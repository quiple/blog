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
  <meta name="description" content={data.description ?? data.contentSummary} />
  <meta property="og:description" content={data.description ?? data.contentSummary} />
  <link rel="canonical" href={data.canonicalURL} />
  {@html `<script type="application/ld+json">${jsonLd}</script>`}
</svelte:head>

<article>
  <h1 class="mb-2!">{data.title}</h1>
  <div class="metadata">
    {new Intl.DateTimeFormat('ko-KR', {dateStyle: 'long'}).format(
      Date.parse(`${data.origDate}+09:00`),
    )}{#if data.media}&#8194;&bullet;&#8194;<a target="_blank" rel="nofollow noreferrer noopener" href={data.source}
        >{data.media}</a
      >
    {/if}
  </div>
  {@html data.contentHtml}
</article>
