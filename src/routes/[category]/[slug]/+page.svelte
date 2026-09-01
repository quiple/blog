<script lang="ts">
  import {onMount} from 'svelte'
  import GitHubDownloadButton from '$lib/components/github-download-button.svelte'
  import LazyGiscus from '$lib/components/lazy-giscus.svelte'
  import MdxContent from '$lib/components/mdx/MdxContent.svelte'
  import {Badge} from '$lib/components/ui/badge/index.js'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'

  import {absoluteUrl, jsonLd as stringifyJsonLd, SITE_AUTHOR, SITE_NAME, toKstDateTime} from '$lib/seo'
  import {astrPreviewTextPools} from '$lib/astr-preview-texts'
  import {getCategoryName, getImageUrl} from '$lib/utils'
  import {mode} from 'mode-watcher'
  import type {Action} from 'svelte/action'
  import type {PageProps} from './$types'
  import 'remark-github-alerts/styles/github-colors-light.css'
  import 'remark-github-alerts/styles/github-colors-dark-class.css'
  import 'remark-github-alerts/styles/github-base.css'
  import Toc from '$lib/components/mdx/Toc.svelte'
  import {setupViewTransition} from '$lib/view-transition'

  let {data}: PageProps = $props()

  const {transition} = setupViewTransition()
  const isContainTwitter = $derived(data.contentHtml.search(/\btwitter-tweet\b/g) !== -1)
  const isArticle = $derived(data.category === 'article')
  const isFont = $derived(data.category === 'font')
  const isAstr = $derived(data.category === 'font' && data.slug === 'astr')
  const isPixelImage = $derived(data.imageType === 'pixel')

  const imageMobile = $derived(data.image ? getImageUrl(data.image, isPixelImage ? {original: true} : {w: 1280}) : '')
  const imageDesktop = $derived(data.image ? getImageUrl(data.image, isPixelImage ? {original: true} : {w: 2560}) : '')
  const image4K = $derived(data.image ? getImageUrl(data.image, isPixelImage ? {original: true} : {w: 3840}) : '')
  const heroSrcset = $derived(
    isPixelImage ? undefined : `${imageMobile} 1280w, ${imageDesktop} 2560w, ${image4K} 3840w`,
  )
  const thumbnail1x = $derived(data.image ? getImageUrl(data.image, isPixelImage ? {original: true} : {h: 88}) : '')
  const thumbnail2x = $derived(data.image ? getImageUrl(data.image, isPixelImage ? {original: true} : {h: 176}) : '')
  const hasHero = $derived(Boolean(imageMobile) || isAstr)
  const heroForeground = $derived(isAstr ? '#fff' : `#${data.imageForeground?.toString() ?? '09090b'}`)
  const outlineColor = $derived(data.outline ? `#${data.outline.toString()}` : undefined)
  const categoryBadgeStyle = $derived(
    outlineColor ? `background-color: ${outlineColor}; color: ${heroForeground};` : undefined,
  )

  const astrPreviewGroups = [
    {selector: '.astr-preview-big', texts: astrPreviewTextPools.big},
    {selector: '.astr-preview-mid', texts: astrPreviewTextPools.mid},
  ] as const

  function shuffle<T>(items: readonly T[]) {
    const shuffled = [...items]
    for (let index = shuffled.length - 1; index > 0; index--) {
      const swapIndex = Math.floor(Math.random() * (index + 1))
      ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
    }
    return shuffled
  }

  const randomizeAstrPreviews: Action<HTMLElement, boolean> = (node, enabled) => {
    let active = enabled
    let frame = 0

    const schedule = () => {
      if (frame) cancelAnimationFrame(frame)
      if (!active) return

      frame = requestAnimationFrame(() => {
        frame = 0
        for (const {selector, texts} of astrPreviewGroups) {
          const elements = [...node.querySelectorAll<HTMLElement>(selector)]
          if (!elements.length || texts.length < elements.length || new Set(texts).size !== texts.length) continue

          const next = shuffle(texts).slice(0, elements.length)
          elements.forEach((element, index) => (element.textContent = next[index]))
        }
      })
    }

    schedule()
    return {
      update(nextEnabled) {
        active = nextEnabled
        schedule()
      },
      destroy() {
        if (frame) cancelAnimationFrame(frame)
      },
    }
  }

  const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  const manageHeroParallax: Action<HTMLElement> = (node) => {
    const desktop = window.matchMedia('(min-width: 768px)')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const navigatorInfo = navigator as Navigator & {deviceMemory?: number; hardwareConcurrency?: number}
    const lowPowerDevice =
      (navigatorInfo.deviceMemory !== undefined && navigatorInfo.deviceMemory <= 2) ||
      (navigatorInfo.hardwareConcurrency !== undefined && navigatorInfo.hardwareConcurrency <= 2)
    let observer: IntersectionObserver | undefined

    const setActive = (active: boolean) => node.classList.toggle('parallax-active', active)
    const update = () => {
      observer?.disconnect()
      observer = undefined
      setActive(false)

      if (!desktop.matches || reducedMotion.matches || lowPowerDevice) return
      if (!('IntersectionObserver' in window)) {
        setActive(true)
        return
      }

      observer = new IntersectionObserver(([entry]) => setActive(Boolean(entry?.isIntersecting)), {
        rootMargin: '100% 0px',
      })
      observer.observe(node)
    }

    update()
    desktop.addEventListener('change', update)
    reducedMotion.addEventListener('change', update)

    return {
      destroy() {
        observer?.disconnect()
        desktop.removeEventListener('change', update)
        reducedMotion.removeEventListener('change', update)
        setActive(false)
      },
    }
  }

  const revealImage: Action<HTMLImageElement, boolean> = (node, animate) => {
    let cancelled = false
    const releaseLayer = () => node.style.removeProperty('will-change')

    const reveal = async () => {
      if (!animate) {
        node.classList.replace('opacity-0', 'opacity-100')
        return
      }

      const viewTransition = document.activeViewTransition
      try {
        try {
          await node.decode()
        } catch {
          if (!node.complete || node.naturalWidth === 0) return
        }
        await viewTransition?.finished.catch(() => {})
        if (cancelled) return

        node.style.willChange = 'opacity'
        await nextFrame()
        await nextFrame()
        if (cancelled) return

        node.classList.replace('opacity-0', 'opacity-100')

        await nextFrame()
        await Promise.allSettled(node.getAnimations().map((animation) => animation.finished))
      } finally {
        releaseLayer()
      }
    }
    void reveal()

    return {
      destroy() {
        cancelled = true
        releaseLayer()
      },
    }
  }
  const ogImageUrl = $derived(absoluteUrl(`/api/og/${data.category}/${data.slug}.png`))
  const articleImageUrl = $derived(imageDesktop ? absoluteUrl(imageDesktop) : ogImageUrl)
  const publishedDate = $derived(data.origDate ?? data.pubDate)
  const publishedDateIso = $derived(toKstDateTime(publishedDate) ?? toKstDateTime(data.pubDate))
  const modifiedDateIso = $derived(toKstDateTime(data.pubDate))
  const publishedDateObj = $derived(
    typeof publishedDate === 'object' ? (publishedDate as Date) : new Date(`${publishedDate}+09:00`),
  )

  const formattedDate = $derived(new Intl.DateTimeFormat('ko-KR', {dateStyle: 'long'}).format(publishedDateObj))
  const formattedDateTime = $derived(
    new Intl.DateTimeFormat('ko-KR', {dateStyle: 'long', timeStyle: 'short'}).format(publishedDateObj),
  )
  const jsonLd = $derived(
    stringifyJsonLd({
      '@context': 'https://schema.org',
      '@type': isFont ? 'TechArticle' : isArticle ? 'Article' : 'BlogPosting',
      '@id': `${data.canonicalURL}#article`,
      mainEntityOfPage: data.canonicalURL,
      url: data.canonicalURL,
      headline: data.title,
      description: data.description,
      inLanguage: 'ko-KR',
      datePublished: publishedDateIso,
      dateModified: modifiedDateIso,
      image: [articleImageUrl],
      author: data.authorURL
        ? {
            '@type': 'Person',
            name: data.author,
            url: data.authorURL,
          }
        : {
            '@type': 'Person',
            name: data.author ?? SITE_AUTHOR,
          },
      publisher: data.media
        ? {
            '@type': 'Organization',
            name: data.media,
            ...(data.source ? {url: `${new URL(data.source).protocol}//${new URL(data.source).hostname}`} : {}),
          }
        : {
            '@type': 'Organization',
            name: SITE_NAME,
            url: absoluteUrl('/'),
          },
      isPartOf: {
        '@type': 'Blog',
        name: SITE_NAME,
        url: absoluteUrl('/'),
      },
      ...(data.tags?.length ? {keywords: data.tags.join(', ')} : {}),
    }),
  )

  const jsonLdScript = $derived(`<script type="application/ld+json">${jsonLd}</sc` + `ript>`)
  const viewTransitionStyle = $derived(`
    <style>
      ::view-transition-group(post-title-${data.slug}),
      ::view-transition-group(post-metadata-${data.slug}) {
        z-index: 10;
      }
      ::view-transition-group(post-category-${data.slug}) {
        z-index: 20;
      }
      ::view-transition-old(post-image-${data.slug}) {
        --zoom-in-opacity: 1;
        animation-name: zoom-in;
      }
      ::view-transition-new(post-image-${data.slug}) {
        --zoom-in-opacity: 0;
        animation-name: zoom-in;
      }
    </style>
  `)

  onMount(() => {
    let cleanupImages: (() => void) | undefined

    if (isContainTwitter) {
      const tweets = document.querySelectorAll('.twitter-tweet')

      for (let i = 0; i < tweets.length; i++) {
        ;(tweets[i] as HTMLElement).dataset.theme = mode.current
      }
    }

    const article = document.querySelector('article')
    if (article) {
      const markImageLoaded = (image: HTMLImageElement) => {
        image.classList.remove('opacity-0')
        image.classList.add('opacity-100')
        image.closest('.mdx-image-frame')?.classList.remove('bg-muted', 'animate-pulse')
      }
      const handleImageLoad = (event: Event) => {
        if (event.target instanceof HTMLImageElement) {
          markImageLoaded(event.target)
        }
      }

      article.addEventListener('load', handleImageLoad, true)
      article.querySelectorAll<HTMLImageElement>('.mdx-image-frame img').forEach((image) => {
        if (image.complete && image.naturalWidth > 0) markImageLoaded(image)
      })
      cleanupImages = () => article.removeEventListener('load', handleImageLoad, true)
    }

    return () => {
      cleanupImages?.()
    }
  })
