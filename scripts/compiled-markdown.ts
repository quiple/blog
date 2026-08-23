import {readFile} from 'node:fs/promises'
import {fileURLToPath} from 'node:url'
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
import remarkMdx from 'remark-mdx'
import remarkRehype from 'remark-rehype'
import smartypants from 'remark-smartypants'
import {visit} from 'unist-util-visit'
import type {Plugin} from 'vite'
import {generateDescription, processTitle} from '../src/lib/markdown.ts'
import {mdxHandlers, preprocessMdx} from '../src/lib/mdx.ts'
import {cn, getImageUrl} from '../src/lib/utils.ts'

const COMPILED_MARKDOWN_QUERY = '?compiled-post'
const imageSizesPath = fileURLToPath(new URL('../src/lib/image-sizes.json', import.meta.url))
const imageSizeMap = JSON.parse(await readFile(imageSizesPath, 'utf8')) as Record<
  string,
  {width: number; height: number}
>
const widthClassRegex = /(^|\s)w-/
const maxHeightClassRegex = /\bmax-h-(\d+(?:\.\d+)?)\b/
const IMAGE_WIDTHS = [343, 576, 672, 686, 1152, 1344]
const DEFAULT_SIZES = '(min-width: 1536px) 672px, (min-width: calc(576px + 32px)) 576px, calc(100vw - 32px)'

export interface CompiledPostContent {
  contentHtml: string
  description: string
  title: string
}

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

function generateSrcSet(src: string) {
  return IMAGE_WIDTHS.map((width) => `${getImageUrl(src, {w: width})} ${width}w`).join(', ')
}

