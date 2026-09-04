import {$Bitmap as createBitmap, $Font as createFont} from 'bdfparser'
import type {Font} from 'bdfparser'
import {getRenderSize, isRenderSizeAllowed} from './font-render-limits'

const fontCache = new Map<string, Font>()
const MAX_FONT_CACHE_SIZE = 1
const FONT_CACHE_TTL = 60_000
let fontCacheTimer: ReturnType<typeof setTimeout> | undefined

async function* fetchLines(url: string) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`폰트 파일을 불러오지 못했습니다. (${response.status})`)
  if (!response.body) throw new Error('폰트 파일을 읽을 수 없습니다.')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let remainder = ''
  let completed = false

  try {
    while (true) {
      const {done, value} = await reader.read()
      if (done) break

      remainder += decoder.decode(value, {stream: true})
      let newlineIndex = remainder.indexOf('\n')
      while (newlineIndex !== -1) {
        const line = remainder.slice(0, newlineIndex)
        yield line.endsWith('\r') ? line.slice(0, -1) : line
        remainder = remainder.slice(newlineIndex + 1)
        newlineIndex = remainder.indexOf('\n')
      }
    }

    remainder += decoder.decode()
    yield remainder
    completed = true
  } finally {
    if (!completed) await reader.cancel().catch(() => {})
    reader.releaseLock()
  }
}

function scheduleFontCacheCleanup() {
  clearTimeout(fontCacheTimer)
  fontCacheTimer = setTimeout(() => fontCache.clear(), FONT_CACHE_TTL)
}

interface RenderPayload {
  fontValue: string
  fontPath: string
  charset: string
  tileWidth: number
  tileHeight: number
  tileColumn: number
  xOffset: number
  yOffset: number
  fontSize: number
  background: string
  foreground: string
  shadowColor: string
  shadowPositions: Record<string, boolean>
  shadowValues: Record<string, [number, number]>
}

const workerScope = self as unknown as {
  onmessage: ((event: MessageEvent<RenderPayload>) => void) | null
  postMessage: (message: unknown, transfer?: Transferable[]) => void
}

function parseHexColor(hex: string, defaultAlpha = 255): [number, number, number, number] {
  const clean = hex.replace('#', '').trim()
  const len = clean.length
  if (![3, 4, 6, 8].includes(len)) return [0, 0, 0, hex ? defaultAlpha : 0]

  const step = len <= 4 ? 1 : 2
  const parts = clean.match(new RegExp(`.{1,${step}}`, 'g')) || []
  const vals = parts.map((p) => parseInt(p.length === 1 ? p + p : p, 16)).map((v) => (isNaN(v) ? 0 : v))

  return [vals[0] || 0, vals[1] || 0, vals[2] || 0, vals[3] ?? defaultAlpha]
}

