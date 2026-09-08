<script lang="ts">
  import PageTitle from '$lib/components/page-title.svelte'
  import type {PageProps} from './$types'
  let {data}: PageProps = $props()
</script>

<svelte:head><title>가사 – quiple</title><meta name="description" content="음악과 함께 읽는 가사" /></svelte:head>
<PageTitle>가사</PageTitle>
<div class="mx-auto max-w-2xl py-8">
  <ul class="divide-y">
    {#each data.songs as song (song.slug)}
      <li>
        <a href={`/lyric/${song.slug}`} class="block rounded-lg py-6 hover:bg-muted/40"
          ><span lang={song.lang ?? ''} class="text-xl font-semibold">{song.title}</span
          >{#each song.artists as artist}<span lang={artist.lang ?? ''} class="mt-2 block text-muted-foreground"
              >{artist.name}</span
            >{/each}</a
        >
      </li>
    {/each}
  </ul>
</div>
