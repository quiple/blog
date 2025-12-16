<script lang="ts">
  import {cn} from '$lib/utils'

  let {class: className}: {class?: string | null} = $props()
</script>

<svg role="img" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class={cn('fill-current', className)}>
  <title>quiple</title>
  <path d="M88 49.5C88 28.8 71.2 12 50.5 12C29.8 12 13 28.8 13 49.5C13 70.2 29.8 87 50.5 87V49.5H88Z" />
  <path d="M50.5 87H88V49.5C88 70.2 71.2 87 50.5 87Z" />
</svg>
