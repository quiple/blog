import {LyricPlayer} from '@applemusic-like-lyrics/core'
import type {LocalizedLyricLine} from './model'

export class AnnotatedLyricPlayer extends LyricPlayer {
  private hasWordAnnotations = false

  constructor() {
    super()
    this.scrollState.allowScroll = false
  }

  // Preserve AMLL's presentation and interlude timeline; only replace its scroll coordinates.
  override async calcLayout(sync = false, force = false) {
    void super.calcLayout(sync, force)
    for (const group of this.currentLyricGroups) {
      group.posY.setTargetPosition(0)
      group.posY.setPosition(0)
      group.element.style.transform = 'translateY(0px)'
      group.show()
    }
    const next = this.currentLyricGroups.find((group) => group.startTime > this.timelineState.currentTime + 20)
    if (next) {
      const dots = this.interludeDots.getElement()
      this.interludeDots.setTransform(
        next.mainLine.getLine().isDuet ? Math.max(0, this.size[0] - dots.clientWidth) : 0,
        Math.max(0, next.element.offsetTop - dots.clientHeight),
      )
    }
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
    super.setLyricLines(lines, initialTime)
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
