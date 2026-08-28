<script lang="ts">
  import TextAlignStartIcon from '@lucide/svelte/icons/text-align-start'
  import {afterNavigate, pushState} from '$app/navigation'
  import {onMount} from 'svelte'

  let {selector = 'article', title = '목차'} = $props<{selector?: string; title?: string}>()

  type Heading = {
    id: string
    text: string
    level: number
    element: HTMLElement
  }

  type RailItem = {
    id: string
    x: number
    top: number
    bottom: number
  }

  type RailStop = {
    start: number
    end: number
  }

  const VIEWPORT_TOP = 100
  const RAIL_X = 2
  const LEVEL_OFFSET = 14
  const RAIL_INSET = 6
  const ITEM_PADDING = 20

  let enabled = $state(false)
  let headings = $state<Heading[]>([])
  let activeIds = $state<string[]>([])
  let railItems = $state<RailItem[]>([])
  let railPath = $state('')
  let railLength = $state(0)
  let railStops = $state<Record<string, RailStop>>({})
  let railElement = $state<SVGPathElement | null>(null)
  let tocList = $state<HTMLUListElement | null>(null)

  const sameHeadings = (next: Heading[]) =>
    next.length === headings.length &&
    next.every(
      (heading, index) =>
        heading.element === headings[index]?.element &&
        heading.id === headings[index]?.id &&
        heading.text === headings[index]?.text &&
        heading.level === headings[index]?.level,
    )

  const ensureId = (element: HTMLElement, index: number, usedIds: Set<string>) => {
    let id = element.id
    if (!id) {
      const base =
        element.innerText
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9가-힣-]/g, '')
          .replace(/^-+|-+$/g, '') || `heading-${index + 1}`

      id = base
      let suffix = 2
      while (usedIds.has(id) || (document.getElementById(id) && document.getElementById(id) !== element)) {
        id = `${base}-${suffix++}`
      }
      element.id = id
    }
    usedIds.add(id)
    return id
  }

  const collectHeadings = () => {
    if (!enabled) {
      headings = []
      return
    }

    const root = document.querySelector(selector)
    if (!root) {
      headings = []
      return
    }

    const usedIds = new Set<string>()
    const elements = Array.from(
      root.querySelectorAll('h2:not(.toc-exclude):not(.sr-only), h3:not(.toc-exclude):not(.sr-only)'),
    ) as HTMLElement[]
    const next = elements.map((element, index) => ({
      id: ensureId(element, index, usedIds),
      text: element.innerText.trim(),
      level: Number(element.tagName.slice(1)),
      element,
    }))

    if (!sameHeadings(next)) headings = next
  }

  onMount(() => {
    const media = window.matchMedia('(min-width: 1024px)')
    const update = () => {
      enabled = media.matches
      queueMicrotask(collectHeadings)
    }

    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  })

  afterNavigate(() => {
    queueMicrotask(collectHeadings)
  })

  $effect(() => {
    const list = tocList
    const currentHeadings = headings
    const root = document.querySelector(selector)
    if (!enabled || !list || !root || currentHeadings.length === 0) return

    let activeFrame = 0
    let layoutFrame = 0
    let prepareVersion = 0
    let ready = false
    let disposed = false
    let headingTops: number[] = []

    activeIds = []
    railItems = []
    railPath = ''

    const sameIds = (next: string[]) =>
      next.length === activeIds.length && next.every((id, index) => id === activeIds[index])

    const hasPendingComponents = () =>
      (Array.from(root.querySelectorAll('[data-mdx-component]')) as HTMLElement[]).some(
        (placeholder) => !placeholder.hasChildNodes(),
      )

    const updateActive = () => {
      activeFrame = 0
      if (!ready || headingTops.length !== currentHeadings.length) return

      const viewportTop = window.scrollY + VIEWPORT_TOP
      const viewportBottom = window.scrollY + window.innerHeight
      const next: string[] = []
      for (let index = 0; index < currentHeadings.length; index++) {
        if (headingTops[index] < viewportBottom && (headingTops[index + 1] ?? Infinity) > viewportTop) {
          next.push(currentHeadings[index].id)
        }
      }

      if (!sameIds(next)) activeIds = next
    }

    const scheduleActive = () => {
      if (!activeFrame) activeFrame = requestAnimationFrame(updateActive)
    }

    const measureRail = () => {
      layoutFrame = 0
      const rows = Array.from(list.querySelectorAll<HTMLElement>('li[data-toc-id]'))
      if (rows.length !== currentHeadings.length) return

      const listRect = list.getBoundingClientRect()
      const minLevel = Math.min(...currentHeadings.map(({level}) => level))
      headingTops = currentHeadings.map(({element}) => element.getBoundingClientRect().top + window.scrollY)
      const nextItems = rows.map((row, index) => {
        const rect = row.getBoundingClientRect()
        return {
          id: currentHeadings[index].id,
          x: RAIL_X + (currentHeadings[index].level - minLevel) * LEVEL_OFFSET,
          top: rect.top - listRect.top + RAIL_INSET,
          bottom: rect.bottom - listRect.top - RAIL_INSET,
        }
      })

      let path = ''
      const first = nextItems[0]
      if (first) {
        path = `M ${first.x} ${first.top} L ${first.x} ${first.bottom}`
        for (let index = 1; index < nextItems.length; index++) {
          const previous = nextItems[index - 1]
          const current = nextItems[index]

          if (previous.x === current.x) {
            path += ` L ${current.x} ${current.bottom}`
          } else {
            const middle = (previous.bottom + current.top) / 2
            path += ` C ${previous.x} ${middle}, ${current.x} ${middle}, ${current.x} ${current.top}`
            path += ` L ${current.x} ${current.bottom}`
          }
        }
      }

      railItems = nextItems
      railPath = path
      scheduleActive()
    }

    const scheduleLayout = () => {
      if (!layoutFrame) layoutFrame = requestAnimationFrame(measureRail)
    }

    const prepare = async () => {
      const version = ++prepareVersion
      if (hasPendingComponents()) {
        ready = false
        activeIds = []
        return
      }

      await document.fonts.ready
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
      if (disposed || version !== prepareVersion || hasPendingComponents()) return

      ready = true
      scheduleLayout()
      mutationObserver.disconnect()
    }

    const mutationObserver = new MutationObserver(() => {
      if (hasPendingComponents()) {
        prepareVersion++
        ready = false
        activeIds = []
      } else if (ready) {
        scheduleLayout()
      } else {
        void prepare()
      }
    })
    mutationObserver.observe(root, {subtree: true, childList: true})

    const resizeObserver = new ResizeObserver(scheduleLayout)
    resizeObserver.observe(root)
    resizeObserver.observe(list)

    window.addEventListener('scroll', scheduleActive, {passive: true})
    window.addEventListener('resize', scheduleLayout, {passive: true})
    document.fonts.addEventListener('loadingdone', scheduleLayout)
    void prepare()

    return () => {
      disposed = true
      prepareVersion++
      if (activeFrame) cancelAnimationFrame(activeFrame)
      if (layoutFrame) cancelAnimationFrame(layoutFrame)
      mutationObserver.disconnect()
      resizeObserver.disconnect()
      window.removeEventListener('scroll', scheduleActive)
      window.removeEventListener('resize', scheduleLayout)
      document.fonts.removeEventListener('loadingdone', scheduleLayout)
    }
  })

  $effect(() => {
    const path = railElement
    const pathData = railPath
    const items = railItems
    if (!path || !pathData || items.length === 0) {
      railLength = 0
      railStops = {}
      return
    }

    const frame = requestAnimationFrame(() => {
      const length = path.getTotalLength()
      const distanceAtY = (targetY: number) => {
        let start = 0
        let end = length

        for (let index = 0; index < 24; index++) {
          const middle = (start + end) / 2
          if (path.getPointAtLength(middle).y < targetY) start = middle
          else end = middle
        }

        return (start + end) / 2
      }

      railLength = length
      railStops = Object.fromEntries(
        items.map((item) => [
          item.id,
          {
            start: distanceAtY(item.top),
            end: distanceAtY(item.bottom),
          },
        ]),
      )
    })

    return () => cancelAnimationFrame(frame)
  })

  const minLevel = $derived(headings.length ? Math.min(...headings.map(({level}) => level)) : 2)
  const activeIdSet = $derived(new Set(activeIds))
  const activeRange = $derived.by(() => {
    const first = railStops[activeIds[0]]
    const last = railStops[activeIds.at(-1) ?? '']
    if (!first || !last) return {start: 0, length: 0}

    return {
      start: first.start,
      length: Math.max(0, last.end - first.start),
    }
  })
