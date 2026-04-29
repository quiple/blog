import type {Component} from 'svelte'
import {Check, X} from '@lucide/svelte'
import MdxImage from './MdxImage.svelte'
import Tester from './Tester.svelte'

/**
 * Registry mapping MDX component names to Svelte components.
 *
 * To add a new MDX component:
 * 1. Create a Svelte component (e.g. `src/lib/components/mdx/MyComponent.svelte`)
 * 2. Import it here and add it to the `components` map
 * 3. Use `<MyComponent>` in your .md files
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const components: Record<string, Component<any>> = {
  Tester,
  Check,
  X,
  MdxImage,
}

export default components
