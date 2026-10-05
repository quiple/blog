import assert from 'node:assert/strict'
import {test} from 'node:test'
import {chromium} from 'playwright'
import {applyRenderJapaneseFont} from './browser.ts'

test(
  'export uses selected Hiragino face for Japanese and preserves Latin fonts',
  {skip: process.platform !== 'darwin'},
  async () => {
    const browser = await chromium.launch()
    try {
      for (const weight of [3, 6]) {
        const page = await browser.newPage()
        await page.setContent(`<style>
        :root { --font-sans-ja-theme: Arial, sans-serif; --font-sans-ja-system: Arial, sans-serif }
        .sample {font:600 60px var(--font-sans-ja-theme)}
      </style><span class="sample" id="latin">Latin</span><span class="sample" id="japanese">日本語</span>
      <span class="sample" id="title" style="font-weight:700">曲名</span>`)
        const cdp = await page.context().newCDPSession(page)
        await cdp.send('DOM.enable')
        await cdp.send('CSS.enable')
        const {root} = await cdp.send('DOM.getDocument')
        const fonts = async (selector: string) => {
          const {nodeId} = await cdp.send('DOM.querySelector', {nodeId: root.nodeId, selector})
          return (await cdp.send('CSS.getPlatformFontsForNode', {nodeId})).fonts.map((f) => f.postScriptName)
        }
        const latin = await fonts('#latin')
        await page.evaluate(applyRenderJapaneseFont, weight)
        await page.evaluate(() => document.fonts.ready)
        assert.deepEqual(await fonts('#latin'), latin)
        assert.deepEqual(await fonts('#japanese'), [`HiraginoSans-W${weight}`])
        assert.deepEqual(await fonts('#title'), [`HiraginoSans-W${weight}`])
        await page.close()
      }
    } finally {
      await browser.close()
    }
  },
)
