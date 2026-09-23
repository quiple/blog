const fields = {
  titleTl: 'titleTranslation',
  pr: 'pronunciation',
  tl: 'translation',
  sp: 'spotify',
  yt: 'youtube',
  ytMV: 'youtubeMV',
  ytAudio: 'youtubeAudio',
} as const

const expandedFields = Object.fromEntries(Object.entries(fields).map(([short, full]) => [full, short]))

/** Translate authored YAML keys at the boundary; player/provider APIs keep their names. */
export function mapYamlFields(value: unknown, direction: 'read' | 'write'): unknown {
  if (Array.isArray(value)) return value.map((item) => mapYamlFields(item, direction))
  if (!value || typeof value !== 'object') return value
  const names: Record<string, string> = direction === 'read' ? fields : expandedFields
  const output: Record<string, unknown> = {}
  for (const [key, entry] of Object.entries(value)) {
    const mapped = names[key] ?? key
    if (Object.hasOwn(output, mapped)) throw Error(`중복 가사 필드: ${mapped}`)
    output[mapped] = mapYamlFields(entry, direction)
  }
  return output
}
