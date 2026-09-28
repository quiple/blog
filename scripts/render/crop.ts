import type {} from '../../src/lib/lyrics/render.ts'

/** Export-only composition in a 1920px CSS canvas; output density is set separately. */
export function prepareRenderFrame() {
  const video = document.querySelector<HTMLElement>('[data-render-mv]')!
  const aside = video.closest('aside')!
  const grid = aside.parentElement!
  grid.style.maxWidth = 'none'
  grid.style.width = '1792px'
  const host = document.querySelector<HTMLElement>('.lyric-player')!
  host.style.setProperty('--amll-lp-font-size', '3.125rem')
  for (const text of aside.querySelectorAll<HTMLElement>(':scope > h1, :scope > p, :scope > .mt-3')) {
    text.style.fontSize = `${parseFloat(getComputedStyle(text).fontSize) * 1.25}px`
  }
  const embed = video.getBoundingClientRect()
  const crop = {x: embed.x - 64, y: embed.y - 12, width: 1920, height: 1080}
  const center = crop.y + crop.height / 2
  const shift = center - (embed.y + aside.getBoundingClientRect().bottom) / 2
  aside.style.transform = `translateY(${shift}px)`
  // These controls used to sit outside the capture. Keep them out of the video
  // when moving the embed down, without changing their layout or selected state.
  const controls = aside.querySelector<HTMLElement>('[aria-label="음악 소스 선택"]')
  if (controls) controls.style.visibility = 'hidden'
  const first = host.querySelector<HTMLElement>('[class*="lyricMainLine"]')!
  const rect = first.getBoundingClientRect()
  // Match SyncedLyrics' normal auto-scroll target, not the first unscrolled row.
  const anchor = Math.max(96, innerHeight * 0.18) + shift
  window.__lyricRender!.anchorY = anchor
  host.style.paddingTop = `${Math.max(0, anchor - rect.top)}px`
  return crop
}
