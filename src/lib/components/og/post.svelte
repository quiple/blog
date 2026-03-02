<svelte:options css="injected" />

<script lang="ts">
  import Q from '$lib/components/q.svelte'

  let {title, image, imageForeground}: {title: string; image?: string; imageForeground?: string} = $props()
</script>

<main class="flex flex-col justify-between items-start bg-white h-full w-full p-12 overflow-hidden relative">
  <Q class="w-20 h-20" />
  <h1 class="font-bold text-6xl leading-tight -mb-3">{title}</h1>
</main>
