#!/usr/bin/env node
import {parseArgs, promisify} from 'node:util'
import {execFile, spawn} from 'node:child_process'
import {once} from 'node:events'
import {createReadStream} from 'node:fs'
import {access, mkdir, mkdtemp, readFile, readdir, rename, rm, stat} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {dirname, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {chromium} from 'playwright'
import {createServer} from 'vite'
import {parseSongYaml} from './src/lib/lyrics/yaml.server.ts'
import {installRenderClock} from './scripts/render/browser.ts'
import {prepareRenderFrame} from './scripts/render/crop.ts'

const root = dirname(fileURLToPath(import.meta.url))
const run = promisify(execFile)
const abort = new AbortController()
const exec = (file: string, args: string[], options: {maxBuffer?: number} = {}) =>
  run(file, args, {...options, signal: abort.signal})

function withTimeout<T>(promise: Promise<T>, message: string) {
  let timer: ReturnType<typeof setTimeout>
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(Error(message)), 30000)
    }),
  ]).finally(() => clearTimeout(timer))
}
const help = `가사 페이지와 YouTube MV를 MP4로 렌더링
  nub run render anger-management
  nub run render anger-management --seconds 20
  nub run render anger-management --file ./mv.mp4 --output ./video.mp4

--width 1920 --height 1080 --fps 60   출력 크기·프레임 수
--font theme|system                 기본 theme
--start 초 --seconds 초             테스트 구간 (기본 MV 전체)
--file 경로                        다운로드 대신 동일한 MV 파일 사용
--output 경로                      기본 renders/<슬러그>.mp4
--force                            기존 출력 덮어쓰기
필수: ffmpeg, ffprobe, yt-dlp, nub exec playwright install chromium --only-shell
가사/오프셋은 앱 그대로, MV 선택, 비활성 행 블러 해제. 오디오는 MV에서 가져옵니다.
출력 해상도로 프레임당 한 번 캡처합니다.`

