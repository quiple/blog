<script lang="ts">
  import {Menu, Monitor, Moon, Search, Sun} from '@lucide/svelte'
  import {afterNavigate, beforeNavigate, goto} from '$app/navigation'
  import {page} from '$app/state'
  import {onDestroy, onMount} from 'svelte'
  import svgGradeDown from '$lib/assets/logo-grade-down.svg'
  import svgOutline from '$lib/assets/logo-outline.svg'
  import menu from '$lib/assets/menu.svg'
  import wordmarkGradeDown from '$lib/assets/wordmark-gradedown.svg'
  import wordmark from '$lib/assets/wordmark.svg'
  import Q from '$lib/components/q.svelte'
  import {Button} from '$lib/components/ui/button/index'
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index'
  import {Input} from '$lib/components/ui/input/index'
  import * as Tabs from '$lib/components/ui/tabs/index.js'
  import {setMode, userPrefersMode} from 'mode-watcher'
  import {setupViewTransition} from '$lib/view-transition'

  let query = $state('')
  let inputElement = $state<HTMLInputElement | null>(null)
  let menuOpen = $state(false)
  let fontFamilyMode = $state<'theme' | 'system'>('theme')
  let overrideTimer: ReturnType<typeof setTimeout> | undefined

  const fontFamilyStorageKey = 'font-family'

  const setFontFamilyMode = (mode: 'theme' | 'system') => {
    fontFamilyMode = mode

    if (mode === 'system') {
      document.documentElement.dataset.fontFamily = 'system'
      localStorage.setItem(fontFamilyStorageKey, mode)
    } else {
      delete document.documentElement.dataset.fontFamily
      localStorage.setItem(fontFamilyStorageKey, mode)
    }
  }

  const isPostPath = (pathname: string) =>
    pathname.startsWith('/blog/') || pathname.startsWith('/article/') || pathname.startsWith('/font/')

  let isHomePage = $derived(page.url.pathname === '/')
  let isPostPage = $derived(isPostPath(page.url.pathname))
  let overrideScrollY = $state<number | null>(null)
  let hasHeroImage = $derived(isPostPage && !!page.data?.image)

  let heroForeground = $derived(hasHeroImage ? `#${page.data?.imageForeground?.toString() ?? '09090b'}` : null)
  let heroOutline = $derived(isPostPage && page.data?.outline ? `#${page.data.outline.toString()}` : null)

  // Track navigation direction
  let navigatingFromNonPostToPost = $state(false)
  let lockedHeaderClassName = $state<string | null>(null)

  let isH1Visible = $state(true)
  let isHeroVisible = $state(true)
  let actualHeaderClassName = $derived.by(() => {
    if (hasHeroImage && (isHeroVisible || overrideScrollY === 0)) return 'hero'
    if (!hasHeroImage && isPostPage && (isH1Visible || overrideScrollY === 0)) return 'title-hidden'
    return ''
  })
  let headerClassName = $derived(lockedHeaderClassName ?? actualHeaderClassName)
  let usesGradeDownLogo = $derived(
    headerClassName === 'hero' &&
      (heroForeground?.toLowerCase() === '#fff' || heroForeground?.toLowerCase() === '#ffffff'),
  )

  const {transition} = setupViewTransition()
  const onKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && inputElement && document.activeElement === inputElement) {
      const trimmed = query.trim()
      goto(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search')
    }
  }

  $effect(() => {
    const q = page.url.searchParams.get('q')
    query = q?.replaceAll('+', ' ') || ''
  })

  $effect(() => {
    if (!isPostPage || !hasHeroImage) {
      isHeroVisible = false
      return
    }

    const hero = document.querySelector('.hero.bg')
    if (!hero) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        isHeroVisible = entry.isIntersecting
      },
      {rootMargin: '-42px 0px 0px 0px'},
    )
    observer.observe(hero)
    return () => observer.disconnect()
  })

  $effect(() => {
    if (!isPostPage || hasHeroImage) {
      isH1Visible = false
      return
    }

    const h1 = document.querySelector('article h1')
    if (h1) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          isH1Visible = entry.isIntersecting
        },
        {threshold: 0},
      )
      observer.observe(h1)
      return () => observer.disconnect()
    }
  })

  beforeNavigate((nav) => {
    const fromPath = nav.from?.url.pathname ?? ''
    const toPath = nav.to?.url.pathname ?? ''
    const fromIsPostPath = isPostPath(fromPath)
    const toIsPostPath = isPostPath(toPath)

    if (nav.type !== 'popstate') overrideScrollY = toIsPostPath ? 0 : null
    lockedHeaderClassName = nav.type !== 'popstate' && fromIsPostPath && !toIsPostPath ? actualHeaderClassName : null
    navigatingFromNonPostToPost = !fromIsPostPath && toIsPostPath
  })

  afterNavigate(() => {
    menuOpen = false
    lockedHeaderClassName = null
    navigatingFromNonPostToPost = false
    clearTimeout(overrideTimer)
    overrideTimer = setTimeout(() => {
      overrideScrollY = null
    }, 100)
  })

  onMount(() => {
    const savedFontFamilyMode = localStorage.getItem(fontFamilyStorageKey)
    setFontFamilyMode(savedFontFamilyMode === 'system' ? 'system' : 'theme')
  })

  onDestroy(() => clearTimeout(overrideTimer))
