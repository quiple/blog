import {error} from '@sveltejs/kit'
import {dev} from '$app/environment'
import {getAllBlogContentMetadata} from '$lib/content'
import type {RequestHandler} from './$types'

const originalImagePaths = new Set(
  getAllBlogContentMetadata()
    .filter(({image, imageType}) => image && imageType === 'pixel')
    .map(({image}) => image as string),
)

function decodeImagePath(path: string) {
  if (!/^[A-Za-z0-9_-]+$/.test(path)) throw error(400, 'Invalid image path')

  try {
    let base64 = path.replace(/-/g, '+').replace(/_/g, '/')
    while (base64.length % 4) base64 += '='
    return atob(base64)
  } catch {
    throw error(400, 'Invalid image path')
  }
}

function assertSafeImagePath(path: string, origin: string) {
  if (!path || path.includes('\\') || path.includes('\0')) throw error(400, 'Invalid image path')

  let decodedPath = path
  try {
    for (let i = 0; i < 3; i++) {
      const decoded = decodeURIComponent(decodedPath)
      if (decoded === decodedPath) break
      decodedPath = decoded
    }
  } catch {
    throw error(400, 'Invalid image path')
  }

  const segments = decodedPath.split('/')
  if (segments.some((segment) => !segment || segment === '.' || segment === '..')) {
    throw error(400, 'Invalid image path')
  }

  const imageUrl = new URL(`/img/${path}`, origin)
  if (!imageUrl.pathname.startsWith('/img/')) throw error(400, 'Invalid image path')
  return imageUrl
}

export const GET: RequestHandler = async ({params, url, platform}) => {
  const {path} = params
  if (!path) throw error(400, 'Missing path')
  if (dev) throw error(404, 'Image delivery disabled in development')

  const decodedPath = decodeImagePath(path)
  const imageUrl = assertSafeImagePath(decodedPath, url.origin)
  const isOriginal = url.searchParams.get('original') === 'true'

  if (isOriginal) {
    if (!originalImagePaths.has(decodedPath)) throw error(403, 'Original image access denied')

    const bucket = platform?.env.R2
    if (!bucket) throw error(500, 'R2 bucket not available')

    const object = await bucket.get(`img/${decodedPath}`)
    if (!object) throw error(404, 'Not found')

    const responseHeaders = new Headers()
    object.writeHttpMetadata(responseHeaders)
    responseHeaders.set('Cache-Control', 'public, max-age=31536000, immutable')
    responseHeaders.set('ETag', object.httpEtag)

    return new Response(object.body as ReadableStream, {headers: responseHeaders})
  }

  const secret = platform?.env.INTERNAL_IMAGE_SECRET
  if (!secret) error(503, 'Image access is not configured')

  const width = url.searchParams.get('w') || '1280'
  const height = url.searchParams.get('h')
  const quality = url.searchParams.get('q')
  const format = url.searchParams.get('f') || 'avif'

  const options: Record<string, string | number> = {
    quality: quality ? +quality : 75,
    format,
  }
  if (width) options.width = +width
  if (height) options.height = +height

  return globalThis.fetch(imageUrl, {
    headers: {'x-internal-secret': secret},
    cf: {
      image: options,
    },
  } as any)
}
