interface MaskWord {
  mainElement: HTMLElement
  subElements: HTMLElement[]
  word: string
  startTime: number
  endTime: number
  width: number
  height: number
  padding: number
  ruby?: unknown[]
}

interface MaskAnimator {
  apply(): void
  setCurrentTime(time: number, playing: boolean): void
  pause(): void
  resume(): void
  dispose(): void
}

/** Keep AMLL's animator, but unfold wrapped emphasis into reading-order masks. */
export function createWrappedLineMaskAnimator<C>(
  words: MaskWord[],
  context: C,
  createAnimator: (words: MaskWord[], context: C) => MaskAnimator,
): MaskAnimator {
  const annotations: MaskWord[] = []
  const measure = (el: HTMLElement) => {
    const padding = parseFloat(getComputedStyle(el).paddingLeft) || 0
    return {padding, width: el.clientWidth - padding * 2, height: el.clientHeight - padding * 2}
  }
  const unfolded = words.flatMap((word) => {
    const glyphs = word.subElements
    // offsetTop excludes the floating/scaling animation and export camera.
    if (new Set(glyphs.map((el) => el.offsetTop)).size < 2) return [word]
    const sizes = glyphs.map(measure)
    const width = sizes.reduce((sum, size) => sum + size.width, 0)
    if (width <= 0) return [word]
    const pronunciation = word.mainElement.querySelector<HTMLElement>('[class*="_romanWord"]')
    if (pronunciation)
      annotations.push({...word, ...measure(pronunciation), mainElement: pronunciation, subElements: [], ruby: []})
    let consumed = 0
    return glyphs.map((el, i) => {
      const startTime = word.startTime + ((word.endTime - word.startTime) * consumed) / width
      consumed += sizes[i].width
      return {
        ...word,
        ...sizes[i],
        mainElement: el,
        subElements: [],
        word: el.textContent ?? '',
        ruby: [],
        startTime,
        endTime: word.startTime + ((word.endTime - word.startTime) * consumed) / width,
      }
    })
  })
  if (unfolded.length === words.length && unfolded.every((word, i) => word === words[i]))
    return createAnimator(words, context)
  const animators = [createAnimator(unfolded, context), ...annotations.map((word) => createAnimator([word], context))]
  return {
    apply: () => animators.forEach((animator) => animator.apply()),
    setCurrentTime: (time, playing) => animators.forEach((animator) => animator.setCurrentTime(time, playing)),
    pause: () => animators.forEach((animator) => animator.pause()),
    resume: () => animators.forEach((animator) => animator.resume()),
    dispose: () => animators.forEach((animator) => animator.dispose()),
  }
}
