import {writable} from 'svelte/store'

export const isHero = writable<boolean | null>(null)
export const heroColors = writable<{foreground: string | null; outline: string | null}>({
  foreground: null,
  outline: null,
})
