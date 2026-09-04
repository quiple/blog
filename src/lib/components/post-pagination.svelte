<script lang="ts">
  import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left'
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right'
  import MoreHorizontalIcon from '@lucide/svelte/icons/more-horizontal'
  import {Button} from '$lib/components/ui/button/index.js'

  type PageItem = {type: 'page'; value: number; key: string} | {type: 'ellipsis'; key: string}

  function getPageItems(page: number, totalPages: number, siblingCount = 2): PageItem[] {
    const pagesToShow = new Set([1, totalPages])
    const firstItemWithSiblings = 3 + siblingCount
    const lastItemWithSiblings = totalPages - 2 - siblingCount

    if (firstItemWithSiblings > lastItemWithSiblings) {
      for (let value = 2; value <= totalPages - 1; value++) pagesToShow.add(value)
    } else if (page < firstItemWithSiblings) {
      for (let value = 2; value <= Math.min(firstItemWithSiblings, totalPages); value++) pagesToShow.add(value)
    } else if (page > lastItemWithSiblings) {
      for (let value = totalPages - 1; value >= Math.max(lastItemWithSiblings, 2); value--) pagesToShow.add(value)
    } else {
      for (let value = Math.max(page - siblingCount, 2); value <= Math.min(page + siblingCount, totalPages); value++) {
        pagesToShow.add(value)
      }
    }

    const items: PageItem[] = []
    let lastPage = 0
    for (const value of [...pagesToShow].sort((a, b) => a - b)) {
      if (value - lastPage > 1) items.push({type: 'ellipsis', key: `ellipsis-${lastPage}`})
      items.push({type: 'page', value, key: `page-${value}`})
      lastPage = value
    }
    return items
  }

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

  const pages = $derived(getPageItems(currentPage, totalPages))
</script>

{#if totalPages > 1}
  <nav class="my-4 flex w-full justify-center" aria-label="페이지 나누기">
    <ul class="flex items-center gap-0.5">
      <li>
        <Button
          variant="ghost"
          class="pl-1.5!"
          aria-label="이전 페이지로 이동"
          disabled={currentPage <= 1}
          onclick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeftIcon class="size-4" />
          <span>이전</span>
        </Button>
      </li>
      {#each pages as page (page.key)}
        <li>
          {#if page.type === 'ellipsis'}
            <span class="flex size-8 items-center justify-center" aria-hidden="true">
              <MoreHorizontalIcon class="size-4" />
              <span class="sr-only">생략된 페이지</span>
            </span>
          {:else}
            <Button
              size="icon"
              variant={currentPage === page.value ? 'outline' : 'ghost'}
              class={currentPage === page.value ? 'pointer-events-none' : undefined}
              aria-label={`${page.value}페이지로 이동`}
              aria-current={currentPage === page.value ? 'page' : undefined}
              onclick={() => onPageChange(page.value)}
            >
              {page.value}
            </Button>
          {/if}
        </li>
      {/each}
      <li>
        <Button
          variant="ghost"
          class="pr-1.5!"
          aria-label="다음 페이지로 이동"
          disabled={currentPage >= totalPages}
          onclick={() => onPageChange(currentPage + 1)}
        >
          <span>다음</span>
          <ChevronRightIcon class="size-4" />
        </Button>
      </li>
    </ul>
  </nav>
{/if}
