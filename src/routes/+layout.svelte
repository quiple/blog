<script lang="ts">
  import '#app.css'
  import '#fonts.sass'
  import favicon from '$lib/assets/favicon.svg'
  import Footer from '$lib/components/footer.svelte'
  import Header from '$lib/components/header.svelte'
  import {ModeWatcher} from 'mode-watcher'

  let {children} = $props()
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<ModeWatcher />

<Header />

{@render children()}
