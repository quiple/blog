import {songArtists} from '$lib/lyrics/artists.server'
import {songs} from '$lib/lyrics/catalog.server'
export const prerender = true
export const load = () => ({
  songs: Object.entries(songs).map(([slug, song]) => ({
    slug,
    title: song.title,
    artists: songArtists(song.artist),
    lang: song.titleLang ?? song.lang,
    example: song.example,
  })),
})
