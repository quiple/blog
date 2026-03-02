<script lang="ts">
  import Q from '$lib/components/q.svelte'

  export let title: string = ''
  export let image: string | undefined = undefined
</script>

<main
  class="flex flex-col justify-center items-center bg-white h-full w-full"
  style="color: oklch(0.141 0.005 285.823)"
>
  <Q />
  <div class="mt-8 text-5xl font-bold text-center max-w-[800px] leading-tight flex justify-center">{title}</div>
</main>
