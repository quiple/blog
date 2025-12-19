import {getBlogPostsMetadata} from '$lib/content'
import {remark} from 'remark'
import smartypants from 'remark-smartypants'
import strip from 'strip-markdown'
import type {PageServerLoad} from './$types'

export const load: PageServerLoad = async () => {
  const posts = getBlogPostsMetadata()

  for (let i = 0; i < posts.length; i++) {
    posts[i].title = (await remark().use(strip).use(smartypants, {dashes: 'oldschool'}).process(posts[i].title))
      .toString()
      .replaceAll('\n', '')
  }

  return {posts}
}