workerScope.onmessage = async (e: MessageEvent<RenderPayload>) => {
  const {
    fontValue,
    fontPath,
    charset,
    tileWidth,
    tileHeight,
    tileColumn,
    xOffset,
    yOffset,
    fontSize,
    background,
    foreground,
    shadowColor,
    shadowPositions,
    shadowValues,
  } = e.data

  try {
    const tWidth = Number(tileWidth)
    const tHeight = Number(tileHeight)
    const tCol = Number(tileColumn)
    let characterCount = 0
    for (const _ of charset) characterCount++

    const {width, height} = getRenderSize(characterCount, tWidth, tHeight, tCol)
    if (!isRenderSizeAllowed(width, height)) throw new Error('이미지 크기가 브라우저 처리 한도를 초과합니다.')
    const pixelCount = width * height

    // 1. Load & Parse Font (with Caching)
    let font = fontCache.get(fontValue)
    if (!font) {
      font = await createFont(
        (async function* () {
          yield* fetchLines(fontPath)
        })(),
      )
      if (fontCache.size >= MAX_FONT_CACHE_SIZE) {
        const firstKey = fontCache.keys().next().value
        if (firstKey) fontCache.delete(firstKey)
      }
      fontCache.set(fontValue, font)
    }
    scheduleFontCacheCleanup()

    // 2. Prepare canvas boundaries & offset adjustments
    const positions: [number, number][] = []
    for (const [key, active] of Object.entries(shadowPositions)) {
      const position = shadowValues[key]
      if (active && position) positions.push(position)
    }

    let xOff = xOffset
    let yOff = yOffset
    if (positions.some(([dx]) => dx === -1)) xOff++
    if (positions.some(([, dy]) => dy === 1)) yOff++

    const bbX = -Number(xOff)
    const bbY = -(tHeight - fontSize) + Number(yOff)
    const bb: [number, number, number, number] = [tWidth, tHeight, bbX, bbY]

    const emptyTile = createBitmap(Array.from({length: tHeight}).fill('0'.repeat(tWidth)) as string[])

    // 3. Allocate pixel buffer (RGBA)
    const buffer = new Uint8ClampedArray(pixelCount * 4)
    const foregroundMask = new Uint8Array(pixelCount)

    // Keep only a compact 1-byte mask instead of retaining every glyph bitmap.
    let characterIndex = 0
    for (const character of charset) {
      const glyph = font.glyphbycp(character.codePointAt(0) ?? 8203) || font.glyphbycp(8203)
      const data = (glyph ? glyph.draw(-1, bb) : emptyTile).bindata
      const offsetX = (characterIndex % tCol) * tWidth
      const offsetY = Math.floor(characterIndex / tCol) * tHeight

      for (let y = 0; y < data.length; y++) {
        const row = data[y]
        const py = offsetY + y
        if (py < 0 || py >= height) continue

        for (let x = 0; x < row.length; x++) {
          const px = offsetX + x
          if (row.charCodeAt(x) === 49 && px >= 0 && px < width) foregroundMask[py * width + px] = 1
        }
      }
      characterIndex++
    }

    // Fill background color only for tiles containing characters
    const [bgR, bgG, bgB, bgA] = parseHexColor(background, background === '' ? 0 : 255)
    if (bgA > 0) {
      const fullRows = Math.floor(characterCount / tCol)
      const lastRowCols = characterCount % tCol
      const fullRowsHeight = fullRows * tHeight

      for (let y = 0; y < height; y++) {
        const limitX = y < fullRowsHeight ? width : tWidth * lastRowCols
        for (let x = 0; x < limitX; x++) {
          const idx = (y * width + x) * 4
          buffer[idx] = bgR
          buffer[idx + 1] = bgG
          buffer[idx + 2] = bgB
          buffer[idx + 3] = bgA
        }
      }
    }

    // Pass 1: Draw shadows
    if (positions.length > 0 && shadowColor) {
      const [shR, shG, shB, shA] = parseHexColor(shadowColor, 255)
      for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex++) {
        if (foregroundMask[pixelIndex] === 0) continue
        const x = pixelIndex % width
        const y = Math.floor(pixelIndex / width)

        for (const [dx, dy] of positions) {
          const px = x + dx
          const py = y - dy
          if (px >= 0 && px < width && py >= 0 && py < height) {
            const index = (py * width + px) * 4
            buffer[index] = shR
            buffer[index + 1] = shG
            buffer[index + 2] = shB
            buffer[index + 3] = shA
          }
        }
      }
    }

    // Pass 2: Draw foregrounds
    const [fgR, fgG, fgB, fgA] = parseHexColor(foreground, 255)
    for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex++) {
      if (foregroundMask[pixelIndex] === 0) continue
      const index = pixelIndex * 4
      buffer[index] = fgR
      buffer[index + 1] = fgG
      buffer[index + 2] = fgB
      buffer[index + 3] = fgA
    }

    // 4. Return results with Transferable Object (avoid copying buffer)
    workerScope.postMessage(
      {
        success: true,
        width,
        height,
        buffer,
      },
      [buffer.buffer],
    )
  } catch (error) {
    workerScope.postMessage({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
