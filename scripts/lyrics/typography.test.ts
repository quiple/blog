import {test} from 'node:test'
import assert from 'node:assert/strict'
import {displaySong} from '../../src/lib/lyrics/typography.server.ts'

const words = [
  {text: 'I ', pronunciation: '아이'},
  {text: 'said, ', pronunciation: '셋,'},
  {text: '"Just ', pronunciation: '"저스트'},
  {text: "don't ", pronunciation: '돈트'},
  {text: 'question ', pronunciation: '퀘스천'},
  {text: 'it!"', pronunciation: '잇!"'},
]
const expected = ['아이', '셋,', '“저스트', '돈트', '퀘스천', '잇!”']

test('word pronunciations preserve source word boundaries for quote context', () => {
  const song = displaySong({title: 'test', example: false, lines: [{text: '', words}]})
  assert.deepEqual(
    song.lines[0].words?.map((word) => word.pronunciation),
    expected,
  )
})

test('localized word pronunciations preserve source word boundaries', () => {
  const localized = words.map((word) => ({...word, pronunciation: {ko: word.pronunciation}}))
  const song = displaySong({title: 'test', example: false, lines: [{text: '', words: localized}]})
  assert.deepEqual(
    song.lines[0].words?.map((word) => word.pronunciation),
    expected.map((ko) => ({ko})),
  )
})
