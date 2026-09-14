<script lang="ts">
  import LyricPage from '$lib/components/lyrics/LyricPage.svelte'
  import type {PageProps} from './$types'
  let {data}: PageProps = $props()
</script>

<svelte:head>
  <title>{data.song.title} – quiple</title>
  <link rel="canonical" href={data.canonicalURL} />
  <meta property="og:title" content={`${data.song.title}`} />
  <meta property="og:url" content={data.canonicalURL} />
  {#if data.song.example}<meta name="robots" content="noindex" />{/if}
</svelte:head>

{#key data.canonicalURL}
  <LyricPage song={data.song} artists={data.artists} sources={data.sources} />
{/key}
