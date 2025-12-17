import matter from 'gray-matter'
import * as v from 'valibot'
import {BASE_URL} from './constants'

export const CONTENT_BASE_PATH = '/src/content/blog'

export const blogPosts = import.meta.glob('/src/posts/*/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

export const blogPostMetadataSchema = v.object({
  category: v.pipe(v.string(), v.trim()),
  slug: v.pipe(v.string(), v.trim()),
  title: v.pipe(v.string(), v.trim()),
  description: v.optional(v.pipe(v.string(), v.trim())),
  source: v.optional(v.pipe(v.string(), v.url(), v.trim())),
  image: v.optional(v.pipe(v.string(), v.trim())),
  media: v.optional(v.pipe(v.string(), v.trim())),
  pubDate: v.pipe(v.string(), v.isoDateTime(), v.trim()),
  lastMod: v.optional(v.pipe(v.date())),
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
})

export function getMetadataFromMatter(
  category: string,
  slug: string,
  data: {
    [key: string]: unknown
  },
) {
  const post = v.parse(blogPostMetadataSchema, {
    category,
    slug,
    ...data,
  })
  const canonicalURL = new URL(`/${post.category}/${post.slug}`, BASE_URL).toString()
  const relativeURL = `/${post.category}/${post.slug}`
  const ogImage = `/content/${post.slug}/og.jpg`
  const heroImage = `/content/${post.slug}/hero.webp`

  return {...post, canonicalURL, relativeURL, ogImage, heroImage}
}

export type Post = ReturnType<typeof getMetadataFromMatter>

export function getBlogPostsMetadata() {
  const posts = Object.entries(blogPosts)
    .map(([filePath, rawContent]) => {
      const {data} = matter(rawContent)
      const category = filePath.split('/').at(-2) as string
      const slug = filePath.split('/').at(-1)?.split('.')[0] as string

      return getMetadataFromMatter(category, slug, data)
    })
    .sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf())

  return posts
}
