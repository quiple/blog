import {simpleHtmlProcessor} from '$lib/markdown'
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

export const load: PageServerLoad = async () => {
  const contentHTML = (await simpleHtmlProcessor.process(content)).toString()

  return {
    contentHTML,
  }
}
