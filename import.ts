#!/usr/bin/env node
import {parseArgs} from 'node:util'
import {readFile, writeFile, mkdir, access} from 'node:fs/promises'
import {resolve, join, dirname} from 'node:path'
import {fileURLToPath} from 'node:url'
import {Document, isScalar, isSeq, visit} from 'yaml'
import {parseSong} from './src/lib/lyrics/model.ts'
import {compactSong, fromTTML} from './scripts/lyrics/convert.ts'
import {choose, terminalText} from './scripts/lyrics/select.ts'
import {
  fromDatabase,
  fromPlatform,
  searchDatabase,
  youtubeCandidates,
  type Candidate,
} from './scripts/lyrics/sources.ts'

const root = dirname(fileURLToPath(import.meta.url))
const help = `가사 가져오기
  nub run import -y YDLafQ-Rg-k
  nub run import -a 1737842246 --slug wrong-world
  nub run import -s 0tNSVPZeJjpNH7Q9VqrbyJ
  nub run import --search '雑踏、僕らの街'
  nub run import --amll 1779284741800-68000793-I1W5DuF4.ttml
  nub run import --file ./lyrics.ttml --slug music-title

-y, --youtube ID       YouTube ID (yt-dlp 필요)
-a, --apple ID         Apple Music 곡 ID로 AMLL DB 검색
-s, --spotify ID       Spotify 트랙 ID로 AMLL DB 검색
    --amll 값         AMLL 파일명 / API ID / TTML 직접 URL
    --search 곡명     AMLL DB 곡명 검색
    --file 경로       로컬 TTML 가져오기
    --slug 슬러그     출력 파일명 (생략하면 제목 또는 서비스 ID)
    --title 제목      제목 변경
    --lang 언어       원문 언어 지정
    --artist 슬러그   등록된 아티스트 (여러 번 지정 가능)
    --audio           YouTube를 뮤비 대신 음원으로 저장
    --auto            YouTube 자동 생성 자막도 선택 후보에 포함
    --select 번호     비대화형 실행에서 후보 번호 선택 (1부터)
    --stdout          파일 생성 없이 YAML 출력
    --out-dir 경로    출력 폴더 (기본 src/posts/lyric)
기존 파일은 덮어쓰지 않습니다. 후보가 여러 개면 ↑↓와 Enter로 선택합니다.`

async function main() {
  const {values: v} = parseArgs({
    args: process.argv.slice(process.argv[2] === '--' ? 3 : 2),
    options: {
      youtube: {type: 'string', short: 'y'},
      apple: {type: 'string', short: 'a'},
      spotify: {type: 'string', short: 's'},
      amll: {type: 'string'},
      search: {type: 'string'},
      file: {type: 'string'},
      slug: {type: 'string'},
      title: {type: 'string'},
      lang: {type: 'string'},
      artist: {type: 'string', multiple: true},
      audio: {type: 'boolean'},
      auto: {type: 'boolean'},
      select: {type: 'string'},
      stdout: {type: 'boolean'},
      'out-dir': {type: 'string'},
      help: {type: 'boolean', short: 'h'},
    },
  })
  if (v.help) {
    console.log(help)
    return
  }
  if ([v.youtube, v.apple, v.spotify, v.amll, v.search, v.file].filter(Boolean).length !== 1)
    throw new Error('입력 소스를 하나만 지정하세요. --help로 사용법을 볼 수 있습니다.')
  // Validate identifiers before interpolating them into requests or starting yt-dlp.
  parseSong({youtube: v.youtube ? {mv: v.youtube} : undefined, appleMusic: v.apple, spotify: v.spotify})
  for (const slug of v.artist ?? []) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`아티스트 슬러그 형식이 잘못되었습니다: ${slug}`)
    const exists = await Promise.any(
      ['yaml', 'yml'].map((ext) => access(join(root, 'src/posts/artist', `${slug}.${ext}`))),
    ).then(
      () => true,
      () => false,
    )
    if (!exists) throw new Error(`등록된 아티스트가 없습니다: ${slug}`)
  }
  let candidates: Candidate[]
  if (v.file) {
    const path = resolve(v.file)
    candidates = [
      {label: path, load: async () => ({song: fromTTML(await readFile(path, 'utf8')).song, sources: [path]})},
    ]
  } else if (v.youtube) candidates = await youtubeCandidates(v.youtube, !!v.auto)
  else if (v.apple) candidates = await fromPlatform('appleMusic', v.apple)
  else if (v.spotify) candidates = await fromPlatform('spotify', v.spotify)
  else if (v.amll) candidates = await fromDatabase(v.amll)
  else candidates = await searchDatabase(v.search!)
  const selected = await choose(
    candidates.map((candidate) => candidate.label),
    v.select ? Number(v.select) : undefined,
  )
  const result = await candidates[selected].load()
  const lang = v.lang || result.song.lang
  const song = parseSong({
    ...result.song,
    ...(v.title ? {title: v.title} : {}),
    lang,
    titleLang: lang,
    ...(v.artist ? {artist: v.artist.length === 1 ? v.artist[0] : v.artist} : {}),
    ...(v.youtube ? {youtube: {[v.audio ? 'audio' : 'mv']: v.youtube}} : {}),
    ...(v.apple ? {appleMusic: v.apple} : {}),
    ...(v.spotify ? {spotify: v.spotify} : {}),
  })
  const fallback = v.youtube
    ? `youtube-${v.youtube.toLowerCase()}`
    : v.apple
      ? `apple-${v.apple}`
      : v.spotify
        ? `spotify-${v.spotify.toLowerCase()}`
        : 'imported-lyrics'
  const slug =
    v.slug ??
    (song.title
      .normalize('NFKD')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') ||
      fallback)
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('--slug에는 영문 소문자·숫자·하이픈만 사용하세요.')
  const sources = [
    ...result.sources,
    `선택 항목: ${terminalText(candidates[selected].label)}`,
    `가져온 시각: ${new Date().toISOString()}`,
    '원본 타이밍을 유지했습니다. 선택한 음원/뮤비와의 차이는 offsets로 보정하세요.',
  ]
  const document = new Document(compactSong(song))
  visit(document, {
    Pair(_, pair) {
      if (isScalar(pair.key) && pair.key.value === 'time' && isSeq(pair.value)) pair.value.flow = true
    },
  })
  const output =
    sources.flatMap((source) => source.split(/\r?\n/).map((line) => `# ${line}`)).join('\n') +
    '\n\n' +
    document.toString({lineWidth: 0, flowCollectionPadding: false})
  if (v.stdout) {
    console.log(output)
    return
  }
  const directory = resolve(v['out-dir'] ?? join(root, 'src/posts/lyric'))
  await mkdir(directory, {recursive: true})
  const path = join(directory, `${slug}.yaml`)
  try {
    await writeFile(path, output, {flag: 'wx'})
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST')
      throw new Error(`이미 파일이 있습니다: ${path}. --slug로 다른 이름을 지정하세요.`)
    throw error
  }
  console.error(`추가했습니다: ${path} (${song.lines.length}행)`)
}

void main().catch((error: unknown) => {
  console.error(terminalText(error instanceof Error ? error.message : String(error)))
  process.exitCode = 1
})
