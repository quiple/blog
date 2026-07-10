<script lang="ts">
  import {mount, unmount, type Component} from 'svelte'

  type MdxComponent = Component<Record<string, unknown>>

  const componentLoaders: Record<string, () => Promise<MdxComponent>> = {
    Tester: () => import('./Tester.svelte').then((module) => module.default as unknown as MdxComponent),
    Check: () => import('@lucide/svelte/icons/check').then((module) => module.default as unknown as MdxComponent),
    X: () => import('@lucide/svelte/icons/x').then((module) => module.default as unknown as MdxComponent),
    MdxImage: () => import('./MdxImage.svelte').then((module) => module.default as unknown as MdxComponent),
  }
  const componentPromises = new Map<string, Promise<MdxComponent>>()

  function loadComponent(name: string) {
    const loader = componentLoaders[name]
    if (!loader) return

    let promise = componentPromises.get(name)
    if (!promise) {
      promise = loader()
      componentPromises.set(name, promise)
    }
    return promise
  }

  let {html}: {html: string} = $props()
  let container: HTMLElement | undefined = $state()

  $effect(() => {
    if (!container) return
    let cancelled = false
    const mountedComponents: ReturnType<typeof mount>[] = []
    const placeholders = [...container.querySelectorAll<HTMLElement>('[data-mdx-component]')]

    async function mountComponents() {
      const names = [
        ...new Set(placeholders.map((element) => element.dataset.mdxComponent).filter(Boolean)),
      ] as string[]
      const loadedComponents = new Map(
        await Promise.all(
          names.map(async (name) => {
            const promise = loadComponent(name)
            return [name, promise ? await promise : undefined] as const
          }),
        ),
      )
      if (cancelled) return

      for (const el of placeholders) {
        const name = el.dataset.mdxComponent
        if (!name) continue

        const Component = loadedComponents.get(name)
        if (!Component) {
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

        el.innerHTML = ''
        const instance = mount(Component, {target: el, props})
        mountedComponents.push(instance)
      }
    }

    mountComponents()

    return () => {
      cancelled = true
      for (const instance of mountedComponents) {
        void unmount(instance)
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
