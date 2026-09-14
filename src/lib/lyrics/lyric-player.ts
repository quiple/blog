import {LyricPlayer} from '@applemusic-like-lyrics/core'
import type {LocalizedLyricLine} from './model'

export class AnnotatedLyricPlayer extends LyricPlayer {
  private needsWordRenderer = false
  private settingLines = false
  private layoutWidth = -1

  constructor() {
    super()
    this.scrollState.allowScroll = false
  }

  // Keep AMLL's absolute layout, including its interlude spacing and springs.
  // Only cancel the internal viewport offset so the document scrolls instead.
  override async calcLayout(sync = false, force = false) {
    // sync removes the stagger between rows; it must not disable their springs.
    // Background rows resize when playback changes, including during animation.
    const width = this.getElement().clientWidth
    force ||= this.settingLines || width !== this.layoutWidth
    this.layoutWidth = width
    if (force) sync = true
    for (const group of this.currentLyricGroups) {
      group.show()
      if (!this.lyricGroupSize.has(group)) {
        this.lyricGroupSize.set(group, [group.element.clientWidth, group.element.clientHeight])
      }
    }
    // Measure the native positions without sending temporary viewport-relative
    // targets to the springs. Only the corrected pass should animate the groups.
    // Restore each method to its original receiver without invoking it unbound.
    // oxlint-disable-next-line typescript/unbound-method
    const transforms = this.currentLyricGroups.map((group) => group.setTransform)
    try {
      for (const group of this.currentLyricGroups) {
        group.setTransform = (top) => {
          group.top = top
        }
      }
      void super.calcLayout(sync, force)
    } finally {
      this.currentLyricGroups.forEach((group, index) => {
        group.setTransform = transforms[index]
      })
    }
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
    }
    void super.calcLayout(sync, force)
    if (force) {
      // setPosition alone does not clear AMLL's delayed spring targets.
      for (const group of this.currentLyricGroups) {
        group.posY.setTargetPosition(group.top)
        group.posY.setPosition(group.top)
        group.bgSlideY.setTargetPosition(group.bgSlideY.getCurrentPosition())
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
    this.needsWordRenderer = lines.some(
      (line) => line.isBG || line.words.some((word) => word.ruby?.length || word.romanWord?.trim()),
    )
    this.settingLines = true
    try {
      super.setLyricLines(lines, initialTime)
    } finally {
      this.settingLines = false
    }
    if (this.needsWordRenderer) this.isNonDynamic = false
    // AMLL keeps these three containers when virtualizing each line's contents.
    for (const group of this.currentLyricGroups) {
      for (const view of [group.mainLine, group.bgLine]) {
        if (!view) continue
        const line = view.getLine() as LocalizedLyricLine
        const [main, translation, pronunciation] = view.getElement().children
        main.setAttribute('lang', line.lang ?? '')
        translation.setAttribute('lang', line.translationLang ?? '')
        translation.classList.add('text-muted-foreground')
        pronunciation.setAttribute('lang', line.pronunciationLang ?? '')
      }
    }
  }

  // AMLL's single-word shortcut skips annotations and independent background
  // timing. The word renderer preserves both, even for line-level lyrics.
  override _getIsNonDynamic() {
    return !this.needsWordRenderer && super._getIsNonDynamic()
  }
}
