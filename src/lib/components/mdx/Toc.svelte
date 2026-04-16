<script lang="ts">
  import {onMount, tick} from 'svelte'

  let {selector = 'article', title = '목차'} = $props<{selector?: string; title?: string}>()

  type Heading = {id: string; text: string; level: number}

  let headings = $state<Heading[]>([])
  let activeIds = $state<string[]>([])

  let tocContainer = $state<HTMLElement | null>(null)

  let isReady = $state(false)
  let pathD = $state('')
  let clipPath = $state('polygon(0px 0px, 100% 0px, 100% 0px, 0px 0px)')

  onMount(() => {
    const updateHeadings = () => {
      const article = document.querySelector(selector)
      if (!article) return

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

    updateHeadings()

    tick().then(updateHeadings)
  })

  $effect(() => {
    if (headings.length === 0) return

    const onScroll = () => {
      const newActiveIds: string[] = []
      const offset = 100
      const innerHeight = window.innerHeight

      for (let i = 0; i < headings.length; i++) {
        const h = headings[i]
        const nextH = headings[i + 1]

        const el = document.getElementById(h.id)
        const nextEl = nextH ? document.getElementById(nextH.id) : null

        if (!el) {
          // Fallback if ID doesn't exist or isn't placed yet
          continue
        }

        const top = el.getBoundingClientRect().top
        const bottom = nextEl ? nextEl.getBoundingClientRect().top : innerHeight + 1000

        if (top < innerHeight && bottom > offset) {
          newActiveIds.push(h.id)
        }
      }
      activeIds = newActiveIds
    }

    window.addEventListener('scroll', onScroll, {passive: true})
    window.addEventListener('resize', onScroll)
    onScroll()

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  })

  type LayoutItem = {top: number; bottom: number; height: number; centerY: number; x: number; id: string}
  let layoutItems = $state<LayoutItem[]>([])

  $effect(() => {
    if (headings.length === 0 || !tocContainer) return

    const calculateLayout = () => {
      if (!tocContainer) return

      const liNodes = Array.from(tocContainer.querySelectorAll('li'))
      if (liNodes.length !== headings.length) return

      const containerRect = tocContainer.getBoundingClientRect()
      const minLevel = Math.min(...headings.map((h) => h.level))

      layoutItems = headings
        .map((h, i) => {
          const node = liNodes[i]
          if (!node) return null

          const rect = node.getBoundingClientRect()
          const top = rect.top - containerRect.top
          const bottom = rect.bottom - containerRect.top
          const height = rect.height
          const centerY = top + height / 2

          const normalizedLevel = h.level - minLevel
          const x = 1 + normalizedLevel * 14

          return {top, bottom, height, centerY, x, id: h.id}
        })
        .filter((x) => x !== null) as LayoutItem[]

      let d = ''
      const corner = 6

      if (layoutItems.length > 0) {
        d += `M ${layoutItems[0].x} ${layoutItems[0].top}`

        for (let i = 0; i < layoutItems.length - 1; i++) {
          const curr = layoutItems[i]
          const next = layoutItems[i + 1]

          if (curr.x !== next.x) {
            const midY = (curr.bottom + next.top) / 2

            d += ` L ${curr.x} ${midY - corner}`

            if (next.x > curr.x) {
              d += ` Q ${curr.x} ${midY} ${curr.x + corner} ${midY}`
              d += ` L ${next.x - corner} ${midY}`
              d += ` Q ${next.x} ${midY} ${next.x} ${midY + corner}`
            } else {
              d += ` Q ${curr.x} ${midY} ${curr.x - corner} ${midY}`
              d += ` L ${next.x + corner} ${midY}`
              d += ` Q ${next.x} ${midY} ${next.x} ${midY + corner}`
            }
          }
        }
        const last = layoutItems[layoutItems.length - 1]
        d += ` L ${last.x} ${last.bottom}`
      }
      pathD = d
    }

    // Trigger layout calc after initial DOM flush
    setTimeout(() => {
      calculateLayout()
      window.addEventListener('resize', calculateLayout)
    }, 50)

    return () => {
      window.removeEventListener('resize', calculateLayout)
    }
  })

  $effect(() => {
    const currentActiveIds = activeIds
    const currentLayoutItems = layoutItems

    if (currentLayoutItems.length === 0) return

    if (currentActiveIds.length > 0) {
      const firstActiveIdx = currentLayoutItems.findIndex((item) => item.id === currentActiveIds[0])
      const lastActiveIdx = currentLayoutItems.findIndex(
        (item) => item.id === currentActiveIds[currentActiveIds.length - 1],
      )

      if (firstActiveIdx !== -1 && lastActiveIdx !== -1) {
        const startY = currentLayoutItems[firstActiveIdx].top
        const endY = currentLayoutItems[lastActiveIdx].bottom
        clipPath = `polygon(-10px ${startY}px, 200% ${startY}px, 200% ${endY}px, -10px ${endY}px)`
      } else {
        clipPath = `polygon(-10px 0px, 200% 0px, 200% 0px, -10px 0px)`
      }
    } else {
      clipPath = `polygon(-10px 0px, 200% 0px, 200% 0px, -10px 0px)`
    }

    if (!isReady) {
      setTimeout(() => (isReady = true), 50)
    }
  })

  const minLevel = $derived(headings.length > 0 ? Math.min(...headings.map((h) => h.level)) : 2)
</script>

{#if headings.length > 0}
  <div class="toc-wrapper sticky pt-2 mt-5" style="top: var(--header-height, 4rem);">
    <div class="text-sm font-semibold mb-4 text-muted-foreground">{title}</div>
    <div class="relative" bind:this={tocContainer}>
      <!-- Background SVG Lines -->
      <svg class="absolute left-0 top-0 w-full h-full pointer-events-none" style="z-index: 0">
        <path
          d={pathD}
          fill="none"
          stroke="hsl(var(--border))"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d={pathD}
          fill="none"
          stroke="currentColor"
          class="text-blue-700 dark:text-blue-300 {isReady ? 'transition-all duration-300 ease-out' : ''}"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          style:clip-path={clipPath}
        />
      </svg>

      <ul class="flex flex-col m-0 p-0 list-none text-sm relative z-10 w-full">
        {#each headings as heading}
          <li class="m-0 p-0 relative w-full">
            <a
              href="#{heading.id}"
              class="block py-1.5 transition-colors no-underline
                {heading.level - minLevel === 0 ? 'pl-4' : ''}
                {heading.level - minLevel === 1 ? 'pl-8' : ''}
                {heading.level - minLevel === 2 ? 'pl-12' : ''}
                {activeIds.includes(heading.id)
                ? 'text-blue-700 hover:text-foreground'
                : 'text-muted-foreground hover:text-foreground'}"
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

  li
    @apply font-medium
</style>
