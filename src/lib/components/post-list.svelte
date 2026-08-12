<script lang="ts">
  import {navigating} from '$app/state'
  import {Badge} from '$lib/components/ui/badge/index.js'
  import {Skeleton} from '$lib/components/ui/skeleton/index.js'
  import type {NavigationLike} from '$lib/navigation'
  import type {ListedPost} from '$lib/server/cache'
  import {getCategoryName, getImageUrl} from '$lib/utils'
  import type {setupViewTransition} from '$lib/view-transition'
  import type {Action} from 'svelte/action'

  let {
    posts,
    isPagination,
    transition,
  }: {
    posts: ListedPost[]
    isPagination: (navigation: NavigationLike) => boolean
    transition: ReturnType<typeof setupViewTransition>['transition']
  } = $props()

  const isProd = import.meta.env.PROD
  const dateFormatter = new Intl.DateTimeFormat('ko-KR', {dateStyle: 'long'})
  const paginationSkeletons = Array.from({length: 15})

  function postTransition(slug: string, part: 'category' | 'title' | 'image' | 'metadata') {
    return {
      name: `post-${part}-${slug}`,
      shouldApply: ({navigation}: {navigation: NavigationLike}) =>
        !isPagination(navigation) && navigation.to?.params?.slug === slug,
      applyImmediately: ({navigation}: {navigation: NavigationLike}) =>
        !isPagination(navigation) && navigation.from?.params?.slug === slug,
    }
  }

  const transitionStyles = $derived.by(() => {
    const rules = posts
      .filter((post) => post.image)
      .map(
        ({slug}) => `
          ::view-transition-group(post-title-${slug}),
          ::view-transition-group(post-category-${slug}),
          ::view-transition-group(post-metadata-${slug}) { z-index: 10; }
          ::view-transition-old(post-image-${slug}) { animation-name: zoom-out-old; }
          ::view-transition-new(post-image-${slug}) { animation-name: zoom-out-new; }
        `,
      )
      .join('')

    return rules ? `<style>${rules}</style>` : ''
  })

  const lazyImage: Action<HTMLImageElement, string> = (node, src) => {
    let timeoutId: ReturnType<typeof setTimeout>

    function handleLoad() {
      node.classList.remove('opacity-0')
      node.parentElement?.classList.remove('animate-pulse')

      // Remove bg-muted after transition completes to prevent color mixing if image has transparency
      timeoutId = setTimeout(() => {
        node.parentElement?.classList.remove('bg-muted')
      }, 500)
    }

    function initLoad(url: string) {
      clearTimeout(timeoutId)
      node.src = url
      // If already cached and loaded
      if (node.complete && node.naturalWidth !== 0) {
        handleLoad()
      } else {
        node.onload = handleLoad
      }
    }

    initLoad(src)

    return {
      update(newSrc) {
        if (newSrc !== src) {
          src = newSrc
          node.classList.add('opacity-0')
          node.parentElement?.classList.add('animate-pulse', 'bg-muted')
          initLoad(src)
        }
      },
      destroy() {
        clearTimeout(timeoutId)
        node.onload = null
      },
    }
  }
</script>

{#snippet skeletonItem()}
  <li>
    <div class="pointer-events-none! list-item py-2">
      <div class="flex gap-4">
        <div class="grow">
          <Skeleton class="mt-1 mb-2 h-4 w-3/5" />
          <div class="space-y-1.5 pt-0.75 pb-1.75">
            <Skeleton class="h-3.5 w-full" />
            <Skeleton class="h-3.5 w-full" />
            <Skeleton class="h-3.5 w-5/6" />
          </div>
        </div>
        <Skeleton class="img size-22" />
      </div>
      <div class="mt-px flex items-start justify-between gap-2">
        <Skeleton class="my-[3.2px] h-[12.8px] w-1/4" />
      </div>
    </div>
  </li>
{/snippet}

<ul class="relative z-10 flex flex-col gap-1" use:transition={'post-list'}>
  {#if navigating && isPagination(navigating)}
    {#each paginationSkeletons as _}
      {@render skeletonItem()}
    {/each}
  {:else}
    {#each posts as post}
      {@const displayDate =
        post.origDate instanceof Date ? post.origDate : new Date(`${post.origDate ?? post.pubDate}+09:00`)}
      <li>
        <a href={post.relativeURL} class="list-item">
          <div class="flex gap-4">
            <div class="grow">
              <div class="mb-1 flex items-center gap-1">
                <div class="-ml-px flex shrink-0 items-center" use:transition={postTransition(post.slug, 'category')}>
                  <Badge variant="secondary" class="bg-zinc-950/5">{getCategoryName(post.category)}</Badge>
                </div>
                <strong class="line-clamp-1 grow" use:transition={postTransition(post.slug, 'title')}
                  >{post.title}</strong
                >
              </div>
              <p class="mb-1 line-clamp-3 text-justify text-sm">{post.description}</p>
            </div>
            {#if post.image}
              {@const src1x = getImageUrl(post.image, {h: 88}, isProd)}
              {@const src2x = getImageUrl(post.image, {h: 176}, isProd)}
              <div class="img animate-pulse bg-muted" use:transition={postTransition(post.slug, 'image')}>
                <img
                  alt=""
                  class="absolute inset-0 size-full object-cover opacity-0 transition-opacity"
                  src={src1x}
                  use:lazyImage={src1x}
                  srcset={`${src1x} 1x, ${src2x} 2x`}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            {/if}
          </div>
          <div class="mt-px flex items-start justify-between gap-2">
            <small class="text-muted-foreground" use:transition={postTransition(post.slug, 'metadata')}>
              {#if post.media}
                {post.media}&#8194;&#8226;&#8194;{/if}{dateFormatter.format(displayDate)}
            </small>
          </div>
        </a>
      </li>
    {/each}
  {/if}
</ul>

{@html transitionStyles}

<style lang="sass">
  @reference '#app.css'

  .list-item
    @apply flex flex-col before:rounded-[1rem] py-2 pl-3.25 -ml-3.25 pr-2 -mr-2 rounded-[1rem] hover-bg-muted
    .img
      @apply relative shrink-0 size-22 overflow-hidden bg-cover bg-center rounded-md shadow-xs
      > img
        @apply rounded-[inherit] inner-border

  @keyframes -global-zoom-out-old
    from
      opacity: 1
      height: calc(100dvh/3*2)
    to
      opacity: 0
      height: 5.5rem

  @keyframes -global-zoom-out-new
    from
      opacity: 0
      height: calc(100dvh/3*2)
    to
      opacity: 1
      height: 5.5rem
</style>
