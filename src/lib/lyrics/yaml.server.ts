import {parseDocument} from 'yaml'
import {mapYamlFields} from './yaml-fields.ts'
import {parseSong, type PublishedSong} from './model.ts'

export function parseSongYaml(source: string, slug: string): PublishedSong {
  const document = parseDocument(source, {version: '1.2', uniqueKeys: true})
  if (document.errors.length || document.warnings.length) {
    throw new Error(`${slug}: ${[...document.errors, ...document.warnings].map((error) => error.message).join('\n')}`)
  }
  const song = parseSong(mapYamlFields(document.toJS({maxAliasCount: 100}) ?? {}, 'read'), slug)
  if (song.pubDate === undefined) throw new Error(`${slug}: pubDate를 입력하세요.`)
  return song as PublishedSong
}
