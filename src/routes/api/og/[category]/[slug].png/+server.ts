import type {ComponentProps} from 'svelte'
import {ImageResponse} from '@ethercorps/sveltekit-og'
import {CustomFont, resolveFonts} from '@ethercorps/sveltekit-og/fonts'
import {read} from '$app/server'
import geistBoldFontPath from '$lib/assets/fonts/Geist-Bold.otf?url'
import plexSansJPBoldFontPath from '$lib/assets/fonts/IBMPlexSansJP-Bold.otf?url'
import plexSansKRBoldFontPath from '$lib/assets/fonts/IBMPlexSansKR-Bold.otf?url'
import OgImage from '$lib/components/og/post.svelte'
import {blogArticles, blogFonts, blogPosts} from '$lib/content'
import {processTitle} from '$lib/markdown'
import matter from 'gray-matter'
import type {EntryGenerator, RequestHandler} from './$types'

export const entries: EntryGenerator = () => {
  const allFiles = [...Object.keys(blogPosts), ...Object.keys(blogArticles), ...Object.keys(blogFonts)]

  return allFiles.map((filePath) => {
    const category = filePath.split('/').at(-2) as string
    const slug = filePath.split('/').at(-1)?.split('.')[0] as string

    return {category, slug}
  })
}

export const prerender = true

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
  if (!rawContent) return new Response(null, {status: 404})

  const {data} = matter(rawContent)

  const props: ComponentProps<typeof OgImage> = {
    title: await processTitle(data.title as string),
    category: params.category as string,
    image: (data.originalImage as string) ?? (data.image as string),
    imageForeground: (data.imageForeground as string) ?? '09090b',
  }

  return new ImageResponse(
    OgImage,
    {
      width: 1200,
      height: 630,
      fonts: resolvedFontOptions,
      // Caching for long-term storage since it's pre-rendered
      headers: {
        'Cache-Control': 'public, immutable, max-age=31536000',
      },
    },
    props,
  )
}
