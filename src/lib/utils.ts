import {clsx, type ClassValue} from 'clsx'
import {twMerge} from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends {child?: any} ? Omit<T, 'child'> : T
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends {children?: any} ? Omit<T, 'children'> : T
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & {ref?: U | null}

export function getCategoryName(category: string) {
  switch (category) {
    case 'article':
      return '기사 번역'
    case 'font':
      return '폰트'
    case 'blog':
      return '블로그'
    default:
      return category
  }
}

export function getImageUrl(
  path: string,
  options: {w?: number; h?: number; q?: number; f?: string; absolute?: boolean} = {},
  isProd = false,
) {
  const baseUrl = options.absolute ? 'https://quiple.dev' : ''

  if (!isProd) return `${baseUrl}/img/${path}`

  // Base64 encode and make it URL safe
  const b64 = typeof btoa !== 'undefined' ? btoa(path) : Buffer.from(path).toString('base64')
  const encodedPath = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  const params = new URLSearchParams()
  if (options.w) params.set('w', options.w.toString())
  if (options.h) params.set('h', options.h.toString())
  if (options.q) params.set('q', options.q.toString())
  if (options.f) params.set('f', options.f.toString())

  const queryString = params.toString()
  return `${baseUrl}/api/img/${encodedPath}${queryString ? `?${queryString}` : ''}`
}
