<script lang="ts">
  import {goto} from '$app/navigation'
  import * as Pagination from '$lib/components/ui/pagination/index.js'
  import {BASE_URL} from '$lib/constants'
  import {setupViewTransition} from 'sveltekit-view-transition'
  import type {PageProps} from './$types'

  let {data}: PageProps = $props()

  const {transition, classes} = setupViewTransition()

  function isPagination(navigation: {
    from?: {route: {id: string | null}} | null
    to?: {route: {id: string | null}} | null
  }) {
    return navigation?.from?.route?.id === '/' && navigation?.to?.route?.id === '/'
  }

  function isGoingForward(navigation: {from?: {url?: URL | null} | null; to?: {url?: URL | null} | null}) {
    const fromPage = Number(navigation?.from?.url?.searchParams?.get('page')) || 1
    const toPage = Number(navigation?.to?.url?.searchParams?.get('page')) || 1
    return toPage > fromPage
  }

  classes(({navigation}) => {
    if (!isPagination(navigation)) return
    return isGoingForward(navigation) ? ['paginate-forward'] : ['paginate-backward']
  })
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
  <ul class="flex flex-col z-10 relative" use:transition={'post-list'}>
    {#each data.posts as post}
      {@const displayDate =
        post.origDate instanceof Date ? post.origDate : new Date(`${post.origDate ?? post.pubDate}+09:00`)}
      <li>
        <a href={post.relativeURL} class="list-item">
          <div class="grow">
            <strong
              class="line-clamp-1 mb-1"
              use:transition={{
                name: `post-title-${post.slug}`,
                shouldApply({navigation}) {
                  return !isPagination(navigation) && navigation?.to?.params?.slug === post.slug
                },
                applyImmediately({navigation}) {
                  return !isPagination(navigation) && navigation?.from?.params?.slug === post.slug
                },
              }}>{post.title}</strong
            >
            <p class="text-sm line-clamp-3 mb-1 text-justify">{post.description}</p>
            <small
              class="text-muted-foreground"
              use:transition={{
                name: `post-metadata-${post.slug}`,
                shouldApply({navigation}) {
                  return !isPagination(navigation) && navigation?.to?.params?.slug === post.slug
                },
                applyImmediately({navigation}) {
                  return !isPagination(navigation) && navigation?.from?.params?.slug === post.slug
                },
              }}
            >
              {#if post.media}
                {post.media}&#8194;&#8226;&#8194;{/if}{new Intl.DateTimeFormat('ko-KR', {dateStyle: 'long'}).format(
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
                  return !isPagination(navigation) && navigation?.to?.params?.slug === post.slug
                },
                applyImmediately({navigation}) {
                  return !isPagination(navigation) && navigation?.from?.params?.slug === post.slug
                },
              }}
            ></div>
          {/if}
        </a>
      </li>
    {/each}
  </ul>

  {#if data.totalPages > 1}
    <Pagination.Root
      count={data.totalPages * 15}
      perPage={15}
      page={data.currentPage}
      onPageChange={(page) => goto(`?page=${page}`)}
      class="mt-6 mb-2"
    >
      {#snippet children({pages, currentPage})}
        <Pagination.Content>
          <Pagination.Item>
            <Pagination.Previous />
          </Pagination.Item>
          {#each pages as page (page.key)}
            {#if page.type === 'ellipsis'}
              <Pagination.Item>
                <Pagination.Ellipsis />
              </Pagination.Item>
            {:else}
              <Pagination.Item>
                <Pagination.Link {page} isActive={currentPage === page.value}>
                  {page.value}
                </Pagination.Link>
              </Pagination.Item>
            {/if}
          {/each}
          <Pagination.Item>
            <Pagination.Next />
          </Pagination.Item>
        </Pagination.Content>
      {/snippet}
    </Pagination.Root>
  {/if}
</div>

{@html `
  <style>
    .paginate-forward::view-transition-old(post-list) {
      animation: paginate-slide-to-left-old 0.25s ease both;
    }
    .paginate-forward::view-transition-new(post-list) {
      animation: paginate-slide-to-left-new 0.25s ease both;
    }
    .paginate-backward::view-transition-old(post-list) {
      animation: paginate-slide-to-right-old 0.25s ease both;
    }
    .paginate-backward::view-transition-new(post-list) {
      animation: paginate-slide-to-right-new 0.25s ease both;
    }
  </style>
`}

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

  @keyframes -global-paginate-slide-to-left-old
    from
      opacity: 1
      transform: translateX(0)
    to
      opacity: 0
      transform: translateX(-60px)

  @keyframes -global-paginate-slide-to-left-new
    from
      opacity: 0
      transform: translateX(60px)
    to
      opacity: 1
      transform: translateX(0)

  @keyframes -global-paginate-slide-to-right-old
    from
      opacity: 1
      transform: translateX(0)
    to
      opacity: 0
      transform: translateX(60px)

  @keyframes -global-paginate-slide-to-right-new
    from
      opacity: 0
      transform: translateX(-60px)
    to
      opacity: 1
      transform: translateX(0)

  .list-item
    @apply flex gap-4 before:rounded-xl py-2 pl-3 -ml-3 pr-2 -mr-2 rounded-xl hover-bg-muted
    .img
      @apply shrink-0 size-22 bg-cover bg-center inner-border after:rounded-sm rounded-sm shadow-xs
</style>
