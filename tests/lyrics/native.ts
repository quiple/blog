import {DomLyricPlayer as Native} from '@applemusic-like-lyrics/core'
import '@applemusic-like-lyrics/core/style.css'
import {DocumentLyricPlayer} from '$lib/lyrics/document-player'
import type {LyricLine} from '@applemusic-like-lyrics/core'

class MeasuredNative extends Native {
  measureDots() {
    this.layoutState.interludeDotsSize = [80, 30]
  }
}
class MeasuredPort extends DocumentLyricPlayer {
  measureDots() {
    this.layoutState.interludeDotsSize = [80, 30]
  }
}

export async function compareNative() {
  const native = new MeasuredNative(),
    port = new MeasuredPort()
  const hosts = [native, port].map((player) => {
    const host = document.createElement('div')
    host.style.cssText = 'position:absolute;left:-10000px;top:0;width:800px;height:600px'
    document.body.append(host)
    host.append(player.getElement())
    player.setAlignPosition(0)
    player.setEnableBlur(false)
    player.setOptimizeOptions({
      resetLineTimestamps: false,
      normalizeSpaces: true,
      syncMainAndBackgroundLines: true,
      cleanUnintentionalOverlaps: false,
      tryAdvanceStartTime: false,
    })
    return host
  })
  const lines: LyricLine[] = Array.from({length: 10}, (_, i) => ({
    startTime: i * 8000 + 5000,
    endTime: i * 8000 + 7000,
    words: [
      {word: 'First ', startTime: i * 8000 + 5000, endTime: i * 8000 + 6000},
      {word: 'second', startTime: i * 8000 + 6000, endTime: i * 8000 + 7000},
    ],
    translatedLyric: '',
    romanLyric: '',
    isBG: false,
    isDuet: i % 3 === 0,
  }))
  try {
    for (const p of [native, port]) {
      p.setLyricLines(lines, 0)
      p.resume()
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
    // Use equal measured row sizes so virtualized fallback heights do not affect comparison.
    for (const group of native.currentLyricGroups) native.lyricGroupSize.set(group, [800, 80])
    for (const group of port.currentLyricGroups) port.lyricGroupSize.set(group, [800, 80])
    native.measureDots()
    port.measureDots()
    let assertions = 0
    for (const time of [0, 5100, 7200, 11000, 17100, 31000, 59000, 62000]) {
      native.setCurrentTime(time, true)
      port.setCurrentTime(time, true)
      await native.calcLayout(true, true)
      await port.calcLayout(true, true)
      const origin = port.currentLyricGroups[0].top - native.currentLyricGroups[0].top
      for (let i = 0; i < 10; i++) {
        const a = native.currentLyricGroups[i],
          b = port.currentLyricGroups[i]
        for (const [label, pass] of [
          ['position', Math.abs(a.top + origin - b.top) < 0.01],
          ['active', a.isActive === b.isActive],
          ['opacity', a.opacity === b.opacity],
          ['delay', a.delay === b.delay],
        ] as const) {
          assertions++
          if (!pass) throw Error(`native ${label} mismatch at ${time}, row ${i}: ${a.top}, ${b.top}`)
        }
      }
    }
    return assertions
  } finally {
    native.dispose()
    port.dispose()
    hosts.forEach((host) => host.remove())
  }
}
