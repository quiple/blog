import {$Bitmap as createBitmap, $Font as createFont} from 'bdfparser'
import fetchline from 'fetchline'

const fontCache = new Map<string, any>()
const MAX_FONT_CACHE_SIZE = 2

function parseHexColor(hex: string, defaultAlpha = 255): [number, number, number, number] {
  if (hex === '') return [0, 0, 0, 0]
  const cleanHex = hex.replace('#', '')
  if (cleanHex.length !== 6) return [0, 0, 0, defaultAlpha]
  const r = parseInt(cleanHex.slice(0, 2), 16)
  const g = parseInt(cleanHex.slice(2, 4), 16)
  const b = parseInt(cleanHex.slice(4, 6), 16)
  return [r, g, b, defaultAlpha]
}

self.onmessage = async (e: MessageEvent) => {
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
    // 1. Load & Parse Font (with Caching)
    let font = fontCache.get(fontValue)
    if (!font) {
      const linesIter = fetchline(fontPath)
      async function* yieldyFetchline() {
        for await (const line of linesIter) {
          yield line
        }
      }
      font = await createFont(yieldyFetchline())
      if (fontCache.size >= MAX_FONT_CACHE_SIZE) {
        const firstKey = fontCache.keys().next().value
        if (firstKey) fontCache.delete(firstKey)
      }
      fontCache.set(fontValue, font)
    }

    // 2. Prepare canvas boundaries & offset adjustments
    const positions: number[][] = []
    for (const [key, active] of Object.entries(shadowPositions)) {
      if (active) {
        positions.push(shadowValues[key] as number[])
      }
    }

    let xOff = xOffset
    let yOff = yOffset
    const includesArr = (data: number[][], arr: number[]) =>
      data.some((e) => Array.isArray(e) && e.every((o, i) => Object.is(arr[i], o)))

    if (includesArr(positions, [-1, -1]) || includesArr(positions, [-1, 0]) || includesArr(positions, [-1, 1])) {
      xOff++
    }
    if (includesArr(positions, [-1, 1]) || includesArr(positions, [0, 1]) || includesArr(positions, [1, 1])) {
      yOff++
    }

    const tWidth = Number(tileWidth)
    const tHeight = Number(tileHeight)
    const tCol = Number(tileColumn)
    const bbX = -Number(xOff)
    const bbY = -(tHeight - fontSize) + Number(yOff)
    const bb: [number, number, number, number] = [tWidth, tHeight, bbX, bbY]

    const emptyTile = createBitmap(Array.from({length: tHeight}).fill('0'.repeat(tWidth)) as string[])
    const cps = Array.from(charset as string).map((c) => c.codePointAt(0) || 8203)

    const width = tWidth * tCol
    const height = tHeight * Math.ceil(cps.length / tCol)

    // 3. Allocate pixel buffer (RGBA)
    const buffer = new Uint8ClampedArray(width * height * 4)

    // Fill background color
    const [bgR, bgG, bgB, bgA] = parseHexColor(background, background === '' ? 0 : 255)
    if (bgA > 0) {
      for (let i = 0; i < buffer.length; i += 4) {
        buffer[i] = bgR
        buffer[i + 1] = bgG
        buffer[i + 2] = bgB
        buffer[i + 3] = bgA
      }
    }

    // Pass 1: Draw shadows
    if (positions.length > 0 && shadowColor) {
      const [shR, shG, shB, shA] = parseHexColor(shadowColor, 255)
      for (let i = 0; i < cps.length; i++) {
        const g = font.glyphbycp(cps[i]) || font.glyphbycp(8203)
        const tileBmp = g ? g.draw(-1, bb) : emptyTile
        const col = i % tCol
        const row = Math.floor(i / tCol)
        const offsetX = col * tWidth
        const offsetY = row * tHeight
        const data = tileBmp.bindata

        for (let y = 0; y < data.length; y++) {
          const r = data[y]
          for (let x = 0; x < r.length; x++) {
            if (r[x] === '1') {
              for (const pos of positions) {
                const dx = pos[0]
                const dy = -pos[1]
                const px = offsetX + x + dx
                const py = offsetY + y + dy
                if (px >= 0 && px < width && py >= 0 && py < height) {
                  const idx = (py * width + px) * 4
                  buffer[idx] = shR
                  buffer[idx + 1] = shG
                  buffer[idx + 2] = shB
                  buffer[idx + 3] = shA
                }
              }
            }
          }
        }
      }
    }

    // Pass 2: Draw foregrounds
    const [fgR, fgG, fgB, fgA] = parseHexColor(foreground, 255)
    for (let i = 0; i < cps.length; i++) {
      const g = font.glyphbycp(cps[i]) || font.glyphbycp(8203)
      const tileBmp = g ? g.draw(-1, bb) : emptyTile
      const col = i % tCol
      const row = Math.floor(i / tCol)
      const offsetX = col * tWidth
      const offsetY = row * tHeight
      const data = tileBmp.bindata

      for (let y = 0; y < data.length; y++) {
        const r = data[y]
        for (let x = 0; x < r.length; x++) {
          if (r[x] === '1') {
            const px = offsetX + x
            const py = offsetY + y
            if (px >= 0 && px < width && py >= 0 && py < height) {
              const idx = (py * width + px) * 4
              buffer[idx] = fgR
              buffer[idx + 1] = fgG
              buffer[idx + 2] = fgB
              buffer[idx + 3] = fgA
            }
          }
        }
      }
    }

    // 4. Return results with Transferable Object (avoid copying buffer)
    ;(self as any).postMessage(
      {
        success: true,
        width,
        height,
        buffer,
      },
      [buffer.buffer],
    )
  } catch (err: any) {
    ;(self as any).postMessage({
      success: false,
      error: err.message || String(err),
    })
  }
}
