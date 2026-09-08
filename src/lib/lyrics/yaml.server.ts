import {parseDocument} from 'yaml'
import {parseSong} from './model.ts'

export function parseSongYaml(source: string, slug: string) {
  const document = parseDocument(source, {version: '1.2', uniqueKeys: true})
  if (document.errors.length || document.warnings.length) {
    throw new Error(`${slug}: ${[...document.errors, ...document.warnings].map((error) => error.message).join('\n')}`)
  }
  return parseSong(document.toJS({maxAliasCount: 100}) ?? {}, slug)
}
