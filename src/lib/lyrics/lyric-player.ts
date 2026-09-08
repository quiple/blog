import {LyricPlayer} from '@applemusic-like-lyrics/core'
import type {LocalizedLyricLine} from './model'

export class AnnotatedLyricPlayer extends LyricPlayer {
  private hasWordAnnotations = false
  private interludeSlots = new Map<HTMLElement, HTMLElement>()

  constructor() {
    super()
    this.scrollState.allowScroll = false
  }

  // Preserve AMLL's presentation and interlude timeline; only replace its scroll coordinates.
  override async calcLayout(sync = false, force = false) {
    void super.calcLayout(sync, force)
    let previousEnd = 0
    for (const group of this.currentLyricGroups) {
      group.posY.setTargetPosition(0)
      group.posY.setPosition(0)
      group.element.style.transform = 'translateY(0px)'
      group.show()
      // Reserve the gap in document flow, so the dots never overlap lyric rows.
      if (group.startTime - 250 - previousEnd >= 4000 && !this.interludeSlots.has(group.element)) {
        const slot = document.createElement('div')
        slot.className = 'lyric-interlude-slot'
        slot.classList.toggle('duet', group.mainLine.getLine().isDuet)
        group.element.before(slot)
        this.interludeSlots.set(group.element, slot)
      }
      previousEnd = group.endTime
    }
    const next = this.currentLyricGroups.find((group) => group.startTime > this.timelineState.currentTime + 20)
    const slot = next && this.interludeSlots.get(next.element)
    if (slot) {
      const dots = this.interludeDots.getElement()
      if (dots.parentElement !== slot) slot.append(dots)
      this.interludeDots.setTransform(0, 0)
    }
  }

  activeElement(time: number) {
    const active = this.currentLyricGroups.find((group) => time >= group.startTime && time < group.endTime)
    if (active) return active.mainLine.getElement()
    const dots = this.interludeDots.getElement()
    return [...dots.classList].some((name) => name.endsWith('_enabled')) ? dots : undefined
  }

  override setLyricLines(lines: LocalizedLyricLine[], initialTime = 0) {
    this.getElement().append(this.interludeDots.getElement())
    for (const slot of this.interludeSlots.values()) slot.remove()
    this.interludeSlots.clear()
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