async function main() {
  const {values, positionals} = parseArgs({
    allowPositionals: true,
    options: {
      width: {type: 'string'},
      height: {type: 'string'},
      fps: {type: 'string'},
      font: {type: 'string'},
      start: {type: 'string'},
      seconds: {type: 'string'},
      file: {type: 'string'},
      output: {type: 'string'},
      force: {type: 'boolean'},
      help: {type: 'boolean', short: 'h'},
    },
  })
  if (values.help) return console.log(help)
  const [slug] = positionals
  if (positionals.length !== 1 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug ?? ''))
    throw Error('곡 슬러그 하나를 지정하세요.')
  const width = Number(values.width ?? 1920),
    height = Number(values.height ?? 1080),
    fps = Number(values.fps ?? 60)
  if (![width, height].every((n) => Number.isInteger(n) && n >= 320 && n <= 3840 && n % 2 === 0))
    throw Error('크기는 320~3840 사이 짝수여야 합니다.')
  if (!Number.isInteger(fps) || fps < 24 || fps > 60) throw Error('fps는 24~60 사이 정수여야 합니다.')
  if (width * 9 !== height * 16) throw Error('출력 크기는 16:9여야 합니다.')
  const font = values.font ?? 'theme',
    start = Number(values.start ?? 0)
  if (!['theme', 'system'].includes(font)) throw Error('font 옵션을 확인하세요.')
  if (!Number.isFinite(start) || start < 0) throw Error('start는 0 이상의 초여야 합니다.')
  const song = parseSongYaml(await readFile(join(root, 'src/posts/lyric', `${slug}.yaml`), 'utf8'), slug)
  if (!song.youtube?.mv) throw Error('이 곡에는 yt.mv가 없습니다.')
  const output = resolve(values.output ?? join(root, 'renders', `${slug}.mp4`))
  if (
    !values.force &&
    (await access(output).then(
      () => true,
      () => false,
    ))
  )
    throw Error('출력 파일이 있습니다. --force로 덮어쓸 수 있습니다.')
  await mkdir(dirname(output), {recursive: true})
  const temp = await mkdtemp(join(tmpdir(), 'lyric-render-'))
  let server: Awaited<ReturnType<typeof createServer>> | undefined
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined
  let encoder: ReturnType<typeof spawn> | undefined
  const interrupt = () => {
    abort.abort()
    encoder?.kill()
    void browser?.close().catch(() => {})
  }
  process.once('SIGINT', interrupt)
  process.once('SIGTERM', interrupt)
  try {
    let media = values.file && resolve(values.file)
    if (!media) {
      console.log('YouTube MV 다운로드 중…')
      await exec(
        'yt-dlp',
        [
          '--ignore-config',
          '--no-playlist',
          '--no-progress',
          '--socket-timeout',
          '30',
          '--retries',
          '2',
          '-f',
          'bv*[vcodec^=avc1]+ba[ext=m4a]/b[ext=mp4]/bv*+ba/b',
          '--merge-output-format',
          'mp4',
          '-o',
          join(temp, 'download.%(ext)s'),
          '--',
          `https://www.youtube.com/watch?v=${song.youtube.mv}`,
        ],
        {maxBuffer: 8 * 1024 * 1024},
      )
      const name = (await readdir(temp)).find((name) => /^download\.(mp4|mkv|webm)$/.test(name))
      if (!name) throw Error('MV 다운로드 파일을 찾지 못했습니다.')
      media = join(temp, name)
    }
    // Normalize decoding across browser platforms; preserve the MV timeline.
    console.log('MV 준비 중…')
    const video = join(temp, 'mv.mp4')
    const probe = JSON.parse((await exec('ffprobe', ['-v', 'error', '-show_streams', '-of', 'json', media])).stdout)
    const copyVideo = probe.streams.some(
      (stream: {codec_type: string; codec_name: string; pix_fmt?: string}) =>
        stream.codec_type === 'video' && stream.codec_name === 'h264' && stream.pix_fmt === 'yuv420p',
    )
    await exec(
      'ffmpeg',
      [
        '-hide_banner',
        '-loglevel',
        'error',
        '-i',
        media,
        '-map',
        '0:v:0',
        '-map',
        '0:a:0',
        ...(copyVideo ? ['-c:v', 'copy'] : ['-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p']),
        '-c:a',
        'aac',
        '-b:a',
        '192k',
        '-movflags',
        '+faststart',
        video,
      ],
      {maxBuffer: 4 * 1024 * 1024},
    )
    const duration = Number(
      (
        await exec('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', video])
      ).stdout.trim(),
    )
    const seconds = values.seconds === undefined ? duration - start : Math.min(Number(values.seconds), duration - start)
    if (!Number.isFinite(seconds) || seconds <= 0) throw Error('출력 구간이 MV 길이 범위 안에 있어야 합니다.')
    const size = (await stat(video)).size
    server = await createServer({
      root,
      // Editing another file during a long export must not reload the capture page.
      server: {host: '127.0.0.1', port: 0, open: false, hmr: false, watch: null},
      plugins: [
        {
          name: 'local-render-media',
          configureServer(vite) {
            vite.middlewares.use('/__render_mv.mp4', (req, res) => {
              const match = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range ?? '')
              const from = match ? Number(match[1]) : 0,
                to = match?.[2] ? Math.min(Number(match[2]), size - 1) : size - 1
              if (from > to || from >= size) {
                res.writeHead(416, {'Content-Range': `bytes */${size}`})
                res.end()
                return
              }
              res.writeHead(match ? 206 : 200, {
                'Content-Type': 'video/mp4',
                'Accept-Ranges': 'bytes',
                'Content-Length': to - from + 1,
                ...(match ? {'Content-Range': `bytes ${from}-${to}/${size}`} : {}),
              })
              const stream = createReadStream(video, {start: from, end: to})
              res.on('close', () => stream.destroy())
              stream.on('error', () => res.destroy())
              stream.pipe(res)
            })
          },
        },
      ],
    })
    await server.listen()
    const address = server.httpServer!.address()
    if (!address || typeof address === 'string') throw Error('로컬 서버를 시작하지 못했습니다.')
    const origin = `http://127.0.0.1:${address.port}`
    browser = await chromium.launch({headless: true})
    const viewport = {width: 1920, height: 1200}
    const page = await browser.newPage({
      viewport,
      deviceScaleFactor: 1,
      colorScheme: 'dark',
      reducedMotion: 'no-preference',
    })
    await page.clock.install()
    await page.addInitScript(installRenderClock, {
      mediaUrl: `${origin}/__render_mv.mp4`,
      duration: duration * 1000,
      font,
    })
    const errors: string[] = []
    page.on('pageerror', (error) => {
      if (!error.message.includes('ResizeObserver loop')) errors.push(error.message)
    })
    console.log('페이지·폰트 로딩 중…')
    await page.goto(`${origin}/lyric/${slug}`, {waitUntil: 'domcontentloaded', timeout: 120000})
    await page.locator('.lyric-player[data-ready="true"]').waitFor({timeout: 120000})
    const mvButton = page.getByRole('button', {name: 'YouTube 뮤비', exact: true})
    if ((await mvButton.count()) && (await mvButton.getAttribute('aria-pressed')) !== 'true')
      throw Error('MV 선택 실패')
    await withTimeout(
      page.evaluate(async () => {
        await document.fonts.ready
        const video = document.querySelector<HTMLVideoElement>('[data-render-mv]')!
        if (video.readyState < 2)
          await new Promise<void>((resolve, reject) => {
            video.addEventListener('loadeddata', () => resolve(), {once: true})
            video.addEventListener('error', () => reject(Error('MV 디코딩 실패')), {once: true})
          })
      }),
      'MV 또는 폰트를 불러오는 시간이 초과됐습니다.',
    )
    await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 100)
    const crop = await page.evaluate(prepareRenderFrame)
    await page.clock.runFor(100)
    console.log(`캡처: ${width}×${height} · 다크 모드 · 중앙 정렬`)
    await page.mouse.move(0, 0)
    await page.evaluate(async () => {
      window.__renderAnimations(0)
      await window.__lyricRender!.setPlayback!(0, true)
    })
    const capture = await page.context().newCDPSession(page)
    {
      // Capture directly at the requested output resolution.
      await capture.send('Emulation.setDeviceMetricsOverride', {
        ...viewport,
        deviceScaleFactor: width / crop.width,
        mobile: false,
      })
    }
    const encoded = join(temp, 'frames.mp4')
    encoder = spawn(
      'ffmpeg',
      [
        '-hide_banner',
        '-loglevel',
        'error',
        '-f',
        'image2pipe',
        '-framerate',
        String(fps),
        '-vcodec',
        'png',
        '-i',
        '-',
        '-an',
        '-c:v',
        'libx264',
        '-preset',
        'fast',
        '-crf',
        '18',
        '-pix_fmt',
        'yuv420p',
        encoded,
      ],
      {stdio: ['pipe', 'ignore', 'pipe']},
    )
    let encoderError = ''
    encoder.stderr!.on('data', (chunk) => {
      encoderError = (encoderError + chunk).slice(-8000)
    })
    encoder.stdin!.on('error', (error) => {
      encoderError = error.message
    })
    const encoding = new Promise<void>((resolve, reject) => {
      encoder!.once('error', reject)
      encoder!.once('close', (code) => (code === 0 ? resolve() : reject(Error(`ffmpeg: ${encoderError}`))))
    })
    // Attach immediately; a failed encoder must not cause an unhandled rejection.
    void encoding.catch(() => {})
    const frames = Math.ceil(seconds * fps),
      warmupFrames = Math.floor(start * fps)
    console.log(`${width}×${height}, ${fps}fps · ${frames}프레임 렌더링 중…`)
    let previousTime = 0
    for (let i = 0; i < warmupFrames + frames; i++) {
      abort.signal.throwIfAborted()
      const outputSample = i - warmupFrames
      const time = (i * 1000) / fps
      if (i > 0) {
        await page.evaluate(async (position) => {
          await window.__lyricRender!.setPlayback!(position, true)
        }, previousTime)
        await page.clock.runFor(Math.round(time) - Math.round(previousTime))
      }
      previousTime = time
      if (i < warmupFrames) {
        await page.evaluate((time) => window.__renderAnimations(time), time)
        continue
      }
      const clip = await withTimeout(
        page.evaluate(
          async ({time, region}) => {
            window.__renderAnimations(time)
            const clip = {...region, x: region.x + scrollX, y: region.y + scrollY, scale: 1}
            const video = document.querySelector<HTMLVideoElement>('[data-render-mv]')!
            if (Math.abs(video.currentTime - time / 1000) < 0.0001 && video.readyState >= 2) return clip
            await new Promise<void>((resolve, reject) => {
              const cleanup = () => {
                video.removeEventListener('seeked', done)
                video.removeEventListener('error', fail)
              }
              const done = () => {
                cleanup()
                resolve()
              }
              const fail = () => {
                cleanup()
                reject(Error('MV 탐색 실패'))
              }
              video.addEventListener('seeked', done, {once: true})
              video.addEventListener('error', fail, {once: true})
              video.currentTime = time / 1000
            })
            return clip
          },
          {time, region: crop},
        ),
        'MV 프레임 탐색 시간이 초과됐습니다.',
      )
      // The page clock and media seek have already settled this frame. Avoid
      // Playwright screenshot's extra real-time animation-frame waits.
      const {data} = await capture.send('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: false,
        fromSurface: true,
        optimizeForSpeed: true,
        clip,
      })
      const image = Buffer.from(data, 'base64')
      if (image.readUInt32BE(16) !== width || image.readUInt32BE(20) !== height)
        throw Error('캡처 프레임 해상도가 출력 설정과 일치하지 않습니다.')
      if (encoder.exitCode !== null) {
        await encoding
        throw Error('인코더가 일찍 종료되었습니다.')
      }
      if (!encoder.stdin!.write(image)) await once(encoder.stdin!, 'drain')
      if (outputSample % (fps * 5) === 0) console.log(`${Math.floor(outputSample / fps)} / ${seconds.toFixed(1)}초`)
      if (errors.length) throw Error(errors.join('\n'))
    }
    encoder.stdin!.end()
    await encoding
    const blurred = await page
      .locator('.amll-lyric-player [class*="lyricLineWrapper"]')
      .evaluateAll((elements) =>
        elements.some((element) => !['none', 'blur(0px)'].includes(getComputedStyle(element).filter)),
      )
    if (blurred) throw Error('렌더링 가사에 블러가 남아 있습니다.')
    const final = join(dirname(output), `.${slug}-${process.pid}.mp4`)
    try {
      await exec('ffmpeg', [
        '-hide_banner',
        '-loglevel',
        'error',
        '-i',
        encoded,
        '-ss',
        String(warmupFrames / fps),
        '-i',
        video,
        '-map',
        '0:v:0',
        '-map',
        '1:a:0',
        '-c:v',
        'copy',
        '-c:a',
        'aac',
        '-b:a',
        '192k',
        '-t',
        String(frames / fps),
        '-movflags',
        '+faststart',
        final,
      ])
      await rename(final, output)
    } finally {
      await rm(final, {force: true})
    }
    console.log(output)
  } finally {
    process.removeListener('SIGINT', interrupt)
    process.removeListener('SIGTERM', interrupt)
    encoder?.kill()
    await browser?.close()
    await server?.close()
    await rm(temp, {recursive: true, force: true})
  }
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = abort.signal.aborted ? 130 : 1
})
