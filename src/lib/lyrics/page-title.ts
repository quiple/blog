export function lyricPageTitle(
  song: {title: string; titleTranslation?: string},
  artists: {name: string; translation?: string}[],
) {
  const title = song.titleTranslation ? `${song.title} (${song.titleTranslation})` : song.title
  const names = artists.map((artist) => artist.translation || artist.name).join(', ')
  return names ? `${title} by ${names}` : title
}
