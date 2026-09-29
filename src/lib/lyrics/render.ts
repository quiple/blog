/** Local CLI renderer only; never enabled by a public URL parameter. */
export interface LyricRender {
  mediaUrl: string
  duration: number
  anchorY?: (line: HTMLElement) => number
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
