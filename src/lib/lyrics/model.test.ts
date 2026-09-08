import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {getSources, isTimed, lyricLanguages, parseSong, toLyricLines} from './model.ts'
import {parseSongYaml} from './yaml.server.ts'
import {playbackTime} from './players.ts'

void test('metadata is optional; independent YouTube sources have distinct keys', () => {
  assert.equal(parseSong({}, 'untitled').title, 'untitled')
  assert.deepEqual(getSources({}), [])
  const sources = getSources({
    youtube: {
      mv: 'https://www.youtube.com/watch?v=oT-G1wS-57c',
      audio: 'https://youtu.be/oT-G1wS-57c',
    },
  })
  assert.deepEqual(
    sources.map(({key, provider, id}) => ({key, provider, id})),
    [
      {key: 'youtubeMV', provider: 'youtube', id: 'oT-G1wS-57c'},
      {key: 'youtubeAudio', provider: 'youtube', id: 'oT-G1wS-57c'},
    ],
  )
  assert.equal(getSources({youtube: {audio: 'https://youtube.com/shorts/oT-G1wS-57c'}})[0].key, 'youtubeAudio')
  assert.equal(
    getSources({appleMusic: 'https://music.apple.com/kr/album/example/123?i=456'})[0].embedUrl,
    'https://embed.music.apple.com/kr/album/example/123?i=456',
  )
  assert.equal(getSources({spotify: 'https://open.spotify.com/intl-ko/track/abc123'})[0].id, 'spotify:track:abc123')
  assert.throws(() => getSources({youtube: {mv: 'https://youtube.com.evil.test/watch?v=oT-G1wS-57c'}}))
  assert.throws(() => getSources({spotify: 'https://open.spotify.com/playlist/abc123'}))
})

void test('YAML shorthand, inferred seconds, timed ruby, duet overlap, background, multilingual annotations', () => {
  const song = parseSongYaml(
    `
lines:
  - 자유롭게 읽는 가사
  - duet: true
    translation:
      ko: 빛 속으로
      en: Into the light
    pronunciation: hikari e
    words:
      - text: 光
        time: [1.25, 3]
        ruby:
          - text: ひ
            time: [1.25, 2]
          - text: かり
            time: [2, 3]
        pronunciation:
          ko: 히카리
          ja-Latn: hikari
        obscene: true
        emptyBeat: 2
      - text: 'へ '
        time: [3, 4]
    background:
      text: 오
      translation: oh
      pronunciation: o
  - text: 겹치는 목소리
    time: [3, 5]
`,
    'test',
  )
  const lines = toLyricLines(song.lines, 'en', 'ja-Latn')
  assert.equal(lines.length, 4)
  assert.equal(lines.filter(isTimed).length, 3)
  assert.equal(lines[1].words.map((word) => word.word).join(''), '光へ ')
  assert.equal(lines[1].startTime, 1250)
  assert.equal(lines[1].endTime, 4000)
  assert.equal(lines[1].translatedLyric, 'Into the light')
  assert.equal(lines[1].romanLyric, 'hikari e')
  assert.equal(lines[1].words[0].romanWord, 'hikari')
  assert.equal(lines[1].words[0].obscene, true)
  assert.deepEqual(lines[1].words[0].ruby, [
    {word: 'ひ', startTime: 1250, endTime: 2000},
    {word: 'かり', startTime: 2000, endTime: 3000},
  ])
  assert.equal(lines[1].isDuet, true)
  assert.equal(lines[2].isBG, true)
  assert.equal(lines[2].isDuet, true)
  assert.equal(lines[2].startTime, 1250)
  assert.equal(lines[2].translatedLyric, 'oh')
  assert.deepEqual(lyricLanguages(song.lines, 'translation'), ['ko', 'en'])
  assert.deepEqual(lyricLanguages(song.lines, 'pronunciation'), ['ko', 'ja-Latn'])
  assert.equal(toLyricLines(song.lines, 'ko', 'ko')[1].words[0].romanWord, '히카리')
  assert.equal(toLyricLines(song.lines, 'ko')[1].translatedLyric, '빛 속으로')
})

void test('timing-free word ruby and background remain readable without an embed', () => {
  const song = parseSong({lines: [{words: [{text: '光', ruby: 'ひかり'}], background: '오'}]})
  const lines = toLyricLines(song.lines)
  assert.deepEqual(getSources(song), [])
  assert.equal(lines.filter(isTimed).length, 0)
  assert.equal(lines[0].words[0].ruby?.[0].word, 'ひかり')
  assert.equal(lines[1].words[0].word, '오')
})

