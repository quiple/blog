import {ImageResponse} from '@ethercorps/sveltekit-og'
import {CustomFont, resolveFonts} from '@ethercorps/sveltekit-og/fonts'
import {error} from '@sveltejs/kit'
import {read} from '$app/server'
import geistBoldFontPath from '$lib/assets/fonts/Geist-Bold.otf?url'
import plexSansJPBoldFontPath from '$lib/assets/fonts/IBMPlexSansJP-Bold.otf?url'
import plexSansKRBoldFontPath from '$lib/assets/fonts/IBMPlexSansKR-Bold.otf?url'
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

const geistBold = new CustomFont('Geist', () => read(geistBoldFontPath).arrayBuffer(), {
  weight: 700,
})

const plexSansKRBold = new CustomFont('IBM Plex Sans KR', () => read(plexSansKRBoldFontPath).arrayBuffer(), {
  weight: 700,
})

const plexSansJPBold = new CustomFont('IBM Plex Sans JP', () => read(plexSansJPBoldFontPath).arrayBuffer(), {
  weight: 700,
})

export const GET: RequestHandler = async ({params}) => {
  const resolvedFontOptions = await resolveFonts([geistBold, plexSansKRBold, plexSansJPBold])

  const matchPath = `/src/posts/${params.category}/${params.slug}.md`
  const rawContent = blogPosts[matchPath] ?? blogArticles[matchPath] ?? blogFonts[matchPath]
  if (!rawContent) return error(404)

  const {data} = matter(rawContent)
  const title = await processTitle(data.title as string)
  const image = data.image as string | undefined
  const imageForeground = data.imageForeground as string | undefined

  return new ImageResponse(
    OgImage,
    {
      width: 1200,
      height: 600,
      fonts: resolvedFontOptions,
    },
    {title, image, imageForeground},
  )
}
