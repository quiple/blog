import {getCompiledContent} from '$lib/compiled-content'
import {blogArticles, blogFonts, blogPosts, getAllBlogContentMetadata, parseMatter} from '$lib/content'
import type {ContentMetadata} from '$lib/content'

export type ProcessedPost = ContentMetadata & {
  searchableText: string
}
export type ListedPost = ContentMetadata

let cachedProcessedMetadata: ProcessedPost[] | null = null

export async function getCachedProcessedMetadata() {
  if (cachedProcessedMetadata) return cachedProcessedMetadata

  const allPosts = getAllBlogContentMetadata().map((p) => ({...p})) as ProcessedPost[]

  for (let i = 0; i < allPosts.length; i++) {
    const post = allPosts[i]
    const matchPath = `/src/posts/${post.category}/${post.slug}.md`
    const rawContent = blogPosts[matchPath] ?? blogArticles[matchPath] ?? blogFonts[matchPath]
    const compiledContent = getCompiledContent(matchPath)
    if (!rawContent || !compiledContent) throw new Error(`Missing content for ${matchPath}`)
    const {content} = parseMatter(rawContent as string)

    post.title = compiledContent.title
    post.description ??= compiledContent.description
    post.searchableText = [post.title, post.description, content].join(' ').toLowerCase()
  }

  cachedProcessedMetadata = allPosts
  return cachedProcessedMetadata
}

export function toListedPosts(posts: ProcessedPost[]): ListedPost[] {
  return posts.map((post) => {
    const listedPost: Partial<ProcessedPost> = {...post}
    delete listedPost.searchableText
    return listedPost as ListedPost
  })
}