</script>

<svelte:head>
  <title>{data.title} – quiple</title>
  <meta name="description" content={data.description} />

  <meta property="og:type" content="article" />
  <meta property="og:url" content={data.canonicalURL} />
  <meta property="og:title" content={data.title} />
  <meta property="og:description" content={data.description} />
  <meta property="og:locale" content="ko_KR" />
  <meta name="twitter:title" content={data.title} />
  <meta name="twitter:description" content={data.description} />
  <meta property="og:image" content={ogImageUrl} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:url" content={data.canonicalURL} />
  <meta name="twitter:image" content={ogImageUrl} />
  <meta name="twitter:card" content="summary_large_image" />
  <meta property="article:published_time" content={publishedDateIso} />
  <meta property="article:modified_time" content={modifiedDateIso} />
  <meta property="article:section" content={getCategoryName(data.category)} />
  {#each data.tags ?? [] as tag}
    <meta property="article:tag" content={tag} />
  {/each}
  {#if data.author}
    <meta property="article:author" content={data.author} />
  {/if}

  <link rel="canonical" href={data.canonicalURL} />
  <link rel="alternate" type="text/markdown" href={`${data.canonicalURL}.md`} />
  {@html jsonLdScript}
  {@html viewTransitionStyle}
</svelte:head>

{#snippet metadata(isOutline: boolean = false)}
  <div class="metadata">
    <span class="-ml-px inline-flex shrink-0" use:transition={`post-category-${data.slug}`}>
      <Badge href={`/${data.category}`} class="no-underline!" variant="secondary" style={categoryBadgeStyle}
        >{getCategoryName(data.category)}</Badge
      >
    </span>
    <span
      class="metadata-content"
      style={isOutline
        ? `--content: '${data.media ? `${data.media} · ` : ''}${data.author ? `${data.author} · ` : ''}${formattedDate}'`
        : null}
      use:transition={`post-metadata-${data.slug}`}
    >
      {#if data.media}
        <a target="_blank" rel="nofollow noreferrer noopener" href={data.source}>
          {data.media}
        </a>&#8194;&middot;&#8194;
      {/if}{#if data.author}
        <a target="_blank" rel="nofollow noreferrer noopener" href={data.authorURL}
          >{data.author}
        </a>&#8194;&middot;&#8194;
      {/if}{#if typeof publishedDate === 'object'}
        <time datetime={(publishedDate as Date).toISOString().split('T')[0]}>
          {formattedDate}
        </time>
      {:else}
        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger>
              {#snippet child({props: {type, ...props}})}
                <time {...props} class="cursor-default" datetime={`${publishedDate}+09:00`}>{formattedDate}</time>
              {/snippet}
            </Tooltip.Trigger>
            <Tooltip.Content>{formattedDateTime}</Tooltip.Content>
          </Tooltip.Root>
        </Tooltip.Provider>
      {/if}
    </span>
  </div>
{/snippet}

{#if hasHero}
  <div class={['hero bg', isAstr && 'astr']} use:transition={`post-image-${data.slug}`}>
    {#if imageMobile}
      <div class="hero-image-inner" use:manageHeroParallax>
        {#if !isPixelImage}
          <img
            class="hero-image-fallback"
            src={thumbnail1x}
            srcset={`${thumbnail1x} 1x, ${thumbnail2x} 2x`}
            alt=""
            aria-hidden="true"
            loading="eager"
            decoding="async"
            draggable="false"
            style:object-position={`center ${data.imageVerticalAlign ?? 50}%`}
          />
        {/if}
        {#key data.slug}
          <img
            class="hero-image-full opacity-0 transition-opacity"
            class:pixel-image={isPixelImage}
            src={imageDesktop}
            srcset={heroSrcset}
            sizes={heroSrcset ? '100vw' : undefined}
            alt=""
            aria-hidden="true"
            loading="eager"
            decoding="async"
            fetchpriority="high"
            draggable="false"
            style:object-position={`center ${data.imageVerticalAlign ?? 50}%`}
            use:revealImage={!isPixelImage}
          />
        {/key}
      </div>
    {/if}
  </div>
  <div
    class={['hero title', data.outline && 'line']}
    style:--hero-foreground={heroForeground}
    style:--outline-color={outlineColor}
  >
    <div>
      {#if isAstr}
        <h1 class="astr-title mb-3!" aria-label={data.title} use:transition={`post-title-${data.slug}`}>
          {#each Array.from(data.title) as character, index}
            <span aria-hidden="true" style:--astr-letter-index={index}>{character}</span>
          {/each}
        </h1>
      {:else}
        <h1 class="mb-3!" use:transition={`post-title-${data.slug}`} style={`--content: '${data.title}'`}>
          {data.title}
        </h1>
      {/if}
      {@render metadata(Boolean(data.outline))}
    </div>
  </div>
{/if}

<section class="flex lg:gap-6 xl:gap-12 2xl:gap-18">
  <div class="flex-1"></div>
  <article use:randomizeAstrPreviews={isAstr}>
    {#if !hasHero}
      <h1 class="mb-3!" use:transition={`post-title-${data.slug}`}>{data.title}</h1>
      {@render metadata()}
    {/if}

    {#if data.downloadURL}
      <div class="not-prose my-5 sm:my-6 lg:hidden">
        <GitHubDownloadButton href={data.downloadURL} class="w-full" />
      </div>
    {/if}

    <MdxContent html={data.contentHtml} />

    {#if isContainTwitter}
      <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
    {/if}
    <LazyGiscus />
  </article>
  <div class="flex-1">
    <Toc title="목차" selector="article">
      {#snippet footer()}
        {#if data.downloadURL}
          <GitHubDownloadButton href={data.downloadURL} class="mt-4" />
        {/if}
      {/snippet}
    </Toc>
  </div>
</section>

<style>
  @reference '#app.css';
  @keyframes -global-zoom-in {
    from {
      opacity: var(--zoom-in-opacity);
      height: 5.5rem;
    }
    to {
      opacity: calc(1 - var(--zoom-in-opacity));
      height: var(--hero-height);
    }
  }
  @keyframes hero-parallax {
    from {
      transform: translate3d(0, 0, 0);
    }
    to {
      transform: translate3d(0, 25svh, 0);
    }
  }
  @keyframes astr-weight-wave {
    0%,
    100% {
      font-weight: 200;
    }
    50% {
      font-weight: 600;
    }
  }
  :global(html:has(.hero.bg)) {
    overscroll-behavior-y: none;
  }
  :global(html:has(.astr-preview-section)) {
    overflow-x: clip;
  }

  .hero {
    @apply absolute! inset-0 [print-color-adjust:exact];
  }
  .hero.bg {
    @apply inner-b-border -z-10 h-(--hero-height) w-[calc(100vw-var(--scrollbar-width))] overflow-hidden print:h-[56.25vw];
  }
  .hero.bg.astr {
    @apply bg-primary;
  }
  .hero.bg .hero-image-inner {
    @apply absolute inset-0 -z-10 h-full w-full;
  }
  @supports (animation-timeline: scroll()) {
    .hero.bg :global(.hero-image-inner.parallax-active) {
      will-change: transform;
      animation: hero-parallax linear both;
      animation-timeline: scroll(root);
      animation-range: 0 var(--hero-height);
    }
  }
  .hero.bg .hero-image-inner img {
    @apply absolute inset-0 block size-full object-cover;
  }
  .hero.title {
    @apply top-(--header-height) z-10 mx-auto flex h-[calc(var(--hero-height)-var(--header-height))] w-[calc(36rem+2rem)] max-w-full items-end justify-center px-4 sm:w-[calc(36rem+4rem)] sm:px-8 md:top-0 md:left-1/2 md:mx-0 md:h-(--hero-height) md:w-xl md:-translate-x-1/2 md:px-0 md:2xl:w-2xl print:h-[calc(56.25vw-var(--header-height))] print:md:h-[56.25vw];
  }
  .hero.title > div {
    @apply prose-shadcn mx-auto w-full pr-(--scrollbar-width) [--tw-prose-body:var(--hero-foreground)] [--tw-prose-headings:var(--hero-foreground)] md:-translate-x-[calc(var(--scrollbar-width)/2)] md:pr-0 dark:[--tw-prose-body:var(--hero-foreground)] dark:[--tw-prose-headings:var(--hero-foreground)];
  }
  .hero.title > div .metadata {
    @apply relative mb-5 text-sm;
  }
  .metadata {
    @apply flex flex-wrap items-center gap-x-2 gap-y-1;
  }
  .metadata-content {
    @apply relative min-w-0;
  }
  .hero.title > div .metadata-content a {
    @apply font-normal text-(--hero-foreground)! no-underline;
  }
  .hero.title .astr-title {
    @apply flex;
    font-family: Astr, sans-serif;
    font-size: clamp(4.5rem, 24vw, 12rem);
    line-height: 1;
    font-feature-settings: normal;
  }
  .astr-title span {
    font-variation-settings: 'opsz' 32;
    animation: astr-weight-wave 3s ease-in-out calc(var(--astr-letter-index) * 0.5s - 3s) infinite both;
  }
  .hero.title.line h1 {
    @apply relative;
  }
  .hero.title.line h1::before {
    @apply absolute inset-0 -z-1 content-(--content);
    -webkit-text-stroke: 6px var(--outline-color);
  }
  .hero.title.line .metadata-content::before {
    @apply absolute inset-0 -z-1 content-(--content);
    -webkit-text-stroke: 6px var(--outline-color);
  }

  @media (prefers-reduced-motion: reduce) {
    .astr-title span {
      animation: none;
      font-weight: 400;
    }
  }

  :global(article .astr-preview-section) {
    @apply relative left-1/2 z-20 mt-10 w-screen -translate-x-1/2 bg-background;
    :global(& > *) {
      @apply mx-4 sm:mx-6 xl:mx-8;
    }
  }
  :global(article .astr-preview-title) {
    @apply mt-8! text-base! text-muted-foreground!;
  }
  :global(article .astr-preview-big) {
    @apply mx-0 mt-[-0.25em]! max-w-full cursor-text overflow-x-auto overflow-y-hidden px-[calc(1rem-(1em/18))] text-[10vw]! leading-tight! whitespace-nowrap text-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:px-[calc(1.5rem-(1em/18))] sm:tracking-tight xl:px-[calc(2rem-(1em/18))];
  }
  :global(article .astr-preview-mid) {
    @apply mt-[-0.125em]! cursor-text text-[6vw]! leading-tight! text-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary;
  }
  :global(article .astr-preview) {
    @apply columns-1 gap-6 font-features-[normal] *:text-base! *:leading-6! sm:*:leading-7! md:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5;
  }
  :global(article .astr-preview > :first-child) {
    @apply mt-0!;
  }
  :global(article .astr-preview > :last-child) {
    @apply mb-0!;
  }

  :global(.mdx-image-frame) {
    @apply relative block overflow-hidden rounded-lg;
    content-visibility: auto;
    contain-intrinsic-size: auto 24rem;
  }
  :global(.mdx-image-frame) :global(img) {
    @apply block max-w-full rounded-[inherit] object-cover inner-border;
  }

  :global(.mdx-image-frame.animate-pulse) {
    box-shadow: none;
  }

  :global(.mdx-image-frame.animate-pulse.mdx-constrained-width) {
    width: var(--mdx-constrained-width) !important;
  }

  :global(article iframe.mdx-embed-frame) {
    @apply rounded-lg inner-border;
  }

  :global(article iframe) {
    content-visibility: auto;
    contain-intrinsic-size: auto 24rem;
  }
</style>
