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
  const {pathname, origin} = event.url

  // 1. Redirect /llms_full.txt to /llms-full.txt
  if (pathname === '/llms_full.txt') {
    return new Response(null, {
      status: 301,
      headers: {
        location: '/llms-full.txt',
      },
    })
  }

  const isMarkdownAccept = accept?.includes('text/markdown')
  const isMarkdownExtension = pathname.endsWith('.md')

  if (isMarkdownAccept || isMarkdownExtension) {
    // 1. Root page (Index)
    if (pathname === '/' || pathname === '/index.html.md' || pathname === '/index.md') {
      const allPosts = getAllBlogContentMetadata()
      const markdown = `# quiple\n\n이것저것 블로그.\n\n${allPosts
        .map((p) => `- [${p.title}](${origin}${p.relativeURL}.md)`)
        .join('\n')}`
      return createMarkdownResponse(markdown)
    }

    // 2. Post Detail Pages
    const cleanPathname = isMarkdownExtension ? pathname.slice(0, -3) : pathname
    const match = cleanPathname.match(/^\/(blog|article|font)\/([^/]+)$/)
    if (match) {
      const [, category, slug] = match
      const matchPath = `/src/posts/${category}/${slug}.md`
      const rawContent = blogPosts[matchPath] ?? blogArticles[matchPath] ?? blogFonts[matchPath]

      if (rawContent) {
        return createMarkdownResponse(rawContent as string)
      }
    }
  }

  return resolve(event)
}