</script>

{#if enabled && headings.length}
  <nav class="toc" style="top: var(--header-height, 4rem);" aria-label={title}>
    <div class="mb-4 flex flex-wrap items-center text-sm font-semibold text-muted-foreground">
      <TextAlignStartIcon class="mr-1.5 inline-block size-4" />
      {title}
    </div>

    <div class="relative">
      <svg class="pointer-events-none absolute inset-0 size-full overflow-visible" aria-hidden="true">
        <path
          bind:this={railElement}
          d={railPath}
          fill="none"
          stroke="var(--border)"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          vector-effect="non-scaling-stroke"
        />

        <path
          d={railPath}
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          vector-effect="non-scaling-stroke"
          class="active-rail text-primary"
          style={`stroke-dasharray: ${activeRange.length} ${Math.max(railLength, 1)}; stroke-dashoffset: ${-activeRange.start}; opacity: ${activeRange.length ? 1 : 0};`}
        />
      </svg>

      <ul bind:this={tocList} class="relative m-0 flex w-full list-none flex-col p-0 text-sm 2xl:text-base">
        {#each headings as heading}
          <li data-toc-id={heading.id} class="relative m-0 w-full p-0">
            <a
              href="#{heading.id}"
              style={`padding-inline-start: ${ITEM_PADDING + (heading.level - minLevel) * LEVEL_OFFSET}px`}
              class={[
                'block py-1 no-underline transition-colors',
                activeIdSet.has(heading.id)
                  ? 'text-primary hover:text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              ]}
              onclick={(event) => {
                event.preventDefault()
                const target = document.getElementById(heading.id)
                if (!target) return

                pushState(`#${heading.id}`, {})
                target.scrollIntoView({behavior: 'smooth'})
              }}
            >
              {heading.text}
            </a>
          </li>
        {/each}
      </ul>
    </div>
  </nav>
{/if}

<style>
  @reference '#app.css';
  .toc {
    @apply sticky mt-5 hidden pt-2 font-medium text-pretty break-keep lg:block noscript:hidden;
  }

  .active-rail {
    transition:
      stroke-dasharray 220ms cubic-bezier(0.2, 0, 0, 1),
      stroke-dashoffset 220ms cubic-bezier(0.2, 0, 0, 1),
      opacity 120ms linear;
  }

  @media (prefers-reduced-motion: reduce) {
    .active-rail {
      transition: none;
    }
  }
</style>
