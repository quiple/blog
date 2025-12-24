import {writable} from 'svelte/store'

export const isHero = writable<boolean | null>(null)
