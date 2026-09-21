import * as v from 'valibot'
import {parse} from 'yaml'
import {mapYamlFields} from './yaml-fields'
import {smartText} from './typography.server'

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
    const artist = v.parse(schema, mapYamlFields(parse(source), 'read'))
    return [
      slug,
      {
        ...artist,
        name: smartText(artist.name),
        translation: artist.translation === undefined ? undefined : smartText(artist.translation),
        slug,
      },
    ]
  }),
)

export function songArtists(artist?: string | string[]): Artist[] {
  return (typeof artist === 'string' ? [artist] : (artist ?? [])).map((slug) => {
    if (!Object.hasOwn(artists, slug)) throw new Error(`아티스트 슬러그를 확인하세요: ${slug}`)
    return artists[slug]
  })
}
