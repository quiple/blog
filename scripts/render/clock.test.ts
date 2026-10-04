import assert from 'node:assert/strict'
import {test} from 'node:test'
import {chromium} from 'playwright'
import {installRenderClock} from './browser.ts'
import {prepareRenderFrame} from './crop.ts'

test('export clock advances animation, respects AMLL pause and keeps scrolling on its clock', async () => {
  const browser = await chromium.launch({headless: true})
  try {
    const page = await browser.newPage({viewport: {width: 800, height: 600}})
    await page.clock.install()
    await page.route('http://render.test/', (route) =>
      route.fulfill({contentType: 'text/html', body: '<div id="word">test</div><div style="height:3000px"></div>'}),
    )
    await page.addInitScript(installRenderClock, {mediaUrl: 'test.mp4', duration: 10000, font: 'theme'})
    await page.goto('http://render.test/')
    await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 10)
    await page.evaluate(() => {
      const animation = document
        .querySelector('#word')!
        .animate([{opacity: 0}, {opacity: 1}], {duration: 1000, fill: 'both'})
      animation.currentTime = 0
      animation.play()
      window.__renderAnimations(0)
      window.scrollTo({top: 500, behavior: 'smooth'})
    })
    await page.clock.runFor(200)
    const first = await page.evaluate(() => {
      window.__renderAnimations(200)
      return {opacity: Number(getComputedStyle(document.querySelector('#word')!).opacity), scroll: scrollY}
    })
    assert.ok(Math.abs(first.opacity - 0.2) < 0.01)
    assert.ok(first.scroll > 400 && first.scroll < 470)
    await page.evaluate(() => {
      document.getAnimations()[0].pause()
      window.scrollTo({top: 600, behavior: 'smooth'})
    })
    await page.clock.runFor(300)
    const second = await page.evaluate(() => {
      window.__renderAnimations(500)
      return {opacity: Number(getComputedStyle(document.querySelector('#word')!).opacity), scroll: scrollY}
    })
    assert.ok(Math.abs(second.opacity - 0.2) < 0.01)
    assert.equal(second.scroll, 600)
    await page.evaluate(() => {
      const animation = document.getAnimations()[0]
      animation.currentTime = 600
      animation.play()
      window.__renderAnimations(600)
    })
    assert.ok(
      Math.abs((await page.locator('#word').evaluate((el) => Number(getComputedStyle(el).opacity))) - 0.7) < 0.01,
    )
  } finally {
    await browser.close()
  }
})

test('AMLL float animation reverses smoothly after reaching its end', async () => {
  const browser = await chromium.launch({headless: true})
  try {
    const page = await browser.newPage()
    await page.route('http://render.test/', (route) =>
      route.fulfill({contentType: 'text/html', body: '<div id="word">text</div>'}),
    )
    await page.addInitScript(installRenderClock, {mediaUrl: 'test.mp4', duration: 10000, font: 'theme'})
    await page.goto('http://render.test/')
    const samples = await page.evaluate(() => {
      const word = document.querySelector('#word')!
      const animation = word.animate([{transform: 'translateY(0px)'}, {transform: 'translateY(-10px)'}], {
        duration: 1000,
        fill: 'both',
        easing: 'linear',
      })
      animation.currentTime = 0
      animation.play()
      window.__renderAnimations(0)
      window.__renderAnimations(1500)
      const end = Number(animation.currentTime)
      animation.playbackRate = -1
      animation.play()
      const positions: number[] = []
      for (let i = 1; i <= 60; i++) {
        window.__renderAnimations(1500 + (i * 1000) / 60)
        positions.push(new DOMMatrix(getComputedStyle(word).transform).m42)
      }
      return {end, positions}
    })
    assert.equal(samples.end, 1000)
    samples.positions.forEach((position, index) => {
      assert.ok(Math.abs(position - (-10 + (index + 1) / 6)) < 0.01)
    })
  } finally {
    await browser.close()
  }
})

