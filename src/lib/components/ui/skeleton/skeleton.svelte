<script lang="ts">
  import type {WithElementRef, WithoutChildren} from '$lib/utils.js'
  import {cn} from 'cn'
  import type {HTMLAttributes} from 'svelte/elements'

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: WithoutChildren<WithElementRef<HTMLAttributes<HTMLDivElement>>> = $props()
</script>

<div
  bind:this={ref}
  data-slot="skeleton"
  class={cn('animate-pulse rounded-md bg-muted', className)}
  {...restProps}
></div>
