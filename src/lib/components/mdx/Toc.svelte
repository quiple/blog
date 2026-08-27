<script lang="ts">
  import {onMount} from 'svelte'
  import TextAlignStartIcon from '@lucide/svelte/icons/text-align-start'
  import {afterNavigate, pushState} from '$app/navigation'

  let {selector = 'article', title = '목차'} = $props<{selector?: string; title?: string}>()

  type Heading = {id: string; text: string; level: number}
  let headings = $state<Heading[]>([])
  let activeIds = $state<string[]>([])

  let tocContainer = $state<HTMLElement | null>(null)
  let shouldRender = $state(false)

  let isReady = $state(false)
  let pathD = $state('')
  let clipPath = $state('polygon(0px 0px, 100% 0px, 100% 0px, 0px 0px)')

  let headingPositions: {id: string; element: HTMLElement; layoutTop: number; layoutBottom: number}[] = []

  const updateHeadings = () => {
    if (!shouldRender) {
      headings = []
      return
    }

    const article = document.querySelector(selector)
    if (!article) {
      headings = []
      return
    }

    const elements = Array.from(
      article.querySelectorAll('h2:not(.toc-exclude):not(.sr-only), h3:not(.toc-exclude):not(.sr-only)'),
    ) as HTMLElement[]

    headings = elements.map((el, i) => {
      if (!el.id) {
        const safeId = el.innerText
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9가-힣-]/g, '')
          .replace(/^-+|-+$/g, '')
        el.id = safeId || `heading-${i}`
      }
      return {
        id: el.id,
        text: el.innerText,
        level: parseInt(el.tagName[1]),
      }
    })
  }

  onMount(() => {
    const media = window.matchMedia('(min-width: 1024px)')
    const update = () => {
      shouldRender = media.matches
      if (shouldRender) {
        queueMicrotask(updateHeadings)
      } else {
        headings = []
      }
    }

    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  })

  afterNavigate(() => {
    updateHeadings()
  })

  // Unified layout, scroll, and resize observer
  $effect(() => {
    if (headings.length === 0 || !tocContainer) return

    let scrollFrame = 0
    let pendingIds: string[] = []
    let stableFrames = 0

    const sameIds = (a: string[], b: string[]) => a.length === b.length && a.every((id, index) => id === b[index])

    const calculateLayout = () => {
      if (!tocContainer) return

      const liNodes = Array.from(tocContainer.querySelectorAll('li'))
      if (liNodes.length !== headings.length) return

      const containerRect = tocContainer.getBoundingClientRect()
      const minLevel = Math.min(...headings.map((h) => h.level))

      type LayoutItem = {top: number; bottom: number; centerY: number; x: number; id: string}
      const items: LayoutItem[] = []

      for (let i = 0; i < headings.length; i++) {
        const h = headings[i]
        const node = liNodes[i]
        if (!node) continue

        const rect = node.getBoundingClientRect()
        const top = rect.top - containerRect.top
        items.push({
          top,
          bottom: rect.bottom - containerRect.top,
          centerY: top + rect.height / 2,
          x: 1 + (h.level - minLevel) * 14,
          id: h.id,
        })
      }

      let d = ''
      const corner = 6
      if (items.length > 0) {
        d += `M ${items[0].x} ${items[0].top}`
        for (let i = 0; i < items.length - 1; i++) {
          const curr = items[i]
          const next = items[i + 1]
          if (curr.x !== next.x) {
            const midY = (curr.bottom + next.top) / 2
            d += ` L ${curr.x} ${midY - corner}`
            if (next.x > curr.x) {
              d += ` Q ${curr.x} ${midY} ${curr.x + corner} ${midY} L ${next.x - corner} ${midY} Q ${next.x} ${midY} ${next.x} ${midY + corner}`
            } else {
              d += ` Q ${curr.x} ${midY} ${curr.x - corner} ${midY} L ${next.x + corner} ${midY} Q ${next.x} ${midY} ${next.x} ${midY + corner}`
            }
          }
        }
        d += ` L ${items[items.length - 1].x} ${items[items.length - 1].bottom}`
      }
      pathD = d

      headingPositions = items.map((item) => ({
        id: item.id,
        element: document.getElementById(item.id) as HTMLElement,
        layoutTop: item.top,
        layoutBottom: item.bottom,
      }))
      onScroll()
    }

    const visibleIds = () => {
      const tops = headingPositions.map(({element}) => element.getBoundingClientRect().top)
      return headingPositions
        .filter((_, index) => tops[index] < window.innerHeight && (tops[index + 1] ?? Infinity) > 100)
        .map(({id}) => id)
    }

    const updateActiveIds = () => {
      const nextIds = visibleIds()
      if (sameIds(nextIds, pendingIds)) {
        stableFrames++
      } else {
        pendingIds = nextIds
        stableFrames = 1
      }

      if (stableFrames < 2) {
        scrollFrame = requestAnimationFrame(updateActiveIds)
        return
      }
      scrollFrame = 0

      if (!sameIds(nextIds, activeIds)) {
        activeIds = nextIds
        if (nextIds.length > 0) {
          const first = headingPositions.find(({id}) => id === nextIds[0])!
          const last = headingPositions.find(({id}) => id === nextIds.at(-1))!
          clipPath = `polygon(-10px ${first.layoutTop}px, 200% ${first.layoutTop}px, 200% ${last.layoutBottom}px, -10px ${last.layoutBottom}px)`
        } else {
          clipPath = 'polygon(-10px 0px, 200% 0px, 200% 0px, -10px 0px)'
        }
        if (!isReady) isReady = true
      }
    }

    const onScroll = () => {
      if (scrollFrame) return
      stableFrames = 0
      scrollFrame = requestAnimationFrame(updateActiveIds)
    }

    let resizeTimeout: ReturnType<typeof setTimeout>
    const debouncedLayout = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(calculateLayout, 100)
    }

    const timer = setTimeout(calculateLayout, 50)
    window.addEventListener('resize', debouncedLayout, {passive: true})
    window.addEventListener('scroll', onScroll, {passive: true})

    let resizeObserver: ResizeObserver | null = null
    const articleNode = document.querySelector(selector)
    if (articleNode) {
      resizeObserver = new ResizeObserver(() => {
        debouncedLayout()
      })
      resizeObserver.observe(articleNode)
    }

    return () => {
      if (scrollFrame) cancelAnimationFrame(scrollFrame)
      clearTimeout(timer)
      clearTimeout(resizeTimeout)
      window.removeEventListener('resize', debouncedLayout)
      window.removeEventListener('scroll', onScroll)
      if (resizeObserver) resizeObserver.disconnect()
    }
  })

  const minLevel = $derived(headings.length > 0 ? Math.min(...headings.map((h) => h.level)) : 2)
  const activeIdSet = $derived(new Set(activeIds))