test('export frame centers left metadata and a two-line lyric against the video', async () => {
  const browser = await chromium.launch({headless: true})
  try {
    const page = await browser.newPage({viewport: {width: 1920, height: 1200}})
    await page.route('http://render.test/', (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: `<meta charset="utf-8">
      <style>body{margin:0;padding:84px 24px}#grid{max-width:1600px;margin:auto;display:grid;grid-template-columns:.85fr 1.15fr;gap:24px}
      [data-render-mv]{width:100%;aspect-ratio:16/9}.lyric-player{padding-left:40px}.lyricMainLine{font-size:var(--amll-lp-font-size);line-height:1.2;height:2lh}</style>
      <div id="grid"><aside><div aria-label="음악 소스 선택" style="height:28px;margin-bottom:12px;transition:all 150ms"></div><div data-render-mv></div><div style="height:140px">Title / year / artist</div></aside>
      <div class="lyric-player"><div class="lyricLine"><div class="lyricMainLine">text</div></div></div></div>`,
      }),
    )
    await page.addInitScript(installRenderClock, {mediaUrl: 'test.mp4', duration: 10000, font: 'theme'})
    await page.goto('http://render.test/')
    const crop = await page.evaluate(prepareRenderFrame)
    const rects = await page.evaluate(() => {
      const video = document.querySelector('[data-render-mv]')!.getBoundingClientRect()
      const line = document.querySelector('.lyricMainLine')!.getBoundingClientRect()
      return {
        videoX: video.x,
        blockCenter: (video.y + document.querySelector('aside')!.getBoundingClientRect().bottom) / 2,
        centerDifference: line.top + line.height / 2 - (video.top + video.height / 2),
        lineTop: line.top,
        anchor: window.__lyricRender!.anchorY!(document.querySelector<HTMLElement>('.lyricLine')!),
        theme: localStorage.getItem('mode-watcher-mode'),
      }
    })
    assert.equal(
      await page.locator('[aria-label="음악 소스 선택"]').evaluate((el) => getComputedStyle(el).opacity),
      '0',
    )
    assert.equal(rects.theme, 'dark')
    assert.equal(rects.videoX - crop.x, 64)
    assert.ok(Math.abs(rects.blockCenter - crop.y - 540) < 0.1)
    assert.ok(Math.abs(rects.centerDifference) < 0.1)
    assert.ok(Math.abs(rects.lineTop - rects.anchor!) < 0.1)
  } finally {
    await browser.close()
  }
})

test('captured floating syllables retain subpixel motion and release their layer', async () => {
  const browser = await chromium.launch({headless: true})
  try {
    const page = await browser.newPage({viewport: {width: 400, height: 200}})
    await page.route('http://render.test/', (route) =>
      route.fulfill({contentType: 'text/html', body: '<div id="word" style="font-size:60px;color:red">TEST</div>'}),
    )
    await page.addInitScript(installRenderClock, {mediaUrl: '', duration: 10000, font: 'theme'})
    await page.goto('http://render.test/')
    await page.evaluate(() => {
      const animation = document
        .querySelector('#word')!
        .animate([{transform: 'translateY(0px)'}, {transform: 'translateY(-3px)'}], {
          duration: 1000,
          fill: 'both',
          id: 'float-word',
        })
      animation.currentTime = 0
      animation.play()
      window.__renderAnimations(0)
    })
    const capture = await page.context().newCDPSession(page)
    const images = new Set<string>()
    for (let i = 1; i <= 20; i++) {
      await page.evaluate((time) => window.__renderAnimations(time), (i * 1000) / 60)
      const {data} = await capture.send('Page.captureScreenshot', {format: 'png', optimizeForSpeed: true})
      images.add(data)
    }
    // Without a compositor layer, these 20 frames contain just two positions.
    assert.ok(images.size >= 12, 'Subpixel movement must survive rasterization')
    const restored = await page.evaluate(() => {
      window.__renderAnimations(1000)
      return (document.querySelector('#word') as HTMLElement).style.willChange
    })
    assert.equal(restored, '')
  } finally {
    await browser.close()
  }
})

