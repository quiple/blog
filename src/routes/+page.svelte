<script lang="ts">
  import type {PageProps} from './$types'

  let {data}: PageProps = $props()
</script>

<div class="max-w-xl 2xl:max-w-2xl mx-auto">
  <ul>
    {#each data.posts as post}
      <li>
        <strong>{post.title}</strong>
        <p>{post.description}</p>
      </li>
    {/each}
  </ul>
</div>
