<script lang="ts">
  import {LogIn, Menu, Moon, Search, Settings, Sun, User} from '@lucide/svelte'
  import {goto} from '$app/navigation'
  import {page} from '$app/state'
  import Q from '$lib/components/q.svelte'
  import {Button} from '$lib/components/ui/button/index'
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index'
  import {Input} from '$lib/components/ui/input/index'
  import {isHero} from '$lib/stores/header'
  import {mode, toggleMode} from 'mode-watcher'

  let query = $state('')
  let inputElement = $state<HTMLInputElement | null>(null)
  let headerClassName = $derived($isHero === true ? 'hero' : '')

  const onKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && inputElement && document.activeElement === inputElement) {
      goto(`/search?q=${query.trim().replaceAll(' ', '+')}`)
    }
  }

  const onScroll = () => {
    const path = page.url.pathname
    const isArticlePage = path.startsWith('/article/')

    if ($isHero !== null && isArticlePage) {
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

<header class={headerClassName}>
  <section>
    <div class="flex gap-2">
      <a href="/" class="flex items-center gap-1 self-center transition">
        <Q class="w-9" />
      </a>
    </div>

    <div class="flex gap-2">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          {#snippet child({props})}
            <Button {...props} size="icon" variant="ghost" aria-label="메뉴">
              <Menu />
            </Button>
          {/snippet}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end">
          <DropdownMenu.Item onclick={toggleMode}>
            {#if mode.current === 'dark'}
              <Sun /> 라이트 테마
            {:else}
              <Moon /> 다크 테마
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
    @apply relative md:sticky top-0 py-4 sm:py-6
    &.hero
      @apply text-(--hero-foreground)
      :global(Button):hover
        @apply text-(--hero-foreground) bg-(--hero-foreground)/10
    section
      @apply relative container-x !max-w-full px-4 sm:!px-6 flex justify-between items-start gap-8
</style>
