<script lang="ts">
  import Q from '$lib/components/q.svelte'

  let {
    title = '',
    image = '',
    imageForeground = '',
  }: {title: string; image?: string; imageForeground?: string} = $props()
</script>

<main
  class="flex flex-col justify-between items-start bg-white h-full w-full p-12"
  style="color: oklch(0.141 0.005 285.823); font-feature-settings: 'palt' 1, 'ss01' 1, 'ss03' 1"
  style:background-image={image && `url('${image}')`}
>
  <Q class="w-20 h-20" />
  <h1 class="font-bold text-6xl leading-tight -mb-3">{image}</h1>
</main>
