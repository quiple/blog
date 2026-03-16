import {blogArticles, blogFonts, blogPosts, getAllBlogContentMetadata} from '$lib/content'
import {generateDescription, processTitle} from '$lib/markdown'
import matter from 'gray-matter'
import type {PageServerLoad} from './$types'

const PER_PAGE = 15

export const load: PageServerLoad = async ({url}) => {
  const title = 'quiple'
  const description = '번역 블로그.'
  const allPosts = getAllBlogContentMetadata()

  for (let i = 0; i < allPosts.length; i++) {
    const matchPath = `/src/posts/${allPosts[i].category}/${allPosts[i].slug}.md`
    const rawContent = blogPosts[matchPath] ?? blogArticles[matchPath] ?? blogFonts[matchPath]
    const {content} = matter(rawContent as string)

    allPosts[i].title = await processTitle(allPosts[i].title)
    allPosts[i].description = allPosts[i].description ?? (await generateDescription(content))
  }

  const totalPages = Math.max(1, Math.ceil(allPosts.length / PER_PAGE))
  let currentPage = Number(url.searchParams.get('page')) || 1
  currentPage = Math.max(1, Math.min(currentPage, totalPages))

  const start = (currentPage - 1) * PER_PAGE
  const posts = allPosts.slice(start, start + PER_PAGE)

  return {title, description, posts, currentPage, totalPages}
}
