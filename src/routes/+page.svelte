<script lang="ts">
  import type {PageProps} from './$types'

  let {data}: PageProps = $props()
</script>

<ul>
  {#each data.posts as post}
    <li>{post.title}</li>
  {/each}
</ul>
