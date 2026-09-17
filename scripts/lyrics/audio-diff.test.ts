import {test} from 'node:test'
import assert from 'node:assert/strict'
import {compareAudio, sampleRate} from './audio-diff.ts'
function signal(seed: number, seconds = 32) {
  let state = seed
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) | 0
    return (state >>> 0) / 2 ** 32
  }
  let amplitude = 0
  return Float32Array.from({length: sampleRate * seconds}, (_, i) => {
    if (i % 400 === 0) amplitude = 0.01 + random() ** 2
    return (random() - 0.5) * amplitude
  })
}
const source = signal(17)
void test('finds positive and negative subsecond offsets despite gain and polarity changes', () => {
  for (const offset of [0.237, -0.431, 0]) {
    const shift = Math.round(offset * sampleRate)
    const target = Float32Array.from({length: source.length + shift}, (_, i) => -(source[i - shift] ?? 0) * 0.6)
    const result = compareAudio(source, target)
    assert.equal(result.stable, true)
    assert.equal(result.offset, offset)
  }
})
void test('rejects silence and unrelated audio', () => {
  assert.equal(compareAudio(source, new Float32Array(source.length)).offset, undefined)
  assert.equal(compareAudio(source, signal(700)).offset, undefined)
})
void test('does not recommend a single offset when an edit changes alignment', () => {
  const target = new Float32Array(source.length + 4000)
  target.set(source.subarray(0, 64000))
  target.set(source.subarray(64000), 68000)
  assert.equal(compareAudio(source, target).offset, undefined)
})

void test('handles a minute-long unrelated intro with equally truncated downloads in either direction', () => {
  const song = signal(29, 180)
  // A repeated outro can falsely match an earlier chorus outside the real overlap.
  song.set(song.subarray(40000, 100000), sampleRate * 144)
  const mv = signal(71, 180)
  const shift = Math.round(60.371 * sampleRate)
  mv.set(song.subarray(0, mv.length - shift), shift)
  assert.equal(compareAudio(song, mv).offset, 60.371)
  assert.equal(compareAudio(mv, song).offset, -60.371)
})
