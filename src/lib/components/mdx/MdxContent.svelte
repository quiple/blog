<script lang="ts">
  import {mount, unmount, type Component} from 'svelte'

  const componentLoaders: Record<string, () => Promise<Component<any>>> = {
    Tester: () => import('./Tester.svelte').then((module) => module.default),
    Check: () => import('@lucide/svelte/icons/check').then((module) => module.default),
    X: () => import('@lucide/svelte/icons/x').then((module) => module.default),
    MdxImage: () => import('./MdxImage.svelte').then((module) => module.default),
  }

  let {html}: {html: string} = $props()
  let container: HTMLElement | undefined = $state()

  $effect(() => {
    if (!container) return
    let cancelled = false
    const mountedComponents: ReturnType<typeof mount>[] = []
    const placeholders = container.querySelectorAll<HTMLElement>('[data-mdx-component]')

    async function mountComponents() {
      for (const el of placeholders) {
        const name = el.dataset.mdxComponent
        if (!name) continue

        const loadComponent = componentLoaders[name]
        if (!loadComponent) {
          console.warn(`[MDX] Unknown component: "${name}". Register it in src/lib/components/mdx/MdxContent.svelte`)
          continue
        }

        let props: Record<string, unknown> = {}
        try {
          props = JSON.parse(el.dataset.mdxProps ?? '{}')
        } catch {
          // ignore
        }

        // Preserve children HTML as innerHTML prop if there are children.
        const childrenHtml = el.innerHTML
        if (childrenHtml) {
          props.children = childrenHtml
        }

        const Component = await loadComponent()
        if (cancelled) return

        el.innerHTML = ''
        const instance = mount(Component, {target: el, props})
        mountedComponents.push(instance)
      }
    }

    mountComponents()

    return () => {
      cancelled = true
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
