<script lang="ts">
  import PageTitle from '$lib/components/page-title.svelte'
</script>

<svelte:head>
  <title>폰트 섞어쓰기 테스트</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<PageTitle>폰트 섞어쓰기 테스트</PageTitle>

<h2 class="text-9xl" style="font-weight: 375">한0O아123요.</h2>
<h2 class="text-9xl" style="font-weight: 500">한0O아123요.</h2>
<h2 class="text-9xl" style="font-weight: 675">한0O아123요.</h2>
<h2 class="text-9xl" style="font-weight: 800">한0O아123요.</h2>

<section class="sans">
  <h2 class="text-sm" style="font-weight: 375">한0O아123요.</h2>
  <h2 class="text-base" style="font-weight: 375">한0O아123요.</h2>
  <h2 class="text-lg" style="font-weight: 375">한0O아123요.</h2>
  <h2 class="text-xl" style="font-weight: 375">한0O아123요.</h2>
  <h2 class="text-sm" style="font-weight: 500">한0O아123요.</h2>
  <h2 class="text-base" style="font-weight: 500">한0O아123요.</h2>
  <h2 class="text-lg" style="font-weight: 500">한0O아123요.</h2>
  <h2 class="text-xl" style="font-weight: 500">한0O아123요.</h2>
  <h2 class="text-sm" style="font-weight: 675">한0O아123요.</h2>
  <h2 class="text-base" style="font-weight: 675">한0O아123요.</h2>
  <h2 class="text-lg" style="font-weight: 675">한0O아123요.</h2>
  <h2 class="text-xl" style="font-weight: 675">한0O아123요.</h2>
  <h2 class="text-sm" style="font-weight: 800">한0O아123요.</h2>
  <h2 class="text-base" style="font-weight: 800">한0O아123요.</h2>
  <h2 class="text-lg" style="font-weight: 800">한0O아123요.</h2>
  <h2 class="text-xl" style="font-weight: 800">한0O아123요.</h2>
</section>

<h2 class="font-serif text-9xl" style="font-weight: 400">한0O아123요.</h2>
<h2 class="font-serif text-9xl" style="font-weight: 450">한0O아123요.</h2>

<section class="serif">
  <h2 class="font-serif text-sm" style="font-weight: 400">한0O아123요.</h2>
  <h2 class="font-serif text-base" style="font-weight: 400">한0O아123요.</h2>
  <h2 class="font-serif text-lg" style="font-weight: 400">한0O아123요.</h2>
  <h2 class="font-serif text-xl" style="font-weight: 400">한0O아123요.</h2>
  <h2 class="font-serif text-sm" style="font-weight: 450">한0O아123요.</h2>
  <h2 class="font-serif text-base" style="font-weight: 450">한0O아123요.</h2>
  <h2 class="font-serif text-lg" style="font-weight: 450">한0O아123요.</h2>
  <h2 class="font-serif text-xl" style="font-weight: 450">한0O아123요.</h2>
</section>

<style>
  @reference '#app.css';
  section {
    @apply my-4;
  }
</style>
