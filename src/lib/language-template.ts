type LanguageTemplatePart =
  | {
      type: 'text'
      value: string
    }
  | {
      type: 'template'
      lang: string
      value: string
    }

type MarkdownNode = {
  type: string
  value?: string
  name?: string
  attributes?: unknown[]
  children?: MarkdownNode[]
}

const LANGUAGE_TEMPLATE_REGEX = /\{\{(ja|zh(?:-[A-Za-z0-9]{1,8})*)\|([^{}]*)\}\}/g

export function stripLanguageTemplates(content: string): string {
  return content.replace(LANGUAGE_TEMPLATE_REGEX, '$2')
}

function parseLanguageTemplateText(value: string): LanguageTemplatePart[] {
  const parts: LanguageTemplatePart[] = []
  let lastIndex = 0

  for (const match of value.matchAll(LANGUAGE_TEMPLATE_REGEX)) {
    const index = match.index ?? 0
    if (index > lastIndex) {
      parts.push({
        type: 'text',
        value: value.slice(lastIndex, index),
      })
    }

    parts.push({
      type: 'template',
      lang: match[1] ?? '',
      value: match[2] ?? '',
    })

    lastIndex = index + match[0].length
  }

  if (lastIndex < value.length) {
    parts.push({
      type: 'text',
      value: value.slice(lastIndex),
    })
  }

  return parts
}

function toMarkdownNode(part: LanguageTemplatePart): MarkdownNode {
  if (part.type === 'text') {
    return {
      type: 'text',
      value: part.value,
    }
  }

  return {
    type: 'mdxJsxTextElement',
    name: 'span',
    attributes: [
      {
        type: 'mdxJsxAttribute',
        name: 'lang',
        value: part.lang,
      },
    ],
    children: [
      {
        type: 'text',
        value: part.value,
      },
    ],
  }
}

function transformLanguageTemplates(node: MarkdownNode) {
  if (!node.children) return

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i]

    if (child.type === 'text' && typeof child.value === 'string') {
      const parts = parseLanguageTemplateText(child.value)
      const hasTemplate = parts.some((part) => part.type === 'template')

      if (hasTemplate) {
        const replacement = parts.map(toMarkdownNode)
        node.children.splice(i, 1, ...replacement)
        i += replacement.length - 1
        continue
      }
    }

    transformLanguageTemplates(child)
  }
}

export function remarkLanguageTemplates() {
  return (tree: MarkdownNode) => {
    transformLanguageTemplates(tree)
  }
}
