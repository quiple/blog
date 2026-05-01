import {error} from '@sveltejs/kit'
import {dev} from '$app/environment'
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

  // 2. 폰트 데이터 매핑 (기존 파일들에서 가져오거나, 별도 저장소 활용 가능)
  // 여기서는 기존에 만들어진 font-data-*.ts 모듈을 동적으로 가져옵니다.
  let fontData: string
  try {
    const fontModule = await import(`../../../../lib/message-maker/font-data-${name}.ts`)
    fontData = fontModule.default
  } catch (e) {
    throw error(404, `Font not found: ${name}`)
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
