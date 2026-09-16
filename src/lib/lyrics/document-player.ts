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
    void this.calcLayout(true, true)
  }

  activeLine(time: number) {
    const group = this.currentLyricGroups.find((group) => group.startTime <= time && time < group.endTime)
    return group?.mainLine.getElement() ?? (this.interlude ? this.interludeDots.getElement() : undefined)
  }

  lineTop(line: HTMLElement) {
    const group = this.currentLyricGroups.find((group) => group.mainLine.getElement() === line)
    // Match the next main line's anchor, including its inset inside the group.
    // The native dots themselves sit 0.4em inside the interlude slot.
    const nextLine = this.interlude
      ? this.currentLyricGroups[this.interlude.anchorLineIndex + 1]?.mainLine.getElement()
      : undefined
    const top = group
      ? group.top + line.offsetTop
      : this.interludeTop - (this.baseFontSize || 24) * 0.4 + (nextLine?.offsetTop ?? 0)
    return this.getElement().getBoundingClientRect().top + window.scrollY + top
  }

  lastLine() {
    return this.currentLyricGroups.at(-1)?.mainLine.getElement()
  }
}
