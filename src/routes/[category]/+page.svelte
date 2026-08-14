<script lang="ts">
  import {goto} from '$app/navigation'
  import PageTitle from '$lib/components/page-title.svelte'
  import PostList from '$lib/components/post-list.svelte'
  import PostPagination from '$lib/components/post-pagination.svelte'
  import {isGoingForward, isRoutePagination, type NavigationLike} from '$lib/navigation'
  import {setupViewTransition} from '$lib/view-transition'
  import type {PageProps} from './$types'

  let {data}: PageProps = $props()

  const {transition, classes} = setupViewTransition()
  const isPagination = (navigation: NavigationLike) =>
    isRoutePagination(navigation, '/[category]') &&
    navigation.from?.params?.category === navigation.to?.params?.category

  classes(({navigation}) => {
    if (!isPagination(navigation)) return
    return isGoingForward(navigation) ? ['paginate-forward'] : ['paginate-backward']
  })
</script>

<svelte:head>
  <title>{data.title}</title>
  <meta name="description" content={data.description} />

  <meta property="og:type" content="website" />
  <meta property="og:url" content={data.canonicalURL} />
  <meta property="og:title" content={data.title} />
  <meta property="og:description" content={data.description} />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content={data.title} />
  <meta name="twitter:description" content={data.description} />

  <link rel="canonical" href={data.canonicalURL} />
  {#if data.previousPageURL}
    <link rel="prev" href={data.previousPageURL} />
  {/if}
  {#if data.nextPageURL}
    <link rel="next" href={data.nextPageURL} />
  {/if}
</svelte:head>

<PageTitle>{data.categoryName}</PageTitle>

<div class="relative z-10 mx-auto max-w-xl 2xl:max-w-2xl">
  <PostList posts={data.posts} {isPagination} {transition} showCategory={false} />

  <PostPagination
    totalPages={data.totalPages}
    perPage={data.perPage}
    currentPage={data.currentPage}
    onPageChange={(page) => {
      window.scrollTo(0, 0)
      goto(`/${data.category}?p=${page}`)
    }}
  />
</div>
