// @ts-expect-error missing @types/node
import fs from 'node:fs'
// @ts-expect-error missing @types/node
import path from 'node:path'
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
  console.log('Resolving fonts...')
  try {
    const resolvedFontOptions = await resolveFonts([geistBold, plexSansKRBold, plexSansJPBold])
    console.log('Fonts resolved')

    const matchPath = `/src/posts/${params.category}/${params.slug}.md`
    const rawContent = blogPosts[matchPath] ?? blogArticles[matchPath] ?? blogFonts[matchPath]
    if (!rawContent) return error(404)

    const {data} = matter(rawContent)
    const title = await processTitle(data.title as string)
    let image = data.image as string | undefined
    const imageForeground = data.imageForeground as string | undefined

    if (image) {
      const extensionLess = image.replace(/\.avif$/, '')
      // @ts-expect-error missing @types/node
      const assetDir = path.join(process.cwd(), 'src', 'lib', 'assets', params.category)
      const pngPath = path.join(assetDir, `${extensionLess}.png`)
      const jpgPath = path.join(assetDir, `${extensionLess}.jpg`)

      // @ts-expect-error missing @types/node
      let buf: Buffer | undefined
      let ext = 'png'

      if (fs.existsSync(pngPath)) {
        buf = fs.readFileSync(pngPath)
      } else if (fs.existsSync(jpgPath)) {
        buf = fs.readFileSync(jpgPath)
        ext = 'jpeg'
      }

      if (buf) {
        // We use base64 purely because Node's fetch (used by Satori) does not support file:/// URIs
        // and using absolute dev server URLs causes Vite SSR deadlock. This is much faster and cleaner!
        image = `data:image/${ext};base64,${buf.toString('base64')}`
      } else {
        image = undefined
      }
    }

    console.log({title, hasImage: !!image, image, imageForeground})

    console.log('Constructing ImageResponse...')
    return new ImageResponse(
      OgImage,
      {
        width: 1200,
        height: 600,
        fonts: resolvedFontOptions,
      },
      {title, image, imageForeground},
    )
  } catch (err) {
    console.error('Error in og GET:', err)
    throw err
  }
}
