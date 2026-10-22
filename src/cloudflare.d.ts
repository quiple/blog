// 서버 바인딩만 선언해 Workers의 Element 타입이 브라우저 DOM과 충돌하지 않게 합니다.
declare module 'cloudflare:workers' {
  export const env: Cloudflare.Env
}
