<script lang="ts">
  import type {Artist} from '$lib/lyrics/artists.server'
  import {onMount} from 'svelte'
  import {Button} from '$lib/components/ui/button'
  import {
    isTimed,
    lyricLanguages,
    toLyricLines,
    type LocalizedLyricLine,
    type Song,
    type Source,
    type SourceKey,
  } from '$lib/lyrics/model'
  import {playbackTime, stopped, type Playback, type PlaybackRequest} from '$lib/lyrics/players'
  import {canPlayTime, sourceOffset, switchPosition} from '$lib/lyrics/timeline'
  import MusicEmbed from './MusicEmbed.svelte'
  import SyncedLyrics from './SyncedLyrics.svelte'
  import LyricText from './LyricText.svelte'
  import {siSpotify, siYoutube, siYoutubemusic} from 'simple-icons'

  const sourceIcons = {
    youtubeAudio: siYoutubemusic.path,
    youtubeMV: siYoutube.path,
    spotify: siSpotify.path,
  }

  let {song, sources, artists}: {song: Song; sources: Source[]; artists: Artist[]} = $props()
  let selected = $state<SourceKey | undefined>()
  const source = $derived(sources.find((item) => item.key === selected) ?? sources[0])
  const pronunciations = $derived(lyricLanguages(song.lines, 'pronunciation'))
  let pronunciation = $state('')
  const lines = $derived(toLyricLines(song.lines, 'ko', pronunciation || pronunciations[0], song))
  const partitioned = $derived.by(() => {
    const timed: LocalizedLyricLine[] = []
    const untimed: LocalizedLyricLine[] = []
    for (const line of lines) (isTimed(line) ? timed : untimed).push(line)
    return {timed, untimed}
  })
  const {timed, untimed} = $derived(partitioned)
  let sample = $state.raw<Playback>(stopped)
  let request = $state.raw<PlaybackRequest>({position: 0, playing: false})
  let durations = $state.raw<Partial<Record<SourceKey, number>>>({})
  const visibleTimed = $derived.by(() => {
    const duration = source && durations[source.key]
    if (!duration) return timed
    const limit = duration - offset
    return timed.filter((line) => line.startTime < limit)
  })
  let seek = $state<((time: number) => void) | undefined>()
  let mounted = $state(false)
  let fullText = $state(false)
  let failed = $state(false)
  let mediaFailed = $state(false)
  const canSync = $derived(!!source && !mediaFailed && visibleTimed.length > 0)
  const animated = $derived(mounted && canSync && !fullText && !failed)
  const offset = $derived(source ? sourceOffset(song, source.key) : 0)
  onMount(() => {
    mounted = true
  })

  function currentLyricTime() {
    return playbackTime(sample, performance.now()) - offset
  }

  function recordPlayback(key: SourceKey, value: Playback) {
    if (source?.key !== key) return
    sample = value
    if (value.duration > 0 && durations[key] !== value.duration) durations = {...durations, [key]: value.duration}
  }

  function select(key: SourceKey) {
    if (source?.key === key) return
    const target = sources.find((item) => item.key === key)
    if (!target) return
    const preserveTime = source?.provider === 'youtube' && target.provider === 'youtube'
    request = {
      position: preserveTime ? switchPosition(song, key, currentLyricTime(), durations[key]).position : 0,
      playing: preserveTime && sample.playing,
    }
    sample = {...stopped, position: request.position}
    seek = undefined
    failed = false
    mediaFailed = false
    selected = key
  }

  function seekLyric(time: number) {
    if (source && canPlayTime(song, source.key, time, durations[source.key])) seek?.(Math.max(0, time + offset))
  }

  function restarts(item: Source) {
    return (
      item.key !== source?.key &&
      source?.provider === 'youtube' &&
      item.provider === 'youtube' &&
      !canPlayTime(song, item.key, sample.position - offset, durations[item.key])
    )
  }
</script>

