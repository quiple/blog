<script lang="ts">
  import {navigating} from '$app/stores'
  import {Skeleton} from '$lib/components/ui/skeleton/index.js'
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

<ul class="flex flex-col z-10 relative" use:transition={'post-list'}>
  {#if $navigating && isPagination($navigating)}
    {#each Array(15) as _}
      <li>
        <div class="list-item pointer-events-none!">
          <div class="grow py-1">
            <Skeleton class="h-4.5 w-2/3 mb-2" />
            <div class="space-y-1.5 mb-2.5 mt-1.5">
              <Skeleton class="h-3.5 w-full" />
              <Skeleton class="h-3.5 w-5/6" />
            </div>
            <Skeleton class="h-3 w-1/4 mt-1.5" />
          </div>
          <Skeleton class="img max-w-[88px]" />
        </div>
      </li>
    {/each}
  {:else}
    {#each posts as post}
      {@const displayDate =
        post.origDate instanceof Date ? post.origDate : new Date(`${post.origDate ?? post.pubDate}+09:00`)}
      <li>
        <a href={post.relativeURL} class="list-item">
          <div class="grow">
            <strong
              class="line-clamp-1 mb-1"
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
            <p class="text-sm line-clamp-3 mb-1 text-justify">{post.description}</p>
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
        </a>
      </li>
    {/each}
  {/if}
</ul>

<style lang="sass">
  @reference '#app.css'

  .list-item
    @apply flex gap-4 before:rounded-xl py-2 pl-3 -ml-3 pr-2 -mr-2 rounded-xl hover-bg-muted
    .img
      @apply shrink-0 size-22 bg-cover bg-center inner-border after:rounded-sm rounded-sm shadow-xs
</style>
