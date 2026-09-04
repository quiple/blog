<script lang="ts">
  import {Download} from '@lucide/svelte'
  import {Button} from '$lib/components/ui/button/index.js'
  import {cn} from 'cn'

  let {href, class: className}: {href: string; class?: string} = $props()
</script>

<Button
  {href}
  target="_blank"
  rel="noreferrer noopener"
  size="lg"
  variant="outline"
  class={cn('self-start after:content-none!', className)}
>
  <Download aria-hidden="true" />
  GitHub에서 다운로드
</Button>
