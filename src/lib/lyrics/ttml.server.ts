import {TTMLGenerator, type LyricLine, type SubLyricContent} from '@applemusic-like-lyrics/ttml'
import {DOMImplementation, DOMParser, XMLSerializer} from '@xmldom/xmldom'
import {milliseconds, type Annotation, type Song, type SongLine} from './model.ts'

const tt = 'http://www.w3.org/ns/ttml'

export function songTTML(song: Song, artists: string[] = []): string {
  const annotations = (value: Annotation | undefined): SubLyricContent[] =>
    Object.entries(typeof value === 'string' ? {ko: value} : (value ?? {})).map(([language, text]) => ({
      language,
      text,
    }))
  function convert(line: SongLine): LyricLine {
    const [startTime, endTime] = (line.time ?? [0, 0]).map(milliseconds)
    const romanizations = annotations(line.pronunciation)
    const wordLanguages = new Set(
      line.words?.flatMap((word) => annotations(word.pronunciation).map((part) => part.language!)),
    )
    for (const language of wordLanguages) {
      const words = line.words!.flatMap((word) => {
        const part = annotations(word.pronunciation).find((entry) => entry.language === language)
        const [start, end] = word.time?.map(milliseconds) ?? [startTime, endTime]
        return part ? [{text: part.text, startTime: start, endTime: end}] : []
      })
      const existing = romanizations.find((entry) => entry.language === language)
      if (existing) existing.words = words
      else romanizations.push({language, text: words.map((word) => word.text).join(' '), words})
    }
    return {
      text: line.text,
      startTime,
      endTime,
      agentId: line.duet ? 'v2' : 'v1',
      translations: annotations(line.translation),
      romanizations,
      words: line.words?.map((word) => {
        const [start, end] = word.time?.map(milliseconds) ?? [startTime, endTime]
        const ruby = typeof word.ruby === 'string' ? [{text: word.ruby}] : word.ruby
        return {
          text: word.text,
          startTime: start,
          endTime: end,
          obscene: word.obscene,
          emptyBeat: word.emptyBeat,
          ruby: ruby?.map((part) => ({
            text: part.text,
            startTime: part.time ? milliseconds(part.time[0]) : start,
            endTime: part.time ? milliseconds(part.time[1]) : end,
          })),
        }
      }),
      backgroundVocal: line.background ? convert(line.background) : undefined,
    }
  }
  const xml = TTMLGenerator.generate(
    {
      metadata: {
        title: [song.title],
        artist: artists,
        language: song.lang,
        timingMode: song.lines.some((line) => line.words || line.background?.words) ? 'Word' : 'Line',
        agents: {
          v1: {id: 'v1', type: 'person'},
          ...(song.lines.some((line) => line.duet) ? {v2: {id: 'v2', type: 'person'}} : {}),
        },
      },
      lines: song.lines.map(convert),
    },
    {domImplementation: new DOMImplementation(), xmlSerializer: new XMLSerializer()},
  )
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  doc.documentElement!.setAttribute('xml:space', 'preserve')
  // Keep absolute lyric times: a timed div would offset its children's begin/end.
  for (const element of Array.from(doc.getElementsByTagNameNS(tt, '*'))) {
    if (
      element.localName === 'div' ||
      (element.getAttribute('begin') === '0.000' && element.getAttribute('end') === '0.000')
    ) {
      element.removeAttribute('begin')
      element.removeAttribute('end')
    }
    if (element.localName === 'body') element.removeAttribute('dur')
  }
  return new XMLSerializer().serializeToString(doc)
}
