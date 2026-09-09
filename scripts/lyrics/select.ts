import {emitKeypressEvents, type Key} from 'node:readline'

// eslint-disable-next-line no-control-regex -- Remove terminal escape/control characters from remote metadata.
export const terminalText = (value: string) => value.replace(/[\x00-\x1f\x7f-\x9f]/g, ' ')

export async function choose(labels: string[], selected?: number): Promise<number> {
  if (!labels.length) throw new Error('가사나 자막을 찾지 못했습니다. --search 또는 --file로 TTML을 지정하세요.')
  if (selected !== undefined) {
    if (!Number.isInteger(selected) || selected < 1 || selected > labels.length)
      throw new Error('--select 번호가 후보 범위를 벗어났습니다.')
    return selected - 1
  }
  if (labels.length === 1) return 0
  if (!process.stdin.isTTY || !process.stderr.isTTY) {
    labels.forEach((label, i) => console.error(`${i + 1}. ${terminalText(label)}`))
    throw new Error('여러 후보가 있습니다. 터미널에서 실행하거나 --select 번호를 지정하세요.')
  }
  return new Promise((resolve, reject) => {
    let index = 0
    let rows = 0
    const wasRaw = process.stdin.isRaw
    const draw = () => {
      if (rows) process.stderr.write(`\x1b[${rows}A`)
      const start = Math.max(0, Math.min(index - 4, labels.length - 8))
      const visible = labels.slice(start, start + 8)
      const output = [
        `가사/자막 선택 (↑↓ 이동 · Enter 선택 · Esc 취소) ${index + 1}/${labels.length}`,
        ...visible.map(
          (label, i) =>
            `${start + i === index ? '❯' : ' '} ${terminalText(label).slice(0, Math.max(12, Math.floor(((process.stderr.columns || 80) - 6) / 2)))}`,
        ),
      ]
      rows = output.length
      process.stderr.write(output.map((row) => `\x1b[2K\r${row}\n`).join(''))
    }
    const finish = (error?: Error) => {
      process.stdin.off('keypress', onKey)
      process.stdin.setRawMode(wasRaw)
      process.stdin.pause()
      process.stderr.write('\x1b[?25h')
      if (error) reject(error)
      else resolve(index)
    }
    const onKey = (_text: string, key: Key) => {
      if (key.name === 'escape' || (key.ctrl && key.name === 'c')) return finish(new Error('가져오기를 취소했습니다.'))
      if (key.name === 'return') return finish()
      if (key.name === 'up') index = (index - 1 + labels.length) % labels.length
      else if (key.name === 'down') index = (index + 1) % labels.length
      else return
      draw()
    }
    emitKeypressEvents(process.stdin)
    process.stdin.setRawMode(true)
    process.stdin.resume()
    process.stdin.on('keypress', onKey)
    process.stderr.write('\x1b[?25l')
    draw()
  })
}
