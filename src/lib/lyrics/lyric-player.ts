import {LyricPlayer} from '@applemusic-like-lyrics/core'
import type {LocalizedLyricLine} from './model'

function measureGroupTop(this: {top: number}, top: number) {
  this.top = top
}

export class AnnotatedLyricPlayer extends LyricPlayer {
  private hasWordAnnotations = false
  private settingLines = false
  private layoutWidth = -1
  private readonly groupTransforms: (typeof this.currentLyricGroups)[number]['setTransform'][] = []

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
    const transforms = this.groupTransforms
    transforms.length = 0
    try {
      for (const group of this.currentLyricGroups) {
        // oxlint-disable-next-line typescript/unbound-method
        transforms.push(group.setTransform)
        group.setTransform = measureGroupTop
      }
      void super.calcLayout(sync, force)
    } finally {
      for (let index = 0; index < transforms.length; index++) {
        this.currentLyricGroups[index].setTransform = transforms[index]
      }
      transforms.length = 0
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
    for (const group of this.currentLyricGroups) {
      if (time >= group.startTime && time < group.endTime) return group.mainLine.getElement()
    }
    const dots = this.interludeDots.getElement()
    for (const name of dots.classList) if (name.endsWith('_enabled')) return dots
    return undefined
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
        translation.classList.add('text-muted-foreground')
        pronunciation.setAttribute('lang', line.pronunciationLang ?? '')
      }
    }
  }

  // AMLL's single-word shortcut skips ruby and word pronunciation annotations.
  // Background rows alone must not turn line-timed lyrics into karaoke lyrics.
  override _getIsNonDynamic() {
    return !this.hasWordAnnotations && super._getIsNonDynamic()
  }
}
