<script lang="ts">
  import type {Artist} from '$lib/lyrics/artists.server'
  import {onMount} from 'svelte'
  import {Button} from '$lib/components/ui/button'
  import {isTimed, lyricLanguages, toLyricLines, type Song, type Source, type SourceKey} from '$lib/lyrics/model'
  import {playbackTime, stopped, type Playback, type PlaybackRequest} from '$lib/lyrics/players'
  import {canPlayTime, sourceOffset, switchPosition} from '$lib/lyrics/timeline'
  import MusicEmbed from './MusicEmbed.svelte'
  import SyncedLyrics from './SyncedLyrics.svelte'
  import LyricText from './LyricText.svelte'

  let {song, sources, artists}: {song: Song; sources: Source[]; artists: Artist[]} = $props()
  let selected = $state<SourceKey | undefined>()
  const source = $derived(sources.find((item) => item.key === selected) ?? sources[0])
  const pronunciations = $derived(lyricLanguages(song.lines, 'pronunciation'))
  let pronunciation = $state('')
  const lines = $derived(toLyricLines(song.lines, 'ko', pronunciation || pronunciations[0], song))
  const timed = $derived(lines.filter(isTimed))
  const untimed = $derived(lines.filter((line) => !isTimed(line)))
  let sample = $state.raw<Playback>(stopped)
  let request = $state.raw<PlaybackRequest>({position: 0, playing: false})
  let durations = $state.raw<Partial<Record<SourceKey, number>>>({})
  const visibleTimed = $derived(
    source ? timed.filter((line) => canPlayTime(song, source.key, line.startTime, durations[source.key])) : timed,
  )
  let seek = $state<((time: number) => void) | undefined>()
  let mounted = $state(false)
  let fullText = $state(false)
  let failed = $state(false)
  let mediaFailed = $state(false)
  const canSync = $derived(!!source && source.provider !== 'appleMusic' && !mediaFailed && visibleTimed.length > 0)
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

  const externalUrl = $derived.by(() => {
    if (!source) return ''
    if (!mediaFailed || source.provider !== 'youtube') return source.url
    const url = new URL(source.url)
    url.searchParams.set('t', String(Math.floor(sample.position / 1000)))
    return url.href
  })

  function restarts(item: Source) {
    return (
      item.key !== source?.key &&
      source?.provider === 'youtube' &&
      item.provider === 'youtube' &&
      !canPlayTime(song, item.key, sample.position - offset, durations[item.key])
    )
  }
</script>

<div
  class="mx-auto grid max-w-[1500px] items-start gap-8 pt-8 md:pt-20 lg:grid-cols-[minmax(320px,0.85fr)_minmax(0,1.15fr)] lg:gap-12"
>
  <aside class="min-w-0 lg:sticky lg:top-26">
    {#if source}
      {#if sources.length > 1}
        <div class="mb-3 flex flex-wrap gap-2" role="group" aria-label="음악 소스 선택">
          {#each sources as item (item.key)}
            <Button
              size="sm"
              variant={source.key === item.key ? 'default' : 'outline'}
              aria-pressed={source.key === item.key}
              onclick={() => select(item.key)}
              >{item.label}{#if restarts(item)}
                · 처음부터{/if}</Button
            >
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
      class="mt-6 text-3xl leading-tight font-semibold text-balance sm:text-4xl"
    >
      {song.title}
    </h1>
    {#if song.titleTranslation}<p lang="ko" class="mt-2 text-xl text-muted-foreground">{song.titleTranslation}</p>{/if}
    {#if artists.length}
      <div class="mt-3 flex flex-wrap gap-x-3 gap-y-2">
        {#each artists as artist (artist.slug)}
          <a href={`/artist/${artist.slug}`} class="hover:underline">
            <span lang={artist.translation ? 'ko' : (artist.lang ?? '')}>{artist.translation || artist.name}</span>
          </a>
        {/each}
      </div>
    {/if}
  </aside>

  <section class="min-w-0 pb-16" aria-label="가사">
    {#if canSync || pronunciations.length > 1}
      <div class="mb-4 flex min-h-9 flex-wrap items-center justify-end gap-3">
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
          <Button size="sm" variant="ghost" aria-pressed={fullText} onclick={() => (fullText = !fullText)}
            >{fullText ? '동기화 보기' : '전체 가사 보기'}</Button
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
        {#each visibleTimed as line, index}{#if index > 0 && !line.translatedLyric && !visibleTimed[index - 1].translatedLyric}<br
            />{/if}<LyricText {line} />{/each}
      </div>
      {#if untimed.length}
        <div class="mt-6 leading-relaxed">
          {#each untimed as line, index}{#if index > 0 && !line.translatedLyric && !untimed[index - 1].translatedLyric}<br
              />{/if}<LyricText {line} />{/each}
        </div>
      {/if}
    {:else}
      <div class="py-6 leading-relaxed font-normal">
        {#each lines as line, index}{#if index > 0 && !line.translatedLyric && !lines[index - 1].translatedLyric}<br
            />{/if}<LyricText {line} />{/each}
      </div>
    {/if}
  </section>
</div>
