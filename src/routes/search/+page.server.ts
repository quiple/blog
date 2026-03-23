import {getCachedProcessedMetadata} from '$lib/server/cache'
import type {PageServerLoad} from './$types'

const PER_PAGE = 15

export const load: PageServerLoad = async ({url}) => {
  const searchQuery = url.searchParams.get('q')?.trim() || ''
  const currentPage = Number(url.searchParams.get('page')) || 1

  if (!searchQuery) {
    return {searchQuery: '', matches: [], totalCount: 0, totalPages: 0, currentPage: 1, perPage: PER_PAGE}
  }

  const allPosts = await getCachedProcessedMetadata()
  const keywords = searchQuery
    .toLowerCase()
    .split(/\s+/)
    .filter((k) => k.length > 0)

  const matches = []

  for (let i = 0; i < allPosts.length; i++) {
    const post = allPosts[i]
    if (keywords.every((keyword) => post.searchableText.includes(keyword))) {
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
