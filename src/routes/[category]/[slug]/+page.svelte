<script lang="ts">
  import {onMount} from 'svelte'
  import {hero} from '$lib/actions/hero'
  import MdxContent from '$lib/components/mdx/MdxContent.svelte'
  import {Badge} from '$lib/components/ui/badge/index.js'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'
  import {BASE_URL} from '$lib/constants'
  import {heroColors} from '$lib/stores/header'
  import {getCategoryName} from '$lib/utils'
  import {mode} from 'mode-watcher'
  import type {PageProps} from './$types'
  import 'remark-github-alerts/styles/github-colors-light.css'
  import 'remark-github-alerts/styles/github-colors-dark-class.css'
  import 'remark-github-alerts/styles/github-base.css'
  import Toc from 'svelte-toc'
  import {setupViewTransition} from 'sveltekit-view-transition'

  let {data}: PageProps = $props()

  const isProd = import.meta.env.PROD
  const baseUrl = isProd ? 'https://quiple.dev' : ''

  const {transition} = setupViewTransition()
  let scrollY = $state(0)
  const isContainTwitter = $derived(data.contentHtml.search(/\btwitter-tweet\b/g) !== -1)
  const isArticle = $derived(data.category === 'article')
  const isFont = $derived(data.category === 'font')

  const rawSrc = $derived(`${baseUrl}/img/${data.category}/${data.image}`)
  const image = $derived(data.image ? (isProd ? `/cdn-cgi/image/w=3840,f=avif,q=75/${rawSrc}` : rawSrc) : '')
  const thumbnailImage = $derived(isProd ? `/cdn-cgi/image/h=180,f=avif,q=75/${rawSrc}` : rawSrc)
  const publishedDate = $derived(data.origDate ?? data.pubDate)
  const jsonLd = $derived(
    JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: data.title,
      datePublished: `${publishedDate}+09:00`,
      image: image && [`${BASE_URL}${image}`],
      ...(data.author
        ? {
            author: [
              data.authorURL
                ? {
                    '@type': 'Person',
                    name: data.author,
                    url: data.authorURL,
                  }
                : {
                    '@type': 'Person',
                    name: data.author,
                  },
            ],
          }
        : {}),
      ...(data.media
        ? {
            publisher: [
              data.source
                ? {
                    '@type': 'Organization',
                    name: data.media,
                    url: `${new URL(data.source).protocol}//${new URL(data.source).hostname}`,
                  }
                : {
                    '@type': 'Organization',
                    name: data.media,
                  },
            ],
          }
        : {}),
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
      ::view-transition-group-children(post-image-wrapper-${data.slug}) {
        overflow: clip;
      }
      ::view-transition-old(post-image-${data.slug}) {
        animation-name: zoom-in-old;
      }
      ::view-transition-new(post-image-${data.slug}) {
        animation-name: zoom-in-new;
      }
    </style>
  `)

  $effect(() => {
    heroColors.set({
      foreground: image ? `#${data.imageForeground?.toString() ?? '09090b'}` : null,
      outline: data.outline ? `#${data.outline.toString()}` : null,
    })
    return () =>
      heroColors.set({
        foreground: null,
        outline: null,
      })
  })

  onMount(() => {
    const tweets = document.querySelectorAll('.twitter-tweet')

    for (let i = 0; i < tweets.length; i++) {
      ;(tweets[i] as HTMLElement).dataset.theme = mode.current
    }
  })
</script>

