import defaultHangul from './hangul-default'

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

// Keep the default preview synchronous; load other scripts only when selected.
export function getCharset(key: string): string | Promise<string> {
  if (key === 'set2350') return defaultHangul
  if (key === 'set11172') return Array.from({length: 11172}, (_, index) => String.fromCharCode(0xac00 + index)).join('')
  if (key === 'set2355' || key === 'set2780' || key === 'set4358')
    return import('./hangul').then(({default: hangul}) => hangul[key])
  if (key === 'ks4888' || key === 'unicode4888') return import('./hanja').then(({default: hanja}) => hanja[key])
  if (['jis2965', 'unicode2965', 'jis6355', 'unicode6355'].includes(key))
    return import('./kanji').then(({default: kanji}) => {
      if (key === 'jis2965') return kanji.jisX0208_level1
      if (key === 'jis6355') return kanji.jisX0208_level1 + kanji.jisX0208_level2
      return kanji[key as 'unicode2965' | 'unicode6355']
    })
  if (key.startsWith('euckr'))
    return import('./korean').then(async ({default: korean}) => {
      if (key === 'euckr') {
        const {default: hanja} = await import('./hanja')
        return korean.restOfEuckr + defaultHangul + hanja.ks4888
      }
      const suffix = key.slice('euckrWoHanja'.length) || '2350'
      if (!key.startsWith('euckrWoHanja')) return ''
      const syllables = await getCharset(`set${suffix}`)
      return syllables ? korean.restOfEuckr + syllables : ''
    })
  if (key === 'shiftjis' || key === 'shiftjis_level1')
    return Promise.all([import('./japanese'), import('./kanji')]).then(
      ([{default: japanese}, {default: kanji}]) =>
        japanese.restOfShiftjis + kanji.jisX0208_level1 + (key === 'shiftjis' ? kanji.jisX0208_level2 : ''),
    )
  return ''
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