{#snippet textLines(value: LocalizedLyricLine[], semibold = false)}
  {#each value as line, index}{#if index > 0 && !line.translatedLyric && !value[index - 1].translatedLyric}<br
      />{/if}<LyricText {line} {semibold} />{/each}
{/snippet}

<div
  class="mx-auto grid max-w-400 items-start gap-4 pt-0 sm:gap-6 md:grid-cols-[minmax(320px,0.85fr)_minmax(0,1.15fr)] md:pt-15"
>
  <aside class="min-w-0 md:sticky md:top-21">
    {#if source}
      {#if sources.length > 1}
        <div class="mb-3 flex flex-wrap gap-2" role="group" aria-label="음악 소스 선택">
          {#each sources as item (item.key)}
            {@const restart = restarts(item)}
            {@const label = `${item.label}${restart ? ' · 처음부터' : ''}`}
            {@const color = item.provider === 'spotify' ? '#1ED760' : '#FF0000'}
            <Button
              size="icon-sm"
              variant={source.key === item.key ? 'default' : 'outline'}
              style={source.key === item.key ? `background-color: ${color}; border-color: ${color}` : undefined}
              aria-pressed={source.key === item.key}
              aria-label={label}
              title={label}
              onclick={() => select(item.key)}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" class="size-4" aria-hidden="true">
                <path d={sourceIcons[item.key]} />
              </svg>
            </Button>
          {/each}
        </div>
      {/if}
      <div>
        {#key source.key}
          {@const activeSource = source}
          <MusicEmbed
            source={activeSource}
            {request}
            onplayback={(value) => recordPlayback(activeSource.key, value)}
            onseekready={(value) => {
              if (source?.key === activeSource.key) seek = value
            }}
            onunavailable={(value) => {
              if (source?.key === activeSource.key) mediaFailed = value
            }}
          />
        {/key}
      </div>
    {/if}
    <h1
      lang={song.titleLang ?? song.lang ?? ''}
      class="mt-5 text-3xl leading-tight font-semibold text-balance sm:text-4xl"
    >
      {song.title}
    </h1>
    {#if song.titleTranslation}<p lang="ko" class="text-xl font-semibold text-muted-foreground">
        {song.titleTranslation}
      </p>{/if}
    {#if artists.length}
      <div class="mt-3 text-muted-foreground">
        {#each artists as artist, index (artist.slug)}
          {#if index > 0}{', '}{/if}
          <a href={`/artist/${artist.slug}`} class="hover:underline">
            <span lang={artist.translation ? 'ko' : (artist.lang ?? '')}>{artist.translation || artist.name}</span>
          </a>
        {/each}
      </div>
    {/if}
  </aside>

  <section class="min-w-0 pb-16" aria-label="가사">
    {#if canSync || pronunciations.length > 1}
      <div class="mb-3 flex min-h-7 flex-wrap items-center justify-end gap-3">
        {#if pronunciations.length > 1}
          <label class="text-sm text-muted-foreground"
            >발음
            <select
              class="ml-1 rounded-md border bg-background p-1 text-foreground"
              value={pronunciation || pronunciations[0]}
              onchange={(event) => (pronunciation = event.currentTarget.value)}
            >
              {#each pronunciations as language}<option value={language}>{language}</option>{/each}
            </select>
          </label>
        {/if}
        {#if canSync}
          <Button
            size="sm"
            variant="outline"
            class="z-100 bg-background! hover:bg-muted! md:fixed md:top-21 dark:hover:bg-[#181819]!"
            aria-pressed={fullText}
            onclick={() => (fullText = !fullText)}>{fullText ? '동기화 보기' : '전체 가사 보기'}</Button
          >
        {/if}
      </div>
    {/if}
    {#if failed}<p class="mb-4 text-sm text-muted-foreground" role="status">
        동기화 보기를 불러오지 못해 전체 가사를 표시합니다.
      </p>{/if}
    {#if animated}
      <SyncedLyrics
        lines={visibleTimed}
        {sample}
        {offset}
        onseek={(time) => seekLyric(time - offset)}
        onfailure={() => (failed = true)}
      />
      <div class="sr-only">
        {@render textLines(visibleTimed)}
      </div>
      {#if untimed.length}
        <div class="mt-6 leading-relaxed">
          {@render textLines(untimed, true)}
        </div>
      {/if}
    {:else}
      <div class="leading-relaxed font-normal">
        {@render textLines(lines)}
      </div>
    {/if}
  </section>
</div>
