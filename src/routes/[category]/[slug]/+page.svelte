<script lang="ts">
  import {onMount} from 'svelte'
  import {hero} from '$lib/actions/hero'
  import {BASE_URL} from '$lib/constants'
  import {mode} from 'mode-watcher'
  import type {PageProps} from './$types'

  let {data}: PageProps = $props()

  let jsonLd = $derived(
    JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: data.title,
      datePublished: `${data.origDate}+09:00`,
      image: data.image && [`${BASE_URL}${data.image}`],
    }),
  )

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
  <meta property="article:published_time" content={`${data.origDate}+09:00`} />
  {#if data.origAuthor}
    <meta property="article:author" content={data.origAuthor} />
  {/if}

  <link rel="canonical" href={data.canonicalURL} />
  {@html `<script type="application/ld+json">${jsonLd}</script>`}

  {#if data.image}
    <meta property="og:image" content={data.image} />
    {@html `<style>:root { --hero-foreground: #${data.imageForeground.toString()}; }</style>`}
  {/if}
</svelte:head>

<div use:hero={{hasHero: Boolean(data.image)}}></div>

{#if data.image}
  <div class="hero bg" style:background-image={`url(${data.image})`}></div>
  <div class="hero title">
    <div>
      <h1 class="mb-2!">{data.title}</h1>
      <div class="metadata">
        {#if data.media}
          <a target="_blank" rel="nofollow noreferrer noopener" href={data.source}>{data.media}</a
          >&#8194;&bullet;&#8194;{/if}{new Intl.DateTimeFormat('ko-KR', {dateStyle: 'long'}).format(
          Date.parse(`${data.origDate}+09:00`),
        )}
      </div>
    </div>
  </div>
{/if}

<article>
  {#if !data.image}
    <h1 class="mb-2!">{data.title}</h1>
    <div class="metadata">
      {#if data.media}
        <a target="_blank" rel="nofollow noreferrer noopener" href={data.source}>{data.media}</a
        >&#8194;&bullet;&#8194;{/if}{new Intl.DateTimeFormat('ko-KR', {dateStyle: 'long'}).format(
        Date.parse(`${data.origDate}+09:00`),
      )}
    </div>
  {/if}
  {@html data.contentHtml}
  <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
</article>

<style lang="sass">
  @reference '#app.css'

  .hero
    @apply inset-0 absolute!
    &.bg
      @apply w-[calc(100vw-var(--scrollbar-width))] bg-cover bg-center inner-b-border -z-10 h-[50vh]
    &.title
      @apply justify-center items-end flex z-10 h-[calc(50vh-var(--header-height))] w-[calc(36rem+2rem)] sm:w-[calc(36rem+4rem)] max-w-full px-4 sm:px-8 md:px-0 mx-auto md:mx-0 top-(--header-height) md:top-0 md:h-[50vh] md:w-xl md:2xl:w-2xl md:left-1/2 md:-translate-x-1/2
      & > div
        @apply prose-shadcn mx-auto [--tw-prose-headings:var(--hero-foreground)] dark:[--tw-prose-headings:var(--hero-foreground)] [--tw-prose-body:var(--hero-foreground)] dark:[--tw-prose-body:var(--hero-foreground)] md:-translate-x-[calc(var(--scrollbar-width)/2)] pr-(--scrollbar-width) md:pr-0
        .metadata
          @apply text-sm mb-6
          a
            @apply font-normal text-(--hero-foreground)!
            &[target=_blank]
              @apply after:content-['↗'] after:px-0.5
</style>
