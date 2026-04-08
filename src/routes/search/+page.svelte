<script lang="ts">
  import {Search} from '@lucide/svelte'
  import {goto} from '$app/navigation'
  import PostList from '$lib/components/post-list.svelte'
  import {Input} from '$lib/components/ui/input/index'
  import * as Pagination from '$lib/components/ui/pagination/index.js'
  import {setupViewTransition} from 'sveltekit-view-transition'
  import type {PageProps} from './$types'

  let {data}: PageProps = $props()
  let searchInput = $derived(data.searchQuery ?? '')
  let debounceTimer: ReturnType<typeof setTimeout>

  const {transition, classes} = setupViewTransition()

  function isPagination(navigation: {
    from?: {route: {id: string | null}} | null
    to?: {route: {id: string | null}} | null
  }) {
    return navigation?.from?.route?.id === '/search' && navigation?.to?.route?.id === '/search'
  }

  function isGoingForward(navigation: {from?: {url?: URL | null} | null; to?: {url?: URL | null} | null}) {
    const fromPage = Number(navigation?.from?.url?.searchParams?.get('p')) || 1
    const toPage = Number(navigation?.to?.url?.searchParams?.get('p')) || 1
    return toPage > fromPage
  }

  classes(({navigation}) => {
    if (!isPagination(navigation)) return
    return isGoingForward(navigation) ? ['paginate-forward'] : ['paginate-backward']
  })

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
  <div class="mb-2 mt-0 md:-mt-1.5 sticky top-4 sm:top-4.5 z-20">
    <Search class="absolute top-3 left-3 size-6" />
    <Input
      type="search"
      placeholder="검색"
      bind:value={searchInput}
      oninput={handleSearch}
      onkeydown={handleKeydown}
      class="z-50 pl-11 h-12 text-lg md:text-xl bg-background dark:bg-card"
      autofocus
    />
  </div>

  {#if !data.searchQuery}
    <p class="empty-state">검색어를 입력해 주세요.</p>
  {:else if data.matches && data.matches.length > 0}
    <p class="result-count">{data.totalCount}개의 검색 결과</p>

    <PostList posts={data.matches} {isPagination} {transition} />

    {#if data.totalPages > 1}
      <Pagination.Root
        count={data.totalPages * data.perPage}
        siblingCount={2}
        perPage={data.perPage}
        page={data.currentPage}
        onPageChange={(p) => {
          window.scrollTo(0, 0)
          goto(`/search?q=${encodeURIComponent(data.searchQuery)}&p=${p}`)
        }}
        class="my-4"
      >
        {#snippet children({pages, currentPage})}
          <Pagination.Content>
            <Pagination.Item>
              <Pagination.PrevButton />
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
              <Pagination.NextButton />
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
</style>
