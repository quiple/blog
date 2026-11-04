import assert from 'node:assert/strict'
import {test} from 'node:test'
import {parseSong} from '../../src/lib/lyrics/model.ts'
import {parseSongYaml} from '../../src/lib/lyrics/yaml.server.ts'

void test('saved lyrics require a publication date in the same format as articles', () => {
  const source = 'title: Test\nlines:\n  - Test\n'
  assert.throws(() => parseSongYaml(source, 'test'), /pubDate/)
  assert.throws(() => parseSongYaml(`${source}pubDate: 2026-04-28\n`, 'test'))
  assert.throws(() => parseSongYaml(`${source}pubDate: 2026-04-28T25:00\n`, 'test'))
  assert.throws(() => parseSongYaml(`${source}pubDate: 2026-02-30T08:30\n`, 'test'))
  assert.throws(() => parseSongYaml(`${source}pubDate: 2026-04-28T08:30Z\n`, 'test'))
  assert.equal(parseSongYaml(`${source}pubDate: 2026-04-28T08:30\n`, 'test').pubDate, '2026-04-28T08:30')
})

void test('intermediate imported songs can be parsed before their publication date is assigned', () => {
  assert.equal(parseSong({title: 'Test', lines: ['Test']}).pubDate, undefined)
})
