<script lang="ts">
  import type {ComponentProps} from 'svelte'
  import {Separator} from '$lib/components/ui/separator/index.js'
  import {cn} from 'cn'

  let {ref = $bindable(null), class: className, ...restProps}: ComponentProps<typeof Separator> = $props()
</script>

<Separator
  bind:ref
  data-slot="select-separator"
  class={cn('pointer-events-none -mx-1 my-1 h-px bg-border', className)}
  {...restProps}
/>
