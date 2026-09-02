<script lang="ts">
  import {cn, type WithElementRef} from '$lib/utils'
  import type {HTMLAttributes} from 'svelte/elements'

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLHeadingElement>> = $props()
</script>

<h1
  bind:this={ref}
  class={cn('mb-4 line-clamp-1 h-9 px-12 text-center text-lg leading-9 font-semibold break-all sm:mb-6', className)}
  {...restProps}
>
  {@render children?.()}
</h1>
