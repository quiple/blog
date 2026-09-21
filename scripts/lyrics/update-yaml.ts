import {isMap, isSeq, parseDocument} from 'yaml'
import {parseSongYaml} from '../../src/lib/lyrics/yaml.server.ts'
import type {fromLRC} from './lrc.ts'

const normalize = (text: string) =>
  text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, '')
export function updateLyricsYaml(source: string, converted: ReturnType<typeof fromLRC>, force = false) {
  const doc = parseDocument(source)
  const original = parseSongYaml(source, '갱신 대상')
  const lines = doc.get('lines')
  if (!isSeq(lines) || lines.items.length !== converted.lines.length)
    throw Error('기존 곡과 변환 가사의 행 수가 다릅니다. 번역 대응을 확인하세요.')
  converted.lines.forEach((line, i) => {
    const old = original.lines[i]
    const text = line.words?.map((w) => w.text).join('') ?? line.text ?? ''
    if (!force && normalize(old.text) !== normalize(text))
      throw Error(`${i + 1}행 원문이 다릅니다. 대응하는 행이 맞다면 --force로 갱신하세요.`)
    const node = lines.items[i]
    if (!isMap(node)) throw Error(`${i + 1}행은 객체 형식이어야 합니다.`)
    // Preserve timed-word annotations only when the original word boundaries still match.
    const annotated = old.words?.some((w) => w.pronunciation || w.ruby || w.obscene || w.emptyBeat)
    if (
      annotated &&
      (!line.words ||
        old.words!.length !== line.words.length ||
        old.words!.some((w, j) => normalize(w.text) !== normalize(line.words![j].text)))
    )
      throw Error(`${i + 1}행의 단어 구분이 달라 발음·루비를 보존할 수 없습니다.`)
    if (line.words) {
      if (annotated) {
        const words = node.get('words')
        if (!isSeq(words)) throw Error('words 배열이 필요합니다.')
        line.words.forEach((word, j) => {
          const entry = words.items[j]
          if (!isMap(entry)) throw Error('단어 객체가 필요합니다.')
          entry.set('text', word.text)
          entry.set('time', doc.createNode(word.time))
        })
      } else node.set('words', doc.createNode(line.words))
      node.delete('text')
    } else {
      node.set('text', line.text)
      node.delete('words')
    }
    node.set('time', doc.createNode(line.time))
  })
  return doc
}
