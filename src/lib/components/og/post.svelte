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
  class="flex flex-col justify-between items-start bg-white h-full w-full p-12"
  style:color={`#${imageForeground}`}
  style:font-family="Geist, 'IBM Plex Sans JP', 'IBM Plex Sans KR', sans-serif"
>
  {#if image}
    <img src={`${BASE_URL}/img/${category}/${image}`} alt={title} style="position: absolute;" />
  {/if}
  <Q class="w-20 h-20" fill={`#${imageForeground}`} />
  <h1
    class="font-bold text-6xl leading-tight -mb-3"
    style="white-space: normal; word-break: keep-all; word-wrap: break-word; text-wrap: pretty"
  >
    {title}
  </h1>
</main>
