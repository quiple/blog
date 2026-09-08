import {parseSongYaml} from './yaml.server'

const entries = import.meta.glob<string>('/src/posts/lyric/*.{yaml,yml}', {
  eager: true,
  query: '?raw',
  import: 'default',
})
const catalog = Object.entries(entries).map(([path, source]) => {
  const slug = path
    .split('/')
    .at(-1)!
    .replace(/\.ya?ml$/, '')
  try {
    return [slug, parseSongYaml(source, slug)] as const
  } catch (error) {
    throw new Error(`${slug}: 가사 데이터를 읽지 못했습니다.`, {cause: error})
  }
})
if (new Set(catalog.map(([slug]) => slug)).size !== catalog.length) throw new Error('가사 파일의 슬러그가 중복됩니다.')
export const songs = Object.fromEntries(catalog)
