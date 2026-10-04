import type {} from '../../src/lib/lyrics/render.ts'

/** Export-only composition in a 1920px CSS canvas; output density is set separately. */
export function prepareRenderFrame() {
  const video = document.querySelector<HTMLElement>('[data-render-mv]')!
  const aside = video.closest('aside')!
  const grid = aside.parentElement!
  grid.style.maxWidth = 'none'
  grid.style.width = '1792px'
  const host = document.querySelector<HTMLElement>('.lyric-player')!
  host.style.setProperty('--amll-lp-font-size', '4.375rem')
  for (const text of aside.querySelectorAll<HTMLElement>(':scope > h1, :scope > p, :scope > .mt-3')) {
    text.style.fontSize = `${parseFloat(getComputedStyle(text).fontSize) * 1.75}px`
  }
  const embed = video.getBoundingClientRect()
  const crop = {x: embed.x - 64, y: embed.y - 12, width: 1920, height: 1080}
  const center = crop.y + crop.height / 2
  const shift = center - (embed.y + aside.getBoundingClientRect().bottom) / 2
  aside.style.transform = `translateY(${shift}px)`
  // These controls used to sit outside the capture. Keep them out of the video
  // when moving the embed down, without changing their layout or selected state.
  const controls = aside.querySelector<HTMLElement>('[aria-label="음악 소스 선택"]')
  if (controls) {
    controls.style.setProperty('transition', 'none', 'important')
    controls.style.setProperty('opacity', '0', 'important')
    controls.style.pointerEvents = 'none'
  }
  const first = host.querySelector<HTMLElement>('[class*="lyricMainLine"]')!
  // Center the actual active line, including its pronunciation and translation.
  // offsetHeight excludes AMLL's animated scale and keeps the scroll target stable.
  const anchor = (line: HTMLElement) => embed.y + shift + embed.height / 2 - line.offsetHeight / 2
  window.__lyricRender!.anchorY = anchor
  const firstLine = first.parentElement!
  host.style.paddingTop = `${Math.max(0, anchor(firstLine) - firstLine.getBoundingClientRect().top)}px`
  return crop
}