void test('invalid YAML, duplicate/unknown keys and invalid timing fail early', () => {
  for (const yaml of [
    'title: one\ntitle: two',
    'lines: [',
    'youtube:\n  typo: https://youtube.com',
    'lines:\n  - text: x\n    time: [2, 1]',
    'lines:\n  - text: x\n    time: [-1, 2]',
    'lines:\n  - text: x\n    time: [1, .inf]',
    'lines:\n  - text: x\n    time: [1, 2, 3]',
  ])
    assert.throws(() => parseSongYaml(yaml, 'invalid'))
  for (const lines of [
    [{}],
    [
      {text: 'x', time: [2, 4]},
      {text: 'y', time: [1, 3]},
    ],
    [{time: [0, 2], words: [{text: 'x', time: [0, 3]}]}],
    [{words: [{text: 'x', time: [0, 2], ruby: [{text: 'y', time: [0, 3]}]}]}],
  ])
    assert.throws(() => parseSong({lines}))
})

void test('the example YAML covers native AMLL features and remains serializable', () => {
  const song = parseSongYaml(
    readFileSync(new URL('../../posts/lyric/life-kinda-sucks.yaml', import.meta.url), 'utf8'),
    'life-kinda-sucks',
  )
  assert.equal(song.title, 'Life kinda sucks ft. Kasane Teto')
  assert.equal(getSources(JSON.parse(JSON.stringify(song)))[0].id, 'oT-G1wS-57c')
  const lines = toLyricLines(song.lines)
  assert.ok(lines.some((line) => line.isBG))
  assert.ok(lines.some((line) => line.isDuet))
  assert.ok(lines.some((line) => line.translatedLyric && line.romanLyric))
  assert.ok(lines.some((line) => line.words.some((word) => word.ruby?.length)))
  assert.ok(lines.some((line) => !isTimed(line)))
})

void test('playback clock freezes while paused, caps stale events, clamps duration', () => {
  const sample = {position: 1000, duration: 5000, sampledAt: 100, playing: true}
  assert.equal(playbackTime(sample, 350), 1250)
  assert.equal(playbackTime({...sample, playing: false}, 350), 1000)
  assert.equal(playbackTime(sample, 20000), 2500)
  assert.equal(playbackTime({...sample, position: 4900}, 350), 5000)
})

void test('original and translation languages remain independent when switching translations', () => {
  const song = parseSong({
    lang: 'ja',
    translationLang: 'en',
    pronunciationLang: 'ja-Latn',
    lines: [
      {
        text: '原文',
        time: [0, 1],
        translation: {en: 'Original', 'zh-Hans': '原文'},
        background: {text: '声', translation: 'Voice'},
      },
      {text: '次', time: [1, 2], translation: 'Next', pronunciation: 'tsugi'},
    ],
  })
  const english = toLyricLines(song.lines, 'en', undefined, song)
  const chinese = toLyricLines(song.lines, 'zh-Hans', undefined, song)
  assert.equal(english[0].lang, 'ja')
  assert.equal(english[0].translationLang, 'en')
  assert.equal(chinese[0].lang, 'ja')
  assert.equal(chinese[0].translationLang, 'zh-Hans')
  assert.equal(chinese[1].translationLang, 'en')
  assert.equal(chinese[2].translationLang, 'en')
  assert.equal(chinese[2].pronunciationLang, 'ja-Latn')
  const unknown = toLyricLines(parseSong({lines: [{text: 'text', translation: 'translation'}]}).lines)
  assert.equal(unknown[0].translationLang, undefined)
})

void test('title metadata and single or multiple artist references are preserved', () => {
  const metadata = {title: '歌', titleLang: 'ja', titleTranslation: '노래', lang: 'ja'}
  const single = parseSong({...metadata, artist: 'togenashi-togeari'})
  assert.equal(single.titleTranslation, '노래')
  assert.equal(single.titleLang, 'ja')
  assert.equal(single.artist, 'togenashi-togeari')
  assert.deepEqual(parseSong({...metadata, artist: ['first', 'second']}).artist, ['first', 'second'])
})

void test('Korean translations never fall back to another language', () => {
  const song = parseSong({
    lines: [
      {text: 'A', translation: {en: 'English'}},
      {text: 'B', translation: {ko: '한국어', en: 'English'}},
      {text: 'C', translation: '문자열 번역'},
    ],
  })
  const lines = toLyricLines(song.lines, 'ko', undefined, song)
  assert.deepEqual(
    lines.map((line) => line.translatedLyric),
    ['', '한국어', '문자열 번역'],
  )
  assert.ok(lines.every((line) => line.translationLang === 'ko'))
  const english = parseSong({translationLang: 'en', lines: [{text: 'A', translation: 'English'}]})
  assert.equal(toLyricLines(english.lines, 'ko', undefined, english)[0].translatedLyric, '')
})
