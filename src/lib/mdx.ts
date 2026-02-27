/**
 * Set of all standard HTML element tag names.
 * Used to distinguish HTML elements from MDX components.
 */
const HTML_TAGS = new Set([
  'a',
  'abbr',
  'address',
  'area',
  'article',
  'aside',
  'audio',
  'b',
  'base',
  'bdi',
  'bdo',
  'blockquote',
  'body',
  'br',
  'button',
  'canvas',
  'caption',
  'cite',
  'code',
  'col',
  'colgroup',
  'data',
  'datalist',
  'dd',
  'del',
  'details',
  'dfn',
  'dialog',
  'div',
  'dl',
  'dt',
  'em',
  'embed',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'head',
  'header',
  'hgroup',
  'hr',
  'html',
  'i',
  'iframe',
  'img',
  'input',
  'ins',
  'kbd',
  'label',
  'legend',
  'li',
  'link',
  'main',
  'map',
  'mark',
  'menu',
  'meta',
  'meter',
  'nav',
  'noscript',
  'object',
  'ol',
  'optgroup',
  'option',
  'output',
  'p',
  'picture',
  'pre',
  'progress',
  'q',
  'rp',
  'rt',
  'ruby',
  's',
  'samp',
  'script',
  'search',
  'section',
  'select',
  'slot',
  'small',
  'source',
  'span',
  'strong',
  'sub',
  'summary',
  'sup',
  'table',
  'tbody',
  'td',
  'template',
  'textarea',
  'tfoot',
  'th',
  'thead',
  'time',
  'title',
  'tr',
  'track',
  'u',
  'ul',
  'var',
  'video',
  'wbr',
])

interface MdxAttribute {
  type: string
  name: string
  value:
    | string
    | null
    | undefined
    | {
        type: string
        value: string
      }
}

interface MdxNode {
  name: string | null
  attributes: MdxAttribute[]
  children: unknown[]
}

interface HastState {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  all: (node: any) => any[]
}

/**
 * Extract props from MDX JSX attributes.
 */
function extractProps(attributes: MdxAttribute[]): Record<string, unknown> {
  const props: Record<string, unknown> = {}

  for (const attr of attributes) {
    if (attr.type !== 'mdxJsxAttribute' || typeof attr.name !== 'string') continue
    const val = attr.value

    if (val === null || val === undefined) {
      props[attr.name] = true
    } else if (typeof val === 'string') {
      props[attr.name] = val
    } else if (val.type === 'mdxJsxAttributeValueExpression') {
      try {
        props[attr.name] = JSON.parse(val.value)
      } catch {
        props[attr.name] = val.value
      }
    }
  }

  return props
}

/**
 * Custom remark-rehype handlers for MDX JSX elements.
 *
 * - Standard HTML tags (e.g. `<br />`, `<img />`) are rendered as normal HTML elements.
 * - MDX components (PascalCase, e.g. `<Alert>`) are rendered as placeholder elements
 *   with `data-mdx-component` and `data-mdx-props` attributes.
 */
export function mdxHandlers() {
  return {
    mdxJsxFlowElement(state: HastState, node: MdxNode) {
      const name = node.name ?? 'div'

      if (HTML_TAGS.has(name)) {
        return {
          type: 'element' as const,
          tagName: name,
          properties: extractProps(node.attributes),
          children: state.all(node),
        }
      }

      return {
        type: 'element' as const,
        tagName: 'div',
        properties: {
          'data-mdx-component': name,
          'data-mdx-props': JSON.stringify(extractProps(node.attributes)),
        },
        children: state.all(node),
      }
    },

    mdxJsxTextElement(state: HastState, node: MdxNode) {
      const name = node.name ?? 'span'

      if (HTML_TAGS.has(name)) {
        return {
          type: 'element' as const,
          tagName: name,
          properties: extractProps(node.attributes),
          children: state.all(node),
        }
      }

      return {
        type: 'element' as const,
        tagName: 'span',
        properties: {
          'data-mdx-component': name,
          'data-mdx-props': JSON.stringify(extractProps(node.attributes)),
        },
        children: state.all(node),
      }
    },

    // Strip ESM import/export statements (handled by component registry)
    mdxjsEsm() {
      return undefined
    },

    // Strip JSX expressions (not supported in this rendering model)
    mdxFlowExpression() {
      return undefined
    },

    mdxTextExpression() {
      return undefined
    },
  }
}

/**
 * Preprocess markdown content for MDX compatibility.
 * Converts autolinks (`<URL>`) to standard markdown links to avoid
 * conflicts with MDX's JSX syntax parsing.
 */
export function preprocessMdx(content: string): string {
  return content.replace(/<(https?:\/\/[^>]+)>/g, '[$1]($1)')
}
