import {LyricPlayer} from '@applemusic-like-lyrics/core'
import type {LocalizedLyricLine} from './model'

type GroupLayout = {top: number; delay: number; isActive: boolean; opacity: number; blur: number}

function measureGroupLayout(
  this: GroupLayout,
  top: number,
  _force: boolean,
  delay: number,
  isActive: boolean,
  opacity: number,
  blur: number,
) {
  this.top = top
  this.delay = delay
  this.isActive = isActive
  this.opacity = opacity
  this.blur = blur
}

export class AnnotatedLyricPlayer extends LyricPlayer {
  private hasWordAnnotations = false
  private settingLines = false
  private layoutWidth = -1
  private measuring = false
  private hasStarted = false
  private interludeEnd: number | undefined
  private interludeLeft = 0
  private interludeTop = 0
  private interludeIndex = -1
  private activeFrom = 0
  private activeUntil = 0
  private activeMain: HTMLElement | undefined
  private mainGroups = new WeakMap<HTMLElement, (typeof this.currentLyricGroups)[number]>()
  layoutVersion = 0
  private readonly groupTransforms: (typeof this.currentLyricGroups)[number]['setTransform'][] = []

  constructor() {
    super()
    this.scrollState.allowScroll = false
    const dots = this.interludeDots
    const transform = dots.setTransform.bind(dots)
    const interlude = dots.setInterlude.bind(dots)
    dots.setTransform = (left = 0, top = 0) => {
      this.interludeLeft = left
      this.interludeTop = top
      if (this.measuring) return
      transform(left, top)
      // AMLL skips all dot style updates while paused, including positioning.
      if (!this.getIsPlaying()) {
        const style = dots.getElement().style
        const scale = style.transform.match(/scale\([^)]*\)/)?.[0] ?? ''
        style.transform = `translate(${left.toFixed(2)}px, ${top.toFixed(2)}px) ${scale}`
      }
    }
    dots.setInterlude = (value) => {
      if (value && value[1] === this.interludeEnd) return
      this.interludeEnd = value?.[1]
      interlude(value)
    }
  }

  override resume() {
    this.hasStarted = true
    super.resume()
  }

  override setCurrentTime(time: number, seek = false) {
    // AMLL detects interludes 20ms ahead, but does not request a layout at
    // their end. Close the gap then, without waiting for the next hot line.
    const interludeEnded = this.interludeEnd !== undefined && Math.round(time) + 20 >= this.interludeEnd
    if (seek) this.interludeEnd = undefined
    super.setCurrentTime(time, seek)
    if (!seek && interludeEnded && this.interludeEnd !== undefined) void this.calcLayout()
  }

  resetPlayback() {
    if (!this.hasStarted) return
    this.hasStarted = false
    void this.calcLayout(true, true)
  }

  override update(delta = 0) {
    super.update(delta)
    this.positionInterlude()
  }

  private positionInterlude() {
    const style = this.interludeDots.getElement().style
    if (this.interludeEnd === undefined) {
      if (style.visibility) style.visibility = ''
      if (style.translate) style.translate = ''
      return
    }
    const index = this.interludeIndex
    const next = this.currentLyricGroups[index]
    if (!next) return
    const previous = this.currentLyricGroups[index - 1]
    const bottom = previous ? previous.posY.getCurrentPosition() + (this.lyricGroupSize.get(previous)?.[1] ?? 0) : 0
    const nextTop = next.posY.getCurrentPosition()
    const required = this.layoutState.interludeDotsSize[1] + (this.baseFontSize || 24) * 0.8
    // Rows have delayed springs; dots must follow their rendered position and
    // wait for the gap to open rather than appearing over the following row.
    const visibility = nextTop - bottom >= required - 1 ? '' : 'hidden'
    const translate = `0 ${(nextTop - next.top).toFixed(2)}px`
    if (style.visibility !== visibility) style.visibility = visibility
    if (style.translate !== translate) style.translate = translate
  }

  private layoutNative(sync: boolean, force: boolean) {
    const time = this.timelineState.currentTime
    // Native gap detection adds 20ms; zero prevents an intro before first play.
    if (!this.hasStarted) this.timelineState.currentTime = -20
    try {
      void super.calcLayout(sync, force)
    } finally {
      this.timelineState.currentTime = time
    }
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
    // Run AMLL once in its own viewport coordinates. Converting coordinates
    // before this calculation changes native stagger delays and spring settings.
    // Record its output, then translate only the positions into document space.
    this.scrollState.scrollOffset = 0
    const transforms = this.groupTransforms
    transforms.length = 0
    try {
      this.measuring = true
      for (const group of this.currentLyricGroups) {
        // oxlint-disable-next-line typescript/unbound-method
        transforms.push(group.setTransform)
        group.setTransform = measureGroupLayout
      }
      this.layoutNative(sync, force)
    } finally {
      this.measuring = false
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
    for (const group of this.currentLyricGroups) {
      group.setTransform(group.top - origin, force, group.delay, group.isActive, group.opacity, group.blur)
      if (force) {
        // AMLL's immediate positioning does not discard older delayed targets.
        group.posY.setTargetPosition(group.top)
        group.bgSlideY.setTargetPosition(group.bgSlideY.getCurrentPosition())
      }
    }
    if (this.interludeEnd !== undefined) {
      this.interludeDots.setTransform(this.interludeLeft, this.interludeTop - origin)
    }
    const last = this.currentLyricGroups[this.currentLyricGroups.length - 1]
    const height = `${last.top + (this.lyricGroupSize.get(last)?.[1] ?? 0)}px`
    if (this.getElement().style.height !== height) this.getElement().style.height = height
    this.interludeIndex =
      this.interludeEnd === undefined ? -1 : this.currentLyricGroups.findIndex((group) => group.top > this.interludeTop)
    this.layoutVersion++
    this.positionInterlude()
  }

  activeElement(time: number) {
    // The first matching group can change only at a start/end boundary.
    // Check all boundaries to preserve overlap/duet precedence and backward seeks.
    if (time < this.activeFrom || time >= this.activeUntil) {
      this.activeFrom = -Infinity
      this.activeUntil = Infinity
      this.activeMain = undefined
      for (const group of this.currentLyricGroups) {
        const start = group.startTime
        const end = group.endTime
        if (!this.activeMain && time >= start && time < end) this.activeMain = group.mainLine.getElement()
        if (start <= time) this.activeFrom = Math.max(this.activeFrom, start)
        else this.activeUntil = Math.min(this.activeUntil, start)
        if (end <= time) this.activeFrom = Math.max(this.activeFrom, end)
        else this.activeUntil = Math.min(this.activeUntil, end)
      }
    }
    return this.activeMain ?? (this.interludeEnd === undefined ? undefined : this.interludeDots.getElement())
  }

  scrollTarget(element: HTMLElement) {
    const group = this.mainGroups.get(element)
    if (group) {
      // The screen rect includes the current spring position and scale.
      // Scroll to the final layout, after preceding background rows collapse.
      return this.getElement().getBoundingClientRect().top + window.scrollY + group.top + element.offsetTop
    }
    return this.getElement().getBoundingClientRect().top + window.scrollY + this.interludeTop
  }

  override setLyricLines(lines: LocalizedLyricLine[], initialTime = 0) {
    this.interludeEnd = undefined
    this.interludeIndex = -1
    this.activeFrom = this.activeUntil = 0
    this.activeMain = undefined
    this.mainGroups = new WeakMap()
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
      this.mainGroups.set(group.mainLine.getElement(), group)
      for (const view of [group.mainLine, group.bgLine]) {
        if (!view) continue
        const line = view.getLine() as LocalizedLyricLine
        const [main, translation, pronunciation] = view.getElement().children
        if (line.lang === 'ko') main.removeAttribute('lang')
        else main.setAttribute('lang', line.lang ?? '')
        translation.classList.add('text-muted-foreground')
        if (line.pronunciationLang === 'ko') pronunciation.removeAttribute('lang')
        else pronunciation.setAttribute('lang', line.pronunciationLang ?? '')
      }
    }
  }

  // AMLL's single-word shortcut skips ruby and word pronunciation annotations.
  // Background rows alone must not turn line-timed lyrics into karaoke lyrics.
  override _getIsNonDynamic() {
    return !this.hasWordAnnotations && super._getIsNonDynamic()
  }
}
