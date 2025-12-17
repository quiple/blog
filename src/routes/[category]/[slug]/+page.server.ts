import {error} from '@sveltejs/kit'
import {blogPosts, getMetadataFromMatter} from '$lib/content'
import matter from 'gray-matter'
import type {Root} from 'mdast'
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
  postMetaData.title = (
    await remark().use(strip).use(smartypants, {dashes: 'oldschool'}).process(postMetaData.title)
  ).toString()

  const contentHTML = (
    await remark()
      .use(remarkDirective)
      .use(figure)
      .use(remarkGfm)
      .use(remarkCjkFriendly)
      .use(smartypants, {dashes: 'oldschool'})
      .use(remarkRehype)
      .use(rehypeStringify)
      .process(content)
  ).toString()

  return {
    ...postMetaData,
    contentHTML,
  }
}

function figure() {
  return (tree: Root) => {
    visit(tree, function (node) {
      if (node.type === 'leafDirective') {
        if (node.name !== 'figure') return

        const data = node.data || (node.data = {})
        const attributes = node.attributes || {}
        const src = attributes.src

        data.hName = 'figure'
        data.hChildren = [
          {
            type: 'element',
            tagName: 'div',
            properties: {class: 'self-center'},
            children: [
              {
                type: 'element',
                tagName: 'img',
                properties: {src: src, class: 'not-prose'},
                children: [],
              },
            ],
          },
          {
            type: 'element',
            tagName: 'figcaption',
            properties: {},
            children: [{type: 'text', value: node.children[0].value}],
          },
        ]
      }
    })
  }
}

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
