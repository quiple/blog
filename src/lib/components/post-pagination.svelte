<script lang="ts">
  import * as Pagination from '$lib/components/ui/pagination/index.js'

  let {
    totalPages,
    perPage,
    currentPage,
    onPageChange,
  }: {
    totalPages: number
    perPage: number
    currentPage: number
    onPageChange: (page: number) => void
  } = $props()
</script>

{#if totalPages > 1}
  <Pagination.Root
    count={totalPages * perPage}
    siblingCount={2}
    {perPage}
    page={currentPage}
    {onPageChange}
    class="my-4"
  >
    {#snippet children({pages, currentPage: activePage})}
      <Pagination.Content>
        <Pagination.Item>
          <Pagination.PrevButton />
        </Pagination.Item>
        {#each pages as page (page.key)}
          <Pagination.Item>
            {#if page.type === 'ellipsis'}
              <Pagination.Ellipsis />
            {:else}
              <Pagination.Link
                class={activePage === page.value ? 'pointer-events-none' : undefined}
                {page}
                isActive={activePage === page.value}
              >
                {page.value}
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
