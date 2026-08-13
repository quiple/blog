<script lang="ts">
  import '#app.css'
  import '#fonts.sass'
  import '@quiple/blog-fonts'
  import {browser} from '$app/environment'
  import {onNavigate} from '$app/navigation'
  import appleTouchIcon from '$lib/assets/apple-touch-icon.png'
  import astaSansUrl from '@quiple/blog-fonts/fonts/AstaSans.woff2?url'
  import favicon32 from '$lib/assets/favicon.png'
  import favicon from '$lib/assets/favicon.svg'
  import Header from '$lib/components/header.svelte'
  import {ModeWatcher} from 'mode-watcher'
  import {setupViewTransition} from '$lib/view-transition'

  let {children} = $props()

  if (browser) {
    onNavigate((navigation) => {
      if (navigation.type === 'popstate') {
        const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
        if (isIOS) {
          const original = document.startViewTransition
          // @ts-ignore
          document.startViewTransition = undefined
          setTimeout(() => {
            // @ts-ignore
            document.startViewTransition = original
          }, 0)
        }
      }
    })
  }

  setupViewTransition()
</script>

<svelte:head>
  <link rel="icon" type="image/png" sizes="32x32" href={favicon32} />
  <link rel="icon" type="image/svg+xml" sizes="any" href={favicon} />
  <link rel="apple-touch-icon" type="image/png" href={appleTouchIcon} />
  <link rel="preload" href={astaSansUrl} as="font" type="font/woff2" crossorigin="anonymous" />
  <meta property="og:locale" content="ko_KR" />
  <meta property="og:site_name" content="quiple" />
  <script
    async
    src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7072683555331245"
    crossorigin="anonymous"
  ></script>
</svelte:head>

<ModeWatcher />

<Header />

<main>
  {@render children()}
</main>

<style lang="sass">
  @reference '#app.css'

  :root
    --hero-height: calc(100svh / 3 * 2)
    @apply [--header-height:68px] sm:[--header-height:84px]
  main
    @apply px-4 sm:px-6 min-h-[calc(100dvh-var(--header-height)-var(--footer-height))] pb-6 md:-mt-(--header-height) md:pt-6
    :global(.page-title)
      @apply mb-4 px-12 sm:mb-6 h-9 leading-9 text-center line-clamp-1 font-semibold text-lg
    :global(section)
      @apply [.hero+&]:pt-[calc(var(--hero-height)-var(--header-height))] md:[.hero+&]:pt-[calc(var(--hero-height)-1.5rem)] print:[.hero+&]:pt-[calc(56.25vw-var(--header-height))] print:md:[.hero+&]:pt-[calc(56.25vw-1.5rem)]
      :global(article)
        @apply z-10 prose-shadcn max-w-xl 2xl:max-w-2xl w-full shrink-0
        :global(.metadata)
          @apply text-muted-foreground text-sm inline-block
          :global(a)
            @apply text-muted-foreground font-normal no-underline hover:text-foreground transition
        :global(figure)
          @apply mx-auto [blockquote_&]:mx-0 max-w-fit flex flex-col items-start
        :global([target=_blank]:not(.metadata [target=_blank]))
          @apply after:content-['↗'] after:pr-px
        :global(.twitter-tweet)
          @apply mx-auto my-0!
        :global(iframe)
          @apply max-w-full w-xl 2xl:w-2xl
          color-scheme: initial
        :global(.footnotes)
          @apply text-sm 2xl:text-base leading-6 border-t pt-4 mt-6
          :global(p)
            @apply leading-6 my-2 2xl:text-base
</style>
