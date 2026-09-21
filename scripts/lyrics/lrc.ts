export type ConversionMode = 'auto' | 'line' | 'syllable'
type Word = {text: string; time: [number, number]}
const stamp = String.raw`(\d+):([0-5]\d)(?:[.:](\d{1,3}))?`
const ms = (m: string, s: string, fraction = '') =>
  Number(m) * 60000 + Number(s) * 1000 + Number(fraction.padEnd(3, '0'))
const seconds = (n: number) => n / 1000

/** LRC has starts, not necessarily ends; use the next line or the configured tail. */
export function fromLRC(
  source: string,
  tail = 2,
  reference?: {text: string; time?: [number, number]}[],
  mode: ConversionMode = 'auto',
) {
  if (!Number.isFinite(tail) || tail <= 0) throw Error('tail은 0보다 큰 초 단위 숫자여야 합니다.')
  let title: string | undefined
  let offset = 0
  const rows: {start: number; parts: {text: string; start: number}[]}[] = []
  for (const [index, raw] of source
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .entries()) {
    const line = raw.trimEnd()
    if (!line.trim()) continue
    const meta = /^\[([a-z]+):(.*)\]$/i.exec(line)
    if (meta) {
      if (meta[1].toLowerCase() === 'ti') title = meta[2].trim()
      if (meta[1].toLowerCase() === 'offset') {
        offset = Number(meta[2])
        if (!Number.isInteger(offset)) throw Error('잘못된 LRC offset')
      }
      continue
    }
    const head = new RegExp('^\\[' + stamp + '\\]').exec(line)
    if (!head) throw Error(`${index + 1}행: LRC 시간 태그가 없습니다.`)
    const start = ms(head[1], head[2], head[3])
    const body = line.slice(head[0].length)
    const marks = [...body.matchAll(new RegExp('<' + stamp + '>', 'g'))]
    const parts = marks.length
      ? marks.map((mark, i) => ({
          start: ms(mark[1], mark[2], mark[3]),
          text: body.slice(mark.index! + mark[0].length, marks[i + 1]?.index),
        }))
      : [{start, text: body}]
    if (marks.length && body.slice(0, marks[0].index).trim())
      throw Error(`${index + 1}행: 첫 단어 시간 앞에 텍스트가 있습니다.`)
    rows.push({start, parts})
  }
  if (!rows.length) throw Error('변환할 가사가 없습니다.')
  const normalize = (text: string) => text.normalize('NFC').replace(/\s/g, '')
  let referenceIndex = 0
  const lines = rows.flatMap((row, i) => {
    if (i && row.start < rows[i - 1].start) throw Error('행 시간이 역순입니다.')
    const final = row.parts.at(-1)!
    const text = row.parts.map((part) => part.text).join('')
    if (!text.trim()) return []
    const matched = reference?.[referenceIndex++]
    if (reference && (!matched?.time || normalize(matched.text) !== normalize(text)))
      throw Error(`TTML의 ${referenceIndex}번째 행과 LRC 가사가 일치하지 않습니다.`)
    const start = matched?.time ? Math.round(matched.time[0] * 1000) - offset : row.start
    const end = matched?.time
      ? Math.round(matched.time[1] * 1000) - offset
      : final.text.trim()
        ? (rows[i + 1]?.start ?? final.start + Math.round(tail * 1000))
        : final.start
    const shift = (n: number) => {
      const value = n + offset
      if (value < 0) throw Error('offset 적용 후 음수 시간이 생깁니다.')
      return seconds(value)
    }
    const words: Word[] = row.parts.flatMap((part, j) => {
      if (!part.text) return []
      const from = j === 0 && matched?.time ? start : part.start
      const until = row.parts[j + 1]?.text ? row.parts[j + 1].start : end
      if (from < start || until < from || until > end) throw Error('단어 시간이 역순이거나 행 범위 밖입니다.')
      if (until === from) throw Error('텍스트의 종료 시간이 시작 시간과 같습니다.')
      return [{text: part.text, time: [shift(from), shift(until)]}]
    })
    if (!words.length || !words.some((w) => w.text.trim())) return []
    const time: [number, number] = [shift(start), shift(end)]
    return [
      mode === 'line' || (mode === 'auto' && words.length === 1)
        ? {text: words.map((word) => word.text).join(''), time}
        : {words, time},
    ]
  })
  if (reference && referenceIndex !== reference.length) throw Error('TTML과 LRC의 가사 행 수가 다릅니다.')
  return {...(title ? {title} : {}), lines}
}
