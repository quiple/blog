<script lang="ts">
  import {goto} from '$app/navigation'
  import {buttonVariants} from '$lib/components/ui/button/index'
  import * as Pagination from '$lib/components/ui/pagination/index'
  import type {PageProps} from './$types'

  let {data}: PageProps = $props()
  let currentPage = $state(data.currentPage)
</script>

<svelte:head>
  {#if !data.searchQuery}
    <title>검색</title>
  {:else}
    <title>‘{data.searchQuery?.replaceAll("' | '", ' ')}’ 검색 결과</title>
  {/if}
</svelte:head>

{#if !data.searchQuery}
  검색어를 입력해 주세요.
{:else if data.matches && data.matches.length > 0}
  <ul class="grid gap-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-2">
    {#each data.matches as match}
      <li></li>
    {/each}
  </ul>

  <Pagination.Root
    count={data.totalCount ?? 0}
    siblingCount={2}
    perPage={data.perPage}
    bind:page={currentPage}
    onPageChange={(page) => goto(`/search?q=${data.searchQuery}&=${page}`)}
    class="my-4"
  >
    {#snippet children({pages})}
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
