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
const imageSizeMap = imageSizes as Record<string, {width: number; height: number}>
const widthClassRegex = /(^|\s)w-/
const IMAGE_WIDTHS = [343, 576, 672, 686, 1152, 1344]
const DEFAULT_SIZES = '(min-width: 1536px) 672px, (min-width: calc(576px + 32px)) 576px, calc(100vw - 32px)'

function escapeHtmlAttr(value: unknown) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function htmlAttrs(attrs: Record<string, unknown>) {
  return Object.entries(attrs)
    .filter(([, value]) => value !== undefined && value !== null && value !== false)
    .map(([name, value]) => (value === true ? name : `${name}="${escapeHtmlAttr(value)}"`))
    .join(' ')
}

function htmlAttrString(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
}

function imageFrameStyle(width: unknown, height: unknown, style?: unknown) {
  const widthValue = htmlAttrString(width)
  const heightValue = htmlAttrString(height)

  return [
    widthValue && heightValue ? `aspect-ratio: ${widthValue} / ${heightValue}` : '',
    typeof style === 'string' ? style.replace(/;$/, '') : '',
  ]
    .filter(Boolean)
    .join('; ')
}

function imageFrameHtml({
  src,
  srcset,
  sizes,
  alt = '',
  width,
  height,
  className,
  style,
  imgClassName,
  loading = 'lazy',
  decoding = 'async',
}: {
  src: string
  srcset?: string
  sizes?: string
  alt?: unknown
  width?: unknown
  height?: unknown
  className?: string
  style?: unknown
  imgClassName?: string
  loading?: unknown
  decoding?: unknown
}) {
  const frameStyle = imageFrameStyle(width, height, style)

  return `<span ${htmlAttrs({
    class: cn('mdx-image-frame bg-muted animate-pulse', className),
    style: frameStyle || undefined,
  })}><img ${htmlAttrs({
    src,
    srcset,
    sizes,
    alt,
    width,
    height,
    class: cn('opacity-0 transition-opacity', imgClassName),
    loading,
    decoding,
  })}></span>`
}

function generateSrcSet(src: string, isProd: boolean) {
  return IMAGE_WIDTHS.map((w) => `${getImageUrl(src, {w}, isProd)} ${w}w`).join(', ')
}

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
        const imgIdx = src.lastIndexOf('/img/')
        if (imgIdx !== -1) {
          srcClean = src.slice(imgIdx + 5)
        } else if (baseUrl && src.startsWith(baseUrl)) {
          srcClean = src.slice(baseUrl.length)
        }

        // Remove any remaining leading slashes
        if (srcClean.charCodeAt(0) === 47) srcClean = srcClean.slice(1)

        // 이미지 주소를 프록시 주소로 교체
        const imageSrc = getImageUrl(srcClean, {w: 1344}, isProd)
        const imageSrcset = generateSrcSet(srcClean, isProd)
        const imageSizesAttr = DEFAULT_SIZES
        const imageAlt = node.properties.alt
        const imageClassName = node.properties.className
        const imageStyle = node.properties.style
        const imageLoading = node.properties.loading || 'lazy'
        const imageDecoding = node.properties.decoding || 'async'

        const sizeInfo = imageSizeMap[srcClean]
        const width = node.properties.width || sizeInfo?.width
        const height = node.properties.height || sizeInfo?.height
        const frameStyle = imageFrameStyle(width, height, imageStyle)

        node.tagName = 'span'
        node.properties = {
          className: cn('mdx-image-frame bg-muted animate-pulse', imageClassName),
          style: frameStyle || undefined,
        }
        node.children = [
          {
            type: 'element',
            tagName: 'img',
            properties: {
              src: imageSrc,
              srcset: imageSrcset,
              sizes: imageSizesAttr,
              alt: imageAlt,
              width,
              height,
              className: 'opacity-0 transition-opacity',
              loading: imageLoading,
              decoding: imageDecoding,
            },
            children: [],
          },
        ]
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
        if (node.name !== 'figure' && node.name !== 'youtube' && node.name !== 'spotify' && node.name !== 'tweet')
          return

        const data = node.data || (node.data = {})
        const attributes = node.attributes || {}
        const srcClean = attributes.src?.replace('\\_', '_') || ''
        const src = getImageUrl(srcClean, {w: 1344}, isProd)
        const srcset = generateSrcSet(srcClean, isProd)
        const sizes = attributes.sizes || DEFAULT_SIZES
        const id = attributes.id
        const className = attributes.class ?? ''

        const sizeInfo = imageSizeMap[srcClean]
        const widthVal = attributes.width || sizeInfo?.width || ''
        const heightVal = attributes.height || sizeInfo?.height || ''

        const widthAttr = widthVal ? `width="${widthVal}"` : ''
        const heightAttr = heightVal ? `height="${heightVal}"` : ''

        let content = ''
        let wrapperStyle = ''
        let wrapperClass = cn('wrapper', node.name !== 'figure' && 'after:hidden')

        if (node.name === 'figure') {
          wrapperClass = cn(wrapperClass, className)
          const hasWidthClass = widthClassRegex.test(className)
          const heightClasses = className?.match(/\b(max-h-|h-)[^\s]+\b/g)?.join(' ') || ''
          const hasHeightClass = Boolean(heightClasses)
          if (widthVal && heightVal) {
            const maxWidth = hasWidthClass || !hasHeightClass ? '100%' : `min(100%, ${widthVal}px)`
            const widthStyle = hasWidthClass ? '' : hasHeightClass ? ' width: fit-content;' : ` width: ${widthVal}px;`
            wrapperStyle = `style="aspect-ratio: ${widthVal} / ${heightVal}; max-width: ${maxWidth};${widthStyle}"`
          }
          const mdxImageClass = hasWidthClass
            ? 'not-prose block h-full w-full object-cover'
            : `not-prose block ${hasHeightClass ? 'w-fit' : 'w-full'} mx-auto max-h-full ${heightClasses}`
          content = imageFrameHtml({
            src,
            srcset,
            sizes,
            alt: attributes.alt ?? '',
            width: widthAttr ? widthVal : undefined,
            height: heightAttr ? heightVal : undefined,
            className: mdxImageClass.trim(),
            imgClassName: hasWidthClass ? 'h-full w-full' : 'h-auto max-h-full',
            loading: 'lazy',
            decoding: 'async',
          })
        } else if (node.name === 'youtube') {
          content = `<iframe class="${cn('aspect-video w-full', className)}" src="https://www.youtube.com/embed/${id}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen loading="lazy" decoding="async"></iframe>`
        } else if (node.name === 'spotify') {
          content = `<iframe class="${cn('w-full', className)}" data-testid="embed-iframe" src="https://open.spotify.com/embed/${id?.replace(':', '/')}" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" decoding="async"></iframe>`
        } else if (node.name === 'tweet') {
          content = `<blockquote class="twitter-tweet" data-lang="ko"><a href="https://twitter.com/username/status/${id}?ref_src=twsrc%5Etfw"></a></blockquote>`
        }

        data.hName = 'figure'
        node.children =
          node.type === 'leafDirective'
            ? [
                {
                  type: 'html',
                  value:
                    node.name !== 'tweet' ? `<div class="${wrapperClass}" ${wrapperStyle}>${content}</div>` : content,
                },
              ]
            : [
                {
                  type: 'html',
                  value:
                    node.name !== 'tweet'
                      ? `<div class="${wrapperClass}" ${wrapperStyle}>${content}</div><figcaption>`
                      : `${content}<figcaption>`,
                },
                ...node.children,
                {type: 'html', value: `</figcaption>`},
              ]
      }
    })
  }
}
