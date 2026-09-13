#!/usr/bin/env node
import {parseArgs} from 'node:util'
import {execFile} from 'node:child_process'
import {promisify} from 'node:util'
import {mkdtemp, readFile, rm, readdir} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {dirname, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {getSources, type SourceKey} from './src/lib/lyrics/model.ts'
import {parseSongYaml} from './src/lib/lyrics/yaml.server.ts'
import {compareAudio, sampleRate} from './scripts/lyrics/audio-diff.ts'
const exec = promisify(execFile)
const root = dirname(fileURLToPath(import.meta.url))
const help = `음원 시간 차이 비교
  nub run diff life-kinda-sucks
  nub run diff life-kinda-sucks --reference youtubeMV
  nub run diff song-slug --file spotify=/path/to/full-song.flac

--reference 소스   기준 소스 (기본: Spotify → YouTube 뮤비 → 음원)
--seconds 초       처음부터 분석할 길이 (기본 180, 최대 900)
--file 소스=경로   해당 서비스의 전체 음원 파일 사용 (여러 번 지정 가능)
YouTube는 yt-dlp로 오디오를 받아 ffmpeg로 비교합니다.
Spotify는 --file로 해당 버전의 전체 음원을 제공해야 합니다.
양수 차이: 대상 소스에서 같은 소리가 더 늦게 나옵니다.
YAML은 수정하지 않습니다. 0.001초로 출력하지만 실제 정확도는 음원에 따라 달라집니다.`
async function main() {
  const {values, positionals} = parseArgs({
    allowPositionals: true,
    options: {
      reference: {type: 'string'},
      seconds: {type: 'string'},
      file: {type: 'string', multiple: true},
      help: {type: 'boolean', short: 'h'},
    },
  })
  if (values.help) {
    console.log(help)
    return
  }
  const [slug] = positionals
  if (positionals.length !== 1 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug ?? ''))
    throw new Error('곡 슬러그 하나를 지정하세요. 예: nub run diff life-kinda-sucks')
  const seconds = Number(values.seconds ?? 180)
  if (!Number.isFinite(seconds) || seconds < 6 || seconds > 900) throw new Error('--seconds는 6~900 사이여야 합니다.')
  let yaml: string
  try {
    yaml = await readFile(join(root, 'src/posts/lyric', `${slug}.yaml`), 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    yaml = await readFile(join(root, 'src/posts/lyric', `${slug}.yml`), 'utf8')
  }
  const song = parseSongYaml(yaml, slug),
    sources = getSources(song)
  const files = new Map<SourceKey, string>()
  for (const value of values.file ?? []) {
    const split = value.indexOf('='),
      key = value.slice(0, split) as SourceKey
    if (split < 1 || !value.slice(split + 1) || !sources.some((source) => source.key === key))
      throw new Error(`등록된 소스=파일 경로를 지정하세요: ${value}`)
    files.set(key, resolve(value.slice(split + 1)))
  }
  if (sources.length < 2) throw new Error('비교할 음악 소스가 두 개 이상 필요합니다.')
  const available = sources.filter((source) => source.provider === 'youtube' || files.has(source.key))
  for (const source of sources.filter((source) => !available.includes(source)))
    console.error(`${source.label}: 전체 오디오 접근 불가. --file ${source.key}=경로 필요`)
  if (available.length !== sources.length) process.exitCode = 2
  const reference = values.reference ? available.find((source) => source.key === values.reference) : available[0]
  if (!reference) throw new Error('기준 소스가 없거나 전체 오디오 파일이 필요합니다.')
  if (available.length < 2) throw new Error('접근 가능한 음원이 두 개 이상 필요합니다.')
  const directory = await mkdtemp(join(tmpdir(), 'lyric-audio-diff-'))
  async function audio(source: typeof reference & {}) {
    let path = files.get(source.key)
    if (!path) {
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
          'bestaudio',
          '--download-sections',
          `*0-${seconds}`,
          '-o',
          join(directory, `${source.key}.%(ext)s`),
          '--',
          source.url,
        ],
        {timeout: 240000, maxBuffer: 4 * 1024 * 1024},
      )
      const downloaded = (await readdir(directory)).find(
        (name) => name.startsWith(`${source.key}.`) && !name.endsWith('.part') && !name.endsWith('.ytdl'),
      )
      if (!downloaded) throw new Error('다운로드된 오디오를 찾지 못했습니다.')
      path = join(directory, downloaded)
    }
    const output = join(directory, `${source.key}-pcm.raw`)
    await exec(
      'ffmpeg',
      [
        '-v',
        'error',
        '-nostdin',
        '-y',
        '-i',
        path,
        '-t',
        String(seconds),
        '-vn',
        '-ac',
        '1',
        '-ar',
        String(sampleRate),
        '-f',
        'f32le',
        output,
      ],
      {timeout: 120000},
    )
    const bytes = await readFile(output)
    return Float32Array.from({length: bytes.length / 4}, (_, i) => bytes.readFloatLE(i * 4))
  }
  try {
    const base = await audio(reference)
    console.log(`${reference.key}: 0.000초 (기준)`)
    for (const source of available.filter((source) => source !== reference)) {
      try {
        const result = compareAudio(base, await audio(source))
        if (result.offset === undefined) {
          console.error(`${source.key}: ${result.matches.length >= 3 ? '구간별 차이 불일치' : '일치 구간 부족'}`)
          process.exitCode = 2
          continue
        }
        console.log(`${source.key}: ${result.offset >= 0 ? '+' : ''}${result.offset.toFixed(3)}초`)
      } catch (error) {
        console.error(`${source.label}: ${error instanceof Error ? error.message : String(error)}`)
        process.exitCode = 2
      }
    }
  } finally {
    await rm(directory, {recursive: true, force: true})
  }
}
void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
