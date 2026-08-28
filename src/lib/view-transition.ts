import {browser} from '$app/environment'
import {onNavigate} from '$app/navigation'
import type {OnNavigate} from '@sveltejs/kit'
import {onDestroy} from 'svelte'
import type {Action} from 'svelte/action'

type NavigationEvent = {navigation: OnNavigate}
type TransitionNode = HTMLElement | SVGElement
type TransitionActionContext = NavigationEvent & {
  node: TransitionNode
  isInViewport: boolean
}

export interface TransitionActionOptions {
  name: string | ((context: TransitionActionContext) => string)
  classes?: string[] | ((context: TransitionActionContext) => string[] | undefined)
  shouldApply?: boolean | ((context: TransitionActionContext) => boolean)
  applyImmediately?: boolean | ((context: TransitionActionContext) => boolean)
}

type TransitionActionParameter = string | TransitionActionOptions
type NavigationCallback = (event: NavigationEvent) => void

const beforeTransitionCallbacks = new Set<NavigationCallback>()
const afterNavigationCallbacks = new Set<NavigationCallback>()
const transitionFinishedCallbacks = new Set<() => void>()

let navigationHookRegistered = false

function shouldUseViewTransitions(navigation: OnNavigate) {
  if (!document.startViewTransition) return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false

  if (navigation.type === 'popstate' && /iPhone|iPad|iPod/.test(navigator.userAgent)) return false

  const navigatorInfo = navigator as Navigator & {
    deviceMemory?: number
    hardwareConcurrency?: number
  }
  if (navigatorInfo.deviceMemory && navigatorInfo.deviceMemory <= 2) return false
  if (navigatorInfo.hardwareConcurrency && navigatorInfo.hardwareConcurrency <= 2) return false

  return true
}

function dispatch(callbacks: Set<NavigationCallback>, navigation: OnNavigate) {
  for (const callback of callbacks) callback({navigation})
}

function finishTransition() {
  for (const callback of transitionFinishedCallbacks) callback()
  transitionFinishedCallbacks.clear()
}

function addTransitionCleanup(cleanup: () => void) {
  let pending = true
  const trackedCleanup = () => {
    if (!pending) return
    pending = false
    transitionFinishedCallbacks.delete(trackedCleanup)
    cleanup()
  }

  transitionFinishedCallbacks.add(trackedCleanup)
  return trackedCleanup
}

function registerNavigationHook() {
  if (!browser || navigationHookRegistered) return
  navigationHookRegistered = true

  onNavigate((navigation) => {
    if (!shouldUseViewTransitions(navigation)) return

    return new Promise<void>((resolve) => {
      dispatch(beforeTransitionCallbacks, navigation)

      const viewTransition = document.startViewTransition!(async () => {
        resolve()
        await navigation.complete
        dispatch(afterNavigationCallbacks, navigation)
      })

      viewTransition.finished.then(finishTransition, finishTransition)
    })
  })
}

function isInViewport(node: TransitionNode) {
  const {top, bottom} = node.getBoundingClientRect()
  return top < window.innerHeight && bottom > 0
}

function resolveOption<T>(value: T | ((context: TransitionActionContext) => T), context: TransitionActionContext) {
  return typeof value === 'function' ? (value as (context: TransitionActionContext) => T)(context) : value
}

function applyTransitionName(node: TransitionNode, options: TransitionActionOptions, context: TransitionActionContext) {
  const name = resolveOption(options.name, context)
  const classes = options.classes ? resolveOption(options.classes, context) : undefined

  node.style.setProperty('view-transition-name', name)
  if (classes?.length) document.documentElement.classList.add(...classes)

  return addTransitionCleanup(() => {
    node.style.removeProperty('view-transition-name')
    if (classes?.length) document.documentElement.classList.remove(...classes)
  })
}

export function setupViewTransition() {
  registerNavigationHook()

  const componentCleanups = new Set<() => void>()
  const pendingTransitionCleanups = new Set<() => void>()

  const transition: Action<TransitionNode, TransitionActionParameter> = (node, initialOptions) => {
    let options = initialOptions
    let activeCleanup: (() => void) | undefined
    const actionCleanups = new Set<() => void>()

    const clearListeners = () => {
      for (const cleanup of actionCleanups) cleanup()
      actionCleanups.clear()
      activeCleanup?.()
      activeCleanup = undefined
      node.style.removeProperty('view-transition-name')
    }

    const setup = () => {
      clearListeners()

      if (typeof options === 'string') {
        node.style.setProperty('view-transition-name', options)
        return
      }

      const objectOptions = options

      const beforeTransition: NavigationCallback = ({navigation}) => {
        const context = {navigation, node, isInViewport: isInViewport(node)}
        const shouldApply =
          objectOptions.shouldApply === undefined ? true : resolveOption(objectOptions.shouldApply, context)
        if (shouldApply) activeCleanup = applyTransitionName(node, objectOptions, context)
      }

      const afterNavigation: NavigationCallback = ({navigation}) => {
        const context = {navigation, node, isInViewport: isInViewport(node)}
        const applyImmediately =
          objectOptions.applyImmediately === undefined ? false : resolveOption(objectOptions.applyImmediately, context)
        if (applyImmediately) activeCleanup = applyTransitionName(node, objectOptions, context)
      }

      beforeTransitionCallbacks.add(beforeTransition)
      afterNavigationCallbacks.add(afterNavigation)
      actionCleanups.add(() => beforeTransitionCallbacks.delete(beforeTransition))
      actionCleanups.add(() => afterNavigationCallbacks.delete(afterNavigation))
    }

    setup()

    return {
      update(nextOptions) {
        options = nextOptions
        setup()
      },
      destroy: clearListeners,
    }
  }

  function classes(resolveClasses: string[] | ((event: NavigationEvent) => string[] | undefined)) {
    const beforeTransition: NavigationCallback = (event) => {
      const classNames = typeof resolveClasses === 'function' ? resolveClasses(event) : resolveClasses
      if (!classNames?.length) return

      document.documentElement.classList.add(...classNames)
      let cleanup: () => void
      cleanup = addTransitionCleanup(() => {
        pendingTransitionCleanups.delete(cleanup)
        document.documentElement.classList.remove(...classNames)
      })
      pendingTransitionCleanups.add(cleanup)
    }

    beforeTransitionCallbacks.add(beforeTransition)
    componentCleanups.add(() => beforeTransitionCallbacks.delete(beforeTransition))
  }

  onDestroy(() => {
    for (const cleanup of componentCleanups) cleanup()
    for (const cleanup of pendingTransitionCleanups) cleanup()
  })

  return {transition, classes}
}
