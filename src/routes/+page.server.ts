import {blogArticles, blogPosts, getAllBlogContentMetadata} from '$lib/content'
import matter from 'gray-matter'
import {remark} from 'remark'
import remarkCjkFriendly from 'remark-cjk-friendly'
import remarkCjkFriendlyGfmStrikethrough from 'remark-cjk-friendly-gfm-strikethrough'
import remarkGfm from 'remark-gfm'
import smartypants from 'remark-smartypants'
import strip from 'strip-markdown'
import type {PageServerLoad} from './$types'

export const load: PageServerLoad = async () => {
  const title = 'quiple'
  const description = '번역 블로그.'
  const posts = getAllBlogContentMetadata()

  for (let i = 0; i < posts.length; i++) {
    const matchPath = `/src/posts/${posts[i].category}/${posts[i].slug}.md`
    const rawContent = blogPosts[matchPath] ?? blogArticles[matchPath]
    const {content} = matter(rawContent)

    posts[i].title = (await remark().use(strip).use(smartypants, {dashes: 'oldschool'}).process(posts[i].title))
      .toString()
      .replaceAll('\n', '')

    posts[i].description =
      posts[i].description ??
      ((stripped) => (stripped.length > 200 ? stripped.substring(0, 200).trim() + '\u2026' : stripped))(
        (
          await remark()
            .use(remarkGfm)
            .use(remarkCjkFriendly)
            .use(remarkCjkFriendlyGfmStrikethrough)
            .use(strip)
            .use(smartypants, {dashes: 'oldschool'})
            .process(content)
        )
          .toString()
          .replaceAll('\n', ' ')
          .replaceAll('  ', ' ')
          .replaceAll(/:::figure[^:]+:::/g, '')
          .replaceAll(/::figure\{[^}]+\}/g, '')
          .trim(),
      )
  }

  return {title, description, posts}
}
