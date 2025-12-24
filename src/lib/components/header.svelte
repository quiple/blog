<script lang="ts">
  import {LogIn, Menu, Moon, Search, Settings, Sun, User} from '@lucide/svelte'
  import {goto} from '$app/navigation'
  import {page} from '$app/state'
  import Q from '$lib/components/q.svelte'
  import {Button} from '$lib/components/ui/button/index'
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index'
  import {Input} from '$lib/components/ui/input/index'
  import {isHero} from '$lib/stores/header'
  import {toggleMode} from 'mode-watcher'

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
      <!-- <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          {#snippet child({props})}
            <Button {...props} size="icon" variant="secondary" aria-label="메뉴">
              <Menu />
            </Button>
          {/snippet}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end">
          <DropdownMenu.Item onclick={() => goto('/login')}><LogIn /> 로그인</DropdownMenu.Item>
          <DropdownMenu.Item onclick={() => goto('/user/quiple')}><User /> 프로필</DropdownMenu.Item>
          <DropdownMenu.Item onclick={() => goto('/settings')}><Settings /> 설정</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root> -->
      <!-- <div class="relative hidden md:block">
        <Search class="absolute top-2.5 left-2.5 z-10 h-4 w-4" />
        <Input name="search" type="text" class="pl-8" bind:value={query} bind:ref={inputElement} placeholder="검색" />
      </div> -->
      <Button onclick={toggleMode} variant="secondary" size="icon">
        <Sun class="scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
        <Moon class="absolute scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
        <span class="sr-only">테마 변경</span>
      </Button>
    </div>
  </section>
</header>

<style lang="sass">
  @reference '#app.css'

  header
    @apply relative md:sticky top-0 py-4 sm:py-6
    :global(Button), :global(input)
      @apply text-foreground dark:text-secondary-foreground backdrop-blur-xs
    :global(Button)
      @apply bg-ring/12 dark:bg-ring/25 hover:bg-ring/9.5 dark:hover:bg-ring/21
    :global(input)
      @apply bg-transparent dark:bg-ring/12 border-foreground/13 dark:border-foreground/15 placeholder:text-foreground/63 dark:placeholder:text-foreground/56
    &.hero
      @apply text-(--hero-foreground-color)
    section
      @apply relative container-x !max-w-full px-4 sm:!px-6 flex justify-between items-start gap-8
</style>