<svelte:head>
  <title>{data.title}</title>
  <meta name="description" content={data.description} />

  <meta property="og:type" content="article" />
  <meta property="og:url" content={data.canonicalURL} />
  <meta property="og:title" content={data.title} />
  <meta property="og:description" content={data.description} />
  <meta name="twitter:title" content={data.title} />
  <meta name="twitter:description" content={data.description} />
  <meta property="og:image" content={`${BASE_URL}/api/og/${data.category}/${data.slug}.png`} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:image" content={`${BASE_URL}/api/og/${data.category}/${data.slug}.png`} />
  <meta name="twitter:card" content="summary_large_image" />
  <meta property="article:published_time" content={`${publishedDate}+09:00`} />
  {#if data.author}
    <meta property="article:author" content={data.author} />
  {/if}

  <link rel="canonical" href={data.canonicalURL} />
  {@html jsonLdScript}
  {@html viewTransitionStyle}
</svelte:head>

<svelte:window bind:scrollY />

<div use:hero={{hasHero: Boolean(image)}}></div>

{#snippet metadata(isOutline: boolean = false)}
  <div
    class="metadata"
    style={isOutline
      ? `--content: '${data.media ? `${data.media} • ` : ''}${data.author ? `${data.author} • ` : ''}${new Intl.DateTimeFormat(
          'ko-KR',
          {
            dateStyle: 'long',
          },
        ).format(typeof publishedDate === 'object' ? (publishedDate as Date) : Date.parse(`${publishedDate}+09:00`))}'`
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
        {new Intl.DateTimeFormat('ko-KR', {dateStyle: 'long'}).format(publishedDate as Date)}
      </time>
    {:else}
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger class="cursor-default">
            <time datetime={`${publishedDate}+09:00`}>
              {new Intl.DateTimeFormat('ko-KR', {dateStyle: 'long'}).format(Date.parse(`${publishedDate}+09:00`))}
            </time>
          </Tooltip.Trigger>
          <Tooltip.Content>
            {new Intl.DateTimeFormat('ko-KR', {dateStyle: 'long', timeStyle: 'short'}).format(
              Date.parse(`${publishedDate}+09:00`),
            )}
          </Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>
    {/if}
  </div>
{/snippet}

{#if image}
  <div
    class="hero bg"
    style:background-image={`url('${image}'), url('${thumbnailImage}')`}
    style:background-position={`center calc(${data.imageVerticalAlign ?? 50}% + ${scrollY * 0.5}px)`}
    use:transition={`post-image-${data.slug}`}
  ></div>
  <div
    class={['hero title', data.outline && 'line']}
    style:--hero-foreground={`#${data.imageForeground?.toString() ?? '09090b'}`}
    style:--outline-color={data.outline ? `#${data.outline.toString()}` : undefined}
  >
    <div>
      <div class="inline-block mb-1.25" use:transition={`post-category-${data.slug}`}>
        <Badge variant="secondary">{getCategoryName(data.category)}</Badge>
      </div>
      <h1 class="mb-2!" use:transition={`post-title-${data.slug}`} style={`--content: '${data.title}'`}>
        {data.title}
      </h1>
      {@render metadata(Boolean(data.outline))}
    </div>
  </div>
{/if}

<section class="flex lg:gap-6">
  <div class="flex-1">
    <Toc
      --toc-padding="0"
      --toc-min-width="0"
      --toc-li-padding="0"
      --toc-title-margin=".5rem 0"
      --toc-active-bg="transparent"
      --toc-active-color="currentColor"
      --toc-desktop-aside-margin="20px 0 0 0"
      --toc-desktop-sticky-top="var(--header-height)"
      breakpoint={1023}
      title="목차"
      headingSelector="h2:not(.toc-exclude, .sr-only)"
    />
  </div>

  <article>
    {#if !image}
      <div class="inline-block mb-1.25" use:transition={`post-category-${data.slug}`}>
        <Badge variant="secondary">{getCategoryName(data.category)}</Badge>
      </div>
      <h1 class="mb-2!" use:transition={`post-title-${data.slug}`}>{data.title}</h1>
      {@render metadata()}
    {/if}

    <MdxContent html={data.contentHtml} />

    {#if isContainTwitter}
      <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
    {/if}
  </article>
  <div class="flex-1"></div>
</section>

<style lang="sass">
  @reference '#app.css'

  @keyframes -global-zoom-in-old
    from
      opacity: 1
      height: 5.5rem
    to
      opacity: 0
      height: 50vh

  @keyframes -global-zoom-in-new
    from
      opacity: 0
      height: 5.5rem
    to
      opacity: 1
      height: 50vh

  .hero
    @apply inset-0 absolute! [print-color-adjust:exact]
    &.bg
      @apply w-[calc(100vw-var(--scrollbar-width))] -z-10 h-[50vh] print:h-[56.25vw] bg-cover inner-b-border print:bg-center!
    &.title
      @apply justify-center items-end flex z-10 h-[calc(50vh-var(--header-height))] print:h-[calc(56.25vw-var(--header-height))] w-[calc(36rem+2rem)] sm:w-[calc(36rem+4rem)] max-w-full px-4 sm:px-8 md:px-0 mx-auto md:mx-0 top-(--header-height) md:top-0 md:h-[50vh] print:md:h-[56.25vw] md:w-xl md:2xl:w-2xl md:left-1/2 md:-translate-x-1/2
      & > div
        @apply w-full prose-shadcn mx-auto [--tw-prose-headings:var(--hero-foreground)] dark:[--tw-prose-headings:var(--hero-foreground)] [--tw-prose-body:var(--hero-foreground)] dark:[--tw-prose-body:var(--hero-foreground)] md:-translate-x-[calc(var(--scrollbar-width)/2)] pr-(--scrollbar-width) md:pr-0
        .metadata
          @apply text-sm mb-5 inline-block
          a
            @apply font-normal text-(--hero-foreground)! no-underline hover:underline
      &.line h1::before
        @apply content-(--content) absolute -z-1 pr-4 sm:pr-8 md:pr-0
        -webkit-text-stroke: 6px var(--outline-color)
      &.line .metadata::before
        @apply content-(--content) absolute -z-1
        -webkit-text-stroke: 6px var(--outline-color)
</style>
