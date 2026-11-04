import {mapYamlFields} from '../../src/lib/lyrics/yaml-fields.ts'
import {TTMLParser} from '@applemusic-like-lyrics/ttml'
import {DOMParser, type Element} from '@xmldom/xmldom'
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

export function fromTTML(xml: string, timing?: 'Line' | 'Word') {
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
  const paragraphById = new Map(paragraphs.map((p) => [p.getAttributeNS(namespace, 'key'), p]))
  const hasTimedWords = (container?: Element) =>
    container &&
    Array.from(container.childNodes).some(
      (child) =>
        child.nodeType === 1 &&
        (child as Element).localName === 'span' &&
        (child as Element).hasAttribute('begin') &&
        (child as Element).hasAttribute('end') &&
        !(child as Element).hasAttributeNS('http://www.w3.org/ns/ttml#metadata', 'role'),
    )
  const result = TTMLParser.parse(xml, {domParser: {parseFromString: () => document}})
  // The parser expands a main line to include its background. Read main timing
  // separately so importing and exporting cannot lengthen the authored main line.
  if (result.lines.some((input) => input.backgroundVocal)) {
    const mainDocument = document.cloneNode(true) as typeof document
    for (const paragraph of Array.from(mainDocument.getElementsByTagNameNS('http://www.w3.org/ns/ttml', 'p'))) {
      for (const child of Array.from(paragraph.childNodes)) {
        if (
          child.nodeType === 1 &&
          (child as Element).getAttributeNS('http://www.w3.org/ns/ttml#metadata', 'role') === 'x-bg'
        )
          paragraph.removeChild(child)
      }
    }
    const mainLines = new Map(
      TTMLParser.parse(xml, {domParser: {parseFromString: () => mainDocument}}).lines.map((input) => [input.id, input]),
    )
    for (const input of result.lines) {
      const main = mainLines.get(input.id)
      if (main && input.backgroundVocal) {
        input.startTime = main.startTime
        input.endTime = main.endTime
      }
    }
  }
  // Read the declared mode, not metadata.timingMode: the parser infers that from word count alone.
  const lineTiming = (timing ?? document.documentElement?.getAttributeNS(namespace, 'timing')) === 'Line'
  function line(input: Line, container?: Element): SongLine {
    const parts = input.words ?? []
    const first = parts[0]
    const wordsCoverLine =
      parts
        .map((word) => word.text + (word.endsWithSpace ? ' ' : ''))
        .join('')
        .trim() === input.text.trim()
    const wordTiming =
      wordsCoverLine &&
      !lineTiming &&
      parts.length > 0 &&
      parts.every((word) => word.endTime > word.startTime) &&
      ((parts.length === 1 && hasTimedWords(container)) ||
        parts.some((word) => word.startTime !== first.startTime || word.endTime !== first.endTime))
    // Ruby and per-word annotations cannot be represented by the plain text field.
    const keepWords =
      wordTiming || parts.some((word) => word.ruby?.length || word.obscene || word.emptyBeat !== undefined)

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
      words: keepWords && words?.length ? words : undefined,
      translation: annotations(input.translations),
      pronunciation: annotations(input.romanizations?.filter((roman) => !keepWords || !roman.words?.length)),
      ...(input.agentId === 'v2' ? {duet: true} : {}),
      ...(input.backgroundVocal
        ? {
            background: line(
              input.backgroundVocal,
              container &&
                Array.from(container.childNodes).find(
                  (child): child is Element =>
                    child.nodeType === 1 &&
                    (child as Element).getAttributeNS('http://www.w3.org/ns/ttml#metadata', 'role') === 'x-bg',
                ),
            ),
          }
        : {}),
    }
  }
  if (!result.lines.length) throw new Error('TTML에 가사 행이 없습니다.')
  const song = parseSong({
    title: result.metadata.title?.[0],
    lang: result.metadata.language,
    spotify: result.metadata.platformIds?.spotifyId?.[0],
    lines: result.lines
      .map((input) => line(input, paragraphById.get(input.id ?? '')))
      .sort((a, b) => (a.time?.[0] ?? 0) - (b.time?.[0] ?? 0)),
  })
  return {song, metadata: result.metadata}
}

type CaptionEvent = {
  tStartMs?: number
  dDurationMs?: number
  wWinId?: number
  wpWinPosId?: number
  segs?: {utf8?: string; tOffsetMs?: number}[]
}
export function fromJSON3(data: {events?: CaptionEvent[]}, title: string, lang?: string) {
  const events = (data.events ?? [])
    .flatMap((event) => {
      const raw = event.segs?.map((segment) => segment.utf8 ?? '').join('') ?? ''
      // Preserve zero-width word separators inside text, but remove layout padding.
      const text = raw
        .replace(/(^|[\s\u2800])[\u200b\ufeff]+|[\u200b\ufeff]+(?=$|[\s\u2800])/gu, '$1')
        .replace(/\u2800/g, ' ')
        .replace(/\n/g, ' ')
        .trim()
      // Styled captions may draw borders in their own padded text windows.
      if (!text || (/[\u200b\ufeff]/u.test(raw) && /^[\s\u2500-\u259f\u25a0-\u25ff]+$/u.test(text))) return []
      return [{...event, text, start: event.tStartMs ?? 0}]
    })
    .sort((a, b) => a.start - b.start)

  const lines: {text: string; start: number; end: number; animated: boolean; short: boolean}[] = []
  const previous = new Map<string, (typeof lines)[number]>()
  for (const [index, event] of events.entries()) {
    const end = event.dDurationMs ? event.start + event.dDurationMs : (events[index + 1]?.start ?? event.start)
    const short = end > event.start && end - event.start <= 250
    const key = JSON.stringify([event.wWinId ?? event.wpWinPosId ?? null, event.text])
    const last = previous.get(key)
    // Short, contiguous frames and identical overlapping layers are visual changes,
    // not newly sung lines. Keep ordinary adjacent repeated lyrics separate.
    if (
      last &&
      event.start <= last.end &&
      (short || last.short || last.animated || (event.start === last.start && end === last.end))
    ) {
      last.end = Math.max(last.end, end)
      last.animated = true
      last.short = short
    } else {
      const line = {text: event.text, start: event.start, end, short, animated: false}
      lines.push(line)
      previous.set(key, line)
    }
  }
  if (!lines.length) throw new Error('선택한 자막에 텍스트가 없습니다.')
  return parseSong({title, lang, lines: lines.map(({text, start, end}) => ({text, time: time(start, end)}))})
}

export function compactSong(song: ReturnType<typeof parseSong>) {
  function compact(line: SongLine): Record<string, unknown> | string {
    if (!line.time && !line.words && !line.translation && !line.pronunciation && !line.background && !line.duet)
      return line.text
    return {
      ...(line.words ? {words: line.words} : {text: line.text}),
      pronunciation: line.pronunciation,
      translation: line.translation,
      time: line.time,
      duet: line.duet || undefined,
      background: line.background ? compact(line.background) : undefined,
    }
  }
  const {lines, example, ...metadata} = song
  return mapYamlFields(
    JSON.parse(JSON.stringify({...metadata, ...(example ? {example} : {}), lines: lines.map(compact)})),
    'write',
  ) as Record<string, unknown>
}
