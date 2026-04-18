<script lang="ts">
  import Giscus from '@giscus/svelte'
  import {mode} from 'mode-watcher'

  const theme = $derived(
    mode.current === 'dark' ? 'https://quiple.dev/giscus/dark.css' : 'https://quiple.dev/giscus/light.css',
  )
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
  loading="lazy"
/>

<style lang="sass">
  @reference '#app.css'

  :global(#comments)
    @apply block mt-8
</style>
