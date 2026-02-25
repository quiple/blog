import {error} from '@sveltejs/kit'
import {blogArticles, blogPosts, getArticleMetadataFromMatter} from '$lib/content'
import {cn} from '$lib/utils'
import matter from 'gray-matter'
import type {Root} from 'mdast'
import rehypeExternalLinks from 'rehype-external-links'
import rehypeStringify from 'rehype-stringify'
import {remark} from 'remark'
import remarkCjkFriendly from 'remark-cjk-friendly'
import remarkCjkFriendlyGfmStrikethrough from 'remark-cjk-friendly-gfm-strikethrough'
import remarkDirective from 'remark-directive'
import remarkGfm from 'remark-gfm'
import remarkGithubAlerts from 'remark-github-alerts'
import remarkRehype from 'remark-rehype'
import smartypants from 'remark-smartypants'
import strip from 'strip-markdown'
import {visit} from 'unist-util-visit'
import type {PageServerLoad} from './$types'

export const load: PageServerLoad = async ({params}) => {
  const matchPath = `/src/posts/${params.category}/${params.slug}.md`
  const rawContent = blogPosts[matchPath] ?? blogArticles[matchPath]
  if (!rawContent) return error(404)

  const {content, data} = matter(rawContent)
  const postMetaData = getArticleMetadataFromMatter(params.category, params.slug, data)

  postMetaData.title = (await remark().use(strip).use(smartypants, {dashes: 'oldschool'}).process(postMetaData.title))
    .toString()
    .replaceAll('\n', '')

  postMetaData.description =
    postMetaData.description ??
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
      .substring(0, 200)
      .replaceAll('\n', ' ')
      .replaceAll('  ', ' ')
      .trim() + '\u2026'

  const contentHtml = (
    await remark()
      .use(remarkDirective)
      .use(figure)
      .use(tweet)
      .use(remarkGfm)
      .use(remarkCjkFriendly)
      .use(remarkCjkFriendlyGfmStrikethrough)
      .use(remarkGithubAlerts)
      .use(remarkRehype, {allowDangerousHtml: true})
      .use(smartypants, {dashes: 'oldschool'})
      .use(rehypeExternalLinks, {target: '_blank', rel: ['nofollow', 'noreferrer', 'noopener']})
      .use(rehypeStringify, {allowDangerousHtml: true})
      .process(content)
  ).toString()

  return {
    ...postMetaData,
    contentHtml,
  }
}

function figure() {
  return (tree: Root) => {
    visit(tree, (node) => {
      if (node.type === 'containerDirective' || node.type === 'leafDirective') {
        if (node.name !== 'figure' && node.name !== 'youtube' && node.name !== 'spotify') return

        const data = node.data || (node.data = {})
        const attributes = node.attributes || {}
        const src = attributes.src
        const id = attributes.id
        const className = attributes.class ?? ''
        const img = `<img class="${cn('not-prose', className)}" src="${src}" />`
        const youtube = `<iframe class="${cn('aspect-video', className)}" src="https://www.youtube.com/embed/${id}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`
        const spotify = `<iframe class="${className}" data-testid="embed-iframe" src="https://open.spotify.com/embed/${id?.replace(':', '/')}" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`

        let content = img
        if (node.name === 'youtube') content = youtube
        if (node.name === 'spotify') content = spotify

        data.hName = 'figure'
        node.children =
          node.type === 'leafDirective'
            ? [
                {
                  type: 'html',
                  value: `<div class="self-center ${node.name !== 'figure' && 'after:hidden'}">${content}</div>`,
                },
              ]
            : [
                {
                  type: 'html',
                  value: `<div class="self-center ${node.name !== 'figure' && 'after:hidden'}">${content}</div><figcaption>`,
                },
                // @ts-ignore
                ...node.children[0].children,
                {type: 'html', value: `</figcaption>`},
              ]
      }
    })
  }
}

function tweet() {
  return (tree: Root) => {
    visit(tree, 'leafDirective', (node) => {
      if (node.name !== 'tweet') return

      const data = node.data || (node.data = {})
      const attributes = node.attributes || {}
      const id = attributes.id

      data.hName = 'blockquote'
      data.hProperties = {
        class: 'twitter-tweet',
        'data-lang': 'ko',
      }
      node.children = [
        {
          type: 'html',
          value: `<a href="https://twitter.com/username/status/${id}?ref_src=twsrc%5Etfw"></a>`,
        },
      ]
    })
  }
}
