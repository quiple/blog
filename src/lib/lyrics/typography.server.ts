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

function translation(value: Annotation | undefined): Annotation | undefined {
  if (value === undefined) return undefined
  return typeof value === 'string'
    ? smartText(value)
    : Object.fromEntries(Object.entries(value).map(([lang, text]) => [lang, smartText(text)]))
}

function displayLine(line: SongLine): SongLine {
  const text = line.words && smartTexts(line.words.map((word) => word.text))
  return {
    ...line,
    text: smartText(line.text),
    words: line.words?.map((word, index) => ({...word, text: text![index]})),
    translation: translation(line.translation),
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
