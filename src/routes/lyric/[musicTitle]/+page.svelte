<script lang="ts">
  import LyricPage from '#lib/components/lyrics/LyricPage.svelte'
  import {lyricPageTitle} from '#lib/lyrics/page-title.js'
  import type {PageProps} from './$types'
  let {data}: PageProps = $props()
  const title = $derived(`${lyricPageTitle(data.song, data.artists)} — quiple`)
</script>

<svelte:head>
  <title>{title}</title>
  <link rel="canonical" href={data.canonicalURL} />
  <meta property="og:title" content={title} />
  <meta property="og:url" content={data.canonicalURL} />
  <meta property="og:image" content={data.ogImageURL} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:image" content={data.ogImageURL} />
  {#if data.song.example}<meta name="robots" content="noindex" />{/if}
</svelte:head>

{#key data.canonicalURL}
  <LyricPage song={data.song} artists={data.artists} sources={data.sources} />
{/key}
