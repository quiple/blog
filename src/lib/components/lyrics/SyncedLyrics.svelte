<script lang="ts">
  import {onMount, untrack} from 'svelte'
  import type {LocalizedLyricLine} from '$lib/lyrics/model'
  import '@applemusic-like-lyrics/core/style.css'
  import {playbackTime, type Playback} from '$lib/lyrics/players'

  // AMLL's line opacity transition is 400ms with no delay.
  const colorTransitionLead = 200

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
        let lastTime = Number.NaN
        let settleUntil = 0
        let visible = true
        let lastFollowed: HTMLElement | undefined
        let lastFollowedTop: number | undefined
        let followedLayout = -1
        let pendingFollow: {element: HTMLElement; top: number} | undefined
        let preserveFollow = false
        let scrollHold: {element: HTMLElement; top: number} | undefined
        let followAfter = 0
        let appliedLines: LocalizedLyricLine[] | undefined
        let spacingDirty = true
        let spacingLayout = -1
        let spacingHeight = 0
        let bottomSpace = 0
        const followInset = () => Math.max(96, window.innerHeight * 0.18)
        const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
        const element = player.getElement()
        element.setAttribute('aria-hidden', 'true')
        container.append(element)
        player.setEnableBlur(false)
        player.setAlignPosition(0)
        player.setOptimizeOptions({
          resetLineTimestamps: false,
          normalizeSpaces: true,
          syncMainAndBackgroundLines: true,
          cleanUnintentionalOverlaps: false,
          tryAdvanceStartTime: false,
        })
        player.pause()
        let playerPlaying = false
        let playbackPlaying = false
        const motion = () => {
          player.setEnableSpring(!reducedMotion.matches)
          player.setEnableScale(!reducedMotion.matches)
        }
        motion()
        const lyricTime = (now = performance.now()) =>
          Math.max(0, playbackTime(sample, now) - offset + colorTransitionLead)
        const releaseScroll = () => {
          scrollHold = undefined
          container.style.minHeight = ''
        }
        const draw = (now: number) => {
          frame = 0
          if (disposed || document.hidden || !visible) {
            lastFrame = 0
            return
          }
          const time = lyricTime(now)
          const seek = Math.abs(time - lastTime) > 1000
          if (time !== lastTime) player.setCurrentTime(time, seek)
          player.update(lastFrame ? Math.min(now - lastFrame, 50) : 0)
          if (spacingDirty || spacingLayout !== player.layoutVersion || spacingHeight !== window.innerHeight) {
            spacingDirty = false
            spacingLayout = player.layoutVersion
            spacingHeight = window.innerHeight
            const lastTarget = player.lastScrollTarget()
            if (lastTarget !== undefined) {
              // Include the footer and surrounding page spacing in the scroll
              // range, so the final row's follow position is the page bottom.
              const space = Math.max(
                0,
                Math.round(
                  bottomSpace + lastTarget - followInset() + window.innerHeight - document.documentElement.scrollHeight,
                ),
              )
              if (space !== bottomSpace) {
                bottomSpace = space
                container.style.paddingBottom = `${space}px`
              }
            }
          }
          const active = player.activeElement(time)
          if (preserveFollow) {
            lastFollowed = active
            lastFollowedTop = undefined
            preserveFollow = false
          }
          // Preserve the active row's viewport position, not the document's
          // scroll offset, while background rows change the layout above it.
          if (scrollHold && active !== scrollHold.element) releaseScroll()
          if (scrollHold) {
            const delta = scrollHold.element.getBoundingClientRect().top - scrollHold.top
            if (Math.abs(delta) >= 0.5) {
              const top = Math.max(0, window.scrollY + delta)
              const missingHeight = top + window.innerHeight - document.documentElement.scrollHeight
              if (missingHeight > 0) container.style.minHeight = `${container.offsetHeight + missingHeight}px`
              window.scrollTo({top, left: window.scrollX, behavior: 'instant'})
            }
          }
          if (
            !scrollHold &&
            sample.playing &&
            active &&
            active.style.visibility !== 'hidden' &&
            now >= followAfter &&
            (active !== lastFollowed || (lastFollowedTop !== undefined && followedLayout !== player.layoutVersion))
          ) {
            const target = player.scrollTarget(active)
            followedLayout = player.layoutVersion
            const moved =
              active === lastFollowed && lastFollowedTop !== undefined && Math.abs(target - lastFollowedTop) >= 0.5
            // Let ResizeObserver commit row-height changes before following.
            if (
              moved ||
              (active !== lastFollowed &&
                pendingFollow?.element === active &&
                Math.abs(pendingFollow.top - target) < 0.5)
            ) {
              lastFollowed = active
              lastFollowedTop = target
              pendingFollow = undefined
              const top = target - followInset()
              window.scrollTo({top: Math.max(0, top), behavior: reducedMotion.matches ? 'instant' : 'smooth'})
            } else if (active !== lastFollowed) {
              if (pendingFollow?.element === active) pendingFollow.top = target
              else pendingFollow = {element: active, top: target}
            }
          } else pendingFollow = undefined
          lastFrame = now
          lastTime = time
          if (sample.playing || now < settleUntil) frame = requestAnimationFrame(draw)
        }
        const schedule = () => {
          if (disposed) return
          if (!sample.playing && sample.position === 0) player.resetPlayback()
          if (playbackPlaying !== sample.playing) {
            window.scrollTo({top: window.scrollY, left: window.scrollX, behavior: 'instant'})
            const time = lyricTime()
            const active = player.activeElement(time)
            const top = active?.getBoundingClientRect().top
            releaseScroll()
            scrollHold = active && top !== undefined ? {element: active, top} : undefined
            preserveFollow = true
          }
          playbackPlaying = sample.playing
          const playing = sample.playing && !document.hidden && visible
          if (playing !== playerPlaying) {
            playerPlaying = playing
            if (playing) player.resume()
            else player.pause()
          }
          settleUntil = performance.now() + 1200
          if (!frame && !document.hidden && visible) frame = requestAnimationFrame(draw)
        }
        updateLines = (value) => {
          if (disposed) return
          // Media duration updates may create a new array containing the same lines.
          if (appliedLines?.length === value.length && value.every((line, index) => line === appliedLines![index]))
            return
          try {
            player.setLyricLines(value, lyricTime())
            appliedLines = value
            lastTime = Number.NaN
            lastFollowed = undefined
            lastFollowedTop = undefined
            schedule()
          } catch {
            onfailure()
          }
        }
        wake = schedule
        const click = (event: Event) => {
          releaseScroll()
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
        const resize = new ResizeObserver(() => {
          spacingDirty = true
          schedule()
        })
        resize.observe(container)
        resize.observe(document.body)
        const manualScroll = () => {
          releaseScroll()
          followAfter = performance.now() + 5000
          lastFollowed = undefined
          lastFollowedTop = undefined
        }
        const scrollKey = (event: KeyboardEvent) => {
          if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) manualScroll()
        }
        const scrollbarPointer = (event: PointerEvent) => {
          if (event.target === document.documentElement) manualScroll()
        }
        const viewportResize = () => {
          releaseScroll()
          spacingDirty = true
          schedule()
        }
        window.addEventListener('wheel', manualScroll, {passive: true})
        window.addEventListener('touchmove', manualScroll, {passive: true})
        window.addEventListener('pointerdown', scrollbarPointer, {passive: true})
        window.addEventListener('resize', viewportResize)
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
          window.removeEventListener('pointerdown', scrollbarPointer)
          window.removeEventListener('resize', viewportResize)
          window.removeEventListener('keydown', scrollKey)
          document.removeEventListener('visibilitychange', schedule)
          reducedMotion.removeEventListener('change', motion)
          player.removeEventListener('line-click', click)
          player.dispose()
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
  /* The document scrolls, so anchors outside the player (e.g. the footer)
     must not compensate for the opening and closing interlude gap either. */
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
    mix-blend-mode: normal;
    height: auto;
    contain: none;
    overflow: visible;
    position: relative;
  }
  .lyric-player :global([data-bottom-line]) {
    display: none;
  }
  .lyric-player :global(.text-muted-foreground) {
    color: var(--muted-foreground);
    opacity: 1;
  }
  /* AMLL sizes the dots separately from their padding; the global reset uses border-box. */
  .lyric-player :global([class*='_interludeDots']) {
    box-sizing: content-box;
  }
  .lyric-player :global([class*='_lyricLine']) {
    content-visibility: visible;
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
