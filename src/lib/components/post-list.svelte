<script lang="ts">
  import {navigating} from '$app/state'
  import {Badge} from '$lib/components/ui/badge/index.js'
  import {Skeleton} from '$lib/components/ui/skeleton/index.js'
  import {getCategoryName} from '$lib/utils'
  import type {Action} from 'svelte/action'

  let {
    posts,
    isPagination,
    transition,
  }: {
    posts: any[]
    isPagination: (navigation: {
      from?: {route: {id: string | null}} | null
      to?: {route: {id: string | null}} | null
    }) => boolean
    transition: Action<HTMLElement, any>
  } = $props()

  const isProd = import.meta.env.PROD
  const baseUrl = isProd ? 'https://quiple.dev' : ''

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
    <div class="list-item pointer-events-none! py-2">
      <div class="flex gap-4">
        <div class="grow">
          <Skeleton class="h-4 w-3/5 mt-1 mb-2" />
          <div class="space-y-1.5 pb-1.75 pt-0.75">
            <Skeleton class="h-3.5 w-full" />
            <Skeleton class="h-3.5 w-full" />
            <Skeleton class="h-3.5 w-5/6" />
          </div>
        </div>
        <Skeleton class="img size-22" />
      </div>
      <div class="flex justify-between items-start gap-2 mt-px">
        <Skeleton class="h-[12.8px] w-1/4 my-[3.2px]" />
      </div>
    </div>
  </li>
{/snippet}

<ul class="flex flex-col gap-1 z-10 relative" use:transition={'post-list'}>
  {#if !isProd}
    {#each Array(2) as _}
      {@render skeletonItem()}
    {/each}
  {/if}
  {#if navigating && isPagination(navigating)}
    {#each Array(15) as _}
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
              <div class="flex items-center mb-1 gap-1">
                <Badge class="-ml-px" variant="secondary">{getCategoryName(post.category)}</Badge>
                <strong
                  class="line-clamp-1 grow"
                  use:transition={{
                    name: `post-title-${post.slug}`,
                    shouldApply({navigation}: {navigation: any}) {
                      return !isPagination(navigation) && navigation?.to?.params?.slug === post.slug
                    },
                    applyImmediately({navigation}: {navigation: any}) {
                      return !isPagination(navigation) && navigation?.from?.params?.slug === post.slug
                    },
                  }}>{post.title}</strong
                >
              </div>
              <p class="text-sm line-clamp-3 mb-1 text-justify">{post.description}</p>
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
              {@const rawSrc = `${baseUrl}/img/${post.category}/${post.image}`}
              {@const src = isProd ? `/cdn-cgi/image/h=180,f=avif,q=75/${rawSrc}` : rawSrc}
              <div
                class="img bg-muted animate-pulse"
                use:transition={{
                  name: `post-image-${post.slug}`,
                  shouldApply({navigation}: {navigation: any}) {
                    return !isPagination(navigation) && navigation?.to?.params?.slug === post.slug
                  },
                  applyImmediately({navigation}: {navigation: any}) {
                    return !isPagination(navigation) && navigation?.from?.params?.slug === post.slug
                  },
                }}
              >
                <img
                  alt=""
                  class="absolute inset-0 size-full object-cover opacity-0 transition-opacity"
                  use:lazyImage={src}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            {/if}
          </div>
          <div class="flex justify-between items-start gap-2 mt-px">
            <small
              class="text-muted-foreground"
              use:transition={{
                name: `post-metadata-${post.slug}`,
                shouldApply({navigation}: {navigation: any}) {
                  return !isPagination(navigation) && navigation?.to?.params?.slug === post.slug
                },
                applyImmediately({navigation}: {navigation: any}) {
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
        </a>
      </li>
    {/each}
  {/if}
</ul>

<style lang="sass">
  @reference '#app.css'

  .list-item
    @apply flex flex-col before:rounded-[1rem] py-2 pl-3.25 -ml-3.25 pr-2 -mr-2 rounded-[1rem] hover-bg-muted
    .img
      @apply shrink-0 size-22 bg-cover bg-center inner-border after:rounded-md rounded-md shadow-xs
</style>
