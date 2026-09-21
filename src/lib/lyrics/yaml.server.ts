import {parseDocument} from 'yaml'
import {mapYamlFields} from './yaml-fields.ts'
import {parseSong} from './model.ts'

export function parseSongYaml(source: string, slug: string) {
  const document = parseDocument(source, {version: '1.2', uniqueKeys: true})
  if (document.errors.length || document.warnings.length) {
    throw new Error(`${slug}: ${[...document.errors, ...document.warnings].map((error) => error.message).join('\n')}`)
  }
  return parseSong(mapYamlFields(document.toJS({maxAliasCount: 100}) ?? {}, 'read'), slug)
}
