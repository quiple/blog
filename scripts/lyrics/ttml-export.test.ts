import {test} from 'node:test'
import assert from 'node:assert/strict'
import {DOMParser} from '@xmldom/xmldom'
import {parseSong} from '../../src/lib/lyrics/model.ts'
import {songTTML} from '../../src/lib/lyrics/ttml.server.ts'
import {fromTTML} from './convert.ts'

void test('exports editable untimed paragraphs and preserves timed words', () => {
  const song = parseSong({
    title: 'Export',
    lines: [
      {text: 'Plain'},
      {text: 'Line', time: [1.123, 2.456]},
      {
        words: [
          {text: 'One ', time: [3.001, 3.5]},
          {text: 'two', time: [3.5, 4]},
        ],
      },
    ],
  })
  const xml = songTTML(song)
  const document = new DOMParser().parseFromString(xml, 'application/xml')
  for (const p of Array.from(document.getElementsByTagName('p'))) {
    assert.ok(p.hasAttribute('begin'))
    assert.ok(p.hasAttribute('end'))
  }
  const result = fromTTML(xml).song
  assert.equal(result.lines[0].text, 'Plain')
  assert.equal(result.lines[0].time, undefined)
  assert.deepEqual(result.lines[1].time, [1.123, 2.456])
  assert.deepEqual(
    result.lines[2].words?.map((word) => word.time),
    [
      [3.001, 3.5],
      [3.5, 4],
    ],
  )
})