</script>

<svelte:window on:keydown={onKeydown} />

<header
  class={headerClassName}
  class:grade-down-logo={usesGradeDownLogo}
  use:transition={'header'}
  style:--hero-foreground={heroForeground ?? undefined}
  style:--outline-color={heroOutline ?? undefined}
>
  <section>
    <div class="flex w-full items-center gap-4">
      <a
        href="/"
        class:home-logo={isHomePage}
        class="logo"
        aria-label="홈"
        style={`--svg-outline: url("${svgOutline}"); --svg-grade-down: url("${svgGradeDown}"); --wordmark: url("${wordmark}"); --wordmark-grade-down: url("${wordmarkGradeDown}")`}
      >
        <span class="logo-symbol" use:transition={'header-logo-symbol'}>
          <Q class="q-logo size-full dark:hidden" />
          <span
            class="q-logo-grade-down absolute inset-0 hidden bg-current mask-(--svg-grade-down) mask-contain mask-center mask-no-repeat dark:block"
            aria-hidden="true"
          ></span>
          {#if isHomePage}
            <span class="wordmark-symbol" aria-hidden="true">
              <span class="wordmark-image wordmark-light dark:hidden"></span>
              <span class="wordmark-image wordmark-grade-down hidden dark:block"></span>
            </span>
          {/if}
        </span>
        {#if isHomePage}
          <span class="wordmark-rest" aria-hidden="true" use:transition={'header-wordmark-rest'}>
            <span class="wordmark-image wordmark-light dark:hidden"></span>
            <span class="wordmark-image wordmark-grade-down hidden dark:block"></span>
          </span>
        {/if}
      </a>
      {#if isPostPage && page.data.title}
        <div class="post-title {navigatingFromNonPostToPost ? 'transition-none!' : ''}" title={page.data.title}>
          {page.data.title}
        </div>
      {/if}
    </div>

    <div class="flex gap-2">
      <DropdownMenu.Root bind:open={menuOpen}>
        <DropdownMenu.Trigger>
          {#snippet child({props})}
            <Button
              {...props}
              class="menu"
              size="icon"
              variant="ghost"
              aria-label="메뉴"
              style={`--svg-outline: url("${menu}")`}
            >
              <Menu class="size-6" />
            </Button>
          {/snippet}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end" class="[--bits-floating-anchor-width:auto]">
          {#if page.url.pathname !== '/search'}
            <div class="relative m-1.5 flex items-center">
              <Search class="absolute left-2 size-4" />
              <Input
                type="search"
                name="search"
                class="z-50 pl-7"
                bind:value={query}
                bind:ref={inputElement}
                placeholder="검색"
                aria-label="검색"
              />
            </div>
          {/if}
          <DropdownMenu.Item onclick={() => goto('/font-generator')}>비트맵 폰트 이미지 생성기</DropdownMenu.Item>
          <DropdownMenu.Separator />
          <div class="flex items-center justify-between px-1.5 py-1 text-sm">
            색상 테마
            <Tabs.Root value={userPrefersMode.current ?? 'system'}>
              <Tabs.List>
                <Tabs.Trigger
                  class="px-1"
                  title="시스템 테마"
                  aria-label="시스템 테마"
                  value="system"
                  onclick={() => setMode('system')}
                >
                  <Monitor />
                </Tabs.Trigger>
                <Tabs.Trigger
                  class="px-1"
                  title="밝은 테마"
                  aria-label="밝은 테마"
                  value="light"
                  onclick={() => setMode('light')}
                >
                  <Sun />
                </Tabs.Trigger>
                <Tabs.Trigger
                  class="px-1"
                  title="어두운 테마"
                  aria-label="어두운 테마"
                  value="dark"
                  onclick={() => setMode('dark')}
                >
                  <Moon />
                </Tabs.Trigger>
              </Tabs.List>
            </Tabs.Root>
          </div>
          <div class="flex items-center justify-between px-1.5 py-1 text-sm">
            폰트 패밀리
            <Tabs.Root value={fontFamilyMode}>
              <Tabs.List>
                <Tabs.Trigger class="px-1" value="theme" onclick={() => setFontFamilyMode('theme')}>테마</Tabs.Trigger>
                <Tabs.Trigger class="px-1" value="system" onclick={() => setFontFamilyMode('system')}>
                  시스템
                </Tabs.Trigger>
              </Tabs.List>
            </Tabs.Root>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  </section>
</header>

<style lang="sass">
  @reference '#app.css'

  header
    @apply relative md:sticky top-0 py-4 sm:py-6 z-1 [print-color-adjust:exact] print:text-(--hero-foreground)
    &.hero, &.title-hidden
      @apply text-(--hero-foreground)
      :global(Button)
        @apply hover:text-(--hero-foreground) hover:bg-(--hero-foreground)/5
      .logo, :global(.menu)
        @apply before:opacity-100
      .post-title
        @apply lg:invisible lg:opacity-0
    &.grade-down-logo
      :global(.q-logo)
        @apply hidden
      .q-logo-grade-down
        @apply block
    &.hero
      .logo
        @apply text-(--hero-foreground)
    section
      @apply relative container-x !max-w-full px-4 sm:!px-6 flex justify-between items-start gap-4
      .logo
        @apply flex items-center self-center transition relative before:mask-size-[54px] p-1 -m-1 text-primary
        .logo-symbol
          @apply relative block size-9 shrink-0
        .wordmark-symbol, .wordmark-rest
          @apply hidden overflow-hidden
        .wordmark-image
          @apply absolute top-0 left-0 h-9 w-[210px] max-w-none
        .wordmark-light
          @apply bg-current mask-(--wordmark) mask-size-[210px_36px] mask-top-left mask-no-repeat
        .wordmark-grade-down
          @apply bg-current mask-(--wordmark-grade-down) mask-size-[210px_36px] mask-top-left mask-no-repeat
        &.home-logo
          @apply xl:gap-0
          .logo-symbol
            @apply xl:size-9
          :global(.q-logo), .q-logo-grade-down
            @apply xl:hidden
          .wordmark-symbol
            @apply xl:block xl:absolute xl:inset-0
          .wordmark-rest
            @apply xl:relative xl:block xl:h-9 xl:w-[174px]
            .wordmark-image
              @apply xl:-left-9
      .post-title
        @apply invisible opacity-0 lg:visible lg:opacity-100 transition-all font-bold line-clamp-2 w-[calc((100%-36px-1rem-36rem)/2-1.5rem)] 2xl:w-[calc((100%-36px-1rem-42rem)/2-1.5rem)] leading-5 -my-0.5 text-pretty break-keep
      :global(.menu)
        @apply relative before:mask-size-[24px] print:hidden size-9
      .logo, :global(.menu)
        @apply before:bg-(--outline-color) before:absolute before:inset-0 before:-z-1 before:opacity-0 before:transition before:mask-(--svg-outline) before:mask-center before:mask-no-repeat
</style>
