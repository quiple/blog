import {error} from '@sveltejs/kit'
import {artists, songArtists} from '$lib/lyrics/artists.server'
import {songs} from '$lib/lyrics/catalog.server'
import type {EntryGenerator, PageServerLoad} from './$types'

export const prerender = true
export const entries: EntryGenerator = () => Object.keys(artists).map((slug) => ({slug}))
export const load: PageServerLoad = ({params}) => {
  if (!Object.hasOwn(artists, params.slug)) error(404, '아티스트를 찾을 수 없습니다.')
  return {
    artist: artists[params.slug],
    songs: Object.entries(songs)
      .filter(([, song]) => songArtists(song.artist).some((artist) => artist.slug === params.slug))
      .map(([slug, song]) => ({
        slug,
        title: song.title,
        year: song.year,
        lang: song.titleLang ?? song.lang,
        translation: song.titleTranslation,
      })),
  }
}
