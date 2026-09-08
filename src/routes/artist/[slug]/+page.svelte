<script lang="ts">
  import type {PageProps} from './$types'
  let {data}: PageProps = $props()
</script>

<svelte:head><title>{data.artist.name} – quiple</title></svelte:head>
<div class="mx-auto max-w-2xl py-12">
  <h1 lang={data.artist.lang ?? ''} class="text-3xl font-semibold">{data.artist.name}</h1>
  {#if data.artist.translation}<p lang="ko" class="mt-2 text-muted-foreground">{data.artist.translation}</p>{/if}
  <ul class="mt-8 divide-y">
    {#each data.songs as song (song.slug)}
      <li>
        <a href={`/lyric/${song.slug}`} class="block rounded-lg py-6 hover:bg-muted/40">
          <span lang={song.lang ?? ''} class="text-xl font-semibold">{song.title}</span>
          {#if song.translation}<span lang="ko" class="mt-2 block text-muted-foreground">{song.translation}</span>{/if}
        </a>
      </li>
    {/each}
  </ul>
</div>
