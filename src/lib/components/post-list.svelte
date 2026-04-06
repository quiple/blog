<script lang="ts">
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
</script>

<ul class="flex flex-col z-10 relative" use:transition={'post-list'}>
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
          {@const src = isProd ? `/cdn-cgi/image/width=180,format=avif,quality=50/${rawSrc}` : rawSrc}
          <div
            class="img"
            style:background-image={`url('${src}')`}
            use:transition={{
              name: `post-image-${post.slug}`,
              shouldApply({navigation}: {navigation: any}) {
                return !isPagination(navigation) && navigation?.to?.params?.slug === post.slug
              },
              applyImmediately({navigation}: {navigation: any}) {
                return !isPagination(navigation) && navigation?.from?.params?.slug === post.slug
              },
            }}
          ></div>
        {/if}
      </a>
    </li>
  {/each}
</ul>

<style lang="sass">
  @reference '#app.css'

  .list-item
    @apply flex gap-4 before:rounded-xl py-2 pl-3 -ml-3 pr-2 -mr-2 rounded-xl hover-bg-muted
    .img
      @apply shrink-0 size-22 bg-cover bg-center inner-border after:rounded-sm rounded-sm shadow-xs
</style>
