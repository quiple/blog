<script lang="ts">
  import {page} from '$app/state'
</script>

<svelte:head>
  <title>오류: {page.error?.message}</title>
</svelte:head>

<section>
  <h1>{page.status}</h1>
  <p>{page.error?.message}</p>
</section>

<style lang="sass">
  @reference '#app.css'

  section
    @apply h-[calc(100dvh-var(--header-height)-2rem)] md:h-[calc(100dvh-3.5rem)] flex items-center justify-center gap-6
    h1
      @apply font-semibold border-r-2 pr-6
</style>
