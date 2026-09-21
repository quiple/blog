import {isMap, isScalar, isSeq, parseDocument, type YAMLMap} from 'yaml'

export function orderPronunciation(node: YAMLMap) {
  const index = node.items.findIndex((pair) => (isScalar(pair.key) ? pair.key.value : pair.key) === 'pr')
  if (index < 0) return
  const [pair] = node.items.splice(index, 1)
  const source = node.items.findIndex(
    (pair) => (isScalar(pair.key) ? pair.key.value : pair.key) === (node.has('words') ? 'words' : 'text'),
  )
  node.items.splice(source < 0 ? index : source + 1, 0, pair)
}

const languages: Record<string, string> = {
  az: 'aze',
  be: 'bel',
  bg: 'bul',
  ca: 'cat',
  cs: 'ces',
  zh: 'chi',
  cy: 'cym',
  de: 'deu',
  el: 'ell',
  eo: 'epo',
  et: 'est',
  fi: 'fin',
  hr: 'hbs',
  sr: 'hbs',
  bs: 'hbs',
  hu: 'hun',
  is: 'isl',
  it: 'ita',
  ja: 'jpn',
  ka: 'kat-1',
  la: 'lat',
  lv: 'lav',
  lt: 'lit',
  mk: 'mkd',
  nl: 'nld',
  pl: 'pol',
  pt: 'por',
  'pt-br': 'por-br',
  ro: 'ron',
  ru: 'rus',
  sk: 'slk',
  sl: 'slv',
  es: 'spa',
  sq: 'sqi',
  sv: 'swe',
  tr: 'tur',
  uk: 'ukr',
  vi: 'vie',
}
export function hangulizeLanguage(language: string) {
  const tag = language.toLowerCase()
  const code = languages[tag] ?? languages[tag.split('-')[0]]
  if (code) return code
  if (Object.values(languages).includes(tag) || ['grc', 'jpn-ck', 'kat-2', 'wlm'].includes(tag)) return tag
  throw Error(
    `Hangulize에서 지원하지 않는 언어: ${language || '(lang 없음)'}. --lang spa처럼 지정하세요. 영어는 지원하지 않습니다.`,
  )
}

/** Keeps source comments, flow timing arrays and existing annotations in YAML nodes. */
export async function addPronunciation(
  source: string,
  convert: (language: string, texts: string[]) => Promise<string[]>,
  options: {lang?: string; force?: boolean} = {},
) {
  const doc = parseDocument(source, {uniqueKeys: true})
  if (doc.errors.length || doc.warnings.length)
    throw Error([...doc.errors, ...doc.warnings].map((e) => e.message).join('\n'))
  if (!isMap(doc.contents) || !isSeq(doc.get('lines'))) throw Error('YAML에 lines 배열이 필요합니다.')
  const sourceLanguage = options.lang ?? doc.get('lang')
  if (typeof sourceLanguage !== 'string') throw Error('YAML의 lang 또는 --lang에 원문 언어를 지정하세요.')
  const language = hangulizeLanguage(sourceLanguage)
  const pending: {node: YAMLMap; text: string}[] = []
  function visit(node: unknown) {
    if (!isMap(node)) throw Error('가사는 문자열 또는 객체여야 합니다.')
    const pronunciation = node.get('pr')
    if (
      !options.force &&
      ((typeof pronunciation === 'string' && pronunciation.trim()) ||
        (isMap(pronunciation) && pronunciation.items.length > 0))
    )
      return
    const words = node.get('words')
    let text = node.get('text')
    if (isSeq(words))
      text = words.items
        .map((word) => {
          if (!isMap(word) || typeof word.get('text') !== 'string') throw Error('words의 text가 올바르지 않습니다.')
          return word.get('text')
        })
        .join('')
    if (typeof text !== 'string') throw Error('가사에 text 또는 words가 필요합니다.')
    const normalized = text.replace(/\s+/g, ' ').trim()
    if (normalized) pending.push({node, text: normalized})
  }
  function asLine(node: unknown) {
    if (isScalar(node) && typeof node.value === 'string') {
      const line = doc.createNode({text: node.value})
      line.commentBefore = node.commentBefore
      line.comment = node.comment
      line.spaceBefore = node.spaceBefore
      return line
    }
    return node
  }
  const lines = doc.get('lines')
  if (!isSeq(lines)) throw Error('lines 배열이 필요합니다.')
  for (let i = 0; i < lines.items.length; i++) {
    const line = asLine(lines.items[i])
    if (!isMap(line)) throw Error(`${i + 1}행 형식이 올바르지 않습니다.`)
    lines.items[i] = line
    visit(line)
    if (line.has('background')) {
      const background = asLine(line.get('background', true))
      line.set('background', background)
      visit(background)
    }
  }
  if (!pending.length) return {yaml: source, count: 0}
  const texts = [...new Set(pending.map((p) => p.text))]
  const results = await convert(language, texts)
  if (results.length !== texts.length || results.some((text) => !text.trim() || !/[가-힣]/u.test(text)))
    throw Error('Hangulize 결과가 비어 있거나 한글 변환에 실패했습니다. YAML은 수정하지 않았습니다.')
  const converted = new Map(texts.map((text, i) => [text, results[i]]))
  for (const {node, text} of pending) {
    const value = converted.get(text)!
    node.set('pr', value)
    orderPronunciation(node)
  }
  return {yaml: doc.toString({lineWidth: 0, flowCollectionPadding: false}), count: pending.length}
}
