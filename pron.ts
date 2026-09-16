#!/usr/bin/env node
import {execFile} from 'node:child_process'
import {access, readFile, rename, rm, writeFile} from 'node:fs/promises'
import {constants} from 'node:fs'
import {parseArgs, promisify} from 'node:util'
import {fileURLToPath} from 'node:url'
import {addPronunciation} from './scripts/lyrics/pronunciation.ts'
const exec = promisify(execFile)
const root = new URL('./', import.meta.url)
const help = `가사에 한글 발음 추가 (로컬 Hangulize)
  nub run pron anhelo
  nub run pron anhelo --dry-run
  nub run pron anhelo --force
  nub run pron anhelo --lang spa

--dry-run  저장하지 않고 결과 YAML 출력
--force    기존 발음을 한글 발음 문자열로 덮어쓰기
--lang     원문 언어 지정 (기본: YAML의 lang, es → spa, pt-BR → por-br)
기존 발음은 기본적으로 보존하고, 새 발음은 pronunciation 문자열로 저장합니다.
설치: go install github.com/hangulize/hangulize/cmd/hangulize@v0.5.0
설치한 hangulize를 PATH에 추가하거나 HANGULIZE_BIN으로 경로를 지정하세요.
영어는 지원하지 않습니다. 결과는 외래어 표기 규칙에 따른 초안입니다.`
async function main() {
  const {values, positionals} = parseArgs({
    allowPositionals: true,
    options: {
      help: {type: 'boolean', short: 'h'},
      'dry-run': {type: 'boolean'},
      force: {type: 'boolean'},
      lang: {type: 'string'},
    },
  })
  if (values.help) return console.log(help)
  const [slug] = positionals
  if (positionals.length !== 1 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug ?? ''))
    throw Error('곡 슬러그 하나를 지정하세요. 예: nub run pron anhelo')
  const path = new URL(`src/posts/lyric/${slug}.yaml`, root)
  const source = await readFile(path, 'utf8')
  let binary = process.env.HANGULIZE_BIN
  if (!binary) {
    const local = fileURLToPath(new URL('node_modules/.bin/hangulize', root))
    binary = await access(local, constants.X_OK).then(
      () => local,
      () => 'hangulize',
    )
  }
  const result = await addPronunciation(
    source,
    async (language, texts) => {
      try {
        // Arguments are passed directly: lyric text never enters a shell.
        const {stdout} = await exec(binary!, [language, '--', ...texts], {timeout: 120_000, maxBuffer: 8 * 1024 * 1024})
        return stdout.trimEnd().split(/\r?\n/)
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT')
          throw Error(
            'Hangulize가 없습니다. go install github.com/hangulize/hangulize/cmd/hangulize@v0.5.0 후 PATH를 설정하세요. nub run pron --help 참고',
          )
        throw error
      }
    },
    values,
  )
  if (values['dry-run']) return process.stdout.write(result.yaml)
  if (result.count) {
    // Do not replace edits made while the converter was running.
    if ((await readFile(path, 'utf8')) !== source) throw Error('실행 중 YAML이 변경되었습니다. 다시 실행하세요.')
    const temporary = new URL(`${path.href}.${process.pid}.tmp`)
    try {
      await writeFile(temporary, result.yaml, {flag: 'wx'})
      await rename(temporary, path)
    } finally {
      await rm(temporary, {force: true})
    }
  }
  console.log(`${slug}: ${result.count}행에 한글 발음을 추가했습니다.`)
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
