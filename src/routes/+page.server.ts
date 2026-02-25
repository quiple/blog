import {blogArticles, blogPosts, getAllBlogContentMetadata} from '$lib/content'
import {generateDescription, processTitle} from '$lib/markdown'
import matter from 'gray-matter'
import type {PageServerLoad} from './$types'

export const load: PageServerLoad = async () => {
  const title = 'quiple'
  const description = '번역 블로그.'
  const posts = getAllBlogContentMetadata()

  for (let i = 0; i < posts.length; i++) {
    const matchPath = `/src/posts/${posts[i].category}/${posts[i].slug}.md`
    const rawContent = blogPosts[matchPath] ?? blogArticles[matchPath]
    const {content} = matter(rawContent)

    posts[i].title = await processTitle(posts[i].title)
    posts[i].description = posts[i].description ?? (await generateDescription(content))
  }

  return {title, description, posts}
}
