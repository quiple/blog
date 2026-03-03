<svelte:options css="injected" />

<script lang="ts">
  import Q from '$lib/components/q.svelte'
  import {BASE_URL} from '$lib/constants'

  type Props = {
    title: string
    category: string
    image?: string
    imageForeground?: string
  }

  let {title, category, image, imageForeground}: Props = $props()
</script>

<main
  class="bg-white h-full w-full"
  style:color={`#${imageForeground}`}
  style:font-family="Geist, 'IBM Plex Sans JP', 'IBM Plex Sans KR', sans-serif"
>
  {#if image}
    <img
      src={`${BASE_URL}/img/${category}/${image}`}
      alt={title}
      class="h-full w-full"
      style="position: absolute; object-fit: cover; object-position: center"
    />
  {/if}
  <div class="flex flex-col justify-between items-start h-full w-full p-12">
    <Q class="w-20 h-20" fill={`#${imageForeground}`} />
    <h1 class="font-bold text-6xl leading-tight -mb-3" style="word-break: keep-all">
      {title}
    </h1>
  </div>
</main>
