import matter from 'gray-matter'
import * as v from 'valibot'
import {BASE_URL} from './constants'

export const blogPosts = import.meta.glob('/src/posts/post/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

export const blogArticles = import.meta.glob('/src/posts/article/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

export const blogFonts = import.meta.glob('/src/posts/font/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

// --- Shared schema fields ---

const trimmedString = v.pipe(v.string(), v.trim())
const optionalTrimmedString = v.optional(trimmedString)

const baseMetadataFields = {
  category: trimmedString,
  slug: trimmedString,
  title: trimmedString,
  description: optionalTrimmedString,
  image: optionalTrimmedString,
  originalImage: optionalTrimmedString,
  imageVerticalAlign: v.optional(v.pipe(v.number())),
  thumbnail: optionalTrimmedString,
  imageForeground: optionalTrimmedString,
  outline: optionalTrimmedString,
  pubDate: v.pipe(v.string(), v.isoDateTime(), v.trim()),
  tags: v.optional(
    v.pipe(
      v.string(),
      v.regex(
        /^(?:[A-Za-z0-9._~-]|%[0-9A-Fa-f]{2})+(?:,(?:[A-Za-z0-9._~-]|%[0-9A-Fa-f]{2})+)*$/,
        'Must be comma-separated URL-safe segments.',
      ),
      v.transform((value) => value.split(',')),
    ),
  ),
}

export const blogPostMetadataSchema = v.object({
  ...baseMetadataFields,
})

export const blogArticleMetadataSchema = v.object({
  ...baseMetadataFields,
  media: optionalTrimmedString,
  source: v.optional(v.pipe(v.string(), v.url(), v.trim())),
  author: optionalTrimmedString,
  authorURL: v.optional(v.pipe(v.string(), v.url(), v.trim())),
  origDate: v.union([v.pipe(v.date()), v.pipe(v.string(), v.isoDateTime(), v.trim())]),
})

export const blogFontMetadataSchema = v.object({
  ...baseMetadataFields,
  origDate: v.optional(v.union([v.pipe(v.date()), v.pipe(v.string(), v.isoDateTime(), v.trim())])),
})

// --- Generic metadata helpers ---

function getMetadataFromMatter<T extends v.ObjectEntries>(
  schema: v.ObjectSchema<T, undefined>,
  category: string,
  slug: string,
  data: {[key: string]: unknown},
) {
  const parsed = v.parse(schema, {category, slug, ...data})
  const canonicalURL = new URL(`/${parsed.category}/${parsed.slug}`, BASE_URL).toString()
  const relativeURL = `/${parsed.category}/${parsed.slug}`

  return {...parsed, canonicalURL, relativeURL}
}

export function getPostMetadataFromMatter(category: string, slug: string, data: {[key: string]: unknown}) {
  return getMetadataFromMatter(blogPostMetadataSchema, category, slug, data)
}

export function getArticleMetadataFromMatter(category: string, slug: string, data: {[key: string]: unknown}) {
  return getMetadataFromMatter(blogArticleMetadataSchema, category, slug, data)
}

export function getFontMetadataFromMatter(category: string, slug: string, data: {[key: string]: unknown}) {
  return getMetadataFromMatter(blogFontMetadataSchema, category, slug, data)
}

export type Post = ReturnType<typeof getPostMetadataFromMatter>
export type Article = ReturnType<typeof getArticleMetadataFromMatter>
export type Font = ReturnType<typeof getFontMetadataFromMatter>

// --- Generic content list builder ---

function getContentMetadata<T>(
  globEntries: Record<string, unknown>,
  metadataFn: (category: string, slug: string, data: {[key: string]: unknown}) => T,
) {
  return Object.entries(globEntries)
    .map(([filePath, rawContent]) => {
      const {data} = matter(rawContent)
      const category = filePath.split('/').at(-2) as string
      const slug = filePath.split('/').at(-1)?.split('.')[0] as string

      return metadataFn(category, slug, data)
    })
    .sort((a, b) => {
      const aDate = (a as {pubDate: string}).pubDate
      const bDate = (b as {pubDate: string}).pubDate
      return Date.parse(`${bDate.valueOf()}+09:00`) - Date.parse(`${aDate.valueOf()}+09:00`)
    })
}

export function getBlogPostsMetadata() {
  return getContentMetadata(blogPosts, getPostMetadataFromMatter)
}

export function getBlogArticlesMetadata() {
  return getContentMetadata(blogArticles, getArticleMetadataFromMatter)
}

export function getBlogFontsMetadata() {
  return getContentMetadata(blogFonts, getFontMetadataFromMatter)
}

export function getAllBlogContentMetadata() {
  const posts = getBlogPostsMetadata().map((p) => ({
    ...p,
    origDate: undefined as undefined,
    media: undefined as string | undefined,
  }))
  const articles = getBlogArticlesMetadata().map((a) => ({
    ...a,
    origDate: a.origDate,
    media: a.media,
  }))
  const fonts = getBlogFontsMetadata().map((f) => ({
    ...f,
    origDate: undefined as undefined,
    media: undefined as string | undefined,
  }))

  return [...posts, ...articles, ...fonts].sort(
    (a, b) => Date.parse(`${b.pubDate.valueOf()}+09:00`) - Date.parse(`${a.pubDate.valueOf()}+09:00`),
  )
}
