import * as v from 'valibot'
import {parse} from 'yaml'

const schema = v.strictObject({
  name: v.string(),
  lang: v.optional(v.string()),
  translation: v.optional(v.string()),
})
export type Artist = v.InferOutput<typeof schema> & {slug: string}
const entries = import.meta.glob<string>('/src/posts/artist/*.{yaml,yml}', {
  eager: true,
  query: '?raw',
  import: 'default',
})
export const artists: Record<string, Artist> = Object.fromEntries(
  Object.entries(entries).map(([path, source]) => {
    const slug = path
      .split('/')
      .at(-1)!
      .replace(/\.ya?ml$/, '')
    return [slug, {...v.parse(schema, parse(source)), slug}]
  }),
)

export function songArtists(artist?: string | string[]): Artist[] {
  return (typeof artist === 'string' ? [artist] : (artist ?? [])).map((slug) => {
    if (Object.hasOwn(artists, slug)) return artists[slug]
    // Accept names from existing song files while authoring moves to slug references.
    const matches = Object.values(artists).filter((entry) => entry.name === slug || entry.translation === slug)
    if (matches.length !== 1) throw new Error(`아티스트 슬러그를 확인하세요: ${slug}`)
    return matches[0]
  })
}
