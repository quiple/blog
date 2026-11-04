import assert from 'node:assert/strict'
import {execFile} from 'node:child_process'
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {test} from 'node:test'
import {promisify} from 'node:util'
import {parse} from 'yaml'
import {importPubDate} from './pub-date.ts'

const exec = promisify(execFile)

test('import publication dates use Seoul time at day and year boundaries', () => {
  assert.equal(importPubDate(new Date('2026-12-31T14:59:59Z')), '2026-12-31T23:59')
  assert.equal(importPubDate(new Date('2026-12-31T15:00:00Z')), '2027-01-01T00:00')
})

test('file and stdout imports record the same Seoul minute as their import timestamp', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lyric-pub-date-'))
  try {
    const input = join(directory, 'fixture.ttml')
    await writeFile(
      input,
      '<tt xmlns="http://www.w3.org/ns/ttml"><body><div><p begin="1s" end="2s">Hello</p></div></body></tt>',
    )
    const args = ['import.ts', '--file', input, '--slug', 'fixture']
    const options = {env: {...process.env, TZ: 'America/Los_Angeles'}}
    const [stdout, written] = await Promise.all([
      exec(process.execPath, [...args, '--stdout'], options),
      exec(process.execPath, [...args, '--out-dir', directory], options),
    ])
    assert.match(written.stderr, /추가했습니다/)
    for (const output of [stdout.stdout, await readFile(join(directory, 'fixture.yaml'), 'utf8')]) {
      const timestamp = output.match(/^# 가져온 시각: (.+)$/m)?.[1]
      assert.ok(timestamp)
      assert.equal(parse(output).pubDate, importPubDate(new Date(timestamp)))
      assert.match(output, /^pubDate: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/m)
    }
  } finally {
    await rm(directory, {recursive: true, force: true})
  }
})

test('new LRC conversions include a publication date', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lyric-conv-date-'))
  try {
    const input = join(directory, 'fixture.lrc')
    await writeFile(input, '[00:01.00]Hello\n[00:03.00]World\n')
    const before = importPubDate(new Date())
    await exec(process.execPath, ['conv.ts', input], {env: {...process.env, TZ: 'America/Los_Angeles'}})
    const after = importPubDate(new Date())
    const result = parse(await readFile(join(directory, 'fixture.yaml'), 'utf8'))
    assert.ok([before, after].includes(result.pubDate))
  } finally {
    await rm(directory, {recursive: true, force: true})
  }
})
