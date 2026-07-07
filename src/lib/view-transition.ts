import {browser} from '$app/environment'
import {setupViewTransition as setupSvelteKitViewTransition} from 'sveltekit-view-transition'
import type {Action} from 'svelte/action'

type ViewTransitionSetup = ReturnType<typeof setupSvelteKitViewTransition>

const noopAction: Action<HTMLElement, any> = () => ({})

function shouldUseViewTransitions() {
  if (!browser || !document.startViewTransition) return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false

  const navigatorInfo = navigator as Navigator & {
    deviceMemory?: number
    hardwareConcurrency?: number
  }
  if (navigatorInfo.deviceMemory && navigatorInfo.deviceMemory <= 2) return false
  if (navigatorInfo.hardwareConcurrency && navigatorInfo.hardwareConcurrency <= 2) return false

  return true
}

export function setupViewTransition(): ViewTransitionSetup {
  if (shouldUseViewTransitions()) return setupSvelteKitViewTransition()

  return {
    transition: noopAction,
    classes: () => {},
    on: () => () => {},
    off: () => {},
  } as unknown as ViewTransitionSetup
}
