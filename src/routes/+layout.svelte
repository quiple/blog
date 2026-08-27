<script lang="ts">
  import '#app.css'
  import '#fonts.css'
  import '@quiple/aster/astr.css'
  import 'inter-ui/inter-variable.css'
  import appleTouchIcon from '$lib/assets/apple-touch-icon.png'
  import astrUrl from '@quiple/aster/fonts/Astr[opsz,wght].woff2?url'
  import Header from '$lib/components/header.svelte'
  import {ModeWatcher} from 'mode-watcher'
  import {setupViewTransition} from '$lib/view-transition'

  let {children} = $props()

  setupViewTransition()
</script>

<svelte:head>
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
  <link rel="icon" type="image/svg+xml" sizes="any" href="/favicon.svg" />
  <link rel="apple-touch-icon" type="image/png" href={appleTouchIcon} />
  <link rel="preload" href={astrUrl} as="font" type="font/woff2" crossorigin="anonymous" />
  <meta property="og:locale" content="ko_KR" />
  <meta property="og:site_name" content="quiple" />
</svelte:head>

<ModeWatcher />

<Header />

<main>
  {@render children()}
</main>

<style>
  @charset "UTF-8";
  @reference '#app.css';
  :root {
    --hero-height: calc(100svh / 3 * 2);
    @apply [--header-height:68px] sm:[--header-height:84px];
  }

  main {
    @apply min-h-[calc(100dvh-var(--header-height)-var(--footer-height))] px-4 pb-6 sm:px-6 md:-mt-(--header-height) md:pt-6;
  }
  main :global(section) {
    @apply [.hero+&]:pt-[calc(var(--hero-height)-var(--header-height))] md:[.hero+&]:pt-[calc(var(--hero-height)-1.5rem)] print:[.hero+&]:pt-[calc(56.25vw-var(--header-height))] print:md:[.hero+&]:pt-[calc(56.25vw-1.5rem)];
  }
  main :global(section) :global(article) {
    @apply prose-shadcn z-10 w-full max-w-xl shrink-0 2xl:max-w-2xl;
  }
  main :global(section) :global(article) :global(.metadata) {
    @apply inline-block text-sm text-muted-foreground;
  }
  main :global(section) :global(article) :global(.metadata) :global(a) {
    @apply font-normal text-muted-foreground no-underline transition hover:text-foreground;
  }
  main :global(section) :global(article) :global(figure) {
    @apply mx-auto flex w-fit max-w-full min-w-0 flex-col items-start [blockquote_&]:mx-0;
  }
  main :global(section) :global(article) :global(figure > figcaption) {
    @apply w-full max-w-full min-w-0;
  }
  main :global(section) :global(article) :global([target='_blank']:not(.metadata [target='_blank'])) {
    @apply after:pr-px after:content-['↗'];
  }
  main :global(section) :global(article) :global(.twitter-tweet) {
    @apply mx-auto my-0!;
  }
  main :global(section) :global(article) :global(iframe) {
    @apply w-xl max-w-full 2xl:w-2xl;
    color-scheme: initial;
  }
  main :global(section) :global(article) :global(.footnotes) {
    @apply mt-6 border-t pt-4 text-sm leading-5 sm:leading-6 2xl:text-base;
  }
  main :global(section) :global(article) :global(.footnotes) :global(p) {
    @apply my-2 leading-5 sm:leading-6 2xl:text-base;
  }
</style>
