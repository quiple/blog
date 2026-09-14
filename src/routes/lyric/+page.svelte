<script lang="ts">
  import LyricList from '$lib/components/lyrics/LyricList.svelte'
  import PageTitle from '$lib/components/page-title.svelte'
  import type {PageProps} from './$types'
  let {data}: PageProps = $props()
</script>

<svelte:head><title>가사 – quiple</title></svelte:head>
<PageTitle>가사</PageTitle>

<div class="relative z-10 mx-auto max-w-xl 2xl:max-w-2xl">
  <LyricList songs={data.songs} />
</div>
