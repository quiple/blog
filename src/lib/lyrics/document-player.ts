import {DomLyricPlayer} from 'virtual:amll-document'
import '@applemusic-like-lyrics/core/style.css'
import './document-player.css'

/** Document-coordinate accessors; rendering is provided by AMLL with the document patch. */
export class DocumentLyricPlayer extends DomLyricPlayer {
  declare layoutVersion: number
  declare hasStarted: boolean
  declare interludeTop: number
  declare interlude: {startTime: number; endTime: number; anchorLineIndex: number; isNextDuet: boolean} | undefined

  resetPlayback() {
    if (!this.hasStarted) return
    this.hasStarted = false
    void this.calcLayout('config-change')
  }

  activeLine(time: number) {
    const group = this.currentLyricGroups.find(
      (group) => group.mainLine.getLine().startTime <= time && time < group.mainLine.getLine().endTime,
    )
    return group?.mainLine.getElement() ?? (this.interlude ? this.interludeDots.getElement() : undefined)
  }

  lineTop(line: HTMLElement, exactInterlude = false) {
    const group = line.parentElement ? this.lyricGroupElementMap.get(line.parentElement) : undefined
    // Match the next main line's anchor, including its inset inside the group.
    // The native dots themselves sit 0.4em inside the interlude slot.
    const nextLine = this.interlude
      ? this.currentLyricGroups[this.interlude.anchorLineIndex + 1]?.mainLine.getElement()
      : undefined
    const top = group
      ? group.top + line.offsetTop
      : exactInterlude
        ? this.interludeTop
        : this.interludeTop - (this.baseFontSize || 24) * 0.4 + (nextLine?.offsetTop ?? 0)
    return this.getElement().getBoundingClientRect().top + window.scrollY + top
  }

  alignmentLine(line: HTMLElement) {
    // Follow the next line's layout spring while the interlude opens its gap.
    return this.interlude && line === this.interludeDots.getElement()
      ? (this.currentLyricGroups[this.interlude.anchorLineIndex + 1]?.mainLine.getElement() ?? line)
      : line
  }

  refreshMasks() {
    for (const group of this.currentLyricGroups) {
      group.mainLine.updateMaskImageSync()
      group.bgLine?.updateMaskImageSync()
    }
  }

  lastLine() {
    return this.currentLyricGroups.at(-1)?.mainLine.getElement()
  }
}
