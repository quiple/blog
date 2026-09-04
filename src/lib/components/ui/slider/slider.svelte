<script lang="ts">
  import type {WithElementRef} from '$lib/utils.js'
  import {cn} from 'cn'
  import type {HTMLInputAttributes} from 'svelte/elements'

  type SliderProps = Omit<
    WithElementRef<HTMLInputAttributes, HTMLInputElement>,
    'type' | 'value' | 'children' | 'orientation'
  > & {
    type?: 'single'
    value?: number
    orientation?: 'horizontal'
  }

  let {
    ref = $bindable(null),
    value = $bindable(0),
    orientation = 'horizontal',
    type = 'single',
    min = 0,
    max = 100,
    style,
    class: className,
    ...restProps
  }: SliderProps = $props()

  const progress = $derived.by(() => {
    const minimum = Number(min)
    const maximum = Number(max)
    if (maximum <= minimum) return 0
    return Math.min(100, Math.max(0, ((Number(value) - minimum) / (maximum - minimum)) * 100))
  })
</script>

<input
  {...restProps}
  bind:this={ref}
  bind:value
  type="range"
  {min}
  {max}
  aria-orientation={orientation}
  data-slider-type={type}
  data-slot="slider"
  data-orientation={orientation}
  style={`${style ?? ''}; --slider-progress: ${progress}%`}
  class={cn(
    'native-slider h-4 w-full cursor-pointer touch-none bg-transparent outline-none select-none disabled:cursor-not-allowed disabled:opacity-50',
    className,
  )}
/>

<style>
  .native-slider {
    appearance: none;
  }
  .native-slider::-webkit-slider-runnable-track {
    height: 0.25rem;
    border-radius: 9999px;
    background: linear-gradient(
      to right,
      var(--color-primary) 0 var(--slider-progress),
      var(--color-muted) var(--slider-progress) 100%
    );
  }
  .native-slider::-webkit-slider-thumb {
    width: 0.75rem;
    height: 0.75rem;
    margin-top: -0.25rem;
    appearance: none;
    border: 1px solid var(--color-ring);
    border-radius: 9999px;
    background: white;
    transition: box-shadow 150ms;
  }
  .native-slider::-moz-range-track {
    height: 0.25rem;
    border-radius: 9999px;
    background: var(--color-muted);
  }
  .native-slider::-moz-range-progress {
    height: 0.25rem;
    border-radius: 9999px;
    background: var(--color-primary);
  }
  .native-slider::-moz-range-thumb {
    width: 0.75rem;
    height: 0.75rem;
    border: 1px solid var(--color-ring);
    border-radius: 9999px;
    background: white;
    transition: box-shadow 150ms;
  }
  .native-slider:hover::-webkit-slider-thumb,
  .native-slider:focus-visible::-webkit-slider-thumb,
  .native-slider:active::-webkit-slider-thumb {
    box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-ring) 50%, transparent);
  }
  .native-slider:hover::-moz-range-thumb,
  .native-slider:focus-visible::-moz-range-thumb,
  .native-slider:active::-moz-range-thumb {
    box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-ring) 50%, transparent);
  }
</style>
