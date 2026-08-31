<script lang="ts">
  import {Download} from '@lucide/svelte'
  import {Button} from '$lib/components/ui/button/index.js'

  let {href}: {href: string} = $props()
</script>

<div class="not-prose my-3 sm:my-4">
  <Button
    size="lg"
    variant="outline"
    {href}
    target="_blank"
    rel="noreferrer noopener"
    class="no-underline! after:content-none!"
  >
    <Download aria-hidden="true" />
    GitHub에서 다운로드
  </Button>
</div>
