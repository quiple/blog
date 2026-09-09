import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp, writeFile, readFile, rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join, resolve} from 'node:path'
import {execFile} from 'node:child_process'
import {promisify} from 'node:util'
import {fromTTML, fromJSON3, compactSong} from './convert.ts'
import {choose, terminalText} from './select.ts'
import {parseSongYaml} from '../../src/lib/lyrics/yaml.server.ts'

const xml = `<tt xmlns="http://www.w3.org/ns/ttml" xmlns:ttm="http://www.w3.org/ns/ttml#metadata" xmlns:tts="http://www.w3.org/ns/ttml#styling" xmlns:amll="http://www.example.com/ns/amll" xml:lang="ja">
<head><metadata><amll:meta key="musicName" value="Test Song"/></metadata></head>
<body><div><p begin="1.001s" end="3.125s" ttm:agent="v2"><span begin="1.001s" end="2.005s">光</span><span begin="2.005s" end="3.125s">へ</span><span ttm:role="x-translation" xml:lang="ko">빛으로</span><span ttm:role="x-bg" begin="2.005s" end="3.125s">声</span></p></div></body></tt>`

void test('TTML preserves milliseconds, languages, duet and background while emitting simple YAML data', () => {
  const {song} = fromTTML(xml)
  assert.equal(song.lang, 'ja')
  assert.equal(song.title, 'Test Song')
  assert.deepEqual(song.lines[0].time, [1.001, 3.125])
  assert.equal(song.lines[0].duet, true)
  assert.equal(song.lines[0].background?.text, '声')
  assert.equal(
    song.lines[0].translation && typeof song.lines[0].translation !== 'string' ? song.lines[0].translation.ko : '',
    '빛으로',
  )
  const compact = compactSong(song)
  assert.equal(JSON.stringify(compact).includes('"text":"光へ"'), false)
  assert.throws(() => fromTTML('<!DOCTYPE tt [<!ENTITY x "foo">]><tt/>'))
})

void test('YouTube JSON3 keeps caption timing without inventing timing for a missing final duration', () => {
  const song = fromJSON3(
    {
      events: [
        {tStartMs: 1001, dDurationMs: 2104, segs: [{utf8: 'hello\nworld'}]},
        {tStartMs: 4000, segs: [{utf8: 'last'}]},
      ],
    },
    'Caption',
    'en',
  )
  assert.deepEqual(song.lines[0].time, [1.001, 3.105])
  assert.equal(song.lines[0].text, 'hello world')
  assert.equal(song.lines[1].time, undefined)
  assert.throws(() => fromJSON3({events: []}, 'empty'))
})

void test('candidate selection validates indexes and sanitizes terminal control characters', async () => {
  assert.equal(await choose(['first', 'second'], 2), 1)
  await assert.rejects(choose(['first'], 2))
  await assert.rejects(choose([]))
  assert.equal(terminalText('test\x1b[2J\nnext').includes('\x1b'), false)
})

void test('CLI creates a YAML file with provenance and never overwrites existing lyrics', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lyrics-import-test-'))
  try {
    const input = join(directory, 'input.ttml')
    await writeFile(input, xml)
    const args = [resolve('import.ts'), '--file', input, '--slug', 'test-song', '--out-dir', directory]
    await promisify(execFile)(process.execPath, args)
    const output = await readFile(join(directory, 'test-song.yaml'), 'utf8')
    assert.ok(output.startsWith(`# ${input}\n`))
    assert.equal(parseSongYaml(output, 'test-song').lines.length, 1)
    await assert.rejects(promisify(execFile)(process.execPath, args), /이미 파일이 있습니다/)
    assert.equal(await readFile(join(directory, 'test-song.yaml'), 'utf8'), output)
    await assert.rejects(
      promisify(execFile)(process.execPath, [
        resolve('import.ts'),
        '--file',
        input,
        '--slug',
        '../escape',
        '--out-dir',
        directory,
      ]),
    )
  } finally {
    await rm(directory, {recursive: true, force: true})
  }
})
