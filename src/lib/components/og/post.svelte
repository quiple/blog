<svelte:options css="injected" />

<script lang="ts">
  import Q from '$lib/components/q.svelte'
  import {BASE_URL} from '$lib/constants'
  import {getCategoryName, getImageUrl} from '$lib/utils'

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
  class="bg-white h-full w-full"
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
  <div class="flex flex-col justify-between items-start h-full w-full p-12">
    <Q class="w-20 h-20" fill={`#${imageForeground}`} />
    <div class="flex flex-col items-start w-full">
      <span class="px-3 py-0.5 text-white rounded-full text-2xl -mb-2.5" style:background-color="#27272a"
        >{getCategoryName(category)}</span
      >
      <h1 class="font-bold text-6xl leading-tight -mb-3" style="word-break: keep-all">
        {title}
      </h1>
    </div>
  </div>
</main>
