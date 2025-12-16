<script lang="ts">
  import type {PageProps} from './$types'

  let {data}: PageProps = $props()
</script>

<article class="prose-shadcn max-w-xl mx-auto text-justify">
  {@html data.contentHTML}
</article>
