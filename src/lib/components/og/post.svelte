<svelte:options css="injected" />

<script lang="ts">
  import Q from '$lib/components/q.svelte'
  import {BASE_URL} from '$lib/constants'
  import {getCategoryName} from '$lib/utils'

  type Props = {
    title: string
    category: string
    image?: string
    imageForeground?: string
  }

  let {title, category, image, imageForeground}: Props = $props()

  const isProd = import.meta.env.PROD
  const baseUrl = isProd ? 'https://quiple.dev' : ''
</script>

<main
  class="h-full w-full bg-white"
  style:color={`#${imageForeground}`}
  style:font-family="Geista, 'IBM Plex Sans JP', 'IBM Plex Sans KR', sans-serif"
>
  {#if image}
    {@const rawSrc = `https://quiple.dev/img/${image}`}
    {@const src = isProd ? `https://quiple.dev/cdn-cgi/image/h=630,f=png/${rawSrc}` : rawSrc}
    <img
      {src}
      alt={title}
      class="h-full w-full"
      style="position: absolute; object-fit: cover; object-position: center"
    />
  {/if}
  <div class="flex h-full w-full flex-col items-start justify-between p-12">
    <Q class="h-20 w-20" fill={`#${imageForeground}`} />
    <div class="flex w-full flex-col items-start">
      <span class="-mb-2.5 rounded-full px-3 py-0.5 text-2xl text-white" style:background-color="#27272a"
        >{getCategoryName(category)}</span
      >
      <h1 class="-mb-3 text-6xl leading-tight font-semibold" style="word-break: keep-all">
        {title}
      </h1>
    </div>
  </div>
</main>
