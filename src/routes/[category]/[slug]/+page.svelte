<script lang="ts">
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
</svelte:head>

{#if data.image}
  <div class="hero" style:background-image={`url(${data.image})`}>
    <div class="container-x">
      <div>
        <h1 class="mb-2!">{data.title}</h1>
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
    @apply bg-cover bg-center h-[50vh] absolute inner-b-border w-[calc(100vw-var(--scrollbar-width))] inset-0 -z-1 flex justify-center items-end
    .container-x > div
      @apply prose-shadcn max-w-xl 2xl:max-w-2xl mx-auto
</style>
