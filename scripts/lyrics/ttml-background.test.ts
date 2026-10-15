import {test} from 'node:test'
import assert from 'node:assert/strict'
import {fromTTML} from './convert.ts'
import {updateLyricsYaml, type ImportedLine} from './update-yaml.ts'
import {parseSongYaml} from '../../src/lib/lyrics/yaml.server.ts'
import {toLyricLines} from '../../src/lib/lyrics/model.ts'

const xml = (background: string) =>
  `<tt xmlns="http://www.w3.org/ns/ttml" xmlns:ttm="http://www.w3.org/ns/ttml#metadata"><body><div><p begin="1s" end="5s"><span begin="1s" end="2s">Main</span><span ttm:role="x-bg">${background}</span></p></div></body></tt>`

void test('single timed background span stays karaoke; plain background stays line timed', () => {
  const timed = fromTTML(xml('<span begin="3s" end="4s">Echo</span>')).song
  assert.deepEqual(
    timed.lines[0].background?.words?.map((w) => w.time),
    [[3, 4]],
  )
  assert.equal(toLyricLines(timed.lines, undefined, timed)[1].wordTimed, true)
  const plain = fromTTML(xml('Echo')).song
  assert.equal(plain.lines[0].background?.words, undefined)
})

void test('updates background words and timing while retaining existing annotations', () => {
  const song = fromTTML(xml('<span begin="3s" end="3.5s">Ec</span><span begin="3.5s" end="4s">ho</span>')).song
  const source = `title: Test
lines:
  - text: Main
    pr: 메인
    tl: 본문
    time: [0, 1]
    background:
      text: Echo
      pr: 에코
      tl: 메아리
      time: [0, 1]
`
  const doc = updateLyricsYaml(source, {lines: song.lines as ImportedLine[]}, false, 'auto', true)
  const result = parseSongYaml(doc.toString(), 'test').lines[0]
  assert.deepEqual(result.background?.time, [3, 4])
  assert.deepEqual(
    result.background?.words?.map((w) => w.time),
    [
      [3, 3.5],
      [3.5, 4],
    ],
  )
  assert.equal(result.background?.pronunciation, '에코')
  assert.equal(result.background?.translation, '메아리')
  assert.equal(result.translation, '본문')
})

void test('TTML round trip keeps main timing independent of earlier or later background vocals', async () => {
  const {songTTML} = await import('../../src/lib/lyrics/ttml.server.ts')
  for (const [start, end] of [
    [0.5, 0.9],
    [3, 4],
  ]) {
    const source = xml(`<span begin="${start}s" end="${end}s">Echo</span>`).replace('end="5s"', 'end="2s"')
    let song = fromTTML(source).song
    for (let i = 0; i < 3; i++) {
      assert.deepEqual(song.lines[0].time, [1, 2])
      assert.deepEqual(song.lines[0].background?.time, [start, end])
      assert.deepEqual(song.lines[0].background?.words?.[0].time, [start, end])
      song = fromTTML(songTTML(song)).song
    }
  }
})
