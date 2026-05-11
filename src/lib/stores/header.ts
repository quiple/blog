import {writable} from 'svelte/store'

export const heroColors = writable<{foreground: string | null; outline: string | null}>({
  foreground: null,
  outline: null,
})
