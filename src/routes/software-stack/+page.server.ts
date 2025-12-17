import rehypeStringify from 'rehype-stringify'
import {remark} from 'remark'
import remarkCjkFriendly from 'remark-cjk-friendly'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import smartypants from 'remark-smartypants'
import type {PageServerLoad} from './$types'

const content = `
# 소프트웨어 스택

* [Svelte](https://svelte.dev)
* [SvelteKit](https://svelte.dev/docs/kit)
* [Tailwind CSS](https://tailwindcss.com)
* [shadcn-svelte](https://www.shadcn-svelte.com)
* [Remark](https://remark.js.org)
  * [remark-smartypants](https://github.com/silvenon/remark-smartypants)
  * [remark-directive](https://github.com/remarkjs/remark-directive)
  * [remark-cjk-friendly](https://github.com/tats-u/markdown-cjk-friendly)
* 서체
  * [Geist](https://vercel.com/font)
  * [IBM Plex Sans JP](https://github.com/IBM/plex)
  * [IBM Plex Sans KR](https://github.com/IBM/plex)
`

export const load: PageServerLoad = async ({params}) => {
  const contentHTML = (
    await remark()
      .use(remarkRehype)
      .use(rehypeStringify)
      .use(remarkGfm)
      .use(remarkCjkFriendly)
      .use(smartypants, {dashes: 'oldschool'})
      .process(content)
  ).toString()

  return {
    contentHTML,
  }
}
