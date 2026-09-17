<script lang="ts">
  import {onMount} from 'svelte'
  import SyncedLyrics from '$lib/components/lyrics/SyncedLyrics.svelte'
  import type {LocalizedLyricLine} from '$lib/lyrics/model'
  import {stopped} from '$lib/lyrics/players'
  let sample = $state({...stopped})
  let result = $state('running')
  let host: HTMLDivElement
  const lines: LocalizedLyricLine[] = Array.from({length: 12}, (_, i) => {
    const start = 5000 + i * 4000 + (i >= 5 ? 6000 : 0),
      end = start + 3000
    return {
      words: [
        {
          word: i === 2 ? '弊社' : 'Test line ' + i,
          startTime: start,
          endTime: end,
          ...(i === 2 ? {ruby: [{word: 'ここ', startTime: start, endTime: end}]} : {}),
        },
        ...(i === 2 ? [{word: 'はもうお仕舞だね', startTime: start, endTime: end}] : []),
      ],
      startTime: start,
      endTime: end,
      translatedLyric: '한국어 번역',
      romanLyric: '',
      isBG: false,
      isDuet: i === 6,
      lang: 'ja',
    }
  })
  lines.splice(4, 0, {...lines[3], words: [{word: 'Background', startTime: 17000, endTime: 20000}], isBG: true})
  const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))
  let playingAt = 0,
    timer: ReturnType<typeof setInterval>
  function set(time: number, playing = false) {
    playingAt = time
    sample = {position: time, duration: 58000, playing, sampledAt: performance.now()}
  }
  const rect = (el: Element) => el.getBoundingClientRect()
  async function run() {
    const checks: Record<string, unknown> = {}
    const assert = (name: string, pass: boolean, detail?: unknown) => {
      checks[name] = {pass, detail}
      result = JSON.stringify(checks, null, 2)
      if (!pass) throw Error(name)
    }
    const {compareNative} = await import('./native')
    const assertions = await compareNative()
    assert('native layout parity', assertions === 320, assertions)
    await wait(1600)
    const main = () => [...host.querySelectorAll<HTMLElement>('[class*="lyricMainLine"]')]
    const dots = () => host.querySelector<HTMLElement>('[class*="interludeDots"]')!
    assert('initial dots hidden', getComputedStyle(dots()).opacity === '0')
    const bodies = [...main()[2].querySelectorAll('[class*="wordBody"]')]
    const heights = bodies.map((el) => rect(el).bottom)
    assert('ruby baseline', Math.max(...heights) - Math.min(...heights) < 0.5, heights)
    const kana = [...main()[2].querySelectorAll('[class*="rubyWord"] > span > span')]
    assert('ruby kana spacing', kana.length === 2 && rect(kana[1]).left - rect(kana[0]).right > 5)
    assert('line timed ruby has no karaoke mask', !main()[2].querySelector('[style*="mask-image"]'))
    set(22000, true)
    await wait(1800)
    const backgroundMain = main()[5],
      before = rect(backgroundMain).top
    set(22000, false)
    await wait(1400)
    const paused = rect(backgroundMain).top
    assert('pause anchor', Math.abs(paused - before) < 1, {before, paused})
    set(22000, true)
    await wait(1400)
    assert('resume anchor', Math.abs(rect(backgroundMain).top - paused) < 1, {
      paused,
      resumed: rect(backgroundMain).top,
    })
    // Dots stay hidden while rows open their gap; scrolling must not wait for them.
    const originalScrollTo = window.scrollTo.bind(window)
    let scrolledWhileDotsHidden = false
    window.scrollTo = (optionsOrX?: ScrollToOptions | number, y?: number) => {
      if (typeof optionsOrX === 'number') originalScrollTo(optionsOrX, y ?? 0)
      else {
        if (dots().style.visibility === 'hidden') scrolledWhileDotsHidden = true
        originalScrollTo(optionsOrX)
      }
    }
    try {
      set(26500, true)
      await wait(1400)
    } finally {
      window.scrollTo = originalScrollTo
    }
    assert('interlude scroll starts while gap opens', scrolledWhileDotsHidden)
    const afterGap = main()[6],
      gapTop = rect(afterGap).top,
      precedingTop = rect(main()[5]).top
    assert('interlude visible', getComputedStyle(dots()).opacity === '1')
    assert('interlude does not overlap next row', rect(dots()).bottom <= rect(afterGap).top + 1, {
      dots: rect(dots()).bottom,
      row: rect(afterGap).top,
    })
    // Natural clock advance, not seek: every increment is below the seek threshold.
    for (let t = 27000; t <= 31200; t += 300) {
      set(t, true)
      await wait(50)
    }
    await wait(1800)
    assert('interlude exit preserves preceding row position', Math.abs(rect(main()[5]).top - precedingTop) < 1, {
      before: precedingTop,
      after: rect(main()[5]).top,
    })
    assert('natural interlude exit', getComputedStyle(dots()).opacity === '0')
    const gap =
      rect(main()[6].closest('[class*=lyricLineWrapper]')!).top -
      rect(main()[5].closest('[class*=lyricLineWrapper]')!).bottom
    assert('interlude space removed', Math.abs(gap) < 2, {gap, gapTop})
    set(55500, true)
    await wait(1800)
    assert('last row at document end', Math.abs(document.documentElement.scrollHeight - innerHeight - scrollY) < 2, {
      remaining: document.documentElement.scrollHeight - innerHeight - scrollY,
    })
    set(0, false)
    await wait(1400)
    assert('ended reset hides intro dots', getComputedStyle(dots()).opacity === '0')
    result = JSON.stringify({pass: true, checks}, null, 2)
  }
  onMount(() => {
    timer = setInterval(() => {
      if (sample.playing) set(playingAt, true)
    }, 100)
    void run().catch((e) => (result += '\nFAILED: ' + String(e)))
    return () => clearInterval(timer)
  })
</script>

<pre
  id="result"
  style="position:fixed;right:0;top:0;z-index:100;background:#222;color:white;font-size:10px;max-height:40vh;overflow:auto">{result}</pre>
<div bind:this={host} style="max-width:850px;margin:0 auto">
  <SyncedLyrics {lines} {sample} onseek={(time) => set(time, true)} onfailure={() => (result = 'failure')} />
</div>
