<script lang="ts">
  import type {PageProps} from './$types'

  let {data}: PageProps = $props()
</script>

<svelte:head>
  <meta name="robots" content="noindex" />
</svelte:head>

<article>
  {@html data.contentHTML}
</article>
