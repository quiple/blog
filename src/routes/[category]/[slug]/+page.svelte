<script lang="ts">
  import {onMount} from 'svelte'
  import {hero} from '$lib/actions/hero'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'
  import {BASE_URL} from '$lib/constants'
  import {mode} from 'mode-watcher'
  import type {PageProps} from './$types'
  import 'remark-github-alerts/styles/github-colors-light.css'
  import 'remark-github-alerts/styles/github-colors-dark-class.css'
  import 'remark-github-alerts/styles/github-base.css'
  import {setupViewTransition} from 'sveltekit-view-transition'

  let {data}: PageProps = $props()

  const {transition} = setupViewTransition()
  const isContainTwitter = $derived(data.contentHtml.search(/\btwitter-tweet\b/g) !== -1)
  const image = $derived(data.image ? `/img/article/${data.image}` : '')
  const jsonLd = $derived(
    JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: data.title,
      datePublished: `${data.origDate}+09:00`,
      image: image && [`${BASE_URL}${image}`],
      author: data.author && [
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
      publisher: data.media && [
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
  {#if data.author}
    <meta property="article:author" content={data.author} />
  {/if}

  <link rel="canonical" href={data.canonicalURL} />
  {@html `<script type="application/ld+json">${jsonLd}</script>`}

  <!-- {#if image || data.outline} -->
  {@html `
      <style>
        ::view-transition-group-children(post-image-wrapper-${data.slug}) {
          overflow: clip;
        }
        ::view-transition-old(post-image-${data.slug}) {
          animation-name: zoom-in-old;
        }
        ::view-transition-new(post-image-${data.slug}) {
          animation-name: zoom-in-new;
        }
        :root {
          ${image && `--hero-foreground: #${data.imageForeground.toString()};`}
          ${data.outline ? `--outline-color: #${data.outline.toString()};` : ''}
        }
      </style>
    `}
  <!-- {/if} -->
</svelte:head>

<div use:hero={{hasHero: Boolean(image)}}></div>

{#snippet metadata(isOutline: boolean = false)}
  <div
    class="metadata"
    style={isOutline
      ? `--content: '${data.media && `${data.media} • `}${data.author && `${data.author} • `}${new Intl.DateTimeFormat(
          'ko-KR',
          {
            dateStyle: 'long',
          },
        ).format(Date.parse(`${data.origDate}+09:00`))}'`
      : null}
  >
    {#if data.media}
      <a target="_blank" rel="nofollow noreferrer noopener" href={data.source}>{data.media}</a
      >&#8194;&bullet;&#8194;{/if}{#if data.author}<a
        target="_blank"
        rel="nofollow noreferrer noopener"
        href={data.authorURL}>{data.author}</a
      >&#8194;&bullet;&#8194;{/if}<Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger class="cursor-default">
          {new Intl.DateTimeFormat('ko-KR', {dateStyle: 'long'}).format(Date.parse(`${data.origDate}+09:00`))}
        </Tooltip.Trigger>
        <Tooltip.Content>
          {new Intl.DateTimeFormat('ko-KR', {dateStyle: 'long', timeStyle: 'short'}).format(
            Date.parse(`${data.origDate}+09:00`),
          )}
        </Tooltip.Content>
      </Tooltip.Root>
    </Tooltip.Provider>
  </div>
{/snippet}

{#if image}
  <div class="hero bg" style:background-image={`url('${image}')`} use:transition={`post-image-${data.slug}`}></div>
  <div class={['hero title', data.outline && 'line']}>
    <div>
      <h1 class="mb-2!" use:transition={`post-title-${data.slug}`} style={`--content: '${data.title}'`}>
        {data.title}
      </h1>
      {@render metadata(Boolean(data.outline))}
    </div>
  </div>
{/if}

<article>
  {#if !image}
    <h1 class="mb-2!" use:transition={`post-title-${data.slug}`}>{data.title}</h1>
    {@render metadata()}
  {/if}

  {@html data.contentHtml}

  {#if isContainTwitter}
    <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
  {/if}
</article>

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
    @apply inset-0 absolute!
    &.bg
      @apply w-[calc(100vw-var(--scrollbar-width))] -z-10 h-[50vh] bg-cover bg-center inner-b-border
    &.title
      @apply justify-center items-end flex z-10 h-[calc(50vh-var(--header-height))] w-[calc(36rem+2rem)] sm:w-[calc(36rem+4rem)] max-w-full px-4 sm:px-8 md:px-0 mx-auto md:mx-0 top-(--header-height) md:top-0 md:h-[50vh] md:w-xl md:2xl:w-2xl md:left-1/2 md:-translate-x-1/2
      & > div
        @apply prose-shadcn mx-auto [--tw-prose-headings:var(--hero-foreground)] dark:[--tw-prose-headings:var(--hero-foreground)] [--tw-prose-body:var(--hero-foreground)] dark:[--tw-prose-body:var(--hero-foreground)] md:-translate-x-[calc(var(--scrollbar-width)/2)] pr-(--scrollbar-width) md:pr-0
        .metadata
          @apply text-sm mb-6
          a
            @apply font-normal text-(--hero-foreground)!
      &.line h1::before
        @apply content-(--content) absolute -z-1 pr-4 sm:pr-8 md:pr-0
        -webkit-text-stroke: 6px var(--outline-color)
      &.line .metadata::before
        @apply content-(--content) absolute -z-1
        -webkit-text-stroke: 6px var(--outline-color)
</style>
