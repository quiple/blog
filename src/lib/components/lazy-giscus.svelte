<script lang="ts">
  import {browser} from '$app/environment'
  import type {Component} from 'svelte'

  let container = $state<HTMLElement>()
  let Giscus = $state<Component | null>(null)

  $effect(() => {
    if (!browser || !container || Giscus) return
    let cancelled = false

    async function loadGiscus() {
      const component = (await import('./giscus.svelte')).default
      if (!cancelled) Giscus = component
    }

    if (!('IntersectionObserver' in window)) {
      const timeoutId = setTimeout(() => void loadGiscus(), 1200)
      return () => {
        cancelled = true
        clearTimeout(timeoutId)
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        observer.disconnect()
        void loadGiscus()
      },
      {rootMargin: '800px 0px'},
    )

    observer.observe(container)
    return () => {
      cancelled = true
      observer.disconnect()
    }
  })
</script>

<div bind:this={container}>
  {#if Giscus}
    <Giscus />
  {/if}
</div>
