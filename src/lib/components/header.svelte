<script lang="ts">
  import {Menu, Moon, Search, Sun} from '@lucide/svelte'
  import {goto} from '$app/navigation'
  import {page} from '$app/state'
  import svgGradeDown from '$lib/assets/logo-grade-down.svg'
  import svgOutline from '$lib/assets/logo-outline.svg'
  import menu from '$lib/assets/menu.svg'
  import Q from '$lib/components/q.svelte'
  import {Button} from '$lib/components/ui/button/index'
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index'
  import {Input} from '$lib/components/ui/input/index'
  import {heroColors, isHero} from '$lib/stores/header'
  import {mode, toggleMode} from 'mode-watcher'
  import {setupViewTransition} from 'sveltekit-view-transition'

  let query = $state('')
  let inputElement = $state<HTMLInputElement | null>(null)
  let headerClassName = $derived($isHero === true ? 'hero' : '')
  let logoMaskImage = $derived(
    $heroColors.foreground === '#fff' ? ($heroColors.outline ? 'none' : `url("${svgGradeDown}")`) : 'none',
  )

  const {transition} = setupViewTransition()

  const onKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && inputElement && document.activeElement === inputElement) {
      goto(`/search?q=${query.trim().replaceAll(' ', '+')}`)
    }
  }

  const onScroll = () => {
    const path = page.url.pathname
    const isPostPage = path.startsWith('/post/') || path.startsWith('/article/') || path.startsWith('/font/')

    if ($isHero !== null && isPostPage) {
      if (window.scrollY < window.innerHeight / 2 - 42) isHero.set(true)
      else isHero.set(false)
    }
  }

  $effect(() => {
    if ($isHero === true) onScroll()
    const q = page.url.searchParams.get('q')
    query = q?.replaceAll('+', ' ') || ''
  })
</script>

<svelte:window on:keydown={onKeydown} on:scroll={onScroll} />

<header
  class={headerClassName}
  use:transition={'header'}
  style:--hero-foreground={$heroColors.foreground ?? undefined}
  style:--outline-color={$heroColors.outline ?? undefined}
  style:--logo-mask-image={logoMaskImage}
>
  <section>
    <div class="flex gap-2">
      <a href="/" class="logo" style={`--svg-outline: url("${svgOutline}"); --svg-grade-down: url("${svgGradeDown}")`}>
        <Q class="size-9" />
      </a>
    </div>

    <div class="flex gap-2">
      <DropdownMenu.Root>
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
        <DropdownMenu.Content align="end">
          <div class="relative m-1.5">
            <Search class="absolute top-2.5 left-2.5 h-4 w-4" />
            <Input
              type="search"
              name="search"
              class="z-50 pl-8"
              bind:value={query}
              bind:ref={inputElement}
              placeholder="검색"
            />
          </div>
          <DropdownMenu.Item onclick={() => goto('/font-generator')}>비트맵 폰트 이미지 생성기</DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item onclick={toggleMode}>
            {#if mode.current === 'dark'}<Sun /> 밝은 테마
            {:else}<Moon /> 어두운 테마
            {/if}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  </section>
</header>

<style lang="sass">
  @reference '#app.css'

  @media print
    header .logo
      mask-image: var(--logo-mask-image) !important

  header
    @apply relative md:sticky top-0 py-4 sm:py-6 z-1 [print-color-adjust:exact] print:text-(--hero-foreground)
    &.hero
      @apply text-(--hero-foreground)
      :global(Button)
        @apply hover:text-(--hero-foreground) hover:bg-(--hero-foreground)/5
      .logo, :global(.menu)
        @apply before:opacity-100
      .logo
        mask-image: var(--logo-mask-image) !important
    section
      @apply relative container-x !max-w-full px-4 sm:!px-6 flex justify-between items-start gap-8
      .logo
        @apply flex items-center gap-1 self-center transition relative before:mask-size-[54px] p-1 -m-1
      :global(.menu)
        @apply relative before:mask-size-[24px] print:hidden
      .logo, :global(.menu)
        @apply before:bg-(--outline-color) before:absolute before:inset-0 before:-z-1 before:opacity-0 before:transition before:mask-(--svg-outline) before:mask-center before:mask-no-repeat dark:mask-(--svg-grade-down) mask-center mask-[size:36px] mask-no-repeat
</style>
