<script lang="ts">
  import '#app.css'
  import '#fonts.sass'
  import 'non.geist'
  import favicon from '$lib/assets/favicon.svg'
  import Header from '$lib/components/header.svelte'
  import {ModeWatcher} from 'mode-watcher'

  let {children} = $props()
</script>

<svelte:head>
  <link rel="icon" type="image/png" sizes="32x32" href="/img/q-32.png" />
  <link rel="icon" type="image/svg+xml" sizes="any" href="/img/q.svg" />
  <link rel="apple-touch-icon" type="image/png" href="/img/q.png" />
</svelte:head>

<ModeWatcher />

<Header />

<main class="container-x">
  {@render children()}
</main>

<style lang="sass">
  @reference '#app.css'

  main
    @apply min-h-[calc(100vh-var(--header-height)-var(--footer-height))] pb-8
</style>
