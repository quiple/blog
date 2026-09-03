import type {ElementContent} from 'hast'
import type {Node} from 'mdast'
import remarkRuby from 'remark-ruby'

export interface RubyNode extends Node {
  type: 'ruby'
  base: string | string[]
  text: string | string[]
  data: {hChildren: ElementContent[]}
}

declare module 'mdast' {
  interface RootContentMap {
    ruby: RubyNode
  }
  interface PhrasingContentMap {
    ruby: RubyNode
  }
}

// Source NULs are normalized by Markdown, so these parser-only markers cannot collide with text.
const OPEN_BRACKET = '\0ruby-open'
const CLOSE_BRACKET = '\0ruby-close'

function restoreBrackets(value: string): string {
  return value.replaceAll(OPEN_BRACKET, '[').replaceAll(CLOSE_BRACKET, ']')
}

const remarkRubyWithEscapes: typeof remarkRuby = function (options) {
  remarkRuby.call(this, options)
  const extension = this.data('fromMarkdownExtensions')?.flat().at(-1)
  if (!extension?.exit) return

  // Protect escaped brackets after Markdown decodes them, before ruby splits on [...].
  extension.exit.characterEscape = function (token) {
    const source = this.sliceSerialize(token)
    const marker = source === '\\[' ? OPEN_BRACKET : source === '\\]' ? CLOSE_BRACKET : undefined
    if (!marker || !this.stack.some((node) => node.type === 'ruby')) return

    const parent = this.stack.at(-1)
    const text = parent && 'children' in parent ? parent.children.at(-1) : undefined
    if (text?.type === 'text') text.value = text.value.slice(0, -1) + marker
  }

  for (const [tokenType, field] of [
    ['rubyText', 'base'],
    ['rubyPronunciation', 'text'],
  ] as const) {
    const handler = extension.exit[tokenType]
    extension.exit[tokenType] = function (token) {
      handler.call(this, token)
      const node = this.stack.at(-1)
      if (node?.type !== 'ruby') return

      const value = node[field]
      node[field] = Array.isArray(value) ? value.map(restoreBrackets) : restoreBrackets(value)
    }
  }
}

export default remarkRubyWithEscapes
