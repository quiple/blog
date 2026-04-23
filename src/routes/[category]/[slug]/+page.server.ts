import {error} from '@sveltejs/kit'
import {
  blogArticles,
  blogFonts,
  blogPosts,
  getArticleMetadataFromMatter,
  getFontMetadataFromMatter,
  getPostMetadataFromMatter,
} from '$lib/content'
import imageSizes from '$lib/image-sizes.json'
import {generateDescription, processTitle} from '$lib/markdown'
import {mdxHandlers, preprocessMdx} from '$lib/mdx'
import {cn, getImageUrl} from '$lib/utils'
import matter from 'gray-matter'
import type {Root} from 'mdast'
import rehypeExternalLinks from 'rehype-external-links'
import rehypeStringify from 'rehype-stringify'
import {remark} from 'remark'
import remarkCjkFriendly from 'remark-cjk-friendly'
import remarkCjkFriendlyGfmStrikethrough from 'remark-cjk-friendly-gfm-strikethrough'
import remarkDirective from 'remark-directive'
import remarkGfm from 'remark-gfm'
// @ts-ignore
import remarkGithubAlerts from 'remark-github-alerts'
import remarkMdx from 'remark-mdx'
import remarkRehype from 'remark-rehype'
import smartypants from 'remark-smartypants'
import {visit} from 'unist-util-visit'
import type {PageServerLoad} from './$types'

const isProd = import.meta.env.PROD

export const load: PageServerLoad = async ({params}) => {
  const matchPath = `/src/posts/${params.category}/${params.slug}.md`
  const rawContent = blogPosts[matchPath] ?? blogArticles[matchPath] ?? blogFonts[matchPath]
  if (!rawContent) return error(404)
  const {content, data} = matter(rawContent as string)
  const isBlog = params.category === 'blog'
  const isArticle = params.category === 'article'
  const isFont = params.category === 'font'
  const postMetaData = isArticle
    ? getArticleMetadataFromMatter(params.category, params.slug, data)
    : isFont
      ? getFontMetadataFromMatter(params.category, params.slug, data)
      : getPostMetadataFromMatter(params.category, params.slug, data)

  postMetaData.title = await processTitle(postMetaData.title)
  postMetaData.description = postMetaData.description ?? (await generateDescription(content))

  const contentHtml = (
    await remark()
      .use(remarkDirective)
      .use(remarkMdx)
      .use(figure)
      .use(tweet)
      .use(remarkGfm)
      .use(remarkCjkFriendly)
      .use(remarkCjkFriendlyGfmStrikethrough)
      .use(remarkGithubAlerts)
      // @ts-expect-error Types of handlers don't perfectly match remark-rehype's expected types
      .use(remarkRehype, {allowDangerousHtml: true, handlers: mdxHandlers()})
      .use(rehypeImageSizes)
      .use(smartypants, {dashes: 'oldschool'})
      .use(rehypeExternalLinks, {target: '_blank', rel: ['nofollow', 'noreferrer', 'noopener']})
      .use(rehypeStringify, {allowDangerousHtml: true})
      .process(preprocessMdx(content))
  ).toString()

  const blogData = isBlog ? (postMetaData as ReturnType<typeof getPostMetadataFromMatter>) : undefined
  const articleData = isArticle ? (postMetaData as ReturnType<typeof getArticleMetadataFromMatter>) : undefined
  const fontData = isFont ? (postMetaData as ReturnType<typeof getFontMetadataFromMatter>) : undefined

  return {
    ...postMetaData,
    contentHtml,
    origDate: articleData?.origDate ?? fontData?.origDate ?? blogData?.origDate,
    media: articleData?.media,
    source: articleData?.source,
    author: articleData?.author,
    authorURL: articleData?.authorURL,
  }
}

