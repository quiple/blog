import {remark} from 'remark'
import smartypants from 'remark-smartypants'
import type {Root, Text} from 'mdast'
import type {Annotation, Song, SongLine} from './model.ts'

const processor = remark().use(smartypants, {dashes: 'oldschool'})

// Supply literal text nodes: lyrics are not Markdown. Keeping each word as a
// node lets smartypants use the whole line's quote context without losing timing.
export function smartTexts(values: string[]): string[] {
  const children: Text[] = values.map((value) => ({type: 'text', value}))
  const tree: Root = {type: 'root', children: [{type: 'paragraph', children}]}
  processor.runSync(tree)
  return children.map((node) => node.value)
}

export function smartText(value: string): string {
  return smartTexts([value])[0]
}

function annotation(value: Annotation | undefined): Annotation | undefined {
  if (value === undefined) return undefined
  return typeof value === 'string'
    ? smartText(value)
    : Object.fromEntries(Object.entries(value).map(([lang, text]) => [lang, smartText(text)]))
}

function wordPronunciations(words: NonNullable<SongLine['words']>) {
  const values = words.map((word) => word.pronunciation)
  const plain = smartTexts(values.map((value) => (typeof value === 'string' ? value : '')))
  const languages = new Set(values.flatMap((value) => (value && typeof value !== 'string' ? Object.keys(value) : [])))
  const localized = new Map(
    [...languages].map((lang) => [
      lang,
      smartTexts(values.map((value) => (value && typeof value !== 'string' ? (value[lang] ?? '') : ''))),
    ]),
  )
  return values.map((value, index) =>
    typeof value === 'string'
      ? plain[index]
      : value && Object.fromEntries(Object.keys(value).map((lang) => [lang, localized.get(lang)![index]])),
  )
}

function displayLine(line: SongLine): SongLine {
  const text = line.words && smartTexts(line.words.map((word) => word.text))
  const pronunciation = line.words && wordPronunciations(line.words)
  return {
    ...line,
    text: smartText(line.text),
    words: line.words?.map((word, index) => ({...word, text: text![index], pronunciation: pronunciation![index]})),
    translation: annotation(line.translation),
    pronunciation: annotation(line.pronunciation),
    background: line.background && displayLine(line.background),
  }
}

export function displaySong(song: Song): Song {
  return {
    ...song,
    title: smartText(song.title),
    titleTranslation: song.titleTranslation === undefined ? undefined : smartText(song.titleTranslation),
    lines: song.lines.map(displayLine),
  }
}
