<script lang="ts">
  import {BASE_URL} from '$lib/constants'
  import {setupViewTransition} from 'sveltekit-view-transition'
  import type {PageProps} from './$types'

  let {data}: PageProps = $props()

  const {transition} = setupViewTransition()

  function pageNumbers(current: number, total: number): (number | '...')[] {
    if (total <= 7) return Array.from({length: total}, (_, i) => i + 1)

    const pages: (number | '...')[] = [1]

    if (current > 3) pages.push('...')

    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)
    for (let i = start; i <= end; i++) pages.push(i)

    if (current < total - 2) pages.push('...')

    pages.push(total)
    return pages
  }
</script>

<svelte:head>
  <title>{data.title}</title>
  <meta name="description" content={data.description} />

  <meta property="og:type" content="website" />
  <meta property="og:url" content={BASE_URL} />
  <meta property="og:title" content={data.title} />
  <meta property="og:description" content={data.description} />
</svelte:head>

<div class="max-w-xl 2xl:max-w-2xl mx-auto">
  <ul class="flex flex-col z-10 relative">
    {#each data.posts as post}
      {@const displayDate =
        post.origDate instanceof Date ? post.origDate : new Date(`${post.origDate ?? post.pubDate}+09:00`)}
      <li>
        <a href={post.relativeURL} class="list-item">
          <div class="grow">
            <strong class="line-clamp-1 mb-1" use:transition={`post-title-${post.slug}`}>{post.title}</strong>
            <p class="text-sm line-clamp-3 mb-1 text-justify">{post.description}</p>
            <small class="text-muted-foreground" use:transition={`post-metadata-${post.slug}`}>
              {#if post.media}
                {post.media}&#8194;&bullet;&#8194;{/if}{new Intl.DateTimeFormat('ko-KR', {dateStyle: 'long'}).format(
                displayDate,
              )}
            </small>
          </div>
          {#if post.image}
            {@html `
              <style>
                ::view-transition-group(post-title-${post.slug}),
                ::view-transition-group(post-metadata-${post.slug}) {
                  z-index: 10;
                }
                ::view-transition-group-children(post-image-wrapper-${post.slug}) {
                  overflow: clip;
                }
                ::view-transition-old(post-image-${post.slug}) {
                  animation-name: zoom-out-old;
                }
                ::view-transition-new(post-image-${post.slug}) {
                  animation-name: zoom-out-new;
                }
              </style>
            `}
            <div
              class="img"
              style:background-image={`url('/img/thumbnail/${post.image.substring(0, post.image.lastIndexOf('.'))}.avif')`}
              use:transition={{
                name: `post-image-${post.slug}`,
                shouldApply({navigation}) {
                  return navigation?.to?.params?.slug === post.slug
                },
                applyImmediately({navigation}) {
                  return navigation?.from?.params?.slug === post.slug
                },
              }}
            ></div>
          {/if}
        </a>
      </li>
    {/each}
  </ul>

  {#if data.totalPages > 1}
    <nav class="pagination" aria-label="페이지 탐색">
      {#if data.currentPage > 1}
        <a href="?page={data.currentPage - 1}" class="page-btn" aria-label="이전 페이지">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg
          >
        </a>
      {:else}
        <span class="page-btn disabled" aria-disabled="true">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg
          >
        </span>
      {/if}

      {#each pageNumbers(data.currentPage, data.totalPages) as page}
        {#if page === '...'}
          <span class="page-ellipsis">…</span>
        {:else if page === data.currentPage}
          <span class="page-btn active" aria-current="page">{page}</span>
        {:else}
          <a href="?page={page}" class="page-btn">{page}</a>
        {/if}
      {/each}

      {#if data.currentPage < data.totalPages}
        <a href="?page={data.currentPage + 1}" class="page-btn" aria-label="다음 페이지">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"><path d="m9 18 6-6-6-6" /></svg
          >
        </a>
      {:else}
        <span class="page-btn disabled" aria-disabled="true">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"><path d="m9 18 6-6-6-6" /></svg
          >
        </span>
      {/if}
    </nav>
  {/if}
</div>

<style lang="sass">
  @reference '#app.css'

  @keyframes -global-zoom-out-old
    from
      opacity: 1
      height: 50vh
    to
      opacity: 0
      height: 5.5rem

  @keyframes -global-zoom-out-new
    from
      opacity: 0
      height: 50vh
    to
      opacity: 1
      height: 5.5rem

  .list-item
    @apply flex gap-4 before:rounded-xl py-2 pl-3 -ml-3 pr-2 -mr-2 rounded-xl hover-bg-muted
    .img
      @apply shrink-0 size-22 bg-cover bg-center inner-border after:rounded-sm rounded-sm shadow-xs

  .pagination
    @apply flex items-center justify-center gap-1 mt-6 mb-2

  .page-btn
    @apply inline-flex items-center justify-center size-9 rounded-lg text-sm font-medium transition-colors
    &:not(.active):not(.disabled)
      @apply hover:bg-muted
    &.active
      @apply bg-foreground text-background
    &.disabled
      @apply opacity-30 cursor-default

  .page-ellipsis
    @apply inline-flex items-center justify-center size-9 text-sm text-muted-foreground select-none
</style>
