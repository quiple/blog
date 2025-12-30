<script lang="ts">
  import {BASE_URL} from '$lib/constants'
  import type {PageProps} from './$types'

  let {data}: PageProps = $props()
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
  <ul class="flex flex-col">
    {#each data.posts as post}
      <li>
        <a
          href={post.relativeURL}
          class="flex gap-4 before:rounded-xl py-2 pl-3 -ml-3 pr-2 -mr-2 rounded-xl hover-bg-muted"
        >
          <div class="grow">
            <strong class="line-clamp-1 mb-1">{post.title}</strong>
            <p class="text-sm line-clamp-3 mb-1">{post.description}</p>
            <small class="text-muted-foreground">
              {#if post.media}
                {post.media}&#8194;&bullet;&#8194;{/if}{new Intl.DateTimeFormat('ko-KR', {dateStyle: 'long'}).format(
                Date.parse(`${post.origDate}+09:00`),
              )}
            </small>
          </div>
          {#if post.image}
            <div
              class="inner-border shrink-0 aspect-square h-22 bg-cover bg-center after:rounded-sm rounded-sm shadow-xs"
              style:background-image={`url('/img/thumbnail/${post.image}')`}
            ></div>
          {/if}
        </a>
      </li>
    {/each}
  </ul>
</div>
