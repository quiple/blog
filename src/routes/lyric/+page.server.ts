import {songArtists} from '$lib/lyrics/artists.server'
import {songs} from '$lib/lyrics/catalog.server'
export const prerender = true
export const load = () => ({
  songs: Object.entries(songs).map(([slug, song]) => ({
    slug,
    title: song.title,
    year: song.year,
    translation: song.titleTranslation,
    artists: songArtists(song.artist),
    lang: song.titleLang ?? song.lang,
    example: song.example,
  })),
})
