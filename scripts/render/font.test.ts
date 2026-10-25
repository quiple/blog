import assert from 'node:assert/strict'
import {test} from 'node:test'
import {chromium} from 'playwright'
import sharp from 'sharp'
import {applyRenderJapaneseFont, installRenderClock} from './browser.ts'

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

test(
  'cached Japanese glyphs preserve proportional spacing and ink position',
  {skip: process.platform !== 'darwin'},
  async () => {
    const browser = await chromium.launch()
    try {
      const page = await browser.newPage()
      await page.route('http://render.test/', (route) =>
        route.fulfill({
          contentType: 'text/html',
          body: `<meta charset="utf-8"><style>
        :root { --font-sans-ja-theme: sans-serif; --font-sans-ja-system: sans-serif }
        body { margin:0; background:black; color:white; font-feature-settings:"palt" 1 }
        .word { display:inline-block; padding:1em; font:60px/1.2 var(--font-sans-ja-theme); font-feature-settings:inherit }
      </style>${['「', 'コ', '日', 'と', '共', '「コ', '日と共'].map((text, i) => `<div><span class="word" id="word-${i}">${text}</span></div>`).join('')}`,
        }),
      )
      await page.addInitScript(installRenderClock, {mediaUrl: '', duration: 10000, font: 'theme'})
      await page.goto('http://render.test/')
      await page.evaluate(applyRenderJapaneseFont, 6)
      const inkBounds = async (buffer: Buffer) => {
        const {data, info} = await sharp(buffer).removeAlpha().raw().toBuffer({resolveWithObject: true})
        let left = info.width,
          right = 0
        for (let y = 0; y < info.height; y++)
          for (let x = 0; x < info.width; x++) {
            if (data[(y * info.width + x) * info.channels] > 64) {
              left = Math.min(left, x)
              right = Math.max(right, x)
            }
          }
        return {left, right}
      }
      for (let i = 0; i < 7; i++) {
        const word = page.locator(`#word-${i}`)
        const before = await inkBounds(await word.screenshot())
        const width = await word.evaluate((el) => {
          const range = document.createRange()
          range.selectNodeContents(el)
          return range.getBoundingClientRect().width
        })
        await word.evaluate((el) => {
          const animation = el.animate([{transform: 'scale(1)'}, {transform: 'scale(1.1)'}], {
            duration: 1000,
            fill: 'both',
            id: 'emphasize-word-spacing',
          })
          animation.currentTime = 0
          animation.play()
          window.__renderAnimations(0)
        })
        const cachedWidth = await word
          .locator('canvas')
          .evaluate((el) => parseFloat((el as HTMLElement).style.width) - 30)
        assert.ok(Math.abs(cachedWidth - width) < 0.1, `Glyph ${i}: cached width ${cachedWidth}, DOM width ${width}`)
        const after = await inkBounds(await word.screenshot())
        assert.ok(Math.abs(after.left - before.left) <= 1, `Glyph ${i}: left ink edge shifted`)
        assert.ok(Math.abs(after.right - before.right) <= 1, `Glyph ${i}: right ink edge shifted`)
      }
    } finally {
      await browser.close()
    }
  },
)
