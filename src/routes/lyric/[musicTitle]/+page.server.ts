import {error} from '@sveltejs/kit'
import {songArtists} from '$lib/lyrics/artists.server'
import {songs} from '$lib/lyrics/catalog.server'
import {getSources} from '$lib/lyrics/model'
import {absoluteUrl} from '$lib/seo'
import type {PageServerLoad, EntryGenerator} from './$types'

export const prerender = true
export const entries: EntryGenerator = () => Object.keys(songs).map((musicTitle) => ({musicTitle}))
export const load: PageServerLoad = ({params}) => {
  const song = Object.hasOwn(songs, params.musicTitle) ? songs[params.musicTitle] : undefined
  if (!song) error(404, '가사를 찾을 수 없습니다.')
  return {
    song,
    artists: songArtists(song.artist),
    sources: getSources(song),
    canonicalURL: absoluteUrl(`/lyric/${params.musicTitle}`),
  }
}
