import {error} from '@sveltejs/kit'
import {songArtists} from '$lib/lyrics/artists.server'
import {parseSongYaml} from '$lib/lyrics/yaml.server'
import {songTTML} from '$lib/lyrics/ttml.server'
import type {RequestHandler, EntryGenerator} from './$types'

const files = import.meta.glob<string>('/src/posts/lyric/*.{yaml,yml}', {query: '?raw', import: 'default', eager: true})
const sources = Object.fromEntries(
  Object.entries(files).map(([path, source]) => [
    path
      .split('/')
      .at(-1)!
      .replace(/\.ya?ml$/, ''),
    source,
  ]),
)
export const prerender = true
export const entries: EntryGenerator = () => Object.keys(sources).map((musicTitle) => ({musicTitle}))
export const GET: RequestHandler = ({params}) => {
  if (!Object.hasOwn(sources, params.musicTitle)) error(404, '가사를 찾을 수 없습니다.')
  const song = parseSongYaml(sources[params.musicTitle], params.musicTitle)
  return new Response(
    songTTML(
      song,
      songArtists(song.artist).map((artist) => artist.name),
    ),
    {
      headers: {
        'Content-Type': 'application/ttml+xml; charset=utf-8',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(params.musicTitle)}.ttml`,
      },
    },
  )
}
