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
        // Cloudflare 환경에서는 R2 버킷에서 직접 읽어오는 것이 가장 안정적입니다.
        const bucket = (platform as any)?.env?.R2
        if (bucket) {
          const object = await bucket.get(`fonts/${name}.bin`)
          if (object) {
            fontBuffer = new Uint8Array(await object.arrayBuffer())
          } else {
            // R2에 없으면 마지막으로 read() 시도
            const response = await read(`/fonts/${name}.bin`)
            fontBuffer = new Uint8Array(await response.arrayBuffer())
          }
        } else {
          // R2 설정이 없으면 read() 시도
          const response = await read(`/fonts/${name}.bin`)
          fontBuffer = new Uint8Array(await response.arrayBuffer())
        }
      } catch (e: any) {
        if (e.status) throw e
        console.error(`[Font API] Error loading font "${name}" in production:`, e)
        throw error(404, `Font not found: ${name} (R2 or Read failed)`)
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
