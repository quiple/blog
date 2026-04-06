<script lang="ts">
  import {goto} from '$app/navigation'
  import PostList from '$lib/components/post-list.svelte'
  import * as Pagination from '$lib/components/ui/pagination/index.js'
  import {BASE_URL} from '$lib/constants'
  import {setupViewTransition} from 'sveltekit-view-transition'
  import type {PageProps} from './$types'

  let {data}: PageProps = $props()

  const {transition, classes} = setupViewTransition()

  function isPagination(navigation: {
    from?: {route: {id: string | null}} | null
    to?: {route: {id: string | null}} | null
  }) {
    return navigation?.from?.route?.id === '/' && navigation?.to?.route?.id === '/'
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
</script>

<svelte:head>
  <title>{data.title}</title>
  <meta name="description" content={data.description} />

  <meta property="og:type" content="website" />
  <meta property="og:url" content={BASE_URL} />
  <meta property="og:title" content={data.title} />
  <meta property="og:description" content={data.description} />
</svelte:head>

<div class="max-w-xl 2xl:max-w-2xl mx-auto z-10 relative">
  <PostList posts={data.posts} {isPagination} {transition} />

  {#if data.totalPages > 1}
    <Pagination.Root
      count={data.totalPages * 15}
      siblingCount={2}
      perPage={data.perPage}
      page={data.currentPage}
      onPageChange={(page) => goto(`?p=${page}`)}
      class="my-4"
    >
      {#snippet children({pages, currentPage})}
        <Pagination.Content>
          <Pagination.Item>
            <Pagination.Previous />
          </Pagination.Item>
          {#each pages as page (page.key)}
            <Pagination.Item>
              {#if page.type === 'ellipsis'}
                <Pagination.Ellipsis />
              {:else}
                <Pagination.Link
                  class={currentPage === page.value ? 'pointer-events-none' : undefined}
                  {page}
                  isActive={currentPage === page.value}
                >
                  {page.value}
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
  {:else}
    검색 결과가 없습니다.
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
</style>
