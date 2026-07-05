import {BASE_URL} from '$lib/constants'

export const SITE_NAME = 'quiple'
export const SITE_DESCRIPTION = '이것저것 블로그.'
export const SITE_AUTHOR = 'Lee Minseo'

type DateInput = string | Date | undefined

function getDatePart(value: DateInput) {
  if (!value) return undefined
  if (value instanceof Date) return value.toISOString().split('T')[0]
  return value.split('T')[0]
}

export function toKstDateTime(value: DateInput) {
  if (!value) return undefined

  if (value instanceof Date) {
    return `${getDatePart(value)}T00:00:00+09:00`
  }

  if (/Z$|[+-]\d{2}:?\d{2}$/.test(value)) return value
  if (value.includes('T')) return `${value}+09:00`
  return `${value}T00:00:00+09:00`
}

export function toSitemapDateTime(value: DateInput) {
  return toKstDateTime(value)
}

export function absoluteUrl(path: string) {
  return new URL(path, BASE_URL).toString()
}

export function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

export function homeCanonicalUrl(page = 1) {
  return page > 1 ? `${BASE_URL}/?p=${page}` : absoluteUrl('/')
}
