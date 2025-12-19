<script lang="ts">
  import type {PageProps} from './$types'

  let {data}: PageProps = $props()
</script>

<div class="max-w-xl 2xl:max-w-2xl mx-auto">
  <ul class="flex flex-col gap-4">
    {#each data.posts as post}
      <li>
        <a href={post.relativeURL} class="flex gap-4">
          <div class="grow">
            <strong class="line-clamp-1 mb-1">{post.title}</strong>
            <p class="text-muted-foreground text-sm line-clamp-3">{post.description}</p>
            <small></small>
          </div>
          {#if post.image}
            <div
              class="inner-border shrink-0 aspect-square h-22 bg-cover bg-center after:rounded-sm rounded-sm shadow-xs"
              style:background-image={`url(${post.image})`}
            ></div>
          {/if}
        </a>
      </li>
    {/each}
  </ul>
</div>
