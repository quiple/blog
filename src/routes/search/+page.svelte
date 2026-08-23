<script lang="ts">
  import {Search} from '@lucide/svelte'
  import {goto} from '$app/navigation'
  import PostPagination from '$lib/components/post-pagination.svelte'
  import PostList from '$lib/components/post-list.svelte'
  import {Input} from '$lib/components/ui/input/index'
  import {isGoingForward, isRoutePagination, type NavigationLike} from '$lib/navigation'
  import {absoluteUrl} from '$lib/seo'
  import {setupViewTransition} from '$lib/view-transition'
  import {onDestroy} from 'svelte'
  import type {PageProps} from './$types'

  let {data}: PageProps = $props()
  let searchInput = $derived(data.searchQuery ?? '')
  let debounceTimer: ReturnType<typeof setTimeout>

  const {transition, classes} = setupViewTransition()

  const isPagination = (navigation: NavigationLike) => isRoutePagination(navigation, '/search')

  classes(({navigation}) => {
    if (!isPagination(navigation)) return
    return isGoingForward(navigation) ? ['paginate-forward'] : ['paginate-backward']
  })

  function submitSearch() {
    const trimmed = searchInput.trim()
    goto(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search', {keepFocus: true})
  }

  function handleSearch() {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(submitSearch, 300)
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter') return
    clearTimeout(debounceTimer)
    submitSearch()
  }

  onDestroy(() => clearTimeout(debounceTimer))
</script>

<svelte:head>
  {#if !data.searchQuery}
    <title>검색 – quiple</title>
  {:else}
    <title>‘{data.searchQuery}’ 검색 결과 – quiple</title>
  {/if}
  <meta name="robots" content="noindex,follow" />
  <meta name="description" content="블로그 글 검색 결과입니다." />
  <link rel="canonical" href={absoluteUrl('/search')} />
</svelte:head>

<div class="relative z-10 mx-auto max-w-xl 2xl:max-w-2xl">
  <div class="sticky top-4 z-20 mt-0 mb-2 sm:top-4.5 md:-mt-1.5">
    <Search class="absolute top-3 left-3 size-6" />
    <Input
      type="search"
      placeholder="검색"
      bind:value={searchInput}
      oninput={handleSearch}
      onkeydown={handleKeydown}
      class="z-50 h-12 bg-background pl-11 text-lg md:text-xl dark:bg-card"
      autofocus
    />
  </div>

  {#if !data.searchQuery}
    <p class="empty-state">검색어를 입력해 주세요.</p>
  {:else if data.matches && data.matches.length > 0}
    <p class="result-count">{data.totalCount}개의 검색 결과</p>

    <PostList posts={data.matches} {isPagination} {transition} />

    <PostPagination
      totalPages={data.totalPages}
      perPage={data.perPage}
      currentPage={data.currentPage}
      onPageChange={(page) => {
        window.scrollTo(0, 0)
        goto(`/search?q=${encodeURIComponent(data.searchQuery)}&p=${page}`)
      }}
    />
  {:else}
    <p class="empty-state">검색 결과가 없습니다.</p>
  {/if}
</div>

<style>
  @reference '#app.css';
  .empty-state {
    @apply py-16 text-center text-muted-foreground;
  }

  .result-count {
    @apply mb-2 text-sm text-muted-foreground;
  }
</style>
