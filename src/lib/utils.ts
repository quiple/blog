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
  options: {w?: number; h?: number; q?: number; f?: string; absolute?: boolean; original?: boolean} = {},
  isProd = false,
) {
  const baseUrl = options.absolute ? 'https://quiple.dev' : ''

  if (!isProd && !options.original) return `${baseUrl}/img/${path}`

  // Base64 encode and make it URL safe
  const b64 = typeof btoa !== 'undefined' ? btoa(path) : Buffer.from(path).toString('base64')
  const encodedPath = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

  // Build query string without URLSearchParams allocation
  const parts: string[] = []
  if (options.original) parts.push('original=true')
  if (options.w) parts.push(`w=${options.w}`)
  if (options.h) parts.push(`h=${options.h}`)
  if (options.q) parts.push(`q=${options.q}`)
  if (options.f) parts.push(`f=${options.f}`)

  return `${baseUrl}/api/img/${encodedPath}${parts.length ? `?${parts.join('&')}` : ''}`
}
