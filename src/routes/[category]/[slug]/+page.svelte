<script lang="ts">
  import {BASE_URL} from '$lib/constants'
  import type {PageProps} from './$types'

  let {data}: PageProps = $props()

  let jsonLd = $derived(
    JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: data.title,
      datePublished: `${data.pubDate}+09:00`,
      image: data.image && [`${BASE_URL}${data.image}`],
    }),
  )
</script>

<svelte:head>
  <title>{data.title}</title>
  <meta property="og:title" content={data.title} />
  <meta name="description" content={data.description ?? data.contentSummary} />
  <meta property="og:description" content={data.description ?? data.contentSummary} />
  {@html `<script type="application/ld+json">${jsonLd}</script>`}
</svelte:head>

<article>
  <h1 class="mb-2!">{data.title}</h1>
  <div class="metadata">
    {new Intl.DateTimeFormat('ko-KR', {dateStyle: 'long'}).format(
      Date.parse(`${data.pubDate}+09:00`),
    )}{#if data.media}&#8194;&bullet;&#8194;<a target="_blank" rel="nofollow noreferrer noopener" href={data.source}
        >{data.media}</a
      >
    {/if}
  </div>
  {@html data.contentHtml}
</article>

<style lang="sass">
  @reference '#app.css'

  article
    @apply prose-shadcn max-w-2xl mx-auto text-justify
    .metadata
      @apply text-muted-foreground text-sm
      a
        @apply text-muted-foreground font-normal
    :global(figure)
      @apply mx-auto max-w-fit flex flex-col items-start
      & > :global(div)
        @apply relative inner-border after:rounded-md rounded-md overflow-hidden shadow-xs
    :global([target=_blank])
      @apply after:content-['↗'] after:mx-0.5
</style>
