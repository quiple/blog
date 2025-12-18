<script lang="ts">
  import {LogIn, Menu, Moon, Search, Settings, Sun, User} from '@lucide/svelte'
  import {goto} from '$app/navigation'
  import {page} from '$app/state'
  import Q from '$lib/components/q.svelte'
  import {Button} from '$lib/components/ui/button/index'
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index'
  import {Input} from '$lib/components/ui/input/index'
  import {toggleMode} from 'mode-watcher'

  let query = $state('')
  let inputElement = $state<HTMLInputElement | null>(null)

  const onKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && inputElement && document.activeElement === inputElement) {
      goto(`/search?q=${query.trim().replaceAll(' ', '+')}`)
    }
  }

  $effect(() => {
    const q = page.url.searchParams.get('q')
    query = q?.replaceAll('+', ' ') || ''
  })
</script>

<svelte:window on:keydown={onKeydown} />

<header>
  <div class="gradient-blur">
    <div></div>
    <div></div>
    <div></div>
    <div></div>
    <div></div>
    <div></div>
  </div>
  <section>
    <div class="flex gap-2">
      <!-- <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          {#snippet child({props})}
            <Button {...props} size="icon" variant="secondary" aria-label="메뉴">
              <Menu />
            </Button>
          {/snippet}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="start">
          <DropdownMenu.Item onclick={() => goto('/login')}><LogIn /> 로그인</DropdownMenu.Item>
          <DropdownMenu.Item onclick={() => goto('/user/quiple')}><User /> 프로필</DropdownMenu.Item>
          <DropdownMenu.Item onclick={() => goto('/settings')}><Settings /> 설정</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root> -->
      <a href="/" class="flex items-center gap-1 self-center transition">
        <Q class="w-9" />
      </a>
    </div>

    <div class="flex gap-2">
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
    @apply relative md:sticky top-0 py-6 z-50
    :global(Button), :global(input)
      @apply text-foreground dark:text-secondary-foreground backdrop-blur-xs
    :global(Button)
      @apply bg-ring/12 dark:bg-ring/25 hover:bg-ring/9.5 dark:hover:bg-ring/21
    :global(input)
      @apply bg-transparent dark:bg-ring/12 border-foreground/13 dark:border-foreground/15 placeholder:text-foreground/63 dark:placeholder:text-foreground/56
    &.hero
      @apply text-primary-foreground dark:text-foreground
      .gradient-blur
        @apply from-foreground/50 dark:from-background/50
      :global([data-slot=badge])
        @apply bg-input dark:bg-primary text-primary dark:text-primary-foreground
      :global(Button), :global(input)
        @apply text-primary-foreground dark:text-secondary-foreground
      :global(Button)
        @apply bg-muted-foreground/25 dark:bg-ring/25 hover:bg-muted-foreground/21 dark:hover:bg-ring/21
      :global(input)
        @apply bg-muted-foreground/12 dark:bg-ring/12 border-primary-foreground/15 dark:border-foreground/15 placeholder:text-primary-foreground/56 dark:placeholder:text-foreground/56
    section
      @apply relative container-x !max-w-full !px-6 flex justify-between items-start gap-8 z-10
    .gradient-blur
      @apply top-0 absolute md:fixed w-full h-[84px] bg-linear-to-b from-background/50 to-transparent transition
      & > div,
      &::before,
      &::after
        @apply absolute inset-0
      &::before
        @apply z-[1] backdrop-blur-[.5px] content-['']
        mask: linear-gradient(
          to top,
          rgba(0,0,0,0) 0%,
          rgba(0,0,0,1) 12.5%,
          rgba(0,0,0,1) 25%,
          rgba(0,0,0,0) 37.5%
        )
      & > div:nth-of-type(1)
        @apply z-[2] backdrop-blur-[1px]
        mask: linear-gradient(
          to top,
          rgba(0,0,0,0) 12.5%,
          rgba(0,0,0,1) 25%,
          rgba(0,0,0,1) 37.5%,
          rgba(0,0,0,0) 50%
        )
      & > div:nth-of-type(2)
        @apply z-[3] backdrop-blur-[1.5px]
        mask: linear-gradient(
          to top,
          rgba(0,0,0,0) 25%,
          rgba(0,0,0,1) 37.5%,
          rgba(0,0,0,1) 50%,
          rgba(0,0,0,0) 62.5%
        )
      & > div:nth-of-type(3)
        @apply z-[4] backdrop-blur-[2px]
        mask: linear-gradient(
          to top,
          rgba(0,0,0,0) 37.5%,
          rgba(0,0,0,1) 50%,
          rgba(0,0,0,1) 62.5%,
          rgba(0,0,0,0) 75%
        )
      & > div:nth-of-type(4)
        @apply z-[5] backdrop-blur-[2.5px]
        mask: linear-gradient(
          to top,
          rgba(0,0,0,0) 50%,
          rgba(0,0,0,1) 62.5%,
          rgba(0,0,0,1) 75%,
          rgba(0,0,0,0) 87.5%
        )
      & > div:nth-of-type(5)
        @apply z-[6] backdrop-blur-[3px]
        mask: linear-gradient(
          to top,
          rgba(0,0,0,0) 62.5%,
          rgba(0,0,0,1) 75%,
          rgba(0,0,0,1) 87.5%,
          rgba(0,0,0,0) 100%
        )
      & > div:nth-of-type(6)
        @apply z-[7] backdrop-blur-[3.5px]
        mask: linear-gradient(
          to top,
          rgba(0,0,0,0) 75%,
          rgba(0,0,0,1) 87.5%,
          rgba(0,0,0,1) 100%
        )
      &::after
        @apply z-[8] backdrop-blur-[4px] content-['']
        mask: linear-gradient(
          to top,
          rgba(0,0,0,0) 87.5%,
          rgba(0,0,0,1) 100%
        )
</style>
