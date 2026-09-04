<script lang="ts">
  import type {WithoutChildren, WithElementRef} from '$lib/utils.js'
  import {cn} from 'cn'
  import type {HTMLAttributes} from 'svelte/elements'

  type SeparatorProps = WithoutChildren<WithElementRef<HTMLAttributes<HTMLDivElement>, HTMLDivElement>> & {
    orientation?: 'horizontal' | 'vertical'
    decorative?: boolean
  }

  let {
    ref = $bindable(null),
    class: className,
    'data-slot': dataSlot = 'separator',
    orientation = 'horizontal',
    decorative = false,
    ...restProps
  }: SeparatorProps = $props()
</script>

<div
  bind:this={ref}
  role={decorative ? 'none' : 'separator'}
  aria-hidden={decorative ? 'true' : undefined}
  aria-orientation={decorative ? undefined : orientation}
  data-slot={dataSlot}
  data-orientation={orientation}
  class={cn(
    'shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px',
    // this is different in shadcn/ui but self-stretch breaks things for us
    'data-[orientation=vertical]:h-full',
    className,
  )}
  {...restProps}
></div>
