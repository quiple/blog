import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {fromTTML} from './convert.ts'
import {toLyricLines} from '../../src/lib/lyrics/model.ts'

const xml = (body: string, mode = '') =>
  `<tt xmlns="http://www.w3.org/ns/ttml" xmlns:itunes="http://music.apple.com/lyric-ttml-internal" ${mode}><body><div><p begin="1s" end="3s">${body}</p></div></body></tt>`

test('explicit single timed spans remain karaoke; plain/line-timed text stays line-timed', () => {
  const word = fromTTML(xml('<span begin="1s" end="3s">ああ～</span>')).song
  assert.equal(word.lines[0].words?.length, 1)
  assert.equal(toLyricLines(word.lines)[0].wordTimed, true)
  for (const source of [xml('ああ～'), xml('<span begin="1s" end="3s">ああ～</span>', 'itunes:timing="Line"')]) {
    const line = fromTTML(source).song
    assert.equal(line.lines[0].words, undefined)
    assert.equal(toLyricLines(line.lines)[0].wordTimed, false)
  }
  const patch = JSON.parse(readFileSync('scripts/amll/document.patch.json', 'utf8'))
  const classification = patch.changes
    .find((change: {label: string}) => change.label === 'Input timing classification')
    .after.split('\n')[0]
  const lyric = toLyricLines(word.lines)[0]
  const lineTiming = new WeakMap()
  new Function('lineTiming', classification).call({processedLines: [lyric]}, lineTiming)
  assert.equal(lineTiming.get(lyric), false)
})
