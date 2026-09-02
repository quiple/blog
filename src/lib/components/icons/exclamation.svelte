<script lang="ts">
  import type {SVGAttributes} from 'svelte/elements'
  import {cn} from '$lib/utils'

  let {
    filled = false,
    size = 24,
    class: className,
    strokeWidth = 2,
    ...restProps
  }: SVGAttributes<SVGSVGElement> & {
    filled?: boolean
    size?: number | string
    strokeWidth?: number
  } = $props()
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill={filled ? 'currentColor' : 'none'}
  stroke="currentColor"
  stroke-width={strokeWidth}
  stroke-linecap="round"
  stroke-linejoin="miter"
  class={cn('lucide lucide-chevron-up-icon lucide-chevron-up', className)}
  {...restProps}
>
  <path d="M12 4L12 13" />
  <path d="M12 20H12.01" />
</svg>
