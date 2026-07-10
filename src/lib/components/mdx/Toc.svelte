<script lang="ts">
  import {onMount} from 'svelte'
  import {TextAlignStart} from '@lucide/svelte'
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

  // Optimize scroll by avoiding layout reads and proxies
  let headingPositions: {id: string; top: number; layoutTop: number; layoutBottom: number}[] = []

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
    let documentHeight = document.documentElement.scrollHeight

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

      const windowScrollY = window.scrollY
      headingPositions = items.map((item) => {
        const el = document.getElementById(item.id)
        return {
          id: item.id,
          top: el ? el.getBoundingClientRect().top + windowScrollY : 0,
          layoutTop: item.top,
          layoutBottom: item.bottom,
        }
      })
      documentHeight = document.documentElement.scrollHeight
      onScroll()
    }

    const _nextActiveIds: string[] = []

    const onScroll = () => {
      if (scrollFrame) return

      scrollFrame = requestAnimationFrame(() => {
        const y = window.scrollY
        const innerHeight = window.innerHeight
        const topViewport = y + 100
        const bottomViewport = y + innerHeight

        _nextActiveIds.length = 0
        for (let i = 0; i < headingPositions.length; i++) {
          const curr = headingPositions[i]
          const next = headingPositions[i + 1]

          const top = curr.top
          const bottom = next ? next.top : documentHeight

          if (top < bottomViewport && bottom > topViewport) {
            _nextActiveIds.push(curr.id)
          }
        }

        let isChanged = _nextActiveIds.length !== activeIds.length
        if (!isChanged) {
          for (let i = 0; i < _nextActiveIds.length; i++) {
            if (_nextActiveIds[i] !== activeIds[i]) {
              isChanged = true
              break
            }
          }
        }

        if (isChanged) {
          activeIds = [..._nextActiveIds]
          if (_nextActiveIds.length > 0) {
            const first = headingPositions.find((x) => x.id === _nextActiveIds[0])
            const last = headingPositions.find((x) => x.id === _nextActiveIds[_nextActiveIds.length - 1])
            if (first && last) {
              clipPath = `polygon(-10px ${first.layoutTop}px, 200% ${first.layoutTop}px, 200% ${last.layoutBottom}px, -10px ${last.layoutBottom}px)`
            }
          } else {
            clipPath = `polygon(-10px 0px, 200% 0px, 200% 0px, -10px 0px)`
          }
          if (!isReady) isReady = true
        }
        scrollFrame = 0
      })
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
      <TextAlignStart class="mr-1.5 inline-block size-4" />
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
          class="text-blue-700 dark:text-blue-300 {isReady ? 'transition-all ease-out' : ''}"
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
                ? 'text-blue-700 hover:text-foreground dark:text-blue-300 dark:hover:text-foreground'
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

<style lang="sass">
  @reference '#app.css'

  .toc
    @apply hidden lg:block noscript:hidden font-medium text-pretty break-keep sticky pt-2 mt-5
</style>
