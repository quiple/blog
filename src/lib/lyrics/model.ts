import * as v from 'valibot'
import type {LyricLine, LyricWord} from '@applemusic-like-lyrics/core'

const seconds = v.pipe(v.number(), v.finite(), v.minValue(0))
const timeSchema = v.pipe(
  v.strictTuple([seconds, seconds]),
  v.check(([start, end]) => end > start, '종료 시간은 시작 시간보다 커야 합니다.'),
)
const annotationSchema = v.union([v.string(), v.record(v.string(), v.string())])
const rubySchema = v.union([v.string(), v.array(v.strictObject({text: v.string(), time: v.optional(timeSchema)}))])
const wordSchema = v.strictObject({
  text: v.string(),
  time: v.optional(timeSchema),
  pronunciation: v.optional(annotationSchema),
  ruby: v.optional(rubySchema),
  obscene: v.optional(v.boolean()),
  emptyBeat: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0))),
})
const baseEntries = {
  text: v.optional(v.string()),
  time: v.optional(timeSchema),
  words: v.optional(v.pipe(v.array(wordSchema), v.minLength(1))),
  translation: v.optional(annotationSchema),
  pronunciation: v.optional(annotationSchema),
}
const backgroundSchema = v.union([v.string(), v.strictObject(baseEntries)])
const lineSchema = v.union([
  v.string(),
  v.strictObject({
    ...baseEntries,
    duet: v.optional(v.boolean(), false),
    background: v.optional(backgroundSchema),
  }),
])
const youtubeId = v.pipe(v.string(), v.regex(/^[A-Za-z0-9_-]{11}$/, 'YouTube 동영상 ID 11자만 입력하세요.'))
const spotifyId = v.pipe(v.string(), v.regex(/^[A-Za-z0-9]{22}$/, 'Spotify 트랙 ID 22자만 입력하세요.'))
const mediaEntries = {
  youtube: v.optional(v.strictObject({mv: v.optional(youtubeId), audio: v.optional(youtubeId)})),
  spotify: v.optional(spotifyId),
}
const mediaSchema = v.object(mediaEntries)
const offset = v.optional(v.pipe(v.number(), v.finite()), 0)
const songSchema = v.strictObject({
  title: v.optional(v.pipe(v.string(), v.minLength(1))),
  titleLang: v.optional(v.string()),
  titleTranslation: v.optional(v.string()),
  artist: v.optional(v.union([v.string(), v.array(v.string())])),
  lang: v.optional(v.string()),
  translationLang: v.optional(v.string()),
  pronunciationLang: v.optional(v.string()),
  example: v.optional(v.boolean(), false),
  ...mediaEntries,
  offsets: v.optional(v.strictObject({youtubeMV: offset, youtubeAudio: offset, spotify: offset})),
  lines: v.optional(v.array(lineSchema), []),
})
type SongInput = v.InferOutput<typeof songSchema>
type BaseLine = Exclude<v.InferOutput<typeof backgroundSchema>, string>
type Time = v.InferOutput<typeof timeSchema>
export type LyricLanguages = {lang?: string; translationLang?: string; pronunciationLang?: string}
export type LocalizedLyricLine = LyricLine & LyricLanguages
export type Annotation = v.InferOutput<typeof annotationSchema>
export type SongLine = BaseLine & {text: string; duet?: boolean; background?: SongLine}
export type Song = Omit<SongInput, 'title' | 'lines'> & {title: string; lines: SongLine[]}
export type Provider = 'youtube' | 'spotify'
export type SourceKey = 'youtubeMV' | 'youtubeAudio' | 'spotify'
export type Source = {key: SourceKey; provider: Provider; label: string; url: string; id: string; embedUrl: string}
export function getSources(input: v.InferInput<typeof mediaSchema>): Source[] {
  const song = v.parse(mediaSchema, input)
  const sources: Source[] = []
  for (const key of ['spotify', 'youtubeMV', 'youtubeAudio'] as const) {
    const provider: Provider = key.startsWith('youtube') ? 'youtube' : (key as Provider)
    const value = key === 'youtubeMV' ? song.youtube?.mv : key === 'youtubeAudio' ? song.youtube?.audio : song[key]
    if (!value) continue
    if (provider === 'youtube') {
      sources.push({
        key,
        provider,
        label: key === 'youtubeMV' ? 'YouTube 뮤비' : 'YouTube 음원',
        url: `https://www.youtube.com/watch?v=${value}`,
        id: value,
        embedUrl: `https://www.youtube.com/embed/${value}`,
      })
    } else {
      sources.push({
        key,
        provider,
        label: 'Spotify',
        url: `https://open.spotify.com/track/${value}`,
        id: `spotify:track:${value}`,
        embedUrl: `https://open.spotify.com/embed/track/${value}?locale=ko`,
      })
    }
  }
  return sources
}

