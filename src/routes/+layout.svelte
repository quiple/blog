<script lang="ts">
  import '#app.css'
  import '#fonts.sass'
  import 'non.geist'
  import favicon32 from '$lib/assets/q-32.png'
  import appleTouchIcon from '$lib/assets/q.png'
  import favicon from '$lib/assets/q.svg'
  import Header from '$lib/components/header.svelte'
  import {ModeWatcher} from 'mode-watcher'

  let {children} = $props()
</script>

<svelte:head>
  <link rel="icon" type="image/png" sizes="32x32" href={favicon32} />
  <link rel="icon" type="image/svg+xml" sizes="any" href={favicon} />
  <link rel="apple-touch-icon" type="image/png" href={appleTouchIcon} />
  <meta property="og:locale" content="ko_KR" />
  <meta property="og:site_name" content="quiple" />
</svelte:head>

<ModeWatcher />

<Header />

<main>
  {@render children()}
</main>

<style lang="sass">
  @reference '#app.css'

  main
    @apply container-x min-h-[calc(100vh-var(--header-height)-var(--footer-height))] pb-8 [--header-height:68px] sm:[--header-height:84px] md:-mt-(--header-height) md:pt-6
    :global(article)
      @apply prose-shadcn max-w-xl 2xl:max-w-2xl mx-auto [.hero+&]:pt-[calc(50vh-var(--header-height))] md:[.hero+&]:pt-[calc(50vh-1.5rem)]
      :global(.metadata)
        @apply text-muted-foreground text-sm
        :global(a)
          @apply text-muted-foreground font-normal
      :global(figure)
        @apply mx-auto max-w-fit flex flex-col items-start
        & > :global(div)
          @apply inner-border after:rounded-md rounded-md shadow-xs
      :global([target=_blank]:not(.metadata [target=_blank]))
        @apply after:content-['↗'] after:px-0.5
      :global(.twitter-tweet)
        @apply mx-auto my-0!
        :global(iframe)
          color-scheme: initial
</style>
