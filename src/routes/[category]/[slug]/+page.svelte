<script lang="ts">
  import type {PageProps} from './$types'

  let {data}: PageProps = $props()
</script>

<article class="prose-shadcn">
  {@html data.contentHTML}
</article>
