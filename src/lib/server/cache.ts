import {blogArticles, blogFonts, blogPosts, getAllBlogContentMetadata, parseMatter} from '$lib/content'
import type {Article, Font, Post} from '$lib/content'
import {generateDescription, processTitle} from '$lib/markdown'

export type ProcessedPost = (Post | Article | Font) & {
  searchableText: string
}

let cachedProcessedMetadata: ProcessedPost[] | null = null

export async function getCachedProcessedMetadata() {
  if (cachedProcessedMetadata) return cachedProcessedMetadata

  const allPosts = getAllBlogContentMetadata().map((p) => ({...p})) as ProcessedPost[]

  for (let i = 0; i < allPosts.length; i++) {
    const post = allPosts[i]
    const matchPath = `/src/posts/${post.category}/${post.slug}.md`
    const rawContent = blogPosts[matchPath] ?? blogArticles[matchPath] ?? blogFonts[matchPath]
    const {content} = parseMatter(rawContent as string)

    post.title = await processTitle(post.title)
    post.description = post.description ?? (await generateDescription(content))
    post.searchableText = [post.title, post.description, content].join(' ').toLowerCase()
  }

  cachedProcessedMetadata = allPosts
  return cachedProcessedMetadata
}