function rehypeImageSizes(isProduction: boolean) {
  return (tree: any) => {
    visit(tree, 'element', (node) => {
      if (node.tagName === 'img') {
        const src = node.properties.src
        if (!src) return

        let srcClean = src
        const baseUrl = isProduction ? 'https://quiple.dev' : ''
        const imgIndex = src.lastIndexOf('/img/')

        if (imgIndex !== -1) {
          srcClean = src.slice(imgIndex + 5)
        } else if (baseUrl && src.startsWith(baseUrl)) {
          srcClean = src.slice(baseUrl.length)
        }
        if (srcClean.charCodeAt(0) === 47) srcClean = srcClean.slice(1)

        const sizeInfo = imageSizeMap[srcClean]
        const width = node.properties.width || sizeInfo?.width
        const height = node.properties.height || sizeInfo?.height
        const frameStyle = imageFrameStyle(width, height, node.properties.style)

        node.tagName = 'span'
        node.properties = {
          className: cn('mdx-image-frame bg-muted animate-pulse', node.properties.className),
          style: frameStyle || undefined,
        }
        node.children = [
          {
            type: 'element',
            tagName: 'img',
            properties: {
              src: getImageUrl(srcClean, {w: 1344}),
              srcset: generateSrcSet(srcClean),
              sizes: DEFAULT_SIZES,
              alt: node.properties.alt,
              width,
              height,
              className: 'opacity-0 transition-opacity',
              loading: node.properties.loading || 'lazy',
              decoding: node.properties.decoding || 'async',
            },
            children: [],
          },
        ]
      } else if (
        node.tagName === 'iframe' &&
        (node.properties.src?.includes('youtube.com') || node.properties.className?.includes('aspect-video'))
      ) {
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
      if (node.type !== 'containerDirective' && node.type !== 'leafDirective') return
      if (node.name !== 'figure' && node.name !== 'youtube' && node.name !== 'spotify' && node.name !== 'tweet') return

      const data = node.data || (node.data = {})
      const attributes = node.attributes || {}
      const srcClean = attributes.src?.replace('\\_', '_') || ''
      const src = getImageUrl(srcClean, {w: 1344})
      const srcset = generateSrcSet(srcClean)
      const sizes = attributes.sizes || DEFAULT_SIZES
      const id = attributes.id
      const className = attributes.class ?? ''
      const sizeInfo = imageSizeMap[srcClean]
      const widthValue = attributes.width || sizeInfo?.width || ''
      const heightValue = attributes.height || sizeInfo?.height || ''

      let content = ''

      if (node.name === 'figure') {
        const hasWidthClass = widthClassRegex.test(className)
        const maxHeight = className.match(maxHeightClassRegex)?.[1]
        const hasHeightClass = Boolean(maxHeight)
        const constrainedWidth =
          maxHeight && widthValue && heightValue
            ? `calc(var(--spacing, 0.25rem) * ${(Number(maxHeight) * Number(widthValue)) / Number(heightValue)})`
            : undefined
        const mdxImageClass = hasWidthClass
          ? 'not-prose block h-full w-full max-w-full object-cover'
          : `not-prose mx-auto block max-w-full ${hasHeightClass ? 'w-fit' : 'w-full'}`

        content = imageFrameHtml({
          src,
          srcset,
          sizes,
          alt: attributes.alt ?? '',
          width: widthValue || undefined,
          height: heightValue || undefined,
          className: cn(
            'mx-auto self-center shadow-xs',
            mdxImageClass,
            constrainedWidth && 'mdx-constrained-width',
            className,
          ),
          style:
            !hasWidthClass && widthValue && heightValue
              ? [
                  `width: ${constrainedWidth ? 'min(100%, var(--mdx-constrained-width))' : `${widthValue}px`}`,
                  'max-width: 100%',
                  constrainedWidth && `--mdx-constrained-width: ${constrainedWidth}`,
                ]
                  .filter(Boolean)
                  .join('; ')
              : undefined,
          imgClassName: hasWidthClass || hasHeightClass ? 'h-full w-full' : 'h-auto max-h-full',
        })
      } else if (node.name === 'youtube') {
        content = `<iframe class="${cn('mdx-embed-frame aspect-video w-full rounded-lg shadow-xs mx-auto self-center', className)}" src="https://www.youtube.com/embed/${id}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen loading="lazy" decoding="async"></iframe>`
      } else if (node.name === 'spotify') {
        content = `<iframe class="${cn('mdx-embed-frame w-full rounded-lg shadow-xs mx-auto self-center', className)}" data-testid="embed-iframe" src="https://open.spotify.com/embed/${id?.replace(':', '/')}" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" decoding="async"></iframe>`
      } else {
        content = `<blockquote class="twitter-tweet" data-lang="ko"><a href="https://twitter.com/username/status/${id}?ref_src=twsrc%5Etfw"></a></blockquote>`
      }

      data.hName = 'figure'
      node.children =
        node.type === 'leafDirective'
          ? [{type: 'html', value: content}]
          : [{type: 'html', value: `${content}<figcaption>`}, ...node.children, {type: 'html', value: '</figcaption>'}]
    })
  }
}

async function compilePost(rawContent: string, isProduction: boolean): Promise<CompiledPostContent> {
  const {content, data} = matter(rawContent)
  const contentHtml = (
    await remark()
      .use(remarkDirective)
      .use(remarkMdx)
      .use(figure)
      .use(remarkGfm)
      .use(remarkCjkFriendly)
      .use(remarkCjkFriendlyGfmStrikethrough)
      .use(remarkGithubAlerts)
      // @ts-expect-error Custom MDX handlers produce valid HAST but use narrower local types.
      .use(remarkRehype, {allowDangerousHtml: true, handlers: mdxHandlers()})
      .use(() => rehypeImageSizes(isProduction))
      .use(smartypants, {dashes: 'oldschool'})
      .use(rehypeExternalLinks, {target: '_blank', rel: ['nofollow', 'noreferrer', 'noopener']})
      .use(rehypeStringify, {allowDangerousHtml: true})
      .process(preprocessMdx(content))
  ).toString()

  return {
    contentHtml,
    description: await generateDescription(content),
    title: await processTitle(String(data.title ?? '')),
  }
}

export function compiledMarkdown(): Plugin {
  let isProduction = false

  return {
    name: 'compiled-markdown',
    enforce: 'pre',
    configResolved(config) {
      isProduction = config.isProduction
    },
    async load(id) {
      if (!id.endsWith(COMPILED_MARKDOWN_QUERY)) return

      const filename = id.slice(0, -COMPILED_MARKDOWN_QUERY.length)
      this.addWatchFile(filename)
      const compiled = await compilePost(await readFile(filename, 'utf8'), isProduction)
      return `export default ${JSON.stringify(compiled)}`
    },
  }
}
