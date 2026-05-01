import fs from 'fs'
import path from 'path'
import {error} from '@sveltejs/kit'
import {dev} from '$app/environment'
import {read} from '$app/server'
import type {RequestHandler} from './$types'

/**
 * 폰트 데이터를 안전하게 제공하는 API
 * Referer 체크 및 CORS 헤더를 통해 외부 핫링크를 방지합니다.
 */
export const GET: RequestHandler = async ({params, request, url}) => {
  const {name} = params
  if (!name) throw error(400, 'Missing font name')

  // 1. Referer 체크 (보안 강화)
  const referer = request.headers.get('referer')
  const allowedHost = 'quiple.dev'

  if (!dev && (!referer || !referer.includes(allowedHost))) {
    throw error(403, 'Forbidden: Hotlinking is not allowed.')
  }

  // 2. 폰트 데이터 매핑 (static/fonts/*.bin 파일에서 가져옴)
  let fontData: string
  try {
    let fontBuffer: Uint8Array | Buffer

    if (dev) {
      // 개발 환경에서는 fs로 직접 읽어오는 것이 더 안정적일 수 있습니다.
      const filePath = path.join(process.cwd(), 'static', 'fonts', `${name}.bin`)
      if (fs.existsSync(filePath)) {
        fontBuffer = fs.readFileSync(filePath)
      } else {
        // fs로 못 찾으면 read로 시도
        const response = await read(`/fonts/${name}.bin`)
        fontBuffer = new Uint8Array(await response.arrayBuffer())
      }
    } else {
      try {
        // 1. SvelteKit의 read() 시도
        const response = await read(`/fonts/${name}.bin`)
        fontBuffer = new Uint8Array(await response.arrayBuffer())
      } catch (e) {
        // 2. read() 실패 시 fetch 시도 (Cloudflare Assets 환경 등)
        const assetUrl = `${url.protocol}//${url.host}/fonts/${name}.bin`

        try {
          const res = await fetch(assetUrl)
          if (!res.ok) {
            // 실패 시 상세 사유를 에러 메시지에 포함하여 브라우저에서 확인할 수 있게 함
            throw error(404, `Font file not found at: ${assetUrl} (Status: ${res.status})`)
          }
          fontBuffer = new Uint8Array(await res.arrayBuffer())
        } catch (fetchErr: any) {
          if (fetchErr.status === 404) throw fetchErr
          console.error(`[Font API] Fetch error for ${name}:`, fetchErr)
          throw error(404, `Failed to fetch font: ${name} (${fetchErr.message})`)
        }
      }
    }

    fontData = Buffer.from(fontBuffer).toString('base64')
  } catch (e: any) {
    // 만약 내부에서 던진 특정 에러(404 상세 메시지 등)라면 그대로 전달
    if (e.status) throw e
    console.error(`[Font API] Error loading font "${name}":`, e)
    throw error(404, `Font not found: ${name} (${e.message})`)
  }

  // 3. 응답 반환 (CORS 헤더 포함)
  return new Response(fontData, {
    headers: {
      'Content-Type': 'text/plain', // Base64 문자열 그대로 반환
      'Access-Control-Allow-Origin': dev ? '*' : `https://${allowedHost}`,
      'Cache-Control': 'public, max-age=31536000, immutable', // 폰트는 거의 안 바뀌므로 강력 캐싱
    },
  })
}
