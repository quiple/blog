import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {milliseconds, parseSong, toLyricLines} from './model.ts'
import {parseSongYaml} from './yaml.server.ts'
import {canPlayTime, sourceOffset, switchPosition} from './timeline.ts'

const youtube = {mv: 'https://youtu.be/YDLafQ-Rg-k', audio: 'https://youtu.be/MSmfAa_oSqE'}

void test('millisecond precision survives YAML and AMLL conversion', () => {
  const song = parseSongYaml(
    `
offsets:
  youtubeMV: 0.125
lines:
  - time: [1.001, 1.009]
    words:
      - text: 字
        time: [1.001, 1.009]
        ruby:
          - text: じ
            time: [1.002, 1.008]
`,
    'precision',
  )
  const [line] = toLyricLines(song.lines)
  assert.deepEqual([line.startTime, line.endTime], [1001, 1009])
  assert.deepEqual([line.words[0].startTime, line.words[0].endTime], [1001, 1009])
  assert.deepEqual(line.words[0].ruby?.[0], {word: 'じ', startTime: 1002, endTime: 1008})
  assert.equal(sourceOffset(song, 'youtubeMV'), 125)
  assert.equal(milliseconds(1.001), 1001)
})

void test('manual source changes preserve lyric time across positive and negative offsets', () => {
  const song = parseSong({youtube, offsets: {youtubeMV: 3.125, youtubeAudio: -0.25}})
  const lyricTime = 43126 - sourceOffset(song, 'youtubeMV')
  assert.equal(lyricTime, 40001)
  assert.deepEqual(switchPosition(song, 'youtubeAudio', lyricTime), {position: 39751, restarted: false})
  assert.deepEqual(switchPosition(song, 'youtubeMV', 39751 - sourceOffset(song, 'youtubeAudio')), {
    position: 43126,
    restarted: false,
  })
  assert.equal(switchPosition(song, 'youtubeAudio', 100).position, 0)
})

void test('a manual switch outside the target duration restarts only the selected source', () => {
  const song = parseSong({youtube, offsets: {youtubeMV: 3, youtubeAudio: 0.001}})
  assert.equal(canPlayTime(song, 'youtubeMV', 86000, 90000), true)
  assert.equal(canPlayTime(song, 'youtubeMV', 87000, 90000), false)
  assert.deepEqual(switchPosition(song, 'youtubeMV', 100000, 90000), {position: 3000, restarted: true})
  assert.deepEqual(switchPosition(song, 'youtubeAudio', 100000, 180000), {position: 100001, restarted: false})
})

void test('Wrong World preserves all supplied lyric words, pronunciation, translation and timing', () => {
  const song = parseSongYaml(
    readFileSync(new URL('../../posts/lyric/wrong-world.yaml', import.meta.url), 'utf8'),
    'wrong-world',
  )
  const lines = toLyricLines(song.lines, 'en')
  const words = lines.flatMap((line) => line.words)
  assert.equal(lines.length, 48)
  assert.equal(words.length, 637)
  assert.deepEqual(
    words.map((word) => word.romanWord),
    song.lines.flatMap((line) => line.words?.map((word) => word.pronunciation ?? '') ?? []),
  )
  assert.equal(lines.filter((line) => line.translatedLyric).length, 48)
  assert.equal(toLyricLines(song.lines, 'zh-Hans').filter((line) => line.translatedLyric).length, 48)
  assert.equal(lines[0].startTime, 500)
  assert.equal(lines.at(-1)?.endTime, 169610)
  assert.ok(words.every((word) => Number.isInteger(word.startTime) && Number.isInteger(word.endTime)))
  assert.equal(lines[26].startTime, 88820)
})
