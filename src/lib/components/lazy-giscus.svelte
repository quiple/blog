<script lang="ts">
  import {browser} from '$app/environment'
  import type {Component} from 'svelte'

  let container = $state<HTMLElement>()
  let Giscus = $state<Component | null>(null)

  async function loadGiscus() {
    if (Giscus) return
    Giscus = (await import('./giscus.svelte')).default
  }

  $effect(() => {
    if (!browser || !container || Giscus) return

    if (!('IntersectionObserver' in window)) {
      const timeoutId = setTimeout(loadGiscus, 1200)
      return () => clearTimeout(timeoutId)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        observer.disconnect()
        loadGiscus()
      },
      {rootMargin: '800px 0px'},
    )

    observer.observe(container)
    return () => observer.disconnect()
  })
</script>

<div bind:this={container}>
  {#if Giscus}
    <Giscus />
  {/if}
</div>
