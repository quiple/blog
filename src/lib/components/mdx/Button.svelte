<script lang="ts">
  import {Button} from '$lib/components/ui/button/index'

  let {
    variant = 'default',
    size = 'default',
    href = '',
    children = '',
  }: {
    variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'ghost' | 'link'
    size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg'
    href?: string
    children?: string
  } = $props()
</script>

<Button {variant} {size} {href}>
  {@html children}
</Button>
