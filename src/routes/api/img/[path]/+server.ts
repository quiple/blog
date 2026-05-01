import {error} from '@sveltejs/kit'
import type {RequestHandler} from './$types'

const SECRET_HEADER = 'fb5328098e2fab0277635ff61df13870'

export const GET: RequestHandler = async ({params, url}) => {
  const {path} = params
  if (!path) throw error(400, 'Missing path')

  let decodedPath: string
  try {
    // Decode URL-safe base64 path
    let base64 = path.replace(/-/g, '+').replace(/_/g, '/')
    while (base64.length % 4) base64 += '='
    decodedPath = atob(base64)
  } catch {
    // Fallback if not base64
    decodedPath = path
  }

  // Ensure decodedPath doesn't start with /
  if (decodedPath.charCodeAt(0) === 47) decodedPath = decodedPath.slice(1)

  const imageUrl = `${url.origin}/img/${decodedPath}`

  const isOriginal = url.searchParams.get('original') === 'true'
  const width = url.searchParams.get('w')
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
    headers: {
      'x-internal-secret': SECRET_HEADER,
    },
    cf: isOriginal
      ? undefined
      : {
          image: options,
        },
  } as any)
}
