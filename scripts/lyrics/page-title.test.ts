import assert from 'node:assert/strict'
import {test} from 'node:test'
import {lyricPageTitle} from '../../src/lib/lyrics/page-title.ts'

test('lyric page titles include translated titles and displayed artist names', () => {
  assert.equal(
    lyricPageTitle({title: '原題', titleTranslation: '번역'}, [
      {name: 'Artist', translation: '아티스트'},
      {name: 'Singer'},
    ]),
    '原題 (번역) by 아티스트, Singer',
  )
  assert.equal(lyricPageTitle({title: 'Original'}, [{name: 'Singer'}]), 'Original by Singer')
  assert.equal(lyricPageTitle({title: 'Original', titleTranslation: '번역'}, []), 'Original (번역)')
  assert.equal(lyricPageTitle({title: 'Original'}, []), 'Original')
})
