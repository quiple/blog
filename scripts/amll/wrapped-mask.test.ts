import assert from 'node:assert/strict'
import {test} from 'node:test'
import {readFile} from 'node:fs/promises'
import {build} from 'vite'
import {chromium} from 'playwright'
import {documentLyrics} from './plugin.ts'

test('wrapped emphasized word highlights its second row last, including after resize', async () => {
  const result = await build({
    configFile: false,
    publicDir: false,
    logLevel: 'silent',
    define: {'process.env.NODE_ENV': '"production"'},
    plugins: [
      documentLyrics(),
      {
        name: 'mask-test',
        resolveId(id) {
          if (id.endsWith('mask-test')) return '\0mask-test'
        },
        load(id) {
          if (id === '\0mask-test')
            return `import {DomLyricPlayer} from 'virtual:amll-document'; window.Player = DomLyricPlayer;`
        },
      },
    ],
    build: {write: false, minify: false, lib: {entry: 'mask-test', formats: ['es']}},
  })
  const output = Array.isArray(result) ? result[0] : result
  if (!('output' in output)) throw Error('Missing bundle')
  const code = output.output.find((chunk) => chunk.type === 'chunk')!
  if (code.type !== 'chunk') throw Error('Missing entry')
  const css = await readFile('node_modules/@applemusic-like-lyrics/core/dist/style.css', 'utf8')
  const customCss = await readFile('src/lib/lyrics/document-player.css', 'utf8')
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage({viewport: {width: 1400, height: 1000}})
    await page.setContent(`<style>${css}\n${customCss}
      #host { width: 600px; } .amll-lyric-player { --amll-lp-font-size:60px; font-family:sans-serif; }
    </style><div id="host" class="lyric-player"></div>`)
    await page.addScriptTag({type: 'module', content: code.code})
    await page.waitForFunction(() => !!(window as any).Player)
    const inspect = (width: number) =>
      page.evaluate(async (width) => {
        const w = window as any
        const host = document.querySelector<HTMLElement>('#host')!
        host.style.width = `${width}px`
        if (!w.player) {
          w.player = new w.Player()
          host.append(w.player.getElement())
          w.player.setEnableSpring(false)
          w.player.setOptimizeOptions({resetLineTimestamps: false, normalizeSpaces: false, tryAdvanceStartTime: false})
          w.player.setLyricLines([
            {
              words: [
                {word: 'かの有名な', startTime: 1000, endTime: 2000},
                {
                  word: '「コジェニー・アークボーイ」の',
                  romanWord: "'코제니아쿠보이'노",
                  startTime: 2000,
                  endTime: 4000,
                },
              ],
              startTime: 1000,
              endTime: 4000,
              translatedLyric: '번역',
              romanLyric: '',
              isBG: false,
              isDuet: false,
              lang: 'ja',
            },
          ])
        }
        await document.fonts.ready
        await new Promise((resolve) => setTimeout(resolve, 100))
        const line = w.player.currentLyricGroups[0].mainLine
        line.updateMaskImageSync()
        const word = line.splittedWords.find((word: any) => word.word.includes('コジェニー'))
        line.maskAnimator.setCurrentTime(2000, false)
        const states = word.subElements.map((el: HTMLElement) => ({
          text: el.textContent,
          top: el.offsetTop,
          width: el.clientWidth,
          mask: getComputedStyle(el).maskImage,
          position: parseFloat(getComputedStyle(el).maskPosition),
        }))
        return {
          states,
          parentMask: getComputedStyle(word.mainElement).maskImage,
          pronunciationMask: getComputedStyle(word.mainElement.querySelector('[class*="_romanWord"]')).maskImage,
        }
      }, width)
    const narrow = await inspect(600)
    assert.ok(new Set(narrow.states.map((s: any) => s.top)).size > 1, 'fixture must wrap')
    assert.equal(narrow.parentMask, 'none')
    assert.notEqual(narrow.pronunciationMask, 'none')
    const first = narrow.states[0],
      last = narrow.states.at(-1)
    assert.equal(last.text, 'の')
    assert.notEqual(last.mask, 'none')
    assert.ok(first.position > last.position + 20, 'second row must remain behind the first row')
    const wide = await inspect(1300)
    assert.equal(new Set(wide.states.map((s: any) => s.top)).size, 1)
    assert.notEqual(wide.parentMask, 'none')
    assert.ok(
      wide.states.every((s: any) => s.mask === 'none'),
      'old glyph masks must be removed',
    )
    const narrowAgain = await inspect(600)
    assert.equal(narrowAgain.parentMask, 'none')
    assert.notEqual(narrowAgain.states.at(-1).mask, 'none')
  } finally {
    await browser.close()
  }
})
