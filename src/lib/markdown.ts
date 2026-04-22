import rehypeStringify from 'rehype-stringify'
import {remark} from 'remark'
import remarkCjkFriendly from 'remark-cjk-friendly'
import remarkCjkFriendlyGfmStrikethrough from 'remark-cjk-friendly-gfm-strikethrough'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import smartypants from 'remark-smartypants'
import strip from 'strip-markdown'

// --- Reusable remark processors ---
// Processors are frozen via .freeze() on first use, so creating them once is efficient.

/** Strips markdown to plain text and applies smartypants for title processing. */
export const titleProcessor = remark().use(strip).use(smartypants, {dashes: 'oldschool'})

/** Strips markdown (with GFM support) to plain text for description generation. */
export const descriptionProcessor = remark()
  .use(remarkGfm)
  .use(remarkCjkFriendly)
  .use(remarkCjkFriendlyGfmStrikethrough)
  .use(strip)
  .use(smartypants, {dashes: 'oldschool'})

/** Renders markdown to HTML (no directives — used for simple content like software-stack). */
export const simpleHtmlProcessor = remark()
  .use(remarkGfm)
  .use(remarkCjkFriendly)
  .use(smartypants, {dashes: 'oldschool'})
  .use(remarkRehype)
  .use(rehypeStringify)

// --- Shared helper functions ---

/** Processes a title string: strips markdown formatting and removes newlines. */
export async function processTitle(title: string): Promise<string> {
  return (await titleProcessor.process(title)).toString().replaceAll('\n', '')
}

/** Generates a description from raw markdown content (max 200 chars + ellipsis). */
export async function generateDescription(content: string): Promise<string> {
  const stripped = (await descriptionProcessor.process(content))
    .toString()
    .replaceAll('\n', ' ')
    .replaceAll('  ', ' ')
    .replaceAll(/:::figure\{[\s\S]*?\}\n?([\s\S]*?)\n?:::/g, '$1')
    .replaceAll(/::figure\{[\s\S]*?\}/g, '')
    .trim()

  return stripped.length > 250 ? stripped.substring(0, 250).trim() + '\u2026' : stripped
}