</script>

{#if shouldRender && headings.length > 0}
  <div class="toc" style="top: var(--header-height, 4rem);">
    <div class="mb-4 flex flex-wrap items-center text-sm font-semibold text-muted-foreground">
      <TextAlignStartIcon class="mr-1.5 inline-block size-4" />
      {title}
    </div>
    <div class="relative" bind:this={tocContainer}>
      <!-- Background SVG Lines -->
      <svg class="pointer-events-none absolute top-0 left-0 h-full w-full" style="z-index: 0">
        <path
          d={pathD}
          fill="none"
          stroke="var(--border)"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d={pathD}
          fill="none"
          stroke="currentColor"
          class="text-orange-600 dark:text-orange-400 {isReady ? 'transition-all ease-out' : ''}"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          style:clip-path={clipPath}
        />
      </svg>

      <ul class="relative z-10 m-0 flex w-full list-none flex-col p-0 text-sm 2xl:text-base">
        {#each headings as heading}
          <li class="relative m-0 w-full p-0">
            <a
              href="#{heading.id}"
              class="block py-1.5 no-underline transition-colors
                {heading.level - minLevel === 0 ? 'pl-4' : ''}
                {heading.level - minLevel === 1 ? 'pl-8' : ''}
                {heading.level - minLevel === 2 ? 'pl-12' : ''}
                {activeIdSet.has(heading.id)
                ? 'text-orange-600 hover:text-foreground dark:text-orange-400 dark:hover:text-foreground'
                : 'text-muted-foreground hover:text-foreground'}"
              onclick={(e) => {
                e.preventDefault()
                const target = document.getElementById(heading.id)
                if (target) {
                  pushState(`#${heading.id}`, {})
                  target.scrollIntoView({behavior: 'smooth'})
                }
              }}
            >
              {heading.text}
            </a>
          </li>
        {/each}
      </ul>
    </div>
  </div>
{/if}

<style>
  @reference '#app.css';
  .toc {
    @apply sticky mt-5 hidden pt-2 font-medium text-pretty break-keep lg:block noscript:hidden;
  }
</style>
