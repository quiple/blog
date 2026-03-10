import type {ComponentProps} from 'svelte'
import {ImageResponse} from '@ethercorps/sveltekit-og'
import {CustomFont, resolveFonts} from '@ethercorps/sveltekit-og/fonts'
import {read} from '$app/server'
import astaSansFontPath from '$lib/assets/fonts/AstaSans-ExtraBold.ttf?url'
import geistFontPath from '$lib/assets/fonts/Geist-SemiBold.otf?url'
import plexSansJPFontPath from '$lib/assets/fonts/IBMPlexSansJP-Bold.otf?url'
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

const geist = new CustomFont('Geist', () => read(geistFontPath).arrayBuffer(), {
  weight: 800,
})

const astaSans = new CustomFont('IBM Plex Sans KR', () => read(astaSansFontPath).arrayBuffer(), {
  weight: 800,
})

const plexSansJP = new CustomFont('IBM Plex Sans JP', () => read(plexSansJPFontPath).arrayBuffer(), {
  weight: 800,
})

export const GET: RequestHandler = async ({params}) => {
  const resolvedFontOptions = await resolveFonts([geist, astaSans, plexSansJP])

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
