<script lang="ts">
  import {Skeleton} from '$lib/components/ui/skeleton'
  import {cn} from 'cn'

  let {
    src,
    srcset,
    sizes,
    alt = '',
    width,
    height,
    class: className,
    style,
    loading = 'lazy',
    decoding = 'async',
    fullSize = false,
    ...restProps
  }: {
    src: string
    srcset?: string
    sizes?: string
    alt?: string
    width?: string | number
    height?: string | number
    class?: string
    style?: string
    loading?: 'lazy' | 'eager'
    decoding?: 'async' | 'auto' | 'sync'
    fullSize?: boolean
    [key: string]: any
  } = $props()

  let loaded = $state(false)
  let error = $state(false)

  function handleLoad() {
    loaded = true
  }

  function handleError() {
    error = true
  }
  const aspectRatioStyle = $derived(width && height ? `aspect-ratio: ${width} / ${height};` : '')
  const mergedStyle = $derived([aspectRatioStyle, style].filter(Boolean).join(' '))
</script>

<div class={cn('relative block', className, (!loaded || error) && 'shadow-none')} style={mergedStyle}>
  {#if !loaded || error}
    <Skeleton class="absolute inset-0 h-full w-full rounded-lg" />
  {/if}

  <img
    {src}
    {srcset}
    {sizes}
    {alt}
    {width}
    {height}
    {loading}
    {decoding}
    class={cn(
      'block object-cover transition-opacity',
      !loaded || error ? 'opacity-0' : 'opacity-100',
      fullSize ? 'h-full w-full' : 'h-auto max-h-full',
    )}
    onload={handleLoad}
    onerror={handleError}
    {...restProps}
  />
</div>
