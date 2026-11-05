import assert from 'node:assert/strict'
import {test} from 'node:test'
import {fileURLToPath} from 'node:url'
import {chromium} from 'playwright'
import {svelte} from '@sveltejs/vite-plugin-svelte'
import {build} from 'vite'
import {documentLyrics} from '../amll/plugin.ts'
import {installRenderClock} from './browser.ts'

test('export blur setting controls the actual lyric player', async () => {
  const component = fileURLToPath(new URL('../../src/lib/components/lyrics/SyncedLyrics.svelte', import.meta.url))
  const model = fileURLToPath(new URL('../../src/lib/lyrics/model.ts', import.meta.url))
  const library = fileURLToPath(new URL('../../src/lib/', import.meta.url))
  const result = await build({
    configFile: false,
    publicDir: false,
    logLevel: 'silent',
    define: {'import.meta.env.DEV': 'true', 'process.env.NODE_ENV': '"production"'},
    resolve: {alias: {'#lib': library}},
    plugins: [
      documentLyrics(),
      svelte({configFile: false}),
      {
        name: 'render-blur-fixture',
        resolveId(id) {
          if (id.endsWith('render-blur-fixture')) return '\0render-blur-fixture'
        },
        load(id) {
          if (id === '\0render-blur-fixture')
            return `import {mount} from 'svelte'; import Component from ${JSON.stringify(component)}; import {toLyricLines} from ${JSON.stringify(model)};
              const lines = toLyricLines([
                {text: 'First line', time: [0, 5]},
                {text: 'Second line', time: [5, 10]},
                {text: 'Third line', time: [10, 15]},
                {text: 'Fourth line', time: [15, 20]},
              ]);
              mount(Component, {target: document.querySelector('#host'), props: {lines, sample: {position: 7000, playing: true, duration: 20000, sampledAt: performance.now()}, onseek() {}, onfailure() {throw Error('player failed')}}});`
        },
      },
    ],
    build: {
      write: false,
      minify: false,
      lib: {entry: 'render-blur-fixture', formats: ['es']},
      rollupOptions: {output: {codeSplitting: false}},
    },
  })
  const output = Array.isArray(result) ? result[0] : result
  if (!('output' in output)) throw Error('Missing bundle')
  const code = output.output.find((chunk) => chunk.type === 'chunk' && chunk.isEntry)
  if (!code || code.type !== 'chunk') throw Error('Missing entry')
  const css = output.output
    .flatMap((asset) => (asset.type === 'asset' && asset.fileName.endsWith('.css') ? [asset.source.toString()] : []))
    .join('\n')
  const browser = await chromium.launch({headless: true})
  try {
    for (const lyricBlur of [false, true]) {
      const page = await browser.newPage({viewport: {width: 1200, height: 900}, reducedMotion: 'no-preference'})
      try {
        const errors: Error[] = []
        page.on('pageerror', (error) => errors.push(error))
        await page.route('http://render.test/', (route) =>
          route.fulfill({
            contentType: 'text/html',
            body: `<style>${css}\n#host {width: 800px}</style><div id="host"></div>`,
          }),
        )
        await page.addInitScript(installRenderClock, {mediaUrl: '', duration: 20000, font: 'theme', lyricBlur})
        await page.addInitScript(() => {
          window.__lyricRender!.follow = () => {}
        })
        await page.goto('http://render.test/')
        await page.addScriptTag({type: 'module', content: code.code})
        await page.locator('.lyric-player[data-ready="true"]').waitFor({timeout: 5000})
        const lines = page.locator('.amll-lyric-player [class*="lyricLineWrapper"]')
        await lines.first().waitFor()
        await page.waitForTimeout(1000)
        const filters = await lines.evaluateAll((elements) => elements.map((el) => getComputedStyle(el).filter))
        const blurred = filters.some((filter) => !['none', 'blur(0px)'].includes(filter))
        assert.equal(blurred, lyricBlur, `lyricBlur=${lyricBlur}: ${filters.join(', ')}`)
        assert.deepEqual(errors, [])
      } finally {
        await page.close()
      }
    }
  } finally {
    await browser.close()
  }
})
