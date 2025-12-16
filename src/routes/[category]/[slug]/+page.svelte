<script lang="ts">
  import type {PageProps} from './$types'

  let {data}: PageProps = $props()
</script>

<article class="prose-shadcn max-w-xl mx-auto text-justify">
  <h1>{data.title}</h1>
  {@html data.contentHTML}
</article>

<style lang="sass">
  @reference '#app.css'

  article
    :global(figure)
      @apply mx-auto max-w-fit flex flex-col items-start
      & > :global(div)
        @apply relative inner-border after:rounded-md rounded-md overflow-hidden shadow-xs
</style>
