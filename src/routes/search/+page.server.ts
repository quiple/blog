import {blogArticles, blogFonts, blogPosts, getAllBlogContentMetadata} from '$lib/content'
import {generateDescription, processTitle} from '$lib/markdown'
import matter from 'gray-matter'
import type {PageServerLoad} from './$types'

const PER_PAGE = 15

export const load: PageServerLoad = async ({url}) => {
  const searchQuery = url.searchParams.get('q')?.trim() || ''
  const currentPage = Number(url.searchParams.get('page')) || 1

  if (!searchQuery) {
    return {searchQuery: '', matches: [], totalCount: 0, totalPages: 0, currentPage: 1, perPage: PER_PAGE}
  }

  const allPosts = getAllBlogContentMetadata()
  const keywords = searchQuery
    .toLowerCase()
    .split(/\s+/)
    .filter((k) => k.length > 0)

  const matches = []

  for (let i = 0; i < allPosts.length; i++) {
    const post = allPosts[i]
    const matchPath = `/src/posts/${post.category}/${post.slug}.md`
    const rawContent = blogPosts[matchPath] ?? blogArticles[matchPath] ?? blogFonts[matchPath]
    const {content} = matter(rawContent as string)

    post.title = await processTitle(post.title)
    post.description = post.description ?? (await generateDescription(content))

    const searchableText = [post.title, post.description, content].join(' ').toLowerCase()

    const isMatch = keywords.every((keyword) => searchableText.includes(keyword))

    if (isMatch) {
      matches.push(post)
    }
  }

  const totalCount = matches.length
  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE))
  const safePage = Math.max(1, Math.min(currentPage, totalPages))

  const start = (safePage - 1) * PER_PAGE
  const paginatedMatches = matches.slice(start, start + PER_PAGE)

  return {
    searchQuery,
    matches: paginatedMatches,
    totalCount,
    totalPages,
    currentPage: safePage,
    perPage: PER_PAGE,
  }
}
