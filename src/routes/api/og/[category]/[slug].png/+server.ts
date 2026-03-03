import {Buffer} from 'node:buffer'
import type {ComponentProps} from 'svelte'
import {ImageResponse} from '@ethercorps/sveltekit-og'
import {CustomFont, resolveFonts} from '@ethercorps/sveltekit-og/fonts'
import {error} from '@sveltejs/kit'
import {read} from '$app/server'
import geistBoldFontPath from '$lib/assets/fonts/Geist-Bold.otf?url'
import plexSansJPBoldFontPath from '$lib/assets/fonts/IBMPlexSansJP-Bold.otf?url'
import plexSansKRBoldFontPath from '$lib/assets/fonts/IBMPlexSansKR-Bold.otf?url'
import OgImage from '$lib/components/og/post.svelte'
import {blogArticles, blogFonts, blogPosts} from '$lib/content'
import {processTitle} from '$lib/markdown'
import matter from 'gray-matter'
import type {RequestHandler} from './$types'

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

export const GET: RequestHandler = async ({params, fetch}) => {
  const resolvedFontOptions = await resolveFonts([geistBold, plexSansKRBold, plexSansJPBold])

  const matchPath = `/src/posts/${params.category}/${params.slug}.md`
  const rawContent = blogPosts[matchPath] ?? blogArticles[matchPath] ?? blogFonts[matchPath]
  if (!rawContent) return error(404)

  const {data} = matter(rawContent)

  let imageSrc: string | undefined = data.image as string | undefined
  if (imageSrc) {
    try {
      const res = await fetch(`/img/${data.category}/${imageSrc}`)
      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString('base64')
        const ext = imageSrc.split('.').pop() || 'png'
        imageSrc = `data:image/${ext};base64,${base64}`
      } else {
        imageSrc = undefined
      }
    } catch (e) {
      console.error('Failed to load image for OG generation', e)
      imageSrc = undefined
    }
  }

  const props: ComponentProps<typeof OgImage> = {
    title: await processTitle(data.title as string),
    category: data.category as string,
    image: imageSrc,
    imageForeground: data.imageForeground as string,
  }

  return new ImageResponse(
    OgImage,
    {
      width: 1200,
      height: 630,
      fonts: resolvedFontOptions,
    },
    props,
  )
}
