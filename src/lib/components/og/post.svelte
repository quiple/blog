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
  style="background-size: cover"
  style:background-image={image && `url(${BASE_URL}/img/${category}/${image})`}
  style:color={imageForeground ? `#${imageForeground}` : '#09090b'}
>
  <Q class="w-20 h-20" fill={imageForeground ? `#${imageForeground}` : '#09090b'} />
  <h1
    class="font-bold text-6xl leading-tight -mb-3"
    style="white-space: normal; word-break: keep-all; word-wrap: break-word; text-wrap: pretty"
  >
    {title}
  </h1>
</main>
