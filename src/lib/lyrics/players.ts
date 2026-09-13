export type Playback = {
  position: number
  duration: number
  playing: boolean
  sampledAt: number
}
export const stopped: Playback = {position: 0, duration: 0, playing: false, sampledAt: 0}
export function playbackTime(sample: Playback, now: number) {
  const elapsed = sample.playing ? Math.max(0, Math.min(1500, now - sample.sampledAt)) : 0
  const position = sample.position + elapsed
  return Math.max(0, sample.duration > 0 ? Math.min(sample.duration, position) : position)
}
export type PlaybackRequest = {position: number; playing: boolean}
export interface YouTubePlayer {
  cueVideoById(options: {videoId: string; startSeconds: number}): void
  loadVideoById(options: {videoId: string; startSeconds: number}): void
  playVideo(): void
  getCurrentTime(): number
  getDuration(): number
  getPlayerState(): number
  seekTo(seconds: number, allowSeekAhead: boolean): void
  destroy(): void
}
interface YouTubeAPI {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string
      width: string
      height: string
      playerVars: {playsinline: number; origin: string}
      events: {
        onReady: (event: {target: YouTubePlayer}) => void
        onStateChange: (event: {target: YouTubePlayer; data: number}) => void
        onError: (event: {data: number}) => void
        onAutoplayBlocked: () => void
      }
    },
  ) => YouTubePlayer
}
export interface SpotifyController {
  destroy(): void
  restart(): void
  seek(seconds: number): void
  addListener(
    name: 'playback_update',
    callback: (event: {
      data: {
        position: number
        duration: number
        isPaused: boolean
        isBuffering: boolean
        playingURI: string
      }
    }) => void,
  ): void
}
interface SpotifyAPI {
  createController(
    element: HTMLElement,
    options: {uri: string; width: string; height: number},
    callback: (controller: SpotifyController) => void,
  ): void
}
declare global {
  interface Window {
    YT?: YouTubeAPI
    onYouTubeIframeAPIReady?: () => void
    onSpotifyIframeApiReady?: (api: SpotifyAPI) => void
  }
}

let youtubePromise: Promise<YouTubeAPI> | undefined
let spotifyPromise: Promise<SpotifyAPI> | undefined

function loadScript<T>(url: string, subscribe: (ready: (value: T) => void) => () => void): Promise<T> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    let finished = false
    let unsubscribe = () => {}
    const timer = window.setTimeout(() => finish(undefined, new Error('플레이어 연결 시간이 초과되었습니다.')), 15000)
    function finish(value?: T, error?: Error) {
      if (finished) return
      finished = true
      clearTimeout(timer)
      script.onerror = null
      unsubscribe()
      if (error) {
        script.remove()
        reject(error)
      } else resolve(value!)
    }
    unsubscribe = subscribe((api) => finish(api))
    script.src = url
    script.async = true
    script.onerror = () => finish(undefined, new Error('플레이어를 불러오지 못했습니다.'))
    document.head.append(script)
  })
}
export function loadYouTube() {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  return (youtubePromise ??= loadScript<YouTubeAPI>('https://www.youtube.com/iframe_api', (ready) => {
    const previous = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      if (window.YT) ready(window.YT)
      previous?.()
    }
    return () => {
      window.onYouTubeIframeAPIReady = previous
    }
  }).catch((error) => {
    youtubePromise = undefined
    throw error
  }))
}
export function loadSpotify() {
  return (spotifyPromise ??= loadScript<SpotifyAPI>('https://open.spotify.com/embed/iframe-api/v1', (ready) => {
    const previous = window.onSpotifyIframeApiReady
    window.onSpotifyIframeApiReady = (api) => {
      ready(api)
      previous?.(api)
    }
    return () => {
      window.onSpotifyIframeApiReady = previous
    }
  }).catch((error) => {
    spotifyPromise = undefined
    throw error
  }))
}
