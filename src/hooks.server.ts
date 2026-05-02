import type {Handle} from '@sveltejs/kit'
import {blogArticles, blogFonts, blogPosts} from '$lib/content'

export const handle: Handle = async ({event, resolve}) => {
  const accept = event.request.headers.get('accept')

  // 마크다운 원본 요청 처리 (Content Negotiation)
  if (accept?.includes('text/markdown')) {
    const {pathname} = event.url
    const match = pathname.match(/^\/(blog|article|font)\/([^/]+)$/)

    if (match) {
      const [, category, slug] = match
      const matchPath = `/src/posts/${category}/${slug}.md`
      const rawContent = blogPosts[matchPath] ?? blogArticles[matchPath] ?? blogFonts[matchPath]

      if (rawContent) {
        const body = rawContent as string
        const tokens = Math.ceil(new TextEncoder().encode(body).length / 4)

        return new Response(body, {
          headers: {
            'content-type': 'text/markdown; charset=utf-8',
            vary: 'accept',
            'x-markdown-tokens': tokens.toString(),
            'content-signal': 'ai-train=yes, search=yes, ai-input=yes',
          },
        })
      }
    }
  }

  return resolve(event)
}
