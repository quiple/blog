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
    showCategory = true,
  }: {
    posts: ListedPost[]
    isPagination: (navigation: NavigationLike) => boolean
    transition: ReturnType<typeof setupViewTransition>['transition']
    showCategory?: boolean
  } = $props()

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
          ::view-transition-old(post-image-${slug}) { --zoom-out-opacity: 1; animation-name: zoom-out; }
          ::view-transition-new(post-image-${slug}) { --zoom-out-opacity: 0; animation-name: zoom-out; }
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
                {#if showCategory}
                  <div class="-ml-px flex shrink-0 items-center" use:transition={postTransition(post.slug, 'category')}>
                    <Badge variant="secondary" class="bg-zinc-950/5 dark:bg-zinc-50/9"
                      >{getCategoryName(post.category)}</Badge
                    >
                  </div>
                {/if}
                <strong class="line-clamp-1 grow font-medium" use:transition={postTransition(post.slug, 'title')}
                  >{post.title}</strong
                >
              </div>
              <p class="mb-1 line-clamp-3 text-justify text-sm text-chart-4">{post.description}</p>
            </div>
            {#if post.image}
              {@const isPixelImage = post.imageType === 'pixel'}
              {@const src1x = getImageUrl(post.image, isPixelImage ? {original: true} : {h: 88})}
              {@const src2x = getImageUrl(post.image, isPixelImage ? {original: true} : {h: 176})}
              <div class="img animate-pulse bg-muted" use:transition={postTransition(post.slug, 'image')}>
                <img
                  alt=""
                  class={[
                    'absolute inset-0 size-full object-cover opacity-0 transition-opacity',
                    isPixelImage && 'pixel-image',
                  ]}
                  src={src1x}
                  use:lazyImage={src1x}
                  srcset={isPixelImage ? undefined : `${src1x} 1x, ${src2x} 2x`}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            {/if}
          </div>
          <div class="mt-px flex items-start justify-between gap-2">
            <small class="text-muted-foreground" use:transition={postTransition(post.slug, 'metadata')}>
              {#if post.media}
                {post.media}&#8194;&middot;&#8194;{/if}{dateFormatter.format(displayDate)}
            </small>
          </div>
        </a>
      </li>
    {/each}
  {/if}
</ul>

{@html transitionStyles}

<style>
  @reference '#app.css';
  .list-item {
    @apply hover-bg-muted -mr-2 -ml-3.25 flex flex-col rounded-[1rem] py-2 pr-2 pl-3.25 before:rounded-[1rem];
  }
  .list-item .img {
    @apply relative size-22 shrink-0 overflow-hidden rounded-md bg-cover bg-center shadow-xs;
  }
  .list-item .img.animate-pulse {
    box-shadow: none;
  }
  .list-item .img > img {
    @apply rounded-[inherit] inner-border;
  }

  @keyframes -global-zoom-out {
    from {
      opacity: var(--zoom-out-opacity);
      height: var(--hero-height);
    }
    to {
      opacity: calc(1 - var(--zoom-out-opacity));
      height: 5.5rem;
    }
  }
</style>
