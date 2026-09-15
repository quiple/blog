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
    const top = group ? group.top + line.offsetTop : this.interludeTop
    return this.getElement().getBoundingClientRect().top + window.scrollY + top
  }

  lastLine() {
    return this.currentLyricGroups.at(-1)?.mainLine.getElement()
  }
}
