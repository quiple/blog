<script lang="ts">
  import {onMount, untrack} from 'svelte'
  import type {LocalizedLyricLine} from '#lib/lyrics/model.js'
  import {playbackTime, type Playback} from '#lib/lyrics/players.js'
  import {lyricRender} from '#lib/lyrics/render.js'
  let {
    lines,
    sample,
    offset = 0,
    onseek,
    onfailure,
  }: {
    lines: LocalizedLyricLine[]
    sample: Playback
    offset?: number
    onseek: (time: number) => void
    onfailure: () => void
  } = $props()
  let host: HTMLDivElement
  let refresh = $state<(() => void) | undefined>()
  $effect(() => {
    void lines
    void sample
    void offset
    untrack(() => refresh?.())
  })

  onMount(() => {
    let disposed = false
    let cleanup = () => {}
    void import('#lib/lyrics/document-player.js')
      .then(({DocumentLyricPlayer}) => {
        if (disposed) return
        const player = new DocumentLyricPlayer()
        const element = player.getElement()
        element.setAttribute('aria-hidden', 'true')
        host.append(element)
        player.setAlignPosition(0)
        if (lyricRender()) player.setEnableBlur(false)
        // Provider timestamps are interpolated below; seek detection is handled there.
        player.setEnableAutoSeekDetection(false)
        player.setOptimizeOptions({
          resetLineTimestamps: false,
          normalizeSpaces: true,
          syncMainAndBackgroundLines: true,
          cleanUnintentionalOverlaps: false,
          tryAdvanceStartTime: false,
        })
        player.pause()
        const motion = matchMedia('(prefers-reduced-motion: reduce)')
        let frame = 0,
          previousFrame = 0,
          previousTime = NaN,
          settleUntil = 0
        let applied: LocalizedLyricLine[] | undefined
        let playing = false,
          visible = true,
          autoFollow = true
        let lastInteraction = 0,
          visibleSince = 0,
          ownScrollUntil = 0
        let followed: HTMLElement | undefined,
          followedTop = NaN
        let anchor: {line: HTMLElement; top: number} | undefined
        let padding = 0,
          spacingVersion = -1,
          spacingDirty = true
        const inset = (line: HTMLElement) => lyricRender()?.anchorY?.(line) ?? Math.max(96, innerHeight * 0.18)
        // Preserve the requested 200ms lead for line transitions.
        const time = () => Math.max(0, playbackTime(sample, performance.now()) - offset + 200)
        const release = () => {
          anchor = undefined
          host.style.minHeight = ''
          spacingDirty = true
        }
        const wake = () => {
          settleUntil = performance.now() + 1200
          if (!frame && visible && !document.hidden) frame = requestAnimationFrame(draw)
        }
        function draw(now: number) {
          frame = 0
          if (disposed || !visible || document.hidden) {
            previousFrame = 0
            return
          }
          // Ignore small backwards corrections from embed timestamp samples.
          let current = time()
          if (current < previousTime && previousTime - current < 200) current = previousTime
          player.setCurrentTime(current, Math.abs(current - previousTime) > 1000)
          const render = lyricRender()
          if (render?.preparing) player.calcLayout('continuous-scroll')
          const upcoming = render ? player.activeLine(current) : undefined
          const initialTop = upcoming ? player.alignmentLine(upcoming).getBoundingClientRect().top : undefined
          player.update(previousFrame ? Math.min(50, now - previousFrame) : 0)
          previousTime = current
          previousFrame = now
          const active = player.activeLine(current)
          if (anchor && active !== anchor.line) release()
          // Share the origin within this frame, but remeasure next frame so external
          // layout shifts and the export camera cannot leave stale coordinates.
          let origin: number | undefined
          const lineTop = (line: HTMLElement, exactInterlude = false) =>
            player.lineTop(line, exactInterlude, (origin ??= player.documentTop()))
          let nextPadding = padding
          if (!anchor && (spacingDirty || spacingVersion !== player.layoutVersion)) {
            spacingDirty = false
            spacingVersion = player.layoutVersion
            const last = player.lastLine()
            if (last) {
              nextPadding = Math.max(
                0,
                Math.round(padding + lineTop(last) - inset(last) + innerHeight - document.documentElement.scrollHeight),
              )
            }
          }
          if (!autoFollow) {
            const rect = active?.getBoundingClientRect()
            const inViewport = rect && rect.bottom > 0 && rect.top < innerHeight
            if (!inViewport) visibleSince = 0
            else if (!visibleSince) visibleSince = now
            if (visibleSince && now - Math.max(lastInteraction, visibleSince) >= 1500) autoFollow = true
          }
          host.dataset.following = String(playing && autoFollow && !render)
          const target =
            !anchor && sample.playing && active && autoFollow ? lineTop(active, !!render) - inset(active) : undefined
          const reference = target !== undefined && active && render?.follow ? player.alignmentLine(active) : undefined
          const referenceTop = reference ? lineTop(reference) : undefined
          // Finish layout reads before changing bottom spacing or scrolling.
          if (nextPadding !== padding) {
            padding = nextPadding
            host.style.paddingBottom = `${padding}px`
          }
          if (anchor) {
            const delta = anchor.line.getBoundingClientRect().top - anchor.top
            if (Math.abs(delta) > 0.5) {
              const target = Math.max(0, scrollY + delta)
              const missing = target + innerHeight - document.documentElement.scrollHeight
              if (missing > 0) host.style.minHeight = `${host.offsetHeight + missing}px`
              ownScrollUntil = performance.now() + 1500
              window.scrollTo({top: target, behavior: 'instant'})
            }
          } else if (active && target !== undefined) {
            if (render?.follow && reference && referenceTop !== undefined) {
              render.follow(active, reference, referenceTop - target, initialTop)
              followed = active
              followedTop = target
            } else if (active !== followed || Math.abs(target - followedTop) > 0.5) {
              followed = active
              followedTop = target
              ownScrollUntil = performance.now() + 1500
              window.scrollTo({
                top: Math.max(0, target),
                behavior: motion.matches ? 'instant' : 'smooth',
              })
            }
          }
          if (sample.playing || now < settleUntil) frame = requestAnimationFrame(draw)
        }
        const sync = () => {
          if (disposed) return
          if (applied?.length !== lines.length || lines.some((line, index) => line !== applied?.[index])) {
            release()
            player.setLyricLines(lines, time())
            applied = lines
            previousTime = NaN
            followed = undefined
          }
          if (!sample.playing && sample.position === 0) player.resetPlayback()
          const running = sample.playing && visible && !document.hidden
          if (running !== playing) {
            const active = player.activeLine(time())
            const top = active?.getBoundingClientRect().top
            release()
            if (active && top !== undefined && followed === active) anchor = {line: active, top}
            if (autoFollow) {
              ownScrollUntil = performance.now() + 1500
              window.scrollTo({top: scrollY, behavior: 'instant'})
            }
            playing = running
            if (playing) player.resume()
            else {
              host.dataset.following = 'false'
              player.pause()
            }
          }
          wake()
        }
        refresh = () => {
          try {
            sync()
          } catch (error) {
            console.error(error)
            onfailure()
          }
        }
        const manual = () => {
          host.dataset.following = 'false'
          release()
          autoFollow = false
          lastInteraction = performance.now()
          visibleSince = 0
          ownScrollUntil = 0
          followed = undefined
          wake()
        }
        const scrolled = () => {
          if (lyricRender()) return
          if (!autoFollow || performance.now() >= ownScrollUntil) manual()
        }
        const scrollEnded = () => {
          ownScrollUntil = 0
        }
        const key = (event: KeyboardEvent) => {
          if (
            !event.defaultPrevented &&
            ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)
          )
            manual()
        }
        const pointer = (event: PointerEvent) => {
          if (event.target === document.documentElement || event.target === document.body) manual()
        }
        const resize = () => {
          release()
          sync()
        }
        const changeMotion = () => {
          player.setEnableSpring(!motion.matches)
          player.setEnableScale(!motion.matches)
          wake()
        }
        const click = (event: Event) => {
          const line = lines[(event as Event & {lineIndex: number}).lineIndex]
          if (line) {
            release()
            followed = undefined
            autoFollow = true
            onseek(Math.max(0, line.startTime + offset))
          }
        }
        const sizes = new ResizeObserver(() => {
          spacingDirty = true
          wake()
        })
        sizes.observe(host)
        sizes.observe(document.body)
        const visibility = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting
          sync()
        })
        visibility.observe(host)
        window.addEventListener('scroll', scrolled, {passive: true})
        window.addEventListener('scrollend', scrollEnded)
        window.addEventListener('wheel', manual, {passive: true, capture: true})
        window.addEventListener('touchmove', manual, {passive: true, capture: true})
        window.addEventListener('keydown', key)
        window.addEventListener('pointerdown', pointer)
        window.addEventListener('resize', resize)
        document.addEventListener('visibilitychange', sync)
        motion.addEventListener('change', changeMotion)
        player.addEventListener('line-click', click)
        changeMotion()
        sync()
        void document.fonts.ready.then(() => {
          if (!disposed) {
            player.refreshMasks()
            host.dataset.ready = 'true'
          }
        })
        cleanup = () => {
          cancelAnimationFrame(frame)
          sizes.disconnect()
          visibility.disconnect()
          player.dispose()
          window.removeEventListener('scroll', scrolled)
          window.removeEventListener('scrollend', scrollEnded)
          window.removeEventListener('wheel', manual, true)
          window.removeEventListener('touchmove', manual, true)
          window.removeEventListener('keydown', key)
          window.removeEventListener('pointerdown', pointer)
          window.removeEventListener('resize', resize)
          document.removeEventListener('visibilitychange', sync)
          motion.removeEventListener('change', changeMotion)
          refresh = undefined
        }
      })
      .catch((error) => {
        console.error(error)
        if (!disposed) onfailure()
      })
    return () => {
      disposed = true
      cleanup()
    }
  })
</script>

<div bind:this={host} class="lyric-player" data-following="false"></div>

<style>
  :global(html:has(.lyric-player)) {
    overflow-anchor: none;
  }
  .lyric-player {
    font-weight: 600;
    min-height: 1px;
    --amll-lp-color: var(--foreground);
    --amll-lp-font-size: clamp(1.5rem, 3vw, 2.5rem);
    --amll-lp-hover-bg-color: var(--muted);
  }
  .lyric-player :global(.amll-lyric-player) {
    position: relative;
    contain: none;
    overflow: visible;
    mix-blend-mode: normal;
  }
  .lyric-player[data-following='false'] :global([class*='_lyricLineWrapper']),
  .lyric-player[data-following='false'] :global([class*='_lyricLine']) {
    filter: none !important;
  }
  .lyric-player :global([data-bottom-line]) {
    display: none;
  }
  .lyric-player :global(.text-muted-foreground) {
    color: var(--muted-foreground);
    opacity: var(--amll-annotation-opacity, 1);
    /* AMLL already animates the mask alpha every frame. */
    transition: none;
  }
</style>
