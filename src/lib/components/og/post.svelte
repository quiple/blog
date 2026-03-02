<svelte:options css="injected" />

<script lang="ts">
  import Q from '$lib/components/q.svelte'

  type Props = {
    title: string
    category: string
    image?: string
    imageForeground?: string
  }

  let {title, category, image, imageForeground}: Props = $props()
</script>

<main class="flex flex-col justify-between items-start bg-white h-full w-full p-12 overflow-hidden relative break-keep">
  <Q class="w-20 h-20" />
  <!-- <img src="/img/font/x12y12pxMaruMinyaHangul.png" alt={title} /> -->
  <h1 class="font-bold text-6xl leading-tight -mb-3 break-keep">{title}</h1>
</main>
