import {isScalar, isSeq, visit, type Document} from 'yaml'

/** Keep authored and newly inserted YAML keys in the same readable format. */
export function formatLyricsYaml(doc: Document) {
  const order = ['text', 'words', 'pr', 'tl', 'time']
  visit(doc, {
    Map(_, node) {
      if (!node.has('text') && !node.has('words')) return
      const rank = (key: unknown) => {
        const index = order.indexOf(String(isScalar(key) ? key.value : key))
        return index < 0 ? order.length : index
      }
      node.items.sort((a, b) => rank(a.key) - rank(b.key))
    },
    Pair(_, pair) {
      const key = isScalar(pair.key) ? pair.key.value : pair.key
      if (key === 'time' && isSeq(pair.value)) pair.value.flow = true
    },
  })
  return doc
}
