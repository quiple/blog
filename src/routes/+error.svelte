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

<style>
  @reference '#app.css';
  section {
    @apply flex h-[calc(100dvh-var(--header-height)-2rem)] items-center justify-center gap-6 md:h-[calc(100dvh-3.5rem)];
  }
  section h1 {
    @apply border-r-2 pr-6 font-semibold;
  }
</style>
