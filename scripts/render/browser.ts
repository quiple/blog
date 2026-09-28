import type {} from '../../src/lib/lyrics/render.ts'

/** Installed only inside the disposable export browser. */
export function installRenderClock(options: {mediaUrl: string; duration: number; font: string}) {
  localStorage.setItem('mode-watcher-mode', 'dark')
  localStorage.setItem('font-family', options.font)
  window.__lyricRender = {mediaUrl: options.mediaUrl, duration: options.duration}

  // Playwright clocks JS timers, but not compositor animations. Freeze those
  // separately while preserving AMLL's own play/pause/currentTime operations.
  const nativePause = Animation.prototype.pause
  const nativePlay = Animation.prototype.play
  const states = new WeakMap<Animation, boolean>()
  Animation.prototype.play = function () {
    states.set(this, true)
    nativePlay.call(this)
    nativePause.call(this)
  }
  Animation.prototype.pause = function () {
    states.set(this, false)
    nativePause.call(this)
  }
  let last = 0
  window.__renderAnimations = (time: number) => {
    const delta = time - last
    last = time
    for (const animation of document.getAnimations()) {
      const known = states.has(animation)
      const running = known ? states.get(animation) : animation.playState === 'running'
      if (!known) states.set(animation, !!running)
      const current = known ? Number(animation.currentTime ?? 0) : 0
      nativePause.call(animation)
      if (running) animation.currentTime = current + (known ? delta : 0)
    }
  }

  // Native smooth scrolling follows wall-clock time. Export uses the same
  // targets, with a clocked 400ms ease, so slow frame capture cannot skip it.
  const scroll = window.scrollTo.bind(window)
  let frame = 0
  window.scrollTo = ((first: ScrollToOptions | number, y?: number) => {
    cancelAnimationFrame(frame)
    if (typeof first === 'number') return scroll(first, y ?? 0)
    if (first.behavior !== 'smooth') return scroll(first)
    const from = scrollY
    const to = Math.max(0, Math.min(first.top ?? from, document.documentElement.scrollHeight - innerHeight))
    const start = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 400)
      const ease = t * t * (3 - 2 * t)
      scroll({top: from + (to - from) * ease, behavior: 'instant'})
      if (t < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
  }) as typeof window.scrollTo
}

declare global {
  interface Window {
    __renderAnimations: (time: number) => void
  }
}
