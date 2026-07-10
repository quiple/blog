import {getCachedProcessedMetadata, toListedPosts} from '$lib/server/cache'
import {homeCanonicalUrl, SITE_DESCRIPTION, SITE_NAME} from '$lib/seo'
import type {PageServerLoad} from './$types'

const PER_PAGE = 15

export const load: PageServerLoad = async ({url}) => {
  const allPosts = await getCachedProcessedMetadata()

  const totalPages = Math.max(1, Math.ceil(allPosts.length / PER_PAGE))
  let currentPage = Number(url.searchParams.get('p')) || 1
  currentPage = Math.max(1, Math.min(currentPage, totalPages))

  const start = (currentPage - 1) * PER_PAGE
  const posts = toListedPosts(allPosts.slice(start, start + PER_PAGE))
  const title = currentPage > 1 ? `${SITE_NAME} – ${currentPage}페이지` : SITE_NAME
  const canonicalURL = homeCanonicalUrl(currentPage)
  const previousPageURL = currentPage > 1 ? homeCanonicalUrl(currentPage - 1) : undefined
  const nextPageURL = currentPage < totalPages ? homeCanonicalUrl(currentPage + 1) : undefined

  return {
    title,
    description: SITE_DESCRIPTION,
    posts,
    currentPage,
    totalPages,
    perPage: PER_PAGE,
    canonicalURL,
    previousPageURL,
    nextPageURL,
  }
}
