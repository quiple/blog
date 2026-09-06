<script module lang="ts">
  import type {Component} from 'svelte'

  type MdxComponent = Component<Record<string, unknown>>

  const componentLoaders: Record<string, () => Promise<MdxComponent>> = {
    Tester: () => import('./Tester.svelte').then((module) => module.default as unknown as MdxComponent),
    FontLicenseTable: () =>
      import('./FontLicenseTable.svelte').then((module) => module.default as unknown as MdxComponent),
    MdxImage: () => import('./MdxImage.svelte').then((module) => module.default as unknown as MdxComponent),
  }
  const componentPromises = new Map<string, Promise<MdxComponent>>()

  function loadComponent(name: string) {
    const loader = componentLoaders[name]
    if (!loader) return

    let promise = componentPromises.get(name)
    if (!promise) {
      promise = loader().catch((error) => {
        componentPromises.delete(name)
        throw error
      })
      componentPromises.set(name, promise)
    }
    return promise
  }
</script>

<script lang="ts">
  import {mount, unmount} from 'svelte'

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

    void mountComponents().catch((error) => {
      if (!cancelled) console.error('[MDX] Failed to load components', error)
    })

    return () => {
      cancelled = true
      for (const instance of mountedComponents) {
        void unmount(instance)
      }
    }
  })
</script>

{#key html}
  <div bind:this={container}>
    {@html html}
  </div>
{/key}

<style>
  div {
    display: contents;
  }
</style>
