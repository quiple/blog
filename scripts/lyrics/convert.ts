import {TTMLParser} from '@applemusic-like-lyrics/ttml'
import {DOMParser} from '@xmldom/xmldom'
import {parseSong, type SongLine} from '../../src/lib/lyrics/model.ts'

type Parsed = ReturnType<TTMLParser['parse']>
type Line = Parsed['lines'][number]
const seconds = (ms: number) => Math.round(ms) / 1000
const time = (start: number, end: number): [number, number] | undefined =>
  end > start ? [seconds(start), seconds(end)] : undefined

function annotations(entries: Line['translations']) {
  if (!entries?.length) return undefined
  return Object.fromEntries(entries.map((entry) => [entry.language ?? 'und', entry.text]))
}

export function fromTTML(xml: string) {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('DTD와 외부 엔티티가 포함된 TTML은 지원하지 않습니다.')
  const document = new DOMParser({
    onError: (level, message) => {
      throw new Error(`XML ${level}: ${message}`)
    },
  }).parseFromString(xml, 'application/xml')
  const paragraphs = Array.from(document.getElementsByTagNameNS('http://www.w3.org/ns/ttml', 'p'))
  const namespace = 'http://music.apple.com/lyric-ttml-internal'
  const ids = new Set(paragraphs.map((p) => p.getAttributeNS(namespace, 'key')))
  // The official parser requires Apple line keys; plain TTML may omit them.
  for (const [index, paragraph] of paragraphs.entries()) {
    if (!paragraph.getAttributeNS(namespace, 'key')) {
      let key = `import-line-${index}`
      while (ids.has(key)) key += '-'
      paragraph.setAttributeNS(namespace, 'itunes:key', key)
      ids.add(key)
    }
  }
  const result = TTMLParser.parse(xml, {domParser: {parseFromString: () => document}})
  function line(input: Line): SongLine {
    const words = input.words?.map((word) => {
      const pronunciation = Object.fromEntries(
        (input.romanizations ?? []).flatMap((roman) => {
          const parts = roman.words?.filter((part) => part.startTime >= word.startTime && part.endTime <= word.endTime)
          return parts?.length
            ? [
                [
                  roman.language ?? 'und',
                  parts
                    .map((part) => part.text + (part.endsWithSpace ? ' ' : ''))
                    .join('')
                    .trim(),
                ],
              ]
            : []
        }),
      )
      return {
        text: word.text + (word.endsWithSpace ? ' ' : ''),
        time: time(word.startTime, word.endTime),
        ruby: word.ruby?.map((ruby) => ({text: ruby.text, time: time(ruby.startTime, ruby.endTime)})),
        pronunciation: Object.keys(pronunciation).length ? pronunciation : undefined,
        obscene: word.obscene || undefined,
        emptyBeat: word.emptyBeat,
      }
    })
    return {
      text: input.text,
      time: time(input.startTime, input.endTime),
      words: words?.length ? words : undefined,
      translation: annotations(input.translations),
      pronunciation: annotations(input.romanizations?.filter((roman) => !roman.words?.length)),
      ...(input.agentId === 'v2' ? {duet: true} : {}),
      ...(input.backgroundVocal ? {background: line(input.backgroundVocal)} : {}),
    }
  }
  if (!result.lines.length) throw new Error('TTML에 가사 행이 없습니다.')
  const song = parseSong({
    title: result.metadata.title?.[0],
    lang: result.metadata.language,
    appleMusic: result.metadata.platformIds?.appleMusicId?.[0],
    spotify: result.metadata.platformIds?.spotifyId?.[0],
    lines: result.lines.map(line).sort((a, b) => (a.time?.[0] ?? 0) - (b.time?.[0] ?? 0)),
  })
  return {song, metadata: result.metadata}
}

type CaptionEvent = {tStartMs?: number; dDurationMs?: number; segs?: {utf8?: string; tOffsetMs?: number}[]}
export function fromJSON3(data: {events?: CaptionEvent[]}, title: string, lang?: string) {
  const events = data.events?.filter((event) => event.segs?.some((segment) => segment.utf8?.trim())) ?? []
  const lines = events.map((event, index) => {
    const text = event
      .segs!.map((segment) => segment.utf8 ?? '')
      .join('')
      .replace(/\n/g, ' ')
      .trim()
    const start = event.tStartMs ?? 0
    const end = event.dDurationMs ? start + event.dDurationMs : (events[index + 1]?.tStartMs ?? start)
    return {text, time: time(start, end)}
  })
  if (!lines.length) throw new Error('선택한 자막에 텍스트가 없습니다.')
  return parseSong({title, lang, lines})
}

export function compactSong(song: ReturnType<typeof parseSong>) {
  function compact(line: SongLine): Record<string, unknown> | string {
    if (!line.time && !line.words && !line.translation && !line.pronunciation && !line.background && !line.duet)
      return line.text
    return {
      ...(line.words ? {words: line.words} : {text: line.text}),
      time: line.time,
      translation: line.translation,
      pronunciation: line.pronunciation,
      duet: line.duet || undefined,
      background: line.background ? compact(line.background) : undefined,
    }
  }
  const {lines, example, ...metadata} = song
  return JSON.parse(JSON.stringify({...metadata, ...(example ? {example} : {}), lines: lines.map(compact)})) as Record<
    string,
    unknown
  >
}
