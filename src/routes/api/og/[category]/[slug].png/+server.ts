import type {ComponentProps} from 'svelte'
import {read} from '$app/server'
import astrFontPath from '$lib/assets/fonts/AstrDisplay-SemiBold.otf?url'
import plexSansJPFontPath from '$lib/assets/fonts/IBMPlexSansJP-Bold.otf?url'
import {getCompiledContent} from '$lib/compiled-content'
import OgImage from '$lib/components/og/post.svelte'
import {blogArticles, blogFonts, blogPosts, parseMatter} from '$lib/content'
import type {EntryGenerator, RequestHandler} from './$types'

export const entries: EntryGenerator = () => {
  const allFiles = [...Object.keys(blogPosts), ...Object.keys(blogArticles), ...Object.keys(blogFonts)]

  return allFiles.map((filePath) => {
    const category = filePath.split('/').at(-2) as string
    const slug = filePath.split('/').at(-1)?.split('.')[0] as string

    return {category, slug}
  })
}

export const prerender = import.meta.env.VITE_PRERENDER_OG_IMAGES === 'true'

let resolvedFontOptionsPromise: ReturnType<typeof import('@ethercorps/sveltekit-og/fonts').resolveFonts> | undefined

function getResolvedFontOptions() {
  resolvedFontOptionsPromise ??= (async () => {
    const {CustomFont, resolveFonts} = await import('@ethercorps/sveltekit-og/fonts')

    const astr = new CustomFont('Geista', () => read(astrFontPath).arrayBuffer(), {
      weight: 600,
    })

    const plexSansJP = new CustomFont('IBM Plex Sans JP', () => read(plexSansJPFontPath).arrayBuffer(), {
      weight: 600,
    })

    return resolveFonts([astr, plexSansJP])
  })()
  return resolvedFontOptionsPromise
}

export const GET: RequestHandler = async ({params}) => {
  const {ImageResponse} = await import('@ethercorps/sveltekit-og')
  const resolvedFontOptions = await getResolvedFontOptions()

  const matchPath = `/src/posts/${params.category}/${params.slug}.md`
  const rawContent = blogPosts[matchPath] ?? blogArticles[matchPath] ?? blogFonts[matchPath]
  const compiledContent = getCompiledContent(matchPath)
  if (!rawContent || !compiledContent) return new Response(null, {status: 404})
  const {data} = parseMatter(rawContent as string)

  const props: ComponentProps<typeof OgImage> = {
    title: compiledContent.title,
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
