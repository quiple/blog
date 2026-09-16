import {parseSong} from '../../src/lib/lyrics/model.ts'
import {fromTTML} from './convert.ts'
import {fetchText, type Candidate} from './sources.ts'

function credential(name: string) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name}을 .env.local에 설정하세요. src/posts/lyric/README.md 참고.`)
  const token = value.replace(/^Bearer\s+/i, '')
  if (!/^[\x21-\x7e]+$/.test(token)) throw new Error(`${name}의 토큰 형식이 올바르지 않습니다.`)
  return token
}

async function json<T>(url: string, headers: Record<string, string>): Promise<T> {
  const text = await fetchText(url, headers)
  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error(`${new URL(url).hostname}에서 올바른 JSON 응답을 받지 못했습니다.`)
  }
}

type AppleResource = {
  id?: string
  attributes?: {name?: string; ttml?: string}
  relationships?: Record<string, {data?: AppleResource[]}>
}

export async function appleCandidates(id: string): Promise<Candidate[]> {
  const userToken = credential('APPLE_MUSIC_USER_TOKEN')
  const headers = {
    Authorization: `Bearer ${credential('APPLE_MUSIC_TOKEN')}`,
    'Media-User-Token': userToken,
    Origin: 'https://music.apple.com',
  }
  const base = 'https://amp-api.music.apple.com/v1'
  const storefront =
    process.env.APPLE_MUSIC_STOREFRONT ||
    (await json<{data?: AppleResource[]}>(`${base}/me/storefront`, headers)).data?.[0]?.id
  if (!storefront || !/^[a-z]{2}$/.test(storefront))
    throw new Error(
      'Apple Music storefront를 확인하지 못했습니다. APPLE_MUSIC_STOREFRONT에 kr, us 등 국가 코드를 지정하세요.',
    )
  const endpoint = `${base}/catalog/${storefront}/songs/${id}?${new URLSearchParams({'include[songs]': 'lyrics,syllable-lyrics'})}`
  const resource = (await json<{data?: AppleResource[]}>(endpoint, headers)).data?.[0]
  const title = resource?.attributes?.name
  const candidates: Candidate[] = []
  const seen = new Set<string>()
  for (const type of ['syllable-lyrics', 'lyrics']) {
    for (const item of resource?.relationships?.[type]?.data ?? []) {
      const xml = item.attributes?.ttml
      if (!xml || seen.has(xml)) continue
      seen.add(xml)
      candidates.push({
        label: `Apple Music · ${title ?? id} · ${type === 'syllable-lyrics' ? '음절별' : '행별'} 가사 · ${item.id ?? candidates.length + 1}`,
        load: async () => {
          const {song} = fromTTML(xml, type === 'lyrics' ? 'Line' : 'Word')
          return {
            song: parseSong({...song, title: title || song.title}),
            sources: [`https://music.apple.com/${storefront}/song/${id}`, `Apple Music ${type} (TTML)`, endpoint],
          }
        },
      })
    }
  }
  if (!candidates.length)
    throw new Error('Apple Music 응답에 가사가 없습니다. 구독·지역·곡의 가사 제공 여부를 확인하세요.')
  return candidates
}

type SpotifyLyrics = {
  lyrics?: {
    syncType?: string
    language?: string
    provider?: string
    lines?: {startTimeMs: string; endTimeMs?: string; words: string}[]
  }
}
type SpotifyTrack = {name: string; duration_ms: number}

/** Spotify usually omits line ends ("0"); the next cue, including blank cues, closes the line. */
export function fromSpotify(data: SpotifyLyrics, track: SpotifyTrack, id: string) {
  const lyrics = data.lyrics
  if (!lyrics?.lines?.length) throw new Error('Spotify 응답에 가사가 없습니다.')
  if (!['LINE_SYNCED', 'UNSYNCED'].includes(lyrics.syncType ?? ''))
    throw new Error(`지원하지 않는 Spotify 동기화 형식: ${lyrics.syncType}`)
  if (!Number.isFinite(track.duration_ms) || track.duration_ms <= 0)
    throw new Error('Spotify 곡 길이가 올바르지 않습니다.')
  const synced = lyrics.syncType === 'LINE_SYNCED'
  const cues = lyrics.lines.map((line) => ({...line, start: Number(line.startTimeMs)}))
  if (
    synced &&
    cues.some((cue, i) => !Number.isFinite(cue.start) || cue.start < 0 || (i > 0 && cue.start < cues[i - 1].start))
  )
    throw new Error('Spotify 가사 시작 시간이 올바르지 않습니다.')
  const lines = cues.flatMap((cue, i) => {
    if (!cue.words.trim() || /^[♪♫\s]+$/.test(cue.words)) return []
    if (!synced) return [{text: cue.words}]
    const explicitEnd = Number(cue.endTimeMs)
    const end =
      explicitEnd > cue.start
        ? explicitEnd
        : (cues.slice(i + 1).find((next) => next.start > cue.start)?.start ?? track.duration_ms)
    if (end <= cue.start || end > track.duration_ms) throw new Error('Spotify 가사 종료 시간이 올바르지 않습니다.')
    return [{text: cue.words, time: [Math.round(cue.start) / 1000, Math.round(end) / 1000]}]
  })
  if (!lines.length) throw new Error('Spotify 응답에 가사 텍스트가 없습니다.')
  return parseSong({title: track.name, lang: lyrics.language || undefined, spotify: id, lines})
}

export async function spotifyCandidates(id: string): Promise<Candidate[]> {
  const headers = {Authorization: `Bearer ${credential('SPOTIFY_ACCESS_TOKEN')}`, 'App-Platform': 'WebPlayer'}
  const endpoint = `https://spclient.wg.spotify.com/color-lyrics/v2/track/${id}?format=json&market=from_token`
  const data = await json<SpotifyLyrics>(endpoint, headers)
  if (!data.lyrics?.lines?.length) throw new Error('Spotify 응답에 가사가 없습니다.')
  return [
    {
      label: `Spotify · ${id} · ${data.lyrics.language ?? '언어 미상'} · ${data.lyrics.syncType === 'LINE_SYNCED' ? '행별 동기화' : '비동기화'} 가사`,
      load: async () => {
        const track = await json<SpotifyTrack>(`https://api.spotify.com/v1/tracks/${id}`, headers)
        return {
          song: fromSpotify(data, track, id),
          sources: [
            `https://open.spotify.com/track/${id}`,
            `Spotify 가사 제공자: ${data.lyrics?.provider ?? '미상'}`,
            endpoint,
            'Spotify의 종료 시각이 없는 행은 다음 큐의 시작 시각 또는 곡 길이로 종료 시각을 보완했습니다.',
          ],
        }
      },
    },
  ]
}
