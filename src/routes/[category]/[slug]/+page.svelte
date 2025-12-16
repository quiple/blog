<script lang="ts">
  import type {PageProps} from './$types'

  let {data}: PageProps = $props()
</script>

<article class="prose-shadcn max-w-xl mx-auto">
  {@html data.contentHTML}
</article>
