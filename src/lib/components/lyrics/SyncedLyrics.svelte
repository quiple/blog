<script lang="ts">
  import {onMount, untrack} from 'svelte'
  import type {LocalizedLyricLine} from '$lib/lyrics/model'
  import {playbackTime, type Playback} from '$lib/lyrics/players'
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
    void import('$lib/lyrics/document-player')
      .then(({DocumentLyricPlayer}) => {
        if (disposed) return
        const player = new DocumentLyricPlayer()
        const element = player.getElement()
        element.setAttribute('aria-hidden', 'true')
        host.append(element)
        player.setAlignPosition(0)
        player.setEnableBlur(false)
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
          userUntil = 0
        let followed: HTMLElement | undefined,
          followedTop = NaN
        let anchor: {line: HTMLElement; top: number} | undefined
        let padding = 0,
          spacingVersion = -1,
          spacingDirty = true
        const inset = () => Math.max(96, innerHeight * 0.18)
        // Preserve the requested 200ms lead for the native 400ms color transition.
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
          const current = time()
          player.setCurrentTime(current, Math.abs(current - previousTime) > 1000)
          player.update(previousFrame ? Math.min(50, now - previousFrame) : 0)
          previousTime = current
          previousFrame = now
          const active = player.activeLine(current)
          if (anchor && active !== anchor.line) release()
          if (!anchor && (spacingDirty || spacingVersion !== player.layoutVersion)) {
            spacingDirty = false
            spacingVersion = player.layoutVersion
            const last = player.lastLine()
            if (last) {
              const next = Math.max(
                0,
                Math.round(
                  padding + player.lineTop(last) - inset() + innerHeight - document.documentElement.scrollHeight,
                ),
              )
              if (next !== padding) {
                padding = next
                host.style.paddingBottom = `${padding}px`
              }
            }
          }
          if (anchor) {
            const delta = anchor.line.getBoundingClientRect().top - anchor.top
            if (Math.abs(delta) > 0.5) {
              const target = Math.max(0, scrollY + delta)
              const missing = target + innerHeight - document.documentElement.scrollHeight
              if (missing > 0) host.style.minHeight = `${host.offsetHeight + missing}px`
              window.scrollTo({top: target, behavior: 'instant'})
            }
          } else if (sample.playing && active && now >= userUntil) {
            const target = player.lineTop(active)
            if (active !== followed || Math.abs(target - followedTop) > 0.5) {
              followed = active
              followedTop = target
              window.scrollTo({top: Math.max(0, target - inset()), behavior: motion.matches ? 'instant' : 'smooth'})
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
            window.scrollTo({top: scrollY, behavior: 'instant'})
            playing = running
            if (playing) player.resume()
            else player.pause()
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
          release()
          userUntil = performance.now() + 5000
          followed = undefined
          wake()
        }
        const key = (event: KeyboardEvent) => {
          if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) manual()
        }
        const pointer = (event: PointerEvent) => {
          if (event.target === document.documentElement) manual()
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
            userUntil = 0
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
        window.addEventListener('wheel', manual, {passive: true})
        window.addEventListener('touchmove', manual, {passive: true})
        window.addEventListener('keydown', key)
        window.addEventListener('pointerdown', pointer)
        window.addEventListener('resize', resize)
        document.addEventListener('visibilitychange', sync)
        motion.addEventListener('change', changeMotion)
        player.addEventListener('line-click', click)
        changeMotion()
        sync()
        cleanup = () => {
          cancelAnimationFrame(frame)
          sizes.disconnect()
          visibility.disconnect()
          player.dispose()
          window.removeEventListener('wheel', manual)
          window.removeEventListener('touchmove', manual)
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

<div bind:this={host} class="lyric-player"></div>

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
  .lyric-player :global([data-bottom-line]) {
    display: none;
  }
  .lyric-player :global(.text-muted-foreground) {
    color: var(--muted-foreground);
    opacity: 1;
  }
</style>
