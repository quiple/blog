<script lang="ts">
  import '#app.css'
  import '#fonts.sass'
  import 'non.geist'
  import appleTouchIcon from '$lib/assets/apple-touch-icon.png'
  import favicon32 from '$lib/assets/favicon.png'
  import favicon from '$lib/assets/favicon.svg'
  import Header from '$lib/components/header.svelte'
  import {ModeWatcher} from 'mode-watcher'
  import {setupViewTransition} from 'sveltekit-view-transition'

  let {children} = $props()

  setupViewTransition()
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
    @apply px-4 sm:px-6 min-h-[calc(100vh-var(--header-height)-var(--footer-height))] pb-6 [--header-height:68px] sm:[--header-height:84px] md:-mt-(--header-height) md:pt-6
    :global(section)
      @apply [.hero+&]:pt-[calc(50vh-var(--header-height))] md:[.hero+&]:pt-[calc(50vh-1.5rem)]
      :global(.toc)
        @apply hidden lg:block
        :global(h2)
          @apply flex items-center text-sm font-semibold text-muted-foreground before:mask-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyLjc1IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXRhYmxlLW9mLWNvbnRlbnRzLWljb24gbHVjaWRlLXRhYmxlLW9mLWNvbnRlbnRzIj48cGF0aCBkPSJNMTYgNUgzIi8+PHBhdGggZD0iTTE2IDEySDMiLz48cGF0aCBkPSJNMTYgMTlIMyIvPjxwYXRoIGQ9Ik0yMSA1aC4wMSIvPjxwYXRoIGQ9Ik0yMSAxMmguMDEiLz48cGF0aCBkPSJNMjEgMTloLjAxIi8+PC9zdmc+')] before:bg-current before:size-3.5 before:block before:mask-contain before:mr-1
        :global(li)
          @apply hover:underline [&.active]:!font-bold [&.active]:hover:!text-current text-sm! mt-2 text-justify
      :global(article)
        @apply prose-shadcn max-w-xl 2xl:max-w-2xl w-full shrink-0
        :global(.metadata)
          @apply text-muted-foreground text-sm inline-block
          :global(a)
            @apply text-muted-foreground font-normal no-underline hover:underline
        :global(figure)
          @apply mx-auto [blockquote_&]:mx-0 max-w-fit flex flex-col items-start
          & > :global(div)
            @apply inner-border after:rounded-md rounded-md shadow-xs
        :global([target=_blank]:not(.metadata [target=_blank]))
          @apply after:content-['↗'] after:pr-px
        :global(.twitter-tweet)
          @apply mx-auto my-0!
        :global(iframe)
          @apply max-w-full w-xl 2xl:w-2xl
          color-scheme: initial
</style>
