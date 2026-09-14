<script lang="ts">
  import {untrack} from 'svelte'
  import {Skeleton} from '$lib/components/ui/skeleton'
  import type {Source} from '$lib/lyrics/model'
  import {
    loadSpotify,
    loadYouTube,
    stopped,
    type Playback,
    type PlaybackRequest,
    type SpotifyController,
    type YouTubePlayer,
  } from '$lib/lyrics/players'

  let {
    source,
    request = {position: 0, playing: false},
    onunavailable,
    onplayback,
    onseekready,
  }: {
    source: Source
    request?: PlaybackRequest
    onunavailable?: (unavailable: boolean) => void
    onplayback: (sample: Playback) => void
    onseekready: (seek: ((time: number) => void) | undefined) => void
  } = $props()
  let host: HTMLDivElement
  let loading = $state(true)
  let message = $state('')
  let retry = $state(0)
  let autoplayBlocked = $state(false)
  let resume = $state<(() => void) | undefined>()

  $effect(() => {
    const container = host
    const current = source
    const initial = request
    void retry
    loading = true
    message = ''
    autoplayBlocked = false
    resume = undefined
    untrack(() => {
      onplayback({...stopped, position: initial.position})
      onseekready(undefined)
      onunavailable?.(false)
    })
    let disposed = false
    let youtube: YouTubePlayer | undefined
    let spotify: SpotifyController | undefined
    let interval: ReturnType<typeof setInterval> | undefined
    const mountPoint = document.createElement('div')
    container.append(mountPoint)
    const readyTimeout = window.setTimeout(() => {
      if (!disposed && loading) {
        loading = false
        message = '플레이어에 연결하지 못했습니다. 원본 링크에서 재생하거나 다시 시도해 주세요.'
        onunavailable?.(true)
      }
    }, 20000)
    let previous: Playback | undefined
    let queuedTime: number | undefined = initial.position
    const publish = (position: number, duration: number, playing: boolean) => {
      if (disposed) return
      if (previous && !playing && !previous.playing && previous.position === position && previous.duration === duration)
        return
      previous = {
        position: Number.isFinite(position) ? position : 0,
        duration: Number.isFinite(duration) ? duration : 0,
        playing,
        sampledAt: performance.now(),
      }
      onplayback(previous)
    }
    const sampleYouTube = () => {
      if (!youtube?.getCurrentTime || disposed) return
      const state = youtube.getPlayerState()
      if (state === 1 || state === 2) queuedTime = undefined
      publish(queuedTime ?? youtube.getCurrentTime() * 1000, youtube.getDuration() * 1000, state === 1)
    }
    const visibility = () => {
      clearInterval(interval)
      interval = undefined
      if (youtube && !document.hidden) {
        sampleYouTube()
        interval = setInterval(sampleYouTube, 200)
      }
    }
    if (current.provider === 'youtube') document.addEventListener('visibilitychange', visibility)
    async function connect() {
      if (current.provider === 'youtube') {
        const api = await loadYouTube()
        if (disposed) return
        youtube = new api.Player(mountPoint, {
          videoId: current.id,
          width: '100%',
          height: '100%',
          playerVars: {playsinline: 1, origin: location.origin},
          events: {
            onReady: ({target}) => {
              if (disposed) {
                target.destroy()
                return
              }
              youtube = target
              clearTimeout(readyTimeout)
              loading = false
              message = ''
              resume = () => target.playVideo()
              onseekready((time) => {
                queuedTime = time
                target.seekTo(time / 1000, true)
                publish(time, target.getDuration() * 1000, target.getPlayerState() === 1)
              })
              const video = {videoId: current.id, startSeconds: initial.position / 1000}
              if (initial.playing) target.loadVideoById(video)
              else if (initial.position > 0) target.cueVideoById(video)
              visibility()
            },
            onStateChange: ({data}) => {
              if (disposed) return
              if (data === 1) {
                autoplayBlocked = false
              }
              sampleYouTube()
            },
            onAutoplayBlocked: () => {
              if (disposed) return
              autoplayBlocked = true
              sampleYouTube()
            },
            onError: ({data}) => {
              if (disposed) return
              clearTimeout(readyTimeout)
              clearInterval(interval)
              loading = false
              message = `이 영상은 임베드에서 재생할 수 없습니다. YouTube에서 확인해 주세요. (${data})`
              autoplayBlocked = false
              onseekready(undefined)
              publish(previous?.position ?? initial.position, previous?.duration ?? 0, false)
              onunavailable?.(true)
            },
          },
        })
      } else {
        const api = await loadSpotify()
        if (disposed) return
        api.createController(
          mountPoint,
          {url: `${current.url}?locale=ko`, width: '100%', height: 352},
          (controller) => {
            if (disposed) {
              controller.destroy()
              return
            }
            spotify = controller
            clearTimeout(readyTimeout)
            loading = false
            message = ''
            onseekready((time) => {
              // Spotify only seeks to whole seconds; retain the start of the selected line.
              const seconds = Math.max(0, Math.floor(time / 1000))
              if (seconds === 0) controller.restart()
              else controller.seek(seconds)
            })
            controller.addListener('playback_update', ({data}) => {
              if (disposed) return
              if (data.playingURI && data.playingURI !== current.id) {
                onplayback(stopped)
                return
              }
              publish(data.position, data.duration, !data.isPaused && !data.isBuffering)
            })
          },
        )
      }
    }
    void connect().catch((error) => {
      if (disposed) return
      clearTimeout(readyTimeout)
      loading = false
      message = error instanceof Error ? error.message : '플레이어를 불러오지 못했습니다.'
      onunavailable?.(true)
    })
    return () => {
      disposed = true
      clearTimeout(readyTimeout)
      clearInterval(interval)
      document.removeEventListener('visibilitychange', visibility)
      youtube?.destroy()
      spotify?.destroy()
      container.replaceChildren()
      onseekready(undefined)
    }
  })
</script>

<div
  class="relative overflow-hidden rounded-[.75rem] shadow-xs inner-border"
  class:bg-muted={!loading}
  aria-busy={loading}
>
  <div
    bind:this={host}
    class:invisible={loading}
    class:youtube={source.provider === 'youtube'}
    class:spotify={source.provider === 'spotify'}
    class:audio={source.key === 'youtubeAudio'}
  ></div>
  {#if loading}
    <Skeleton class="absolute inset-0 size-full rounded-[inherit]" role="status" aria-label="플레이어 로딩 중" />
  {/if}
</div>
{#if autoplayBlocked}
  <button type="button" class="mt-3 rounded-md border px-3 py-2 text-sm" onclick={() => resume?.()}>이어서 재생</button>
{/if}
{#if message}
  <p class="mt-3 text-sm text-muted-foreground" role="status">{message}</p>
  <button type="button" class="mt-2 text-sm underline" onclick={() => retry++}>다시 시도</button>
{/if}

<style>
  .youtube {
    aspect-ratio: 16 / 9;
    min-height: 200px;
  }
  .youtube.audio {
    aspect-ratio: 1;
  }
  .spotify {
    min-height: 352px;
  }
  .youtube :global(iframe) {
    width: 100%;
    height: 100%;
    min-height: 200px;
    border: 0;
    display: block;
  }
</style>
