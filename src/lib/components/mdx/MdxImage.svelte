<script lang="ts">
  import {Skeleton} from '$lib/components/ui/skeleton'
  import {cn} from '$lib/utils'

  let {
    src,
    alt = '',
    width,
    height,
    class: className,
    style,
    loading = 'lazy',
    decoding = 'async',
    ...restProps
  }: {
    src: string
    alt?: string
    width?: string | number
    height?: string | number
    class?: string
    style?: string
    loading?: 'lazy' | 'eager'
    decoding?: 'async' | 'auto' | 'sync'
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
  const aspectRatioStyle = width && height ? `aspect-ratio: ${width} / ${height};` : ''
  const mergedStyle = [aspectRatioStyle, style].filter(Boolean).join(' ')
</script>

<div class={cn('relative block w-full h-full', className)} style={mergedStyle}>
  {#if !loaded || error}
    <Skeleton class="absolute inset-0 w-full h-full rounded-md" />
  {/if}

  {#if !error}
    <img
      {src}
      {alt}
      {width}
      {height}
      {loading}
      {decoding}
      class={cn('block w-full h-full object-cover transition-opacity', !loaded ? 'opacity-0' : 'opacity-100')}
      onload={handleLoad}
      onerror={handleError}
      {...restProps}
    />
  {/if}
</div>
