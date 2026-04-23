import {error} from '@sveltejs/kit'
import type {RequestHandler} from './$types'

export const GET: RequestHandler = async ({params, url, fetch}) => {
  const {path} = params
  if (!path) throw error(400, 'Missing path')

  let decodedPath: string
  try {
    // Decode URL-safe base64 path
    let base64 = path.replace(/-/g, '+').replace(/_/g, '/')
    while (base64.length % 4) base64 += '='
    decodedPath = atob(base64)
  } catch (e) {
    // Fallback if not base64
    decodedPath = path
  }

  // Ensure decodedPath doesn't start with /
  decodedPath = decodedPath.replace(/^\//, '')

  // Internal URL to the original image
  // Cloudflare Image Resizing requires an absolute URL when used in fetch()
  const imageUrl = `${url.origin}/img/${decodedPath}`

  // Resizing options from query parameters
  const width = url.searchParams.get('w')
  const height = url.searchParams.get('h')
  const quality = url.searchParams.get('q') || '75'
  const format = url.searchParams.get('f') || 'avif'

  // If width or height is provided, use Cloudflare Image Resizing
  // Otherwise just fetch the original (but maybe still through cf for caching)
  const options: any = {
    quality: parseInt(quality),
    format,
  }
  if (width) options.width = parseInt(width)
  if (height) options.height = parseInt(height)

  return fetch(imageUrl, {
    headers: {
      // 이 키는 Cloudflare WAF 설정과 일치해야 합니다.
      'x-internal-secret': 'fb5328098e2fab0277635ff61df13870',
    },
    cf: {
      image: options,
    },
  } as any)
}
