import {ImageResponse} from '@ethercorps/sveltekit-og'
import type {RequestHandler} from '@sveltejs/kit'
import OgImage from '$lib/components/og/post.svelte'

// This is optional, use it if you want to generate OG image at build time.
export const prerender = true

export const GET: RequestHandler = async () => {
  return new ImageResponse(OgImage, {
    width: 1200,
    height: 600,
  })
}
