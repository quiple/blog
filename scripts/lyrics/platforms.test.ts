import {test} from 'node:test'
import assert from 'node:assert/strict'
import {appleCandidates, fromSpotify, spotifyCandidates} from './platforms.ts'

const id = '0tNSVPZeJjpNH7Q9VqrbyJ'
const track = {name: 'Fixture', duration_ms: 9000}
const lyrics = {
  lyrics: {
    syncType: 'LINE_SYNCED',
    language: 'en',
    lines: [
      {startTimeMs: '1234', endTimeMs: '0', words: 'First'},
      {startTimeMs: '2345', words: '♪'},
      {startTimeMs: '4567', words: 'Last'},
    ],
  },
}

void test('Spotify preserves milliseconds, blank cues and the final line', () => {
  const song = fromSpotify(lyrics, track, id)
  assert.deepEqual(
    song.lines.map((line) => line.time),
    [
      [1.234, 2.345],
      [4.567, 9],
    ],
  )
  assert.equal(song.lang, 'en')
  assert.equal(song.title, 'Fixture')
  assert.equal(song.spotify, id)
})
void test('Spotify keeps unsynced lyrics untimed and rejects malformed timing', () => {
  assert.ok(
    fromSpotify({lyrics: {...lyrics.lyrics, syncType: 'UNSYNCED'}}, track, id).lines.every((line) => !line.time),
  )
  assert.throws(() => fromSpotify({lyrics: {...lyrics.lyrics, lines: [{words: 'Bad', startTimeMs: 'NaN'}]}}, track, id))
  assert.throws(() => fromSpotify(lyrics, {...track, duration_ms: 4000}, id))
  assert.throws(() => fromSpotify({lyrics: {...lyrics.lyrics, syncType: 'UNKNOWN'}}, track, id))
})

void test('direct providers authenticate only with their own hosts and preserve Apple TTML', async (t) => {
  const names = ['SPOTIFY_ACCESS_TOKEN', 'APPLE_MUSIC_TOKEN', 'APPLE_MUSIC_USER_TOKEN', 'APPLE_MUSIC_STOREFRONT']
  const before = names.map((name) => process.env[name])
  t.after(() =>
    names.forEach((name, i) => {
      if (before[i] === undefined) delete process.env[name]
      else process.env[name] = before[i]
    }),
  )
  for (const name of names) delete process.env[name]
  await assert.rejects(spotifyCandidates(id), /SPOTIFY_ACCESS_TOKEN/)
  await assert.rejects(appleCandidates('123'), /APPLE_MUSIC_USER_TOKEN/)
  process.env.SPOTIFY_ACCESS_TOKEN = 'spotify-test'
  process.env.APPLE_MUSIC_TOKEN = 'apple-test'
  process.env.APPLE_MUSIC_USER_TOKEN = 'user-test'
  const xml =
    '<tt xmlns="http://www.w3.org/ns/ttml" xml:lang="en"><body><div><p begin="1.234s" end="2.345s">Test</p></div></body></tt>'
  const requests: string[] = []
  t.mock.method(globalThis, 'fetch', async (url: string, init: RequestInit) => {
    requests.push(url)
    assert.equal(init.redirect, 'error')
    const headers = new Headers(init.headers)
    if (url.includes('spotify.com')) {
      assert.equal(headers.get('authorization'), 'Bearer spotify-test')
      assert.equal(headers.get('media-user-token'), null)
      return Response.json(url.includes('color-lyrics') ? lyrics : track)
    }
    assert.equal(new URL(url).hostname, 'amp-api.music.apple.com')
    assert.equal(headers.get('authorization'), 'Bearer apple-test')
    assert.equal(headers.get('media-user-token'), 'user-test')
    return Response.json(
      url.endsWith('/me/storefront')
        ? {data: [{id: 'us'}]}
        : {
            data: [
              {
                attributes: {name: 'Apple fixture'},
                relationships: {
                  'syllable-lyrics': {data: [{id: 'syllables', attributes: {ttml: xml}}]},
                  lyrics: {data: [{id: 'lines', attributes: {ttml: xml.replace('Test', 'Other')}}]},
                },
              },
            ],
          },
    )
  })
  const spotify = await (await spotifyCandidates(id))[0].load()
  assert.equal(spotify.song.title, 'Fixture')
  const apple = await appleCandidates('123')
  assert.equal(apple.length, 2)
  const result = await apple[0].load()
  assert.equal(result.song.title, 'Apple fixture')
  assert.deepEqual(result.song.lines[0].time, [1.234, 2.345])
  assert.ok(!JSON.stringify(result.sources).includes('test'))
  assert.ok(requests.every((url) => !url.includes('amll')))
  t.mock.method(globalThis, 'fetch', async () => new Response('secret-response-body', {status: 401}))
  await assert.rejects(spotifyCandidates(id), (error) => {
    assert.match(String(error), /401/)
    assert.ok(!String(error).includes('secret-response-body'))
    return true
  })
})
