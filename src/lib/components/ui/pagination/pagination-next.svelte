<script lang="ts">
  import type {ComponentProps} from 'svelte'
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right'
  import {cn} from '$lib/utils.js'
  import {PaginationLink} from './index.js'

  type PaginationNextProps = ComponentProps<typeof PaginationLink>

  let {class: className, ...restProps}: PaginationNextProps = $props()
</script>

<PaginationLink aria-label="Go to next page" size="default" class={cn('pr-1.5!', className)} {...restProps}>
  <span class="cn-pagination-next-text hidden sm:block">다음</span>
  <ChevronRightIcon data-icon="inline-end" />
</PaginationLink>
