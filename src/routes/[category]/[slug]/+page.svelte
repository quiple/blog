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

  :global(figure)
    @apply after:block after:inner-border
</style>
