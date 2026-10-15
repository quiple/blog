<script lang="ts">
  import type {Artist} from '#lib/lyrics/artists.server.js'

  let {
    songs,
  }: {songs: {slug: string; title: string; year?: string; lang?: string; translation?: string; artists?: Artist[]}[]} =
    $props()
</script>

<ul class="relative z-10 flex flex-col gap-1">
  {#each songs as song (song.slug)}
    <li>
      <a href={`/lyric/${song.slug}`} class="post-list-item list-item">
        <div class="flex items-center gap-1">
          <strong
            lang={song.lang === 'ko' ? undefined : (song.lang ?? '')}
            class="line-clamp-1 grow font-medium break-all"
          >
            {song.title}
          </strong>
        </div>
        {#if song.translation}
          <p
            class:mb-1={!!(song.artists?.length || song.year)}
            class="line-clamp-3 text-sm text-chart-4 dark:text-chart-1"
          >
            {song.translation}
          </p>
        {/if}
        {#if song.artists?.length || song.year}
          <div class="mt-px flex items-start justify-between gap-2">
            <small class="text-muted-foreground">
              {#if song.year}{song.year}년{#if song.artists?.length}&#8194;&middot;&#8194;{/if}{/if}{#each song.artists ?? [] as artist, index (artist.slug)}{#if index > 0}{', '}{/if}<span
                  lang={artist.translation || artist.lang === 'ko' ? undefined : (artist.lang ?? '')}
                >
                  {artist.translation || artist.name}
                </span>
              {/each}
            </small>
          </div>
        {/if}
      </a>
    </li>
  {/each}
</ul>
