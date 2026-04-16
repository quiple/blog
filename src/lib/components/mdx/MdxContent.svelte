<script lang="ts">
  import {mount, onMount, unmount} from 'svelte'
  import components from './index'

  let {html}: {html: string} = $props()
  let container: HTMLElement | undefined = $state()

  $effect(() => {
    if (!container) return
    const mountedComponents: ReturnType<typeof mount>[] = []
    const placeholders = container.querySelectorAll<HTMLElement>('[data-mdx-component]')

    for (const el of placeholders) {
      const name = el.dataset.mdxComponent
      if (!name) continue

      const Component = components[name]
      if (!Component) {
        console.warn(`[MDX] Unknown component: "${name}". Register it in src/lib/components/mdx/index.ts`)
        continue
      }

      let props: Record<string, unknown> = {}
      try {
        props = JSON.parse(el.dataset.mdxProps ?? '{}')
      } catch {
        // ignore
      }

      // Preserve children HTML as innerHTML prop if there are children
      const childrenHtml = el.innerHTML
      if (childrenHtml) {
        props.children = childrenHtml
      }

      // Clear placeholder content and mount Svelte component
      el.innerHTML = ''
      const instance = mount(Component, {target: el, props})
      mountedComponents.push(instance)
    }

    return () => {
      for (const instance of mountedComponents) {
        unmount(instance)
      }
    }
  })
</script>

<div bind:this={container}>
  {@html html}
</div>

<style>
  div {
    display: contents;
  }
</style>