function normalizeLine(input: string | BaseLine, inheritedTime?: Time): SongLine {
  const line = typeof input === 'string' ? {text: input} : input
  if (line.text === undefined && !line.words?.length) throw new Error('가사에는 text 또는 words가 필요합니다.')
  const timedWords = line.words?.filter((word) => word.time)
  const time =
    line.time ??
    (timedWords?.length
      ? ([
          Math.min(...timedWords.map((word) => word.time![0])),
          Math.max(...timedWords.map((word) => word.time![1])),
        ] as Time)
      : inheritedTime)
  let previousStart = -1
  for (const word of line.words ?? []) {
    const wordTime = word.time ?? time
    if (word.time && time && (word.time[0] < time[0] || word.time[1] > time[1] || word.time[0] < previousStart)) {
      throw new Error('단어는 줄 시간 범위 안에서 시작 시간 순서로 작성하세요.')
    }
    if (word.time) previousStart = word.time[0]
    let previousRubyStart = -1
    for (const ruby of typeof word.ruby === 'string' ? [] : (word.ruby ?? [])) {
      if (
        ruby.time &&
        (!wordTime || ruby.time[0] < wordTime[0] || ruby.time[1] > wordTime[1] || ruby.time[0] < previousRubyStart)
      ) {
        throw new Error('루비는 단어 시간 범위 안에서 시작 시간 순서로 작성하세요.')
      }
      if (ruby.time) previousRubyStart = ruby.time[0]
    }
  }
  return {...line, text: line.words?.map((word) => word.text).join('') ?? line.text ?? '', time}
}

export function parseSong(input: unknown, slug = '제목 없음'): Song {
  const data = v.parse(songSchema, input)
  getSources(data)
  let previousStart = -1
  const lines = data.lines.map((input) => {
    const line = normalizeLine(input)
    if (line.time && line.time[0] < previousStart) throw new Error('가사 줄은 시작 시간 순서로 작성하세요.')
    if (line.time) previousStart = line.time[0]
    if (typeof input !== 'string') {
      line.duet = input.duet
      if (input.background !== undefined) line.background = normalizeLine(input.background, line.time)
    }
    return line
  })
  return {...data, title: data.title ?? slug, lines}
}

export function annotationText(value: Annotation | undefined, language?: string): string {
  if (typeof value === 'string') return value
  if (!value) return ''
  return (language ? value[language] : Object.values(value)[0]) ?? ''
}

export function lyricLanguages(lines: SongLine[], field: 'translation' | 'pronunciation'): string[] {
  const languages = new Set<string>()
  function collect(line: SongLine) {
    const values = [
      line[field],
      ...(field === 'pronunciation' ? (line.words?.map((word) => word.pronunciation) ?? []) : []),
    ]
    for (const value of values)
      if (value && typeof value !== 'string') for (const language of Object.keys(value)) languages.add(language)
    if (line.background) collect(line.background)
  }
  lines.forEach(collect)
  return [...languages]
}

export function isTimed(line: LyricLine) {
  return line.endTime > line.startTime
}

export function toLyricLines(
  lines: SongLine[],
  translationLanguage?: string,
  pronunciationLanguage?: string,
  languages: LyricLanguages = {},
): LocalizedLyricLine[] {
  function convert(line: SongLine, isBG: boolean, isDuet: boolean): LocalizedLyricLine {
    const [start, end] = line.time ?? [0, 0]
    const words: LyricWord[] = (line.words ?? [{text: line.text}]).map((word) => {
      const [wordStart, wordEnd] = word.time ?? [start, end]
      const ruby = typeof word.ruby === 'string' ? [{text: word.ruby}] : word.ruby
      return {
        word: word.text,
        startTime: milliseconds(wordStart),
        endTime: milliseconds(wordEnd),
        romanWord: annotationText(word.pronunciation, pronunciationLanguage),
        ruby: ruby?.map((part) => ({
          word: part.text,
          startTime: milliseconds(part.time?.[0] ?? wordStart),
          endTime: milliseconds(part.time?.[1] ?? wordEnd),
        })),
        obscene: word.obscene,
        emptyBeat: word.emptyBeat,
      }
    })
    return {
      words,
      startTime: milliseconds(start),
      endTime: milliseconds(end),
      isBG,
      isDuet,
      lang: languages.lang,
      translationLang: annotationLanguage(
        line.translation,
        translationLanguage,
        languages.translationLang ?? translationLanguage,
      ),
      pronunciationLang: annotationLanguage(line.pronunciation, pronunciationLanguage, languages.pronunciationLang),
      translatedLyric:
        typeof line.translation === 'string' &&
        translationLanguage &&
        languages.translationLang &&
        languages.translationLang !== translationLanguage
          ? ''
          : annotationText(line.translation, translationLanguage),
      romanLyric: annotationText(line.pronunciation, pronunciationLanguage),
    }
  }
  return lines.flatMap((line) => [
    convert(line, false, line.duet ?? false),
    ...(line.background ? [convert(line.background, true, line.duet ?? false)] : []),
  ])
}

export function milliseconds(seconds: number) {
  return Math.round(seconds * 1000)
}

function annotationLanguage(value: Annotation | undefined, selected?: string, fallback?: string) {
  return value && typeof value !== 'string' ? (selected ?? Object.keys(value)[0]) : fallback
}