test('scaling glyphs keep their raster through return and completion, releasing it on removal', async () => {
  const browser = await chromium.launch({headless: true})
  try {
    const page = await browser.newPage({viewport: {width: 320, height: 240}})
    await page.route('http://render.test/', (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: '<meta charset="utf-8"><style>body{margin:0;background:black}#word{display:inline-block;padding:1em;font:60px/1.2 sans-serif;font-feature-settings:"kern";color:red}</style><span id="word">失</span>',
      }),
    )
    await page.addInitScript(installRenderClock, {mediaUrl: '', duration: 10000, font: 'theme'})
    await page.goto('http://render.test/')
    const size = await page.evaluate(() => {
      const word = document.querySelector<HTMLElement>('#word')!
      const size = [word.offsetWidth, word.offsetHeight]
      const glow = word.animate(
        [
          {transform: 'scale(1)', textShadow: '0 0 2px rgba(255,255,255,0)'},
          {transform: 'scale(1.1)', textShadow: '0 0 2px rgba(255,255,255,0.2)'},
          {transform: 'scale(1)', textShadow: '0 0 2px rgba(255,255,255,0)'},
        ],
        {duration: 1000, fill: 'both', id: 'emphasize-word-失-0'},
      )
      const float = word.animate(
        [{transform: 'translateY(0)'}, {transform: 'translateY(-3px)'}, {transform: 'translateY(0)'}],
        {
          duration: 1000,
          fill: 'both',
          composite: 'add',
          id: 'emphasize-word-float',
        },
      )
      for (const animation of [glow, float]) {
        animation.currentTime = 0
        animation.play()
      }
      window.__renderAnimations(0)
      return size
    })
    const capture = await page.context().newCDPSession(page)
    const centers: number[] = []
    for (let i = 1; i <= 65; i++) {
      await page.evaluate((t) => window.__renderAnimations(t), (i * 1000) / 60)
      const {data} = await capture.send('Page.captureScreenshot', {format: 'png'})
      centers.push(
        await page.evaluate(async (data) => {
          const image = await createImageBitmap(await (await fetch(`data:image/png;base64,${data}`)).blob())
          const canvas = document.createElement('canvas')
          canvas.width = image.width
          canvas.height = image.height
          const ctx = canvas.getContext('2d')!
          ctx.drawImage(image, 0, 0)
          image.close()
          const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data
          let sum = 0,
            y = 0
          for (let p = 0; p < pixels.length; p += 4) {
            const weight = Math.max(0, pixels[p] - pixels[p + 1])
            sum += weight
            y += Math.floor(p / 4 / canvas.width) * weight
          }
          return y / sum
        }, data),
      )
    }
    for (let i = 1; i < centers.length; i++) assert.ok(Math.abs(centers[i] - centers[i - 1]) < 0.3)
    assert.equal(await page.locator('#word canvas').count(), 1)
    // An empty computed font shorthand must not silently fall back to 10px.
    assert.ok(await page.locator('#word canvas').evaluate((el) => (el as HTMLCanvasElement).width > 120))
    assert.deepEqual(
      await page.locator('#word').evaluate((el) => [(el as HTMLElement).offsetWidth, (el as HTMLElement).offsetHeight]),
      size,
    )
    const detached = await page.locator('#word').evaluateHandle((el) => {
      el.remove()
      return el
    })
    await page.evaluate(() => window.__renderAnimations(1100))
    assert.equal(await detached.evaluate((el) => el.querySelectorAll('canvas').length), 0)
    assert.equal(await detached.evaluate((el) => el.textContent), '失')
  } finally {
    await browser.close()
  }
})
