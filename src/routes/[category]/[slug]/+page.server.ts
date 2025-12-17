import {error} from '@sveltejs/kit'
import {blogPosts, getMetadataFromMatter} from '$lib/content'
import matter from 'gray-matter'
import rehypeStringify from 'rehype-stringify'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import {unified} from 'unified'
import type {PageServerLoad} from './$types'

// const figureDirective: DirectiveConfig = {
//   level: 'block',
//   marker: '::',
//   renderer(token) {
//     if (token.meta.name === 'figure') {
//       return `<figure><div class="self-center"><img class="not-prose" src="${token.attrs?.src}" alt="${token.text.replace(/<[^>]*>?/g, '')}"></div><figcaption>${token.text}</figcaption></figure>`
//     }

//     return false
//   },
// }

// const renderer = {
//   link(link: any) {
//     const linkStr = marked.Renderer.prototype.link.call(this, link)
//     if (/^(https?:)?\/\//g.test(link.href)) {
//       return linkStr.replace('<a', "<a target='_blank' rel='nofollow noreferrer noopener'")
//     }
//     return linkStr
//   },
// }

export const load: PageServerLoad = async ({params}) => {
  const matchPath = `/src/posts/${params.category}/${params.slug}.md`
  const rawContent = blogPosts[matchPath]
  if (!rawContent) return error(404)

  const {content, data} = matter(rawContent)

  const postMetaData = getMetadataFromMatter(params.category, params.slug, data)

  const contentHTML = (
    await unified().use(remarkParse).use(remarkRehype).use(rehypeStringify).process(content)
  ).toString()

  return {
    ...postMetaData,
    contentHTML,
  }
}
