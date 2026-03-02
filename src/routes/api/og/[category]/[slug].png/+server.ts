import {ImageResponse} from '@ethercorps/sveltekit-og'
import {error} from '@sveltejs/kit'
import OgImage from '$lib/components/og/post.svelte'
import {blogArticles, blogFonts, blogPosts, getAllBlogContentMetadata} from '$lib/content'
import {processTitle} from '$lib/markdown'
import matter from 'gray-matter'
import type {EntryGenerator, RequestHandler} from './$types'

export const prerender = true

export const entries: EntryGenerator = () => {
  return getAllBlogContentMetadata().map((content) => ({
    category: content.category,
    slug: content.slug,
  }))
}

export const GET: RequestHandler = async ({params}) => {
  const matchPath = `/src/posts/${params.category}/${params.slug}.md`
  const rawContent = blogPosts[matchPath] ?? blogArticles[matchPath] ?? blogFonts[matchPath]
  if (!rawContent) return error(404)

  const {data} = matter(rawContent)
  const title = await processTitle(data.title as string)
  const image = (data.thumbnail || data.image) as string | undefined
  const imageForeground = data.imageForeground as string | undefined

  return new ImageResponse(
    OgImage,
    {
      width: 1200,
      height: 630,
    },
    {title, image, imageForeground},
  )
}
