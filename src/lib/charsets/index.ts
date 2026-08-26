import hangul from './hangul'
import hanja from './hanja'
import japanese from './japanese'
import kanji from './kanji'
import korean from './korean'

export interface CharsetEntry {
  key: string
  label: string
  group: string
  lang: string
}

export const charsetEntries: CharsetEntry[] = [
  // 한글 완성자
  {key: 'set2350', label: '2,350자', group: '한글 완성자', lang: 'ko'},
  {key: 'set2355', label: '2,355자', group: '한글 완성자', lang: 'ko'},
  {key: 'set2780', label: '2,780자', group: '한글 완성자', lang: 'ko'},
  {key: 'set4358', label: '4,358자', group: '한글 완성자', lang: 'ko'},
  {key: 'set11172', label: '11,172자', group: '한글 완성자', lang: 'ko'},
  // 한자
  {key: 'ks4888', label: '4,888자 (KS 순서)', group: '한자', lang: 'ko'},
  {key: 'unicode4888', label: '4,888자 (Unicode 순서)', group: '한자', lang: 'ko'},
  {key: 'jis2965', label: '2,965자 (JIS 순서)', group: '한자', lang: 'ja'},
  {key: 'unicode2965', label: '2,965자 (Unicode 순서)', group: '한자', lang: 'ja'},
  {key: 'jis6355', label: '6,355자 (JIS 순서)', group: '한자', lang: 'ja'},
  {key: 'unicode6355', label: '6,355자 (Unicode 순서)', group: '한자', lang: 'ja'},
  // EUC-KR
  {key: 'euckr', label: 'EUC-KR', group: 'EUC-KR', lang: 'ko'},
  {key: 'euckrWoHanja', label: '한자 제외', group: 'EUC-KR', lang: 'ko'},
  {key: 'euckrWoHanja2355', label: '한자 제외, 한글 2,355자', group: 'EUC-KR', lang: 'ko'},
  {key: 'euckrWoHanja2780', label: '한자 제외, 한글 2,780자', group: 'EUC-KR', lang: 'ko'},
  {key: 'euckrWoHanja4358', label: '한자 제외, 한글 4,358자', group: 'EUC-KR', lang: 'ko'},
  {key: 'euckrWoHanja11172', label: '한자 제외, 한글 11,172자', group: 'EUC-KR', lang: 'ko'},
  // Shift_JIS
  {key: 'shiftjis', label: 'Shift_JIS', group: 'Shift_JIS', lang: 'ja'},
  {key: 'shiftjis_level1', label: '제1수준 한자만 포함', group: 'Shift_JIS', lang: 'ja'},
]

// Lazily built charset map (only computed when first accessed)
const charsetStrings: Record<string, string> = {
  // Hangul syllables
  set2350: hangul.set2350,
  set2355: hangul.set2355,
  set2780: hangul.set2780,
  set4358: hangul.set4358,
  set11172: hangul.set11172,
  // Kanji
  ks4888: hanja.ks4888,
  unicode4888: hanja.unicode4888,
  jis2965: kanji.jisX0208_level1,
  unicode2965: kanji.unicode2965,
  jis6355: kanji.jisX0208_level1 + kanji.jisX0208_level2,
  unicode6355: kanji.unicode6355,
  // EUC-KR
  euckr: korean.restOfEuckr + hangul.set2350 + hanja.ks4888,
  euckrWoHanja: korean.restOfEuckr + hangul.set2350,
  euckrWoHanja2355: korean.restOfEuckr + hangul.set2355,
  euckrWoHanja2780: korean.restOfEuckr + hangul.set2780,
  euckrWoHanja4358: korean.restOfEuckr + hangul.set4358,
  euckrWoHanja11172: korean.restOfEuckr + hangul.set11172,
  // Shift_JIS
  shiftjis: japanese.restOfShiftjis + kanji.jisX0208_level1 + kanji.jisX0208_level2,
  shiftjis_level1: japanese.restOfShiftjis + kanji.jisX0208_level1,
}

export function getCharset(key: string): string {
  return charsetStrings[key] ?? ''
}

/** Group charsetEntries by group name, preserving insertion order. */
export function getCharsetGroups(): Map<string, CharsetEntry[]> {
  const groups = new Map<string, CharsetEntry[]>()
  for (const entry of charsetEntries) {
    const existing = groups.get(entry.group)
    if (existing) {
      existing.push(entry)
    } else {
      groups.set(entry.group, [entry])
    }
  }
  return groups
}
