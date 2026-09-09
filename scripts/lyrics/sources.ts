import {execFile} from 'node:child_process'
import {promisify} from 'node:util'
import {fromTTML, fromJSON3} from './convert.ts'
import type {Song} from '../../src/lib/lyrics/model.ts'

const exec = promisify(execFile)
export const API = 'https://api.amll.dev/v1/lyrics/'
export type Candidate = {label: string; load: () => Promise<{song: Song; sources: string[]}>}
type Item = {
  id: number
  filename: string
  musicNames: string[]
  artistNames: string[]
  appleMusicIds?: string[]
  spotifyIds?: string[]
  authorUsernames?: string[]
  lyrics?: string
}

export async function fetchText(url: string) {
  if (new URL(url).protocol !== 'https:') throw new Error('HTTPS 주소만 사용할 수 있습니다.')
  const response = await fetch(url, {
    signal: AbortSignal.timeout(30000),
    headers: {'User-Agent': 'quiple-lyric-import/1.0'},
  })
  if (!response.ok) throw new Error(`가사 요청 실패: HTTP ${response.status} (${new URL(url).hostname})`)
  const reader = response.body!.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  while (true) {
    const {value, done} = await reader.read()
    if (done) break
    size += value.length
    if (size > 8 * 1024 * 1024) {
      await reader.cancel()
      throw new Error('가사 응답이 8MB를 초과했습니다.')
    }
    chunks.push(value)
  }
  return Buffer.concat(chunks).toString('utf8')
}
async function api<T>(method: string, params: Record<string, string>): Promise<T> {
  const payload = JSON.parse(await fetchText(`${API}${method}?${new URLSearchParams(params)}`)) as {
    status: number
    data: T
  }
  if (payload.status !== 200 || !payload.data) throw new Error('AMLL DB에서 대응하는 가사를 찾지 못했습니다.')
  return payload.data
}
export function ttmlCandidate(label: string, url: string, xml?: string): Candidate {
  return {
    label,
    load: async () => {
      const {song, metadata} = fromTTML(xml ?? (await fetchText(url)))
      return {
        song,
        sources: [url, ...(metadata.authorNames?.length ? [`TTML 기여자: ${metadata.authorNames.join(', ')}`] : [])],
      }
    },
  }
}
function databaseCandidate(item: Item): Candidate {
  const raw = `https://raw.githubusercontent.com/amll-dev/amll-ttml-db/main/raw-lyrics/${encodeURIComponent(item.filename)}`
  return {
    label: `AMLL · ${item.musicNames[0]} · ${item.artistNames.join(', ')} · ${item.authorUsernames?.join(', ') ?? ''} · ${item.filename}`,
    load: async () => {
      const full = item.lyrics ? item : await api<Item>('get', {filename: item.filename})
      if (!full.lyrics) throw new Error('AMLL 응답에 TTML 본문이 없습니다.')
      return ttmlCandidate('', raw, full.lyrics).load()
    },
  }
}
export async function searchDatabase(query: string, filter?: (item: Item) => boolean) {
  const candidates: Candidate[] = []
  for (let page = 1; page <= 10; page++) {
    const result = await api<{items: Item[]; pagination: {hasMore: boolean}}>('search', {
      musicName: query,
      page: String(page),
      pageSize: '100',
    })
    candidates.push(...result.items.filter((item) => !filter || filter(item)).map(databaseCandidate))
    if (!result.pagination.hasMore) return candidates
  }
  throw new Error('검색 결과가 너무 많습니다. --search에 더 구체적인 곡명을 입력하세요.')
}
export async function fromPlatform(platform: 'appleMusic' | 'spotify', id: string) {
  const item = await api<Item>('get', {[`${platform}Id`]: id})
  try {
    const candidates = await searchDatabase(
      item.musicNames[0],
      (row) => (platform === 'appleMusic' ? row.appleMusicIds : row.spotifyIds)?.includes(id) ?? false,
    )
    if (candidates.length) return candidates
  } catch (error) {
    console.error(`이전 가사 버전 검색 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
  }
  return [databaseCandidate(item)]
}
export async function fromDatabase(identifier: string) {
  if (/^\d+$/.test(identifier)) return [databaseCandidate(await api<Item>('get', {id: identifier}))]
  if (/^[\w-]+\.ttml$/.test(identifier)) return [databaseCandidate(await api<Item>('get', {filename: identifier}))]
  if (identifier.startsWith('https://')) return [ttmlCandidate('TTML 다운로드', identifier)]
  return searchDatabase(identifier)
}

type Subtitle = {ext: string; url: string; name?: string}
type YouTubeInfo = {
  title: string
  track?: string
  language?: string
  subtitles?: Record<string, Subtitle[]>
  automatic_captions?: Record<string, Subtitle[]>
}
export async function youtubeCandidates(id: string, includeAuto: boolean) {
  const url = `https://www.youtube.com/watch?v=${id}`
  let info: YouTubeInfo
  try {
    const result = await exec(
      'yt-dlp',
      [
        '--ignore-config',
        '--no-playlist',
        '--skip-download',
        '--ignore-no-formats-error',
        '--no-warnings',
        '--dump-single-json',
        '--',
        url,
      ],
      {maxBuffer: 24 * 1024 * 1024, timeout: 120000},
    )
    info = JSON.parse(result.stdout) as YouTubeInfo
  } catch (error) {
    throw new Error(
      `YouTube 메타데이터/자막을 불러오지 못했습니다. yt-dlp 설치·업데이트를 확인하거나 --search/--file을 사용하세요. (${(error as NodeJS.ErrnoException).code ?? 'yt-dlp 실패'})`,
    )
  }
  const candidates: Candidate[] = []
  const quotedTitle = [...info.title.matchAll(/「([^」]+)」/g)].at(-1)?.[1]
  try {
    candidates.push(...(await searchDatabase(info.track || quotedTitle || info.title)))
  } catch (error) {
    console.error(`AMLL 검색: ${error instanceof Error ? error.message : '실패'}`)
  }
  for (const [automatic, tracks] of [
    [false, info.subtitles],
    [true, includeAuto ? info.automatic_captions : undefined],
  ] as const) {
    for (const [language, formats] of Object.entries(tracks ?? {})) {
      const subtitle = formats.find((format) => format.ext === 'json3')
      if (!subtitle) continue
      candidates.push({
        label: `YouTube ${automatic ? '자동 생성' : '등록 자막'} · ${language} · ${subtitle.name ?? info.title}`,
        load: async () => ({
          song: {
            ...fromJSON3(JSON.parse(await fetchText(subtitle.url)), info.title, language),
            titleLang: info.language ?? '',
          },
          sources: [url, `YouTube ${automatic ? '자동 생성' : '등록'} 자막: ${language} (json3, 행별 타이밍)`],
        }),
      })
    }
  }
  return candidates
}
