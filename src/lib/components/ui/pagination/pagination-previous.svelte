<script lang="ts">
  import type {ComponentProps} from 'svelte'
  import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left'
  import {cn} from '$lib/utils.js'
  import {PaginationLink} from './index.js'

  type PaginationPreviousProps = ComponentProps<typeof PaginationLink>

  let {class: className, ...restProps}: PaginationPreviousProps = $props()
</script>

<PaginationLink aria-label="Go to previous page" size="default" class={cn('pl-1.5!', className)} {...restProps}>
  <ChevronLeftIcon data-icon="inline-start" />
  <span class="cn-pagination-previous-text hidden sm:block">이전</span>
</PaginationLink>
