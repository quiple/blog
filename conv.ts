#!/usr/bin/env node
import {parseArgs} from 'node:util'
import {readFile, writeFile} from 'node:fs/promises'
import {resolve, parse as parsePath, join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {updateLyricsYaml} from './scripts/lyrics/update-yaml.ts'
import {Document, isScalar, isSeq, visit} from 'yaml'
import {fromTTML} from './scripts/lyrics/convert.ts'
import {fromLRC} from './scripts/lyrics/lrc.ts'
import {parseSong} from './src/lib/lyrics/model.ts'

try {
  const {values, positionals} = parseArgs({
    allowPositionals: true,
    options: {
      tail: {type: 'string', default: '2'},
      help: {type: 'boolean', short: 'h'},
      ttml: {type: 'string'},
      force: {type: 'boolean'},
      mode: {type: 'string', default: 'auto'},
    },
  })
  if (values.help) {
    console.log(
      'nub run conv <파일.lrc 또는 경로/번호> [곡-슬러그] [--mode auto|line|syllable] [--ttml 파일.ttml] [--tail 2] [--force]\n원본 디렉토리에 같은 이름의 .yaml을 생성합니다. mode: auto는 기존 동작, line은 행별, syllable은 원본 음절 타이밍을 사용합니다. 행별 변환 시 단어 발음·루비가 있으면 words를 유지하고 행 타이밍을 적용합니다. 같은 이름 또는 _enhanced를 뺀 이름의 TTML에서 행 시작·종료 시간과 첫 음절 시작 시간을 읽습니다. 곡 슬러그를 지정하면 기존 곡의 타이밍만 갱신하고 원문·발음·번역·메타데이터를 보존합니다. TTML이 없고 종료 태그도 없으면 다음 행 시작을 사용하며, 마지막 단어는 --tail 초로 계산합니다.',
    )
  } else {
    if (positionals.length < 1 || positionals.length > 2)
      throw Error('사용법: nub run conv <파일.lrc 또는 경로/번호> [곡-슬러그] [--force]')
    const mode = values.mode
    if (mode !== 'auto' && mode !== 'line' && mode !== 'syllable')
      throw Error('--mode는 auto, line, syllable 중 하나여야 합니다.')
    const input = resolve(
      positionals[0].toLowerCase().endsWith('.lrc') ? positionals[0] : positionals[0] + '_enhanced.lrc',
    )
    const slug = positionals[1]
    if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw Error('올바른 곡 슬러그를 입력하세요.')
    const {dir, name, ext} = parsePath(input)
    if (ext.toLowerCase() !== '.lrc') throw Error('.lrc 파일을 입력하세요.')

    let ttmlPath: string | undefined
    let reference: ReturnType<typeof fromTTML>['song']['lines'] | undefined
    const candidates = values.ttml
      ? [resolve(values.ttml)]
      : [...new Set([join(dir, name + '.ttml'), join(dir, name.replace(/_enhanced$/i, '') + '.ttml')])]
    for (const candidate of candidates) {
      let xml: string
      try {
        xml = await readFile(candidate, 'utf8')
      } catch (error) {
        if (!values.ttml && (error as NodeJS.ErrnoException).code === 'ENOENT') continue
        throw error
      }
      reference = fromTTML(xml).song.lines
      ttmlPath = candidate
      break
    }
    const song = fromLRC(await readFile(input, 'utf8'), Number(values.tail), reference, mode)
    parseSong(song, name)
    const output = slug
      ? fileURLToPath(new URL('src/posts/lyric/' + slug + '.yaml', import.meta.url))
      : join(dir, name + '.yaml')
    const original = slug ? await readFile(output, 'utf8') : undefined
    const doc = original === undefined ? new Document(song) : updateLyricsYaml(original, song, values.force, mode)
    visit(doc, {
      Pair(_, pair) {
        if (isScalar(pair.key) && pair.key.value === 'time' && isSeq(pair.value)) pair.value.flow = true
      },
    })
    const comment =
      '# 출처: ' +
      input.replace(/[\r\n]/g, ' ') +
      '\n' +
      (ttmlPath
        ? '# 행 시작·종료 시간 출처: ' + ttmlPath.replace(/[\r\n]/g, ' ') + '\n'
        : '# 종료 태그가 없는 행은 다음 행 시작으로, 마지막 단어는 ' + values.tail + '초로 종료 시간을 추정했습니다.\n')
    const yaml = (slug ? '' : comment) + doc.toString({lineWidth: 0, flowCollectionPadding: false, singleQuote: true})
    if (slug) {
      const {parseSongYaml} = await import('./src/lib/lyrics/yaml.server.ts')
      parseSongYaml(yaml, slug)
      if ((await readFile(output, 'utf8')) !== original) throw Error('실행 중 대상 YAML이 변경되었습니다.')
    }
    await writeFile(output, yaml, {
      flag: slug || values.force ? 'w' : 'wx',
    })
    console.log(output)
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
