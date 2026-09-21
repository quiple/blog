import {isMap, isScalar, isSeq, parseDocument, YAMLMap} from 'yaml'
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
    let node = lines.items[i]
    if (isScalar(node) && typeof node.value === 'string') {
      const entry = new YAMLMap()
      entry.set('text', node)
      lines.items[i] = node = entry
    }
    if (!isMap(node)) throw Error(`${i + 1}행은 객체 형식이어야 합니다.`)
    const words = node.get('words')
    if (isSeq(words)) {
      if (!line.words || words.items.length !== line.words.length)
        throw Error(`${i + 1}행의 단어 구분이 달라 타이밍을 대응시킬 수 없습니다.`)
      line.words.forEach((word, j) => {
        const entry = words.items[j]
        if (!isMap(entry)) throw Error('단어 객체가 필요합니다.')
        if (!force && normalize(String(entry.get('text') ?? '')) !== normalize(word.text))
          throw Error(`${i + 1}행 ${j + 1}번째 단어가 다릅니다. 대응하는 단어가 맞다면 --force로 갱신하세요.`)
        entry.set('time', doc.createNode(word.time))
      })
    }
    node.set('time', doc.createNode(line.time))
  })
  return doc
}
