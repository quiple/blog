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
  const layers = new Map<HTMLElement, string>()
  const glyphs = new Map<HTMLElement, {canvas: HTMLCanvasElement; restore: () => void}>()
  const cacheGlyph = (target: HTMLElement) => {
    if (glyphs.has(target) || target.childElementCount || !target.textContent) return
    const style = getComputedStyle(target)
    // Variable-font settings can make the computed `font` shorthand empty.
    const font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    ctx.font = font
    const metrics = ctx.measureText(target.textContent)
    const height = parseFloat(style.lineHeight) || metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent
    const pad = Math.ceil(parseFloat(style.fontSize) / 4)
    const width = metrics.width + pad * 2
    const bitmapHeight = height + pad * 2
    // Rasterize only this glyph once. The frame itself stays at output resolution.
    canvas.width = Math.ceil(width * 2)
    canvas.height = Math.ceil(bitmapHeight * 2)
    ctx.scale(2, 2)
    ctx.font = font
    ctx.fillStyle = style.color
    ctx.fillText(
      target.textContent,
      pad,
      pad +
        (height - metrics.fontBoundingBoxAscent - metrics.fontBoundingBoxDescent) / 2 +
        metrics.fontBoundingBoxAscent,
    )
    Object.assign(canvas.style, {
      position: 'absolute',
      left: `${parseFloat(style.paddingLeft) - pad}px`,
      top: `${parseFloat(style.paddingTop) - pad}px`,
      width: `${width}px`,
      height: `${bitmapHeight}px`,
      pointerEvents: 'none',
    })
    canvas.setAttribute('aria-hidden', 'true')
    const text = target.firstChild!
    const spacer = document.createElement('span')
    spacer.style.visibility = 'hidden'
    text.replaceWith(spacer)
    spacer.append(text)
    const position = target.style.position
    target.style.position = 'relative'
    target.append(canvas)
    glyphs.set(target, {
      canvas,
      restore: () => {
        spacer.replaceWith(text)
        canvas.remove()
        target.style.position = position
      },
    })
  }
  window.__renderAnimations = (time: number) => {
    const delta = time - last
    last = time
    const floating = new Set<HTMLElement>()
    for (const animation of document.getAnimations()) {
      const known = states.has(animation)
      const running = known ? states.get(animation) : animation.playState === 'running'
      if (!known) states.set(animation, !!running)
      const current = known ? Number(animation.currentTime ?? 0) : 0
      nativePause.call(animation)
      if (running) {
        const end = Number(animation.effect?.getComputedTiming().endTime ?? Infinity)
        animation.currentTime = Math.max(0, Math.min(end, current + (known ? delta : 0) * animation.playbackRate))
        const target = (animation.effect as KeyframeEffect | null)?.target
        if (
          animation.id.startsWith('emphasize-word-') &&
          !animation.id.includes('float') &&
          Number(animation.currentTime) < end &&
          target instanceof HTMLElement
        )
          cacheGlyph(target)
        if (
          animation.id.includes('float') &&
          Number(animation.currentTime) > 0 &&
          (animation.playbackRate < 0 || Number(animation.currentTime) < end) &&
          target instanceof HTMLElement
        ) {
          floating.add(target)
          if (!layers.has(target)) {
            layers.set(target, target.style.willChange)
            // Paused text transforms otherwise rasterize at whole CSS pixels.
            target.style.willChange = 'transform'
          }
        }
      }
    }
    for (const [target, glyph] of glyphs) {
      // Keep the same raster after the motion ends. Switching back to DOM text
      // changes font rasterization/baseline at the final frame and causes a jump.
      if (!target.isConnected) {
        glyph.restore()
        glyphs.delete(target)
        continue
      }
      // Canvas pixels do not receive text-shadow. Match AMLL's single glow with
      // a drop shadow (its blur uses sigma, half the text-shadow blur radius).
      const shadow = getComputedStyle(target).textShadow.match(/^(.*?) (-?[\d.]+)px (-?[\d.]+)px ([\d.]+)px$/)
      glyph.canvas.style.filter = shadow
        ? `drop-shadow(${shadow[2]}px ${shadow[3]}px ${Number(shadow[4]) / 2}px ${shadow[1]})`
        : 'none'
    }
    for (const [target, original] of layers) {
      if (!floating.has(target) && !glyphs.has(target)) {
        target.style.willChange = original
        layers.delete(target)
      }
    }
  }

  // Native smooth scrolling follows wall-clock time. Export uses the same
  // targets, with a clocked 400ms ease, so slow frame capture cannot skip it.
  const scroll = window.scrollTo.bind(window)
  let frame = 0
  let movement: {from: number; to: number; start: number} | undefined
  window.scrollTo = ((first: ScrollToOptions | number, y?: number) => {
    cancelAnimationFrame(frame)
    if (typeof first === 'number' || first.behavior !== 'smooth') {
      movement = undefined
      return typeof first === 'number' ? scroll(first, y ?? 0) : scroll(first)
    }
    const to = Math.max(0, Math.min(first.top ?? scrollY, document.documentElement.scrollHeight - innerHeight))
    // Layout springs can adjust the destination on consecutive frames. Retarget
    // without restarting the easing and stretching one transition indefinitely.
    movement ??= {from: scrollY, to, start: performance.now()}
    movement.to = to
    const step = (now: number) => {
      if (!movement) return
      const {from, to, start} = movement
      const t = Math.min(1, (now - start) / 400)
      const ease = 1 - (1 - t) ** 3
      scroll({top: from + (to - from) * ease, behavior: 'instant'})
      if (t < 1) frame = requestAnimationFrame(step)
      else movement = undefined
    }
    frame = requestAnimationFrame(step)
  }) as typeof window.scrollTo
}

declare global {
  interface Window {
    __renderAnimations: (time: number) => void
  }
}
