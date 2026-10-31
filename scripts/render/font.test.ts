import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {test} from 'node:test'
import {fileURLToPath} from 'node:url'
import {chromium} from 'playwright'
import sharp from 'sharp'
import {build} from 'vite'
import {documentLyrics} from '../amll/plugin.ts'
import {parseSongYaml} from '../../src/lib/lyrics/yaml.server.ts'
import {applyRenderJapaneseFont, installRenderClock} from './browser.ts'

async function fontFixture() {
  const appCss = await readFile('src/app.css', 'utf8')
  const theme = appCss
    .match(/--font-sans-theme:\s*([^;]+);/)?.[1]
    .replace(/\s+/g, ' ')
    .trim()
  if (!theme) throw Error('Missing theme font stack')
  const astr = (await readFile('node_modules/@quiple/aster/fonts/webfonts/Astr[opsz,wght].woff2')).toString('base64')
  return `@font-face {font-family: Astr; src: url(data:font/woff2;base64,${astr}) format('woff2'); font-weight: 200 600}
    :root {--font-sans-theme: ${theme}; --font-sans-active: var(--font-sans-theme);
      --font-sans-ja-theme: Arial, sans-serif; --font-sans-ja-active: var(--font-sans-ja-theme)}`
}

test(
  'export uses Astr first and the selected Hiragino face for Japanese',
  {skip: process.platform !== 'darwin'},
  async () => {
    const fixture = await fontFixture()
    const browser = await chromium.launch()
    try {
      for (const weight of [3, 6]) {
        const page = await browser.newPage()
        await page.setContent(`<style>
        ${fixture}
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
        await page.evaluate(applyRenderJapaneseFont, weight)
        await page.evaluate(async () => {
          await document.fonts.load('600 60px Astr')
          await document.fonts.ready
        })
        const stacks = await page.evaluate(() => {
          const style = document.documentElement.style
          return ['sans', 'sans-ja', 'sans-zh-cn', 'sans-zh-tw'].flatMap((name) =>
            ['theme', 'system'].map((mode) => style.getPropertyValue(`--font-${name}-${mode}`)),
          )
        })
        const expected = fixture
          .match(/--font-sans-theme: ([^;]+);/)![1]
          .replace(/,\s*IBMPlexSansJP-web/, '')
          .replace('Hiragino Sans', 'RenderHiragino, Hiragino Sans')
        assert.ok(stacks.every((stack) => stack === expected))
        assert.ok((await fonts('#latin')).some((font) => /Astr/i.test(font)))
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
  'export applies the Japanese font to actual main and background lyrics and cached glyphs',
  {skip: process.platform !== 'darwin'},
  async () => {
    const song = parseSongYaml(await readFile('src/posts/lyric/unemployed.yaml', 'utf8'), 'unemployed')
    const line = song.lines.find((entry) => entry.background?.text.includes('ナマケ'))
    assert.ok(line?.background)
    assert.equal(song.lang, 'en-US')
    const fixture = await fontFixture()
    const model = fileURLToPath(new URL('../../src/lib/lyrics/model.ts', import.meta.url))
    const result = await build({
      configFile: false,
      publicDir: false,
      logLevel: 'silent',
      define: {'process.env.NODE_ENV': '"production"'},
      plugins: [
        documentLyrics(),
        {
          name: 'render-font-fixture',
          resolveId(id) {
            if (id.endsWith('render-font-fixture')) return '\0render-font-fixture'
          },
          load(id) {
            if (id === '\0render-font-fixture')
              return `import {DomLyricPlayer} from 'virtual:amll-document'; import {toLyricLines} from ${JSON.stringify(model)}; window.Player = DomLyricPlayer; window.convertLines = toLyricLines;`
          },
        },
      ],
      build: {write: false, minify: false, lib: {entry: 'render-font-fixture', formats: ['es']}},
    })
    const output = Array.isArray(result) ? result[0] : result
    if (!('output' in output)) throw Error('Missing bundle')
    const code = output.output.find((chunk) => chunk.type === 'chunk' && chunk.isEntry)
    if (!code || code.type !== 'chunk') throw Error('Missing entry')
    const css = await readFile('node_modules/@applemusic-like-lyrics/core/dist/style.css', 'utf8')
    const customCss = await readFile('src/lib/lyrics/document-player.css', 'utf8')
    const browser = await chromium.launch()
    try {
      for (const lang of [song.lang, undefined]) {
        const page = await browser.newPage({viewport: {width: 1400, height: 1000}})
        await page.route('http://render.test/', (route) =>
          route.fulfill({
            contentType: 'text/html',
            body: `<meta charset="utf-8"><style>
              ${fixture}
              @layer base { html { font-family: var(--font-sans-active) } :lang(ja) { font-family: var(--font-sans-ja-active) } }
              ${css}\n${customCss}
              #host { width: 800px } .lyric-player { --amll-lp-font-size: 60px }
            </style><html lang="ko"><body><div id="host" class="lyric-player"></div></body></html>`,
          }),
        )
        await page.addInitScript(installRenderClock, {mediaUrl: '', duration: 10000, font: 'theme'})
        await page.goto('http://render.test/')
        await page.addScriptTag({type: 'module', content: code.code})
        await page.waitForFunction(() => !!(window as any).Player && !!(window as any).convertLines)
        await page.evaluate(
          ({lang, line}) => {
            const w = window as any
            const player = new w.Player()
            w.player = player
            document.querySelector('#host')!.append(player.getElement())
            player.setEnableSpring(false)
            player.setOptimizeOptions({
              resetLineTimestamps: false,
              normalizeSpaces: true,
              syncMainAndBackgroundLines: true,
            })
            player.setLyricLines(w.convertLines([line], undefined, {lang}), 58000)
          },
          {lang, line},
        )
        await page.waitForFunction(() =>
          document.querySelector('[class*="_lyricBgLine"] [class*="_lyricMainLine"]')?.textContent?.includes('ナ'),
        )
        await page.evaluate(() => {
          const markText = (selector: string, value: string, id: string) => {
            const root = document.querySelector(selector)
            if (!root) throw Error(`Missing ${selector}`)
            const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
            for (let node = walker.nextNode(); node; node = walker.nextNode()) {
              if (node.textContent?.includes(value) && node.parentElement) {
                node.parentElement.id = id
                return
              }
            }
            throw Error(`Missing ${value}`)
          }
          const main = '[class*="_lyricLine"]:not([class*="_lyricBgLine"]) [class*="_lyricMainLine"]'
          const background = '[class*="_lyricBgLine"] [class*="_lyricMainLine"]'
          markText(main, 'waste', 'font-latin')
          markText(background, 'ナ', 'font-background')
          markText(background, '나마케', 'font-pronunciation')
          markText('[class*="_lyricBgLine"] [class*="_lyricSubLine"]:last-child', '게으름뱅이', 'font-translation')
        })
        const cdp = await page.context().newCDPSession(page)
        await cdp.send('DOM.enable')
        await cdp.send('CSS.enable')
        const {root} = await cdp.send('DOM.getDocument')
        const fonts = async (selector: string) => {
          const {nodeId} = await cdp.send('DOM.querySelector', {nodeId: root.nodeId, selector})
          return (await cdp.send('CSS.getPlatformFontsForNode', {nodeId})).fonts.map((f) => f.postScriptName)
        }
        await page.evaluate(applyRenderJapaneseFont, 6)
        await page.evaluate(async () => {
          await document.fonts.load('600 60px Astr')
          await document.fonts.ready
        })
        assert.ok(
          (await fonts('#font-background')).includes('HiraginoSans-W6'),
          `${lang ?? 'missing lang'}: background`,
        )
        for (const selector of ['#font-latin', '#font-pronunciation', '#font-translation'])
          assert.ok(
            (await fonts(selector)).some((font) => /Astr/i.test(font)),
            `${lang ?? 'missing lang'}: ${selector}`,
          )
        const cachedFont = await page.locator('#font-background').evaluate((el) => {
          const animation = el.animate([{transform: 'scale(1)'}, {transform: 'scale(1.1)'}], {
            duration: 1000,
            fill: 'both',
            id: 'emphasize-word-font-test',
          })
          animation.play()
          window.__renderAnimations(0)
          return el.querySelector('canvas')?.getContext('2d')?.font
        })
        assert.match(cachedFont ?? '', /RenderHiragino/, `${lang ?? 'missing lang'}: cached background`)
        await page.evaluate(() => (window as any).player.dispose())
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
    const fixture = await fontFixture()
    const browser = await chromium.launch()
    try {
      const page = await browser.newPage()
      await page.route('http://render.test/', (route) =>
        route.fulfill({
          contentType: 'text/html',
          body: `<meta charset="utf-8"><style>
        ${fixture}
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
