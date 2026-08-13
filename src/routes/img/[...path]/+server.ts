import {error} from '@sveltejs/kit'
import {dev} from '$app/environment'
import type {RequestHandler} from './$types'

const SECRET_HEADER = 'fb5328098e2fab0277635ff61df13870'

const MIME_TYPES: Record<string, string> = {
  '.avif': 'image/avif',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
}

function getMimeType(path: string): string {
  const ext = path.slice(path.lastIndexOf('.')).toLowerCase()
  return MIME_TYPES[ext] ?? 'application/octet-stream'
}

export const GET: RequestHandler = async ({params, platform}) => {
  const path = `img/${params.path}`

  if (dev) {
    // 개발 환경: 로컬 static 파일을 직접 반환
    // Vite가 static 디렉토리를 자동으로 서빙하므로 여기에 도달하면 static에 없는 경우
    // 프로덕션 사이트에서 fallback
    try {
      const res = await fetch(`https://quiple.dev/${path}`, {
        headers: {'x-internal-secret': SECRET_HEADER},
      })
      if (!res.ok) error(404, 'Not found')
      return new Response(res.body, {
        headers: {
          'Content-Type': res.headers.get('Content-Type') ?? getMimeType(path),
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      })
    } catch {
      error(404, 'Not found')
    }
  }

  // 프로덕션 환경: Cloudflare R2에서 서빙
  const bucket = platform?.env.R2
  if (!bucket) {
    error(500, 'R2 bucket not available')
  }

  const object = await bucket.get(path)
  if (!object) {
    error(404, 'Not found')
  }

  return new Response(object.body as ReadableStream, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType ?? getMimeType(path),
      'Cache-Control': 'public, max-age=31536000, immutable',
      ETag: object.httpEtag,
    },
  })
}
