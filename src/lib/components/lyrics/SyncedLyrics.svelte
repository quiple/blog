<script lang="ts">
  import {onMount, untrack} from 'svelte'
  import type {LocalizedLyricLine} from '$lib/lyrics/model'
  import '@applemusic-like-lyrics/core/style.css'
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
  let wake = $state<(() => void) | undefined>()

  let updateLines = $state<((value: LocalizedLyricLine[]) => void) | undefined>()

  $effect(() => {
    const apply = updateLines
    const value = lines
    untrack(() => apply?.(value))
  })

  $effect(() => {
    void sample
    void offset
    wake?.()
  })

  onMount(() => {
    const container = host
    let disposed = false
    let cleanup = () => {}
    void import('$lib/lyrics/lyric-player')
      .then(({AnnotatedLyricPlayer}) => {
        if (disposed) return
        const player = new AnnotatedLyricPlayer()
        let frame = 0
        let lastFrame = 0
        let lastTime = 0
        let settleUntil = 0
        let visible = true
        let lastFollowed: HTMLElement | undefined
        let followAfter = 0
        const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
        const element = player.getElement()
        element.setAttribute('aria-hidden', 'true')
        container.append(element)
        player.setEnableBlur(false)
        player.setAlignPosition(0.35)
        player.setOptimizeOptions({
          resetLineTimestamps: false,
          normalizeSpaces: false,
          syncMainAndBackgroundLines: false,
          cleanUnintentionalOverlaps: false,
          tryAdvanceStartTime: false,
        })
        player.pause()
        const motion = () => {
          player.setEnableSpring(!reducedMotion.matches)
          player.setEnableScale(!reducedMotion.matches)
        }
        motion()
        const draw = (now: number) => {
          frame = 0
          if (disposed || document.hidden || !visible) {
            lastFrame = 0
            return
          }
          const time = Math.max(0, playbackTime(sample, now) - offset)
          const seek = Math.abs(time - lastTime) > 1000
          player.setCurrentTime(time, seek)
          player.update(lastFrame ? Math.min(now - lastFrame, 50) : 0)
          const active = player.activeElement(time)
          if (sample.playing && active && active !== lastFollowed && now >= followAfter) {
            lastFollowed = active
            const top = active.getBoundingClientRect().top + window.scrollY - Math.max(96, window.innerHeight * 0.18)
            window.scrollTo({top: Math.max(0, top), behavior: reducedMotion.matches ? 'instant' : 'smooth'})
          }
          lastFrame = now
          lastTime = time
          if (sample.playing || now < settleUntil) frame = requestAnimationFrame(draw)
        }
        const schedule = () => {
          if (disposed) return
          if (sample.playing && !document.hidden && visible) player.resume()
          else player.pause()
          settleUntil = performance.now() + 1200
          if (!frame && !document.hidden && visible) frame = requestAnimationFrame(draw)
        }
        updateLines = (value) => {
          if (disposed) return
          try {
            player.setLyricLines(value, Math.max(0, playbackTime(sample, performance.now()) - offset))
            schedule()
          } catch {
            onfailure()
          }
        }
        wake = schedule
        const click = (event: Event) => {
          const index = (event as Event & {lineIndex: number}).lineIndex
          const line = lines[index]
          if (line) onseek(Math.max(0, line.startTime + offset))
        }
        player.addEventListener('line-click', click)
        const observer = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting
          schedule()
        })
        observer.observe(container)
        const resize = new ResizeObserver(schedule)
        resize.observe(container)
        const manualScroll = () => {
          followAfter = performance.now() + 5000
          lastFollowed = undefined
        }
        const scrollKey = (event: KeyboardEvent) => {
          if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) manualScroll()
        }
        window.addEventListener('wheel', manualScroll, {passive: true})
        window.addEventListener('touchmove', manualScroll, {passive: true})
        window.addEventListener('keydown', scrollKey)
        document.addEventListener('visibilitychange', schedule)
        reducedMotion.addEventListener('change', motion)
        schedule()
        cleanup = () => {
          cancelAnimationFrame(frame)
          observer.disconnect()
          resize.disconnect()
          window.removeEventListener('wheel', manualScroll)
          window.removeEventListener('touchmove', manualScroll)
          window.removeEventListener('keydown', scrollKey)
          document.removeEventListener('visibilitychange', schedule)
          reducedMotion.removeEventListener('change', motion)
          player.removeEventListener('line-click', click)
          player.dispose()
          element.remove()
        }
      })
      .catch(() => {
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
  .lyric-player {
    min-height: 1px;
    padding-bottom: 70svh;
    --amll-lp-color: var(--foreground);
    --amll-lp-font-size: clamp(1.5rem, 3vw, 2.5rem);
    --amll-lp-hover-bg-color: var(--muted);
  }
  .lyric-player :global(.amll-lyric-player) {
    mix-blend-mode: normal;
    height: auto;
    contain: none;
    overflow: visible;
    position: relative;
  }
  .lyric-player :global([class*='_lyricLineWrapper']) {
    position: relative;
    padding-block: 0.4em;
    margin-block: 0.6em;
  }
  .lyric-player :global([data-bottom-line]) {
    display: none;
  }
  .lyric-player :global(.lyric-interlude-slot) {
    display: flex;
    align-items: center;
    min-height: 2em;
    pointer-events: none;
  }
  .lyric-player :global(.lyric-interlude-slot.duet) {
    justify-content: flex-end;
  }
  .lyric-player :global(.lyric-interlude-slot > [class*='_interludeDots']) {
    position: relative;
    inset: auto;
  }
  .lyric-player :global([class*='_lyricLine']) {
    content-visibility: visible;
  }
  .lyric-player :global([class*='_bgWrapper']) {
    position: relative;
    inset: auto;
    width: 100%;
    z-index: auto;
    opacity: 1;
    visibility: visible;
    transform: none !important;
    margin-top: 0 !important;
  }
  .lyric-player :global([class*='_romanWord']) {
    line-height: 1.5;
    padding-bottom: 0.15em;
  }
  /* AMLL 0.5.2 stacks the individual emphasis characters in ruby word bodies. */
  .lyric-player :global([class*='_wordBody']) {
    display: block;
    text-align: center;
  }
</style>
