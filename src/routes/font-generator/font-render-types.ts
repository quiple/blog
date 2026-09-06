export interface RenderPayload {
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

export type RenderResult = {width: number; height: number} & (
  | {blob: Blob; bitmap: ImageBitmap}
  | {buffer: Uint8ClampedArray<ArrayBuffer>}
)
export type WorkerMessage = ({success: true} & RenderResult) | {success: false; error: string}
