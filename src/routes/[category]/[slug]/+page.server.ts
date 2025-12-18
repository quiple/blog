import {error} from '@sveltejs/kit'
import {blogPosts, getMetadataFromMatter} from '$lib/content'
import matter from 'gray-matter'
import type {Root} from 'mdast'
import rehypeExternalLinks from 'rehype-external-links'
import rehypeStringify from 'rehype-stringify'
import {remark} from 'remark'
import remarkCjkFriendly from 'remark-cjk-friendly'
import remarkDirective from 'remark-directive'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import smartypants from 'remark-smartypants'
import strip from 'strip-markdown'
import {visit} from 'unist-util-visit'
import type {PageServerLoad} from './$types'

export const load: PageServerLoad = async ({params}) => {
  const matchPath = `/src/posts/${params.category}/${params.slug}.md`
  const rawContent = blogPosts[matchPath]
  if (!rawContent) return error(404)

  const {content, data} = matter(rawContent)

  const postMetaData = getMetadataFromMatter(params.category, params.slug, data)
  postMetaData.title = (
    await remark().use(strip).use(smartypants, {dashes: 'oldschool'}).process(postMetaData.title)
  ).toString()

  const contentHtml = (
    await remark()
      .use(remarkDirective)
      .use(figure)
      .use(remarkRehype)
      .use(rehypeExternalLinks, {target: '_blank', rel: ['nofollow', 'noreferrer', 'noopener']})
      .use(rehypeStringify)
      .use(remarkGfm)
      .use(remarkCjkFriendly)
      .use(smartypants, {dashes: 'oldschool'})
      .process(content)
  ).toString()

  const contentSummary = (
    await remark()
      .use(remarkGfm)
      .use(remarkCjkFriendly)
      .use(strip)
      .use(smartypants, {dashes: 'oldschool'})
      .process(content)
  )
    .toString()
    .substring(0, 200)
    .replaceAll('\n', ' ')
    .replaceAll('  ', ' ')

  return {
    ...postMetaData,
    contentHtml,
    contentSummary,
  }
}

function figure() {
  return (tree: Root) => {
    visit(tree, 'containerDirective', (node) => {
      if (node.name !== 'figure') return

      const data = node.data || (node.data = {})
      const attributes = node.attributes || {}
      const src = attributes.src

      data.hName = 'figure'
      node.children = [
        {
          type: 'html',
          value: `<div class="self-center"><img class="not-prose" src="${src}"></div><figcaption>`,
        },
        // @ts-ignore
        ...node.children[0].children,
        {type: 'html', value: `</figcaption>`},
      ]
    })
  }
}
