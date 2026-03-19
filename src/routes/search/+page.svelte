<script lang="ts">
  import {Search} from '@lucide/svelte'
  import {goto} from '$app/navigation'
  import {page} from '$app/stores'
  import {Input} from '$lib/components/ui/input/index'
  import * as Pagination from '$lib/components/ui/pagination/index.js'
  import type {PageProps} from './$types'

  let {data}: PageProps = $props()
  let searchInput = $state(data.searchQuery ?? '')
  let debounceTimer: ReturnType<typeof setTimeout>

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
      placeholder="검색어를 입력하세요"
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
              <strong class="line-clamp-1 mb-1">{match.title}</strong>
              <p class="text-sm line-clamp-3 mb-1 text-justify">{match.description}</p>
              <small class="text-muted-foreground">
                {#if match.media}
                  {match.media}&#8194;&#8226;&#8194;{/if}{new Intl.DateTimeFormat('ko-KR', {dateStyle: 'long'}).format(
                  displayDate,
                )}
              </small>
            </div>
            {#if match.image}
              <div
                class="img"
                style:background-image={`url('/img/thumbnail/${match.image.substring(0, match.image.lastIndexOf('.'))}.avif')`}
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

  .search-bar
    @apply flex items-center gap-3 px-4 py-3 mb-4 rounded-xl border border-border bg-card transition-colors
    &:focus-within
      @apply border-primary/50

    .search-icon
      @apply text-muted-foreground shrink-0

    input
      @apply bg-transparent outline-none w-full text-foreground placeholder:text-muted-foreground

    .clear-btn
      @apply text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer

  .empty-state
    @apply text-muted-foreground text-center py-16

  .result-count
    @apply text-sm text-muted-foreground mb-2

  .list-item
    @apply flex gap-4 before:rounded-xl py-2 pl-3 -ml-3 pr-2 -mr-2 rounded-xl hover-bg-muted
    .img
      @apply shrink-0 size-22 bg-cover bg-center inner-border after:rounded-sm rounded-sm shadow-xs
</style>
