<script lang="ts">
  import {hero} from '$lib/actions/hero'
  import {BASE_URL} from '$lib/constants'
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
</script>

<svelte:head>
  <title>{data.title}</title>
  <meta property="og:title" content={data.title} />
  <meta name="description" content={data.description} />
  <meta property="og:description" content={data.description} />
  <link rel="canonical" href={data.canonicalURL} />
  {@html `<script type="application/ld+json">${jsonLd}</script>`}
  {#if data.image}
    {@html `<style>:root { --hero-foreground: #${data.imageForeground.toString()}; }</style>`}
  {/if}
</svelte:head>

<div use:hero={{hasHero: Boolean(data.image)}}></div>

{#if data.image}
  <div class="hero bg" style:background-image={`url(${data.image})`}></div>
  <div class="hero title">
    <div class="container-x">
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
</article>

<style lang="sass">
  @reference '#app.css'

  .hero
    @apply w-[calc(100vw-var(--scrollbar-width))] inset-0 absolute!
    &.bg
      @apply bg-cover bg-center inner-b-border -z-10 h-[50vh]
    &.title
      @apply justify-center items-end flex z-10 h-[calc(50vh-var(--header-height))] top-(--header-height)
      .container-x > div
        @apply prose-shadcn max-w-xl 2xl:max-w-2xl mx-auto prose-h1:text-(--hero-foreground)
    .metadata
      @apply text-sm
      a
        @apply font-normal
        &[target=_blank]
          @apply after:content-['↗'] after:px-0.5
</style>
