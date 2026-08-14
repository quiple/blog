import {error} from '@sveltejs/kit'
import {getCachedProcessedMetadata, toListedPosts} from '$lib/server/cache'
import {absoluteUrl} from '$lib/seo'
import {getCategoryName} from '$lib/utils'
import type {PageServerLoad} from './$types'

const PER_PAGE = 15
const CATEGORIES = ['blog', 'article', 'font'] as const
type Category = (typeof CATEGORIES)[number]

function isCategory(category: string): category is Category {
  return CATEGORIES.includes(category as Category)
}

function categoryCanonicalUrl(category: Category, page = 1) {
  const canonicalURL = absoluteUrl(`/${category}`)
  return page > 1 ? `${canonicalURL}?p=${page}` : canonicalURL
}

export const load: PageServerLoad = async ({params, url}) => {
  if (!isCategory(params.category)) error(404, 'Not found')

  const allPosts = await getCachedProcessedMetadata()
  const categoryPosts = allPosts.filter((post) => post.category === params.category)
  const totalPages = Math.max(1, Math.ceil(categoryPosts.length / PER_PAGE))
  let currentPage = Number(url.searchParams.get('p')) || 1
  currentPage = Math.max(1, Math.min(currentPage, totalPages))

  const start = (currentPage - 1) * PER_PAGE
  const categoryName = getCategoryName(params.category)
  const title = `${categoryName}${currentPage > 1 ? ` – ${currentPage}페이지` : ''} – quiple`

  return {
    category: params.category,
    categoryName,
    title,
    description: `${categoryName} 카테고리의 게시글 목록입니다.`,
    posts: toListedPosts(categoryPosts.slice(start, start + PER_PAGE)),
    currentPage,
    totalPages,
    perPage: PER_PAGE,
    canonicalURL: categoryCanonicalUrl(params.category, currentPage),
    previousPageURL: currentPage > 1 ? categoryCanonicalUrl(params.category, currentPage - 1) : undefined,
    nextPageURL: currentPage < totalPages ? categoryCanonicalUrl(params.category, currentPage + 1) : undefined,
  }
}