function rehypeImageSizes() {
  return (tree: any) => {
    visit(tree, 'element', (node) => {
      if (node.tagName === 'img') {
        const src = node.properties.src
        if (!src) return

        let srcClean = src
        const baseUrl = isProd ? 'https://quiple.dev' : ''

        // Handle Cloudflare Image Resizing and other prefixes
        if (src.includes('/img/')) {
          srcClean = src.split('/img/').pop() || ''
        } else if (src.startsWith(baseUrl)) {
          srcClean = src.replace(baseUrl, '')
        }

        // Remove any remaining leading slashes
        srcClean = srcClean.replace(/^\//, '')

        // 이미지 주소를 프록시 주소로 교체
        node.properties.src = getImageUrl(srcClean, {w: 1280}, isProd)

        const sizeInfo = (imageSizes as Record<string, {width: number; height: number}>)[srcClean]
        if (sizeInfo) {
          node.properties.width = node.properties.width || sizeInfo.width
          node.properties.height = node.properties.height || sizeInfo.height
          node.properties.loading = node.properties.loading || 'lazy'
          node.properties.decoding = node.properties.decoding || 'async'

          const ratio = `${sizeInfo.width} / ${sizeInfo.height}`
          const existingStyle = node.properties.style || ''
          if (!existingStyle.includes('aspect-ratio')) {
            node.properties.style = `${existingStyle}${existingStyle ? ';' : ''} aspect-ratio: ${ratio};`.trim()
          }
        }
      } else if (
        node.tagName === 'iframe' &&
        (node.properties.src?.includes('youtube.com') || node.properties.className?.includes('aspect-video'))
      ) {
        // Ensure iframes have aspect-ratio even if missing attributes
        const existingStyle = node.properties.style || ''
        if (!existingStyle.includes('aspect-ratio')) {
          node.properties.style =
            `${existingStyle}${existingStyle ? ';' : ''} aspect-ratio: 16 / 9; width: 100%; height: auto;`.trim()
        }
      }
    })
  }
}

function figure() {
  return (tree: Root) => {
    visit(tree, (node) => {
      if (node.type === 'containerDirective' || node.type === 'leafDirective') {
        if (node.name !== 'figure' && node.name !== 'youtube' && node.name !== 'spotify') return

        const data = node.data || (node.data = {})
        const attributes = node.attributes || {}
        const srcClean = attributes.src?.replace('\\_', '_') || ''
        const src = getImageUrl(srcClean, {w: 1280}, isProd)
        const id = attributes.id
        const className = attributes.class ?? ''

        const sizeInfo = (imageSizes as Record<string, {width: number; height: number}>)[srcClean]
        const widthVal = attributes.width || sizeInfo?.width || ''
        const heightVal = attributes.height || sizeInfo?.height || ''

        const widthAttr = widthVal ? `width="${widthVal}"` : ''
        const heightAttr = heightVal ? `height="${heightVal}"` : ''

        let content = ''
        let wrapperStyle = ''
        let wrapperClass = cn('mx-auto self-center', node.name !== 'figure' && 'after:hidden')

        if (node.name === 'figure') {
          wrapperClass = cn(wrapperClass, className)
          const hasWidthClass = /(^|\s)w-/.test(className)
          if (widthVal && heightVal) {
            const maxWidth = hasWidthClass ? '100%' : `${widthVal}px`
            wrapperStyle = `style="aspect-ratio: ${widthVal} / ${heightVal}; max-width: ${maxWidth};"`
          }
          content = `<img class="not-prose w-full h-full block" src="${src}" ${widthAttr} ${heightAttr} loading="lazy" decoding="async" />`
        } else if (node.name === 'youtube') {
          content = `<iframe class="${cn('aspect-video w-full', className)}" src="https://www.youtube.com/embed/${id}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen loading="lazy" decoding="async"></iframe>`
        } else if (node.name === 'spotify') {
          content = `<iframe class="${cn('w-full', className)}" data-testid="embed-iframe" src="https://open.spotify.com/embed/${id?.replace(':', '/')}" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" decoding="async"></iframe>`
        }

        data.hName = 'figure'
        node.children =
          node.type === 'leafDirective'
            ? [
                {
                  type: 'html',
                  value: `<div class="${wrapperClass}" ${wrapperStyle}>${content}</div>`,
                },
              ]
            : [
                {
                  type: 'html',
                  value: `<div class="${wrapperClass}" ${wrapperStyle}>${content}</div><figcaption>`,
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
