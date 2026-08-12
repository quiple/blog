<script lang="ts">
  import {onMount} from 'svelte'
  import LazyGiscus from '$lib/components/lazy-giscus.svelte'
  import MdxContent from '$lib/components/mdx/MdxContent.svelte'
  import {Badge} from '$lib/components/ui/badge/index.js'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'

  import {absoluteUrl, jsonLd as stringifyJsonLd, SITE_AUTHOR, SITE_NAME, toKstDateTime} from '$lib/seo'
  import {getCategoryName, getImageUrl} from '$lib/utils'
  import {mode} from 'mode-watcher'
  import type {PageProps} from './$types'
  import 'remark-github-alerts/styles/github-colors-light.css'
  import 'remark-github-alerts/styles/github-colors-dark-class.css'
  import 'remark-github-alerts/styles/github-base.css'
  import Toc from '$lib/components/mdx/Toc.svelte'
  import {setupViewTransition} from '$lib/view-transition'

  let {data}: PageProps = $props()

  const isProd = import.meta.env.PROD

  const {transition} = setupViewTransition()
  const isContainTwitter = $derived(data.contentHtml.search(/\btwitter-tweet\b/g) !== -1)
  const isArticle = $derived(data.category === 'article')
  const isFont = $derived(data.category === 'font')

  const imageMobile = $derived(data.image ? getImageUrl(data.image, {w: 1280}, isProd) : '')
  const imageDesktop = $derived(data.image ? getImageUrl(data.image, {w: 2560}, isProd) : '')
  const image4K = $derived(data.image ? getImageUrl(data.image, {w: 3840}, isProd) : '')
  const thumbnail1x = $derived(data.image ? getImageUrl(data.image, {h: 88}, isProd) : '')
  const thumbnail2x = $derived(data.image ? getImageUrl(data.image, {h: 176}, isProd) : '')
  const thumbnailImage = $derived(
    `image-set(url('${thumbnail1x}') 1x, url('${thumbnail2x}') 2x), -webkit-image-set(url('${thumbnail1x}') 1x, url('${thumbnail2x}') 2x)`,
  )
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
      ::view-transition-group(post-category-${data.slug}),
      ::view-transition-group(post-metadata-${data.slug}) {
        z-index: 10;
      }
      ::view-transition-old(post-image-${data.slug}) {
        animation-name: zoom-in-old;
      }
      ::view-transition-new(post-image-${data.slug}) {
        animation-name: zoom-in-new;
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
  <div
    class="metadata"
    style={isOutline
      ? `--content: '${data.media ? `${data.media} • ` : ''}${data.author ? `${data.author} • ` : ''}${formattedDate}'`
      : null}
    use:transition={`post-metadata-${data.slug}`}
  >
    {#if data.media}
      <a target="_blank" rel="nofollow noreferrer noopener" href={data.source}>
        {data.media}
      </a>&#8194;&bullet;&#8194;
    {/if}{#if data.author}
      <a target="_blank" rel="nofollow noreferrer noopener" href={data.authorURL}
        >{data.author}
      </a>&#8194;&bullet;&#8194;
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
  </div>
{/snippet}

{#if imageMobile}
  <div class="hero bg" use:transition={`post-image-${data.slug}`}>
    <div
      class="hero-image-inner"
      style:--image-mobile={`url('${imageMobile}')`}
      style:--image-desktop={`url('${imageDesktop}')`}
      style:--image-4k={`url('${image4K}')`}
      style:--thumbnail-image={thumbnailImage}
      style:background-position={`center ${data.imageVerticalAlign ?? 50}%`}
    ></div>
  </div>
  <div
    class={['hero title', data.outline && 'line']}
    style:--hero-foreground={`#${data.imageForeground?.toString() ?? '09090b'}`}
    style:--outline-color={data.outline ? `#${data.outline.toString()}` : undefined}
  >
    <div>
      <div class="mb-1.25 inline-block" use:transition={`post-category-${data.slug}`}>
        <Badge variant="secondary">{getCategoryName(data.category)}</Badge>
      </div>
      <h1 class="mb-2!" use:transition={`post-title-${data.slug}`} style={`--content: '${data.title}'`}>
        {data.title}
      </h1>
      {@render metadata(Boolean(data.outline))}
    </div>
  </div>
{/if}

<section class="flex lg:gap-6 xl:gap-12 2xl:gap-18">
  <div class="flex-1"></div>
  <article>
    {#if !imageMobile}
      <div class="mb-1.25 inline-block" use:transition={`post-category-${data.slug}`}>
        <Badge variant="secondary">{getCategoryName(data.category)}</Badge>
      </div>
      <h1 class="mb-2!" use:transition={`post-title-${data.slug}`}>{data.title}</h1>
      {@render metadata()}
    {/if}

    <MdxContent html={data.contentHtml} />

    {#if isContainTwitter}
      <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
    {/if}
    <LazyGiscus />
  </article>
  <div class="flex-1">
    <Toc title="목차" selector="article" />
  </div>
</section>

<style lang="sass">
  @reference '#app.css'

  @keyframes -global-zoom-in-old
    from
      opacity: 1
      height: 5.5rem
    to
      opacity: 0
      height: 50dvh

  @keyframes -global-zoom-in-new
    from
      opacity: 0
      height: 5.5rem
    to
      opacity: 1
      height: 50dvh

  @keyframes hero-parallax
    from
      transform: translateY(0)
    to
      transform: translateY(25dvh)

  .hero
    @apply inset-0 absolute! [print-color-adjust:exact]
    &.bg
      @apply w-[calc(100vw-var(--scrollbar-width))] -z-10 h-[50dvh] print:h-[56.25vw] overflow-hidden inner-b-border print:bg-center!
      .hero-image-inner
        @apply absolute inset-0 w-full h-full bg-cover -z-10
        background-image: var(--image-desktop), var(--thumbnail-image)
        @media (max-width: 1024px)
          background-image: var(--image-mobile), var(--thumbnail-image)
        @media (min-width: 2560px)
          background-image: var(--image-4k), var(--thumbnail-image)
        @supports (animation-timeline: scroll())
          will-change: transform
          animation: hero-parallax linear both
          animation-timeline: scroll(root)
          animation-range: 0 50dvh
        @media (prefers-reduced-motion: reduce)
          animation: none
          will-change: auto
    &.title
      @apply justify-center items-end flex z-10 h-[calc(50dvh-var(--header-height))] print:h-[calc(56.25vw-var(--header-height))] w-[calc(36rem+2rem)] sm:w-[calc(36rem+4rem)] max-w-full px-4 sm:px-8 md:px-0 mx-auto md:mx-0 top-(--header-height) md:top-0 md:h-[50dvh] print:md:h-[56.25vw] md:w-xl md:2xl:w-2xl md:left-1/2 md:-translate-x-1/2
      & > div
        @apply w-full prose-shadcn mx-auto [--tw-prose-headings:var(--hero-foreground)] dark:[--tw-prose-headings:var(--hero-foreground)] [--tw-prose-body:var(--hero-foreground)] dark:[--tw-prose-body:var(--hero-foreground)] md:-translate-x-[calc(var(--scrollbar-width)/2)] pr-(--scrollbar-width) md:pr-0
        .metadata
          @apply relative text-sm mb-5 inline-block
          a
            @apply font-normal text-(--hero-foreground)! no-underline
      &.line h1
        @apply relative
        &::before
          @apply content-(--content) absolute inset-0 -z-1
          -webkit-text-stroke: 6px var(--outline-color)
      &.line .metadata::before
        @apply content-(--content) absolute inset-0 -z-1
        -webkit-text-stroke: 6px var(--outline-color)
  :global(.mdx-image-frame)
    @apply relative block overflow-hidden rounded-lg
    content-visibility: auto
    contain-intrinsic-size: auto 24rem
    :global(img)
      @apply block max-w-full rounded-[inherit] object-cover inner-border
  :global(article iframe.mdx-embed-frame)
    @apply rounded-lg inner-border
  :global(article iframe)
    content-visibility: auto
    contain-intrinsic-size: auto 24rem
</style>
