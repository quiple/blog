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

<main
  class="flex flex-col justify-between items-start bg-white h-full w-full p-12 overflow-hidden relative"
  style="color: #09090b"
>
  <Q class="w-20 h-20" style="fill: #09090b" />
  {#if image}
    <img src={`https://blog.quiple.dev/img/${category}/${image}`} alt={title} />
  {/if}
  <h1
    class="font-bold text-6xl leading-tight -mb-3"
    style="white-space: normal; word-break: keep-all; word-wrap: break-word; text-wrap: pretty"
  >
    {title}
  </h1>
</main>
