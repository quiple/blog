export const MAX_RENDER_DIMENSION = 8192
export const MAX_RENDER_PIXELS = 8_388_608

export function getRenderSize(characterCount: number, tileWidth: number, tileHeight: number, tileColumn: number) {
  return {
    width: tileWidth * tileColumn,
    height: tileHeight * Math.ceil(characterCount / tileColumn),
  }
}

export function isRenderSizeAllowed(width: number, height: number) {
  const pixels = width * height
  return (
    Number.isSafeInteger(width) &&
    Number.isSafeInteger(height) &&
    width > 0 &&
    height > 0 &&
    width <= MAX_RENDER_DIMENSION &&
    height <= MAX_RENDER_DIMENSION &&
    pixels <= MAX_RENDER_PIXELS
  )
}
