import {BASE_URL} from '$lib/constants'
import {blogArticles, blogFonts, blogPosts, getAllBlogContentMetadata, parseMatter} from '$lib/content'
import type {RequestHandler} from './$types'

export const prerender = true

export const GET: RequestHandler = async () => {
  const allPosts = getAllBlogContentMetadata()

  const postsMarkdown = allPosts
    .map((p) => {
      const matchPath = `/src/posts/${p.category}/${p.slug}.md`
      const rawContent = (blogPosts[matchPath] ?? blogArticles[matchPath] ?? blogFonts[matchPath]) as string
      if (!rawContent) return ''

      const {content} = parseMatter(rawContent)

      return `## [${p.title}](${BASE_URL}${p.relativeURL}.md)
${p.media ? `Media: ${p.media}` : ''}
Date: ${p.origDate}\n
${content.trim()}
`
    })
    .filter(Boolean)
    .join('\n---\n\n')

  const markdown = `# quiple - Full Archive

${postsMarkdown}
`

  return new Response(markdown, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
    },
  })
}
