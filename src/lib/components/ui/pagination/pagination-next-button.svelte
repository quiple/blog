<script lang="ts">
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right'
  import {cn} from '$lib/utils.js'
  import {Pagination as PaginationPrimitive} from 'bits-ui'
  import {buttonVariants} from '../button/index.js'

  let {
    ref = $bindable(null),
    class: className,
    size = 'icon-lg',
    children,
    ...restProps
  }: PaginationPrimitive.NextButtonProps & {size?: ButtonSize} = $props()
</script>

{#snippet Fallback()}
  <span>다음</span>
  <ChevronRightIcon class="size-4" />
{/snippet}

<PaginationPrimitive.NextButton
  bind:ref
  aria-label="다음 페이지로 이동"
  class={cn(buttonVariants({variant: 'ghost', size}), 'pr-1.5!', className)}
  {...restProps}
>
  {#if children}
    {@render children?.()}
  {:else}
    {@render Fallback()}
  {/if}
</PaginationPrimitive.NextButton>
