<script lang="ts">
  import {Search} from '@lucide/svelte'
  import {goto} from '$app/navigation'
  import {Input} from '$lib/components/ui/input/index'
  import * as Pagination from '$lib/components/ui/pagination/index.js'
  import {setupViewTransition} from 'sveltekit-view-transition'
  import type {PageProps} from './$types'

  let {data}: PageProps = $props()
  let searchInput = $derived(data.searchQuery ?? '')
  let debounceTimer: ReturnType<typeof setTimeout>

  const {transition} = setupViewTransition()

  function handleSearch() {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      const trimmed = searchInput.trim()
      if (trimmed) {
        goto(`/search?q=${encodeURIComponent(trimmed)}`, {keepFocus: true})
      } else {
        goto('/search', {keepFocus: true})
      }
    }, 300)
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      clearTimeout(debounceTimer)
      const trimmed = searchInput.trim()
      if (trimmed) {
        goto(`/search?q=${encodeURIComponent(trimmed)}`, {keepFocus: true})
      } else {
        goto('/search', {keepFocus: true})
      }
    }
  }
</script>

<svelte:head>
  {#if !data.searchQuery}
    <title>검색</title>
  {:else}
    <title>‘{data.searchQuery}’ 검색 결과</title>
  {/if}
</svelte:head>

<div class="max-w-xl 2xl:max-w-2xl mx-auto z-10 relative">
  <div class="relative mb-4">
    <Search class="absolute top-3 left-3 size-6" />
    <Input
      type="search"
      placeholder="검색"
      bind:value={searchInput}
      oninput={handleSearch}
      onkeydown={handleKeydown}
      class="z-50 pl-10 h-12 md:text-xl"
      autofocus
    />
  </div>

  {#if !data.searchQuery}
    <p class="empty-state">검색어를 입력해 주세요.</p>
  {:else if data.matches && data.matches.length > 0}
    <p class="result-count">{data.totalCount}개의 검색 결과</p>

    <ul class="flex flex-col z-10 relative">
      {#each data.matches as match}
        {@const displayDate =
          match.origDate instanceof Date ? match.origDate : new Date(`${match.origDate ?? match.pubDate}+09:00`)}
        <li>
          <a href={match.relativeURL} class="list-item">
            <div class="grow">
              <strong
                class="line-clamp-1 mb-1"
                use:transition={{
                  name: `post-title-${match.slug}`,
                  shouldApply({navigation}) {
                    return navigation?.to?.params?.slug === match.slug
                  },
                  applyImmediately({navigation}) {
                    return navigation?.from?.params?.slug === match.slug
                  },
                }}>{match.title}</strong
              >
              <p class="text-sm line-clamp-3 mb-1 text-justify">{match.description}</p>
              <small
                class="text-muted-foreground"
                use:transition={{
                  name: `post-metadata-${match.slug}`,
                  shouldApply({navigation}) {
                    return navigation?.to?.params?.slug === match.slug
                  },
                  applyImmediately({navigation}) {
                    return navigation?.from?.params?.slug === match.slug
                  },
                }}
              >
                {#if match.media}
                  {match.media}&#8194;&#8226;&#8194;{/if}{new Intl.DateTimeFormat('ko-KR', {dateStyle: 'long'}).format(
                  displayDate,
                )}
              </small>
            </div>
            {#if match.image}
              {@html `
                <style>
                  ::view-transition-group(post-title-${match.slug}),
                  ::view-transition-group(post-metadata-${match.slug}) {
                    z-index: 10;
                  }
                  ::view-transition-group-children(post-image-wrapper-${match.slug}) {
                    overflow: clip;
                  }
                  ::view-transition-old(post-image-${match.slug}) {
                    animation-name: zoom-out-old;
                  }
                  ::view-transition-new(post-image-${match.slug}) {
                    animation-name: zoom-out-new;
                  }
                </style>
              `}
              <div
                class="img"
                style:background-image={`url('/img/thumbnail/${match.image.substring(0, match.image.lastIndexOf('.'))}.avif')`}
                use:transition={{
                  name: `post-image-${match.slug}`,
                  shouldApply({navigation}) {
                    return navigation?.to?.params?.slug === match.slug
                  },
                  applyImmediately({navigation}) {
                    return navigation?.from?.params?.slug === match.slug
                  },
                }}
              ></div>
            {/if}
          </a>
        </li>
      {/each}
    </ul>

    {#if data.totalPages > 1}
      <Pagination.Root
        count={data.totalPages * data.perPage}
        siblingCount={2}
        perPage={data.perPage}
        page={data.currentPage}
        onPageChange={(p) => goto(`/search?q=${encodeURIComponent(data.searchQuery)}&page=${p}`)}
        class="my-4"
      >
        {#snippet children({pages, currentPage})}
          <Pagination.Content>
            <Pagination.Item>
              <Pagination.Previous />
            </Pagination.Item>
            {#each pages as p (p.key)}
              <Pagination.Item>
                {#if p.type === 'ellipsis'}
                  <Pagination.Ellipsis />
                {:else}
                  <Pagination.Link
                    class={currentPage === p.value ? 'pointer-events-none' : undefined}
                    page={p}
                    isActive={currentPage === p.value}
                  >
                    {p.value}
                  </Pagination.Link>
                {/if}
              </Pagination.Item>
            {/each}
            <Pagination.Item>
              <Pagination.Next />
            </Pagination.Item>
          </Pagination.Content>
        {/snippet}
      </Pagination.Root>
    {/if}
  {:else}
    <p class="empty-state">검색 결과가 없습니다.</p>
  {/if}
</div>

<style lang="sass">
  @reference '#app.css'

  @keyframes -global-zoom-out-old
    from
      opacity: 1
      height: 50vh
    to
      opacity: 0
      height: 5.5rem

  @keyframes -global-zoom-out-new
    from
      opacity: 0
      height: 50vh
    to
      opacity: 1
      height: 5.5rem

  .empty-state
    @apply text-muted-foreground text-center py-16

  .result-count
    @apply text-sm text-muted-foreground mb-2

  .list-item
    @apply flex gap-4 before:rounded-xl py-2 pl-3 -ml-3 pr-2 -mr-2 rounded-xl hover-bg-muted
    .img
      @apply shrink-0 size-22 bg-cover bg-center inner-border after:rounded-sm rounded-sm shadow-xs
</style>
