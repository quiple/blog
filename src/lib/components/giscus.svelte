<script lang="ts">
  import Giscus from '@giscus/svelte'
  import {onMount} from 'svelte'
  import {mode} from 'mode-watcher'

  let fontFamilyMode = $state<'theme' | 'system'>('theme')

  onMount(() => {
    const root = document.documentElement
    const updateFontFamilyMode = () => {
      fontFamilyMode = root.dataset.fontFamily === 'system' ? 'system' : 'theme'
    }

    updateFontFamilyMode()

    const observer = new MutationObserver(updateFontFamilyMode)
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['data-font-family'],
    })

    return () => observer.disconnect()
  })

  const theme = $derived.by(() => {
    const color = mode.current === 'dark' ? 'dark' : 'light'
    const font = fontFamilyMode === 'system' ? '-system' : ''
    return `https://quiple.dev/giscus/${color}${font}.css`
  })
</script>

<Giscus
  id="comments"
  repo="quiple/quiple.dev-comments"
  repoId="R_kgDOSFIVTQ"
  category="Announcements"
  categoryId="DIC_kwDOSFIVTc4C7DcS"
  mapping="pathname"
  term="Welcome to @giscus/svelte component!"
  reactionsEnabled="0"
  emitMetadata="0"
  inputPosition="bottom"
  {theme}
  lang="ko"
/>

<style lang="sass">
  @reference '#app.css'

  :global(#comments)
    @apply block mt-8 border-t pt-4
</style>
