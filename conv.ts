#!/usr/bin/env node
import {parseArgs} from 'node:util'
import {readFile, writeFile} from 'node:fs/promises'
import {resolve, parse as parsePath, join} from 'node:path'
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
    },
  })
  if (values.help) {
    console.log(
      'nub run conv <파일.lrc> [--ttml 파일.ttml] [--tail 2] [--force]\n원본 디렉토리에 같은 이름의 .yaml을 생성합니다. 같은 이름 또는 _enhanced를 뺀 이름의 TTML에서 행 종료 시간을 읽습니다. TTML이 없고 종료 태그도 없으면 다음 행 시작을 사용하며, 마지막 단어는 --tail 초로 계산합니다.',
    )
  } else {
    if (positionals.length !== 1) throw Error('사용법: nub run conv <파일.lrc> [--tail 2]')
    const input = resolve(positionals[0])
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
    const song = fromLRC(await readFile(input, 'utf8'), Number(values.tail), reference)
    parseSong(song, name)
    const doc = new Document(song)
    visit(doc, {
      Pair(_, pair) {
        if (isScalar(pair.key) && pair.key.value === 'time' && isSeq(pair.value)) pair.value.flow = true
      },
    })
    const output = join(dir, name + '.yaml')
    const comment =
      '# 출처: ' +
      input.replace(/[\r\n]/g, ' ') +
      '\n' +
      (ttmlPath
        ? '# 종료 시간 출처: ' + ttmlPath.replace(/[\r\n]/g, ' ') + '\n'
        : '# 종료 태그가 없는 행은 다음 행 시작으로, 마지막 단어는 ' + values.tail + '초로 종료 시간을 추정했습니다.\n')
    await writeFile(output, comment + doc.toString({lineWidth: 0, flowCollectionPadding: false}), {
      flag: values.force ? 'w' : 'wx',
    })
    console.log(output)
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
