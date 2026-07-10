<script lang="ts">
  import {goto} from '$app/navigation'
  import PostPagination from '$lib/components/post-pagination.svelte'
  import PostList from '$lib/components/post-list.svelte'
  import {isGoingForward, isRoutePagination, type NavigationLike} from '$lib/navigation'
  import {absoluteUrl, jsonLd as stringifyJsonLd, SITE_NAME} from '$lib/seo'
  import {setupViewTransition} from '$lib/view-transition'
  import type {PageProps} from './$types'

  let {data}: PageProps = $props()

  const {transition, classes} = setupViewTransition()

  const isPagination = (navigation: NavigationLike) => isRoutePagination(navigation, '/')

  classes(({navigation}) => {
    if (!isPagination(navigation)) return
    return isGoingForward(navigation) ? ['paginate-forward'] : ['paginate-backward']
  })

  const jsonLd = $derived(
    stringifyJsonLd({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${absoluteUrl('/')}#website`,
      name: SITE_NAME,
      url: absoluteUrl('/'),
      description: data.description,
      inLanguage: 'ko-KR',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${absoluteUrl('/search')}?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    }),
  )
  const jsonLdScript = $derived(`<script type="application/ld+json">${jsonLd}</sc` + `ript>`)
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
  {@html jsonLdScript}
</svelte:head>

<div class="relative z-10 mx-auto max-w-xl 2xl:max-w-2xl">
  <PostList posts={data.posts} {isPagination} {transition} />

  <PostPagination
    totalPages={data.totalPages}
    perPage={data.perPage}
    currentPage={data.currentPage}
    onPageChange={(page) => {
      window.scrollTo(0, 0)
      goto(`?p=${page}`)
    }}
  />
</div>
