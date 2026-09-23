#!/usr/bin/env node
import {parseArgs} from 'node:util'
import {readFile, writeFile} from 'node:fs/promises'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {fromTTML} from './scripts/lyrics/convert.ts'
import {updateLyricsYaml} from './scripts/lyrics/update-yaml.ts'
import {formatLyricsYaml} from './scripts/lyrics/format-yaml.ts'
import {parseSongYaml} from './src/lib/lyrics/yaml.server.ts'

try {
  const {values, positionals} = parseArgs({
    allowPositionals: true,
    options: {help: {type: 'boolean', short: 'h'}, force: {type: 'boolean'}},
  })
  if (values.help) {
    console.log(
      'nub run ttml <곡-슬러그>\n현재 디렉토리의 <곡-슬러그>.ttml에서 원문과 행·음절 타이밍을 가져옵니다. 기존 YAML의 발음·번역·메타데이터는 유지합니다. 원문 차이는 기본적으로 허용하며 --force는 필요하지 않습니다.',
    )
  } else {
    const [slug] = positionals
    if (positionals.length !== 1 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
      throw Error('사용법: nub run ttml <곡-슬러그> [--force]')
    const input = resolve(`${slug}.ttml`)
    const output = fileURLToPath(new URL(`src/posts/lyric/${slug}.yaml`, import.meta.url))
    const original = await readFile(output, 'utf8')
    const {song} = fromTTML(await readFile(input, 'utf8'))
    const lines = song.lines.map((line, index) => {
      if (!line.time) throw Error(`${index + 1}행에 이식할 TTML 타이밍이 없습니다.`)
      return line.words
        ? {time: line.time, words: line.words.map((word) => ({text: word.text, time: word.time ?? line.time!}))}
        : {text: line.text, time: line.time}
    })
    const doc = formatLyricsYaml(updateLyricsYaml(original, {lines}, values.force, 'auto', true))
    const yaml = doc.toString({lineWidth: 0, flowCollectionPadding: false, singleQuote: true})
    parseSongYaml(yaml, slug)
    if ((await readFile(output, 'utf8')) !== original) throw Error('실행 중 대상 YAML이 변경되었습니다.')
    await writeFile(output, yaml)
    console.log(output)
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
