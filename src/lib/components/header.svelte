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
  import {isHero} from '$lib/stores/header'
  import {mode, toggleMode} from 'mode-watcher'
  import {setupViewTransition} from 'sveltekit-view-transition'

  let query = $state('')
  let inputElement = $state<HTMLInputElement | null>(null)
  let headerClassName = $derived($isHero === true ? 'hero' : '')

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

<header class={headerClassName} use:transition={'header'}>
  <section>
    <div class="flex gap-2">
      <a href="/" class="logo" style={`--svgOutline: url("${svgOutline}"); --svgGradeDown: url("${svgGradeDown}")`}>
        <Q class="w-9" />
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
              style={`--svgOutline: url("${menu}")`}
            >
              <Menu class="size-6" />
            </Button>
          {/snippet}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end">
          <DropdownMenu.Item onclick={toggleMode}>
            {#if mode.current === 'dark'}<Sun /> 라이트 테마
            {:else}<Moon /> 다크 테마
            {/if}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  </section>
</header>

<style lang="sass">
  @reference '#app.css'

  header
    @apply relative md:sticky top-0 py-4 sm:py-6 z-1
    &.hero
      @apply text-(--hero-foreground)
      :global(Button):hover
        @apply text-(--hero-foreground) bg-(--hero-foreground)/5
      .logo, :global(.menu)
        @apply before:opacity-100
      .logo
        mask-image: if(
          style(--hero-foreground: #fff): var(--svgGradeDown);
          else: none;
        ) !important
    section
      @apply relative container-x !max-w-full px-4 sm:!px-6 flex justify-between items-start gap-8
      .logo
        @apply flex items-center gap-1 self-center transition relative before:mask-size-[54px] p-1 -m-1
      :global(.menu)
        @apply relative before:mask-size-[24px]
      .logo, :global(.menu)
        @apply before:bg-(--outline-color) before:absolute before:inset-0 before:-z-1 before:opacity-0 before:transition before:mask-(--svgOutline) before:mask-center before:mask-no-repeat dark:mask-(--svgGradeDown) mask-center mask-[size:36px] mask-no-repeat
</style>
