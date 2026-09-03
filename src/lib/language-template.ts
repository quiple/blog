const LANGUAGE_TAG_PATTERN = 'ja|zh(?:-[A-Za-z0-9]{1,8})*'
const LANGUAGE_TEMPLATE_REGEX = new RegExp(`\\{\\{(${LANGUAGE_TAG_PATTERN})\\|([^{}]*)\\}\\}`, 'g')
const RENDERED_LANGUAGE_TEMPLATE_REGEX = new RegExp(`^<span lang="(${LANGUAGE_TAG_PATTERN})">([\\s\\S]*)</span>$`)

function escapeHtmlText(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

export function stripLanguageTemplates(content: string): string {
  return content.replace(LANGUAGE_TEMPLATE_REGEX, '$2')
}

export function renderLanguageTemplates(content: string): string {
  return content.replace(
    LANGUAGE_TEMPLATE_REGEX,
    (_template, lang: string, value: string) => `<span lang="${lang}">${escapeHtmlText(value)}</span>`,
  )
}

/** Recognizes the language wrapper emitted by renderLanguageTemplates, without parsing its contents as HTML. */
export function parseRenderedLanguageTemplate(value: string) {
  const match = RENDERED_LANGUAGE_TEMPLATE_REGEX.exec(value)
  return match ? {lang: match[1], text: match[2]} : null
}
