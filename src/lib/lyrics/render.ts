/** Local CLI renderer only; never enabled by a public URL parameter. */
export interface LyricRender {
  mediaUrl: string
  duration: number
  preparing?: boolean
  anchorY?: (line: HTMLElement) => number
  follow?: (line: HTMLElement, reference: HTMLElement, screenTop: number, initialTop?: number) => void
  setPlayback?: (position: number, playing: boolean) => Promise<void>
}

declare global {
  interface Window {
    __lyricRender?: LyricRender
  }
}

export function lyricRender() {
  return import.meta.env.DEV && typeof window !== 'undefined' ? window.__lyricRender : undefined
}
