import {getCachedProcessedMetadata} from '$lib/server/cache'
import type {PageServerLoad} from './$types'

const PER_PAGE = 15

export const load: PageServerLoad = async ({url}) => {
  const title = 'quiple'
  const description = '이것저것 블로그.'
  const allPosts = await getCachedProcessedMetadata()

  const totalPages = Math.max(1, Math.ceil(allPosts.length / PER_PAGE))
  let currentPage = Number(url.searchParams.get('p')) || 1
  currentPage = Math.max(1, Math.min(currentPage, totalPages))

  const start = (currentPage - 1) * PER_PAGE
  const posts = allPosts.slice(start, start + PER_PAGE)

  return {title, description, posts, currentPage, totalPages, perPage: PER_PAGE}
}
