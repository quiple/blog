<script lang="ts">
  import '#app.css'
  import '#fonts.sass'
  import 'non.geist'
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
    :global(article)
      @apply prose-shadcn max-w-xl 2xl:max-w-2xl mx-auto text-justify
      :global(.metadata)
        @apply text-muted-foreground text-sm
        :global(a)
          @apply text-muted-foreground font-normal
      :global(figure)
        @apply mx-auto max-w-fit flex flex-col items-start
        & > :global(div)
          @apply inner-border after:rounded-md rounded-md shadow-xs
      :global([target=_blank])
        @apply after:content-['↗'] after:px-0.5
</style>
