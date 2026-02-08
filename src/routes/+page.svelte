<script lang="ts">
  import {BASE_URL} from '$lib/constants'
  import {setupViewTransition} from 'sveltekit-view-transition'
  import type {PageProps} from './$types'

  let {data}: PageProps = $props()

  const {transition} = setupViewTransition()
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
  <h1 class="text-2xl leading-tight font-bold tracking-tight md:text-3xl lg:text-4xl mb-2 md:mb-4">전체 글</h1>
  <ul class="flex flex-col">
    {#each data.posts as post}
      <li>
        <a href={post.relativeURL} class="list-item">
          <div class="grow z-1">
            <strong class="line-clamp-1 mb-1" use:transition={`post-title-${post.slug}`}>{post.title}</strong>
            <p class="text-sm line-clamp-3 mb-1 text-justify">{post.description}</p>
            <small class="text-muted-foreground" use:transition={`post-metadata-${post.slug}`}>
              {#if post.media}
                {post.media}&#8194;&bullet;&#8194;{/if}{new Intl.DateTimeFormat('ko-KR', {dateStyle: 'long'}).format(
                typeof post.origDate === 'object' ? post.origDate : Date.parse(`${post.origDate}+09:00`),
              )}
            </small>
          </div>
          {#if post.image}
            {@html `
              <style>
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
              style:background-image={`url('/img/thumbnail/${post.image}')`}
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
</style>
