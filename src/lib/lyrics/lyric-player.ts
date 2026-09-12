import {LyricPlayer} from '@applemusic-like-lyrics/core'
import type {LocalizedLyricLine} from './model'

export class AnnotatedLyricPlayer extends LyricPlayer {
  private hasWordAnnotations = false
  private settingLines = false

  constructor() {
    super()
    this.scrollState.allowScroll = false
  }

  // Keep AMLL's absolute layout, including its interlude spacing and springs.
  // Only cancel the internal viewport offset so the document scrolls instead.
  override async calcLayout(sync = false, force = false) {
    // Initial data and size measurements are layout corrections, not lyric transitions.
    force ||= sync || this.settingLines
    if (force) sync = true
    for (const group of this.currentLyricGroups) {
      group.show()
      if (!this.lyricGroupSize.has(group)) {
        this.lyricGroupSize.set(group, [group.element.clientWidth, group.element.clientHeight])
      }
    }
    void super.calcLayout(sync, force)
    const first = this.currentLyricGroups[0]
    if (!first) {
      this.getElement().style.height = '0px'
      return
    }
    const intro = this.layoutState.lastInterludeState && first.startTime > this.timelineState.currentTime + 20
    const introHeight = intro ? this.layoutState.interludeDotsSize[1] + (this.baseFontSize || 24) * 0.8 : 0
    const origin = first.top - introHeight
    if (Math.abs(origin) > 0.01) {
      this.scrollState.scrollOffset += origin
      void super.calcLayout(sync, force)
    }
    if (force) {
      // setPosition alone does not clear AMLL's delayed spring targets.
      for (const group of this.currentLyricGroups) {
        group.posY.setTargetPosition(group.top)
        group.posY.setPosition(group.top)
      }
    }
    const last = this.currentLyricGroups[this.currentLyricGroups.length - 1]
    const height = `${last.top + (this.lyricGroupSize.get(last)?.[1] ?? 0)}px`
    if (this.getElement().style.height !== height) this.getElement().style.height = height
  }

  activeElement(time: number) {
    const active = this.currentLyricGroups.find((group) => time >= group.startTime && time < group.endTime)
    if (active) return active.mainLine.getElement()
    const dots = this.interludeDots.getElement()
    return [...dots.classList].some((name) => name.endsWith('_enabled')) ? dots : undefined
  }

  override setLyricLines(lines: LocalizedLyricLine[], initialTime = 0) {
    this.hasWordAnnotations = lines.some((line) =>
      line.words.some((word) => word.ruby?.length || word.romanWord?.trim()),
    )
    this.settingLines = true
    try {
      super.setLyricLines(lines, initialTime)
    } finally {
      this.settingLines = false
    }
    if (this.hasWordAnnotations) this.isNonDynamic = false
    // AMLL keeps these three containers when virtualizing each line's contents.
    for (const group of this.currentLyricGroups) {
      for (const view of [group.mainLine, group.bgLine]) {
        if (!view) continue
        const line = view.getLine() as LocalizedLyricLine
        const [main, translation, pronunciation] = view.getElement().children
        main.setAttribute('lang', line.lang ?? '')
        translation.setAttribute('lang', line.translationLang ?? '')
        pronunciation.setAttribute('lang', line.pronunciationLang ?? '')
      }
    }
  }

  // AMLL 0.5.2 skips word annotations when every line contains only one word.
  // Keep its word renderer enabled for annotated line-level lyrics as well.
  override _getIsNonDynamic() {
    return !this.hasWordAnnotations && super._getIsNonDynamic()
  }
}
