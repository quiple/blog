const LANGUAGE_TEMPLATE_REGEX = /\{\{(ja|zh(?:-[A-Za-z0-9]{1,8})*)\|([^{}]*)\}\}/g

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
