<script lang="ts">
  import LyricList from '$lib/components/lyrics/LyricList.svelte'
  import type {PageProps} from './$types'
  let {data}: PageProps = $props()
</script>

<svelte:head><title>{data.artist.name} – quiple</title></svelte:head>
<div class="mx-auto max-w-2xl py-12">
  <h1 lang={data.artist.lang ?? ''} class="text-3xl font-semibold">{data.artist.name}</h1>
  {#if data.artist.translation}<p lang="ko" class="mt-2 text-muted-foreground">{data.artist.translation}</p>{/if}
  <div class="mt-8">
    <LyricList songs={data.songs} />
  </div>
</div>
