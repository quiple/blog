import type {Handle} from '@sveltejs/kit'
import {blogArticles, blogFonts, blogPosts, getAllBlogContentMetadata} from '$lib/content'

function createMarkdownResponse(content: string) {
  const tokens = Math.ceil(new TextEncoder().encode(content).length / 4)
  return new Response(content, {
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
      vary: 'accept',
      'x-markdown-tokens': tokens.toString(),
      'content-signal': 'ai-train=yes, search=yes, ai-input=yes',
    },
  })
}

export const handle: Handle = async ({event, resolve}) => {
  const accept = event.request.headers.get('accept')

  // 마크다운 원본 요청 처리 (Content Negotiation)
  if (accept?.includes('text/markdown')) {
    const {pathname, origin} = event.url

    // 1. Root page (Index)
    if (pathname === '/') {
      const allPosts = getAllBlogContentMetadata()
      const markdown = `# quiple\n\n이것저것 블로그.\n\n${allPosts
        .map((p) => `- [${p.title}](${origin}${p.relativeURL})`)
        .join('\n')}`
      return createMarkdownResponse(markdown)
    }

    // 2. Post Detail Pages
    const match = pathname.match(/^\/(blog|article|font)\/([^/]+)$/)
    if (match) {
      const [, category, slug] = match
      const matchPath = `/src/posts/${category}/${slug}.md`
      const rawContent = blogPosts[matchPath] ?? blogArticles[matchPath] ?? blogFonts[matchPath]

      if (rawContent) {
        return createMarkdownResponse(rawContent as string)
      }
    }
  }

  const response = await resolve(event)

  // 홈페이지에 에이전트를 위한 Link 헤더 추가 (RFC 8288)
  if (event.url.pathname === '/') {
    response.headers.append('Link', '</llms.txt>; rel="index"; type="text/plain"')
    response.headers.append('Link', '</sitemap.xml>; rel="sitemap"; type="application/xml"')
  }

  return response
}
