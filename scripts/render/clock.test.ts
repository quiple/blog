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
    assert.ok(first.scroll > 180 && first.scroll < 300)
    await page.evaluate(() => document.getAnimations()[0].pause())
    await page.clock.runFor(300)
    const second = await page.evaluate(() => {
      window.__renderAnimations(500)
      return {opacity: Number(getComputedStyle(document.querySelector('#word')!).opacity), scroll: scrollY}
    })
    assert.ok(Math.abs(second.opacity - 0.2) < 0.01)
    assert.equal(second.scroll, 500)
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

test('export frame centers left metadata and preserves the normal auto-scroll target relative to the video', async () => {
  const browser = await chromium.launch({headless: true})
  try {
    const page = await browser.newPage({viewport: {width: 1920, height: 1200}})
    await page.route('http://render.test/', (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: `
      <style>body{margin:0;padding:84px 24px}#grid{max-width:1600px;margin:auto;display:grid;grid-template-columns:.85fr 1.15fr;gap:24px}
      [data-render-mv]{width:100%;aspect-ratio:16/9}.lyric-player{padding-left:40px}.lyricMainLine{height:120px}</style>
      <div id="grid"><aside><div aria-label="음악 소스 선택" style="height:28px;margin-bottom:12px"></div><div data-render-mv></div><div style="height:140px">Title / year / artist</div></aside>
      <div class="lyric-player"><div class="lyricMainLine">text</div></div></div>`,
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
        topDifference: line.top - video.top,
        lineTop: line.top,
        anchor: window.__lyricRender!.anchorY,
        theme: localStorage.getItem('mode-watcher-mode'),
      }
    })
    assert.equal(rects.theme, 'dark')
    assert.equal(rects.videoX - crop.x, 64)
    assert.ok(Math.abs(rects.blockCenter - crop.y - 540) < 0.1)
    // Normal auto-scroll targets y=216 (18% of 1200), with the embed at y=124.
    assert.ok(Math.abs(rects.topDifference - 92) < 0.1)
    assert.ok(Math.abs(rects.lineTop - rects.anchor!) < 0.1)
  } finally {
    await browser.close()
  }
})
