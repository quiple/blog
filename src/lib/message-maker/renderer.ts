import opentype from 'opentype.js'
import {woff2Decode} from 'woff2-decode'
import {getImageUrl} from '../utils'
import type {Language, ThemeConfig, ThemeName} from './configs'
import {resolveThemeConfig, themes} from './configs'

const rendererIsProd = import.meta.env.PROD

/**
 * 난독화된 Data URL (base64) 문자열을 ArrayBuffer로 복호화합니다.
 * 도메인 바인딩 기법을 적용하여 브라우저 및 외부 유출 시 복호화를 어렵게 만듭니다.
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  // 1. 도메인 기반 키 동적 생성
  let key = 'quiple.dev'
  if (typeof window !== 'undefined') {
    // Vite 빌드 시 DEV 환경이면 하드코딩된 키 유지, PROD 환경이면 hostname으로 대체됨
    // 즉, 운영 빌드 산출물에는 'quiple.dev'라는 문자열 자체가 사라져 리버싱 난이도가 올라감
    if (!import.meta.env.DEV) {
      key = window.location.hostname
    }
  }

  const binaryString = atob(base64)
  const len = binaryString.length
  const bytes = new Uint8Array(len)

  for (let i = 0; i < len; i++) {
    // 2. XOR 연산으로 원본 바이너리 복원
    bytes[i] = binaryString.charCodeAt(i) ^ key.charCodeAt(i % key.length)
  }
  return bytes.buffer as ArrayBuffer
}

/** 폰트 데이터 URL 캐시 (FontFace + opentype 중복 fetch 방지) */
const fontDataUrlCache = new Map<string, Promise<string>>()

function fetchFontDataUrl(endpoint: string): Promise<string> {
  if (!fontDataUrlCache.has(endpoint)) {
    fontDataUrlCache.set(
      endpoint,
      fetch(endpoint).then((r) => {
        if (!r.ok) throw new Error(`Failed to fetch font from ${endpoint}`)
        return r.text()
      }),
    )
  }
  return fontDataUrlCache.get(endpoint)!
}

/** opentype.js 파싱 결과 캐시 */
const opentypeCache = new Map<string, opentype.Font>()

/** CSS font-family 문자열에서 대응하는 opentype.Font를 찾음 */
function resolveOpentypeFont(fontFamily: string): opentype.Font | undefined {
  if (fontFamily.includes('Jalnan2')) return opentypeCache.get('Jalnan2')
  if (fontFamily.includes('ShinMGo-DeBold')) return opentypeCache.get('ShinMGo-DeBold')
  if (fontFamily.includes('ShinMGo-Medium')) return opentypeCache.get('ShinMGo-Medium')
  if (fontFamily.includes('NotoSansBold')) return opentypeCache.get('NotoSansBold')
  if (fontFamily.includes('NotoSans')) return opentypeCache.get('NotoSans')
  if (fontFamily.includes('GyeonggiTitleBold')) return opentypeCache.get('GyeonggiTitleBold')
  if (fontFamily.includes('GyeonggiTitle')) return opentypeCache.get('GyeonggiTitle')
  return undefined
}

/** opentype.js 폰트로 텍스트 너비 측정 */
function measureTextOt(font: opentype.Font, text: string, fontSize: number): number {
  return font.getAdvanceWidth(text, fontSize)
}

/** 텍스트 너비 측정 (opentype 사용 가능 시 우선, 아니면 Canvas fallback) */
function measureTextWidth(
  text: string,
  ctx: CanvasRenderingContext2D,
  otFont?: opentype.Font,
  otFontSize?: number,
): number {
  if (otFont && otFontSize) return measureTextOt(otFont, text, otFontSize)
  return ctx.measureText(text).width
}

/** opentype.js 폰트로 Canvas에 텍스트 그리기 (Path 렌더링으로 브라우저 차이 제거) */
function drawTextOt(
  ctx: CanvasRenderingContext2D,
  font: opentype.Font,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  color: string,
  baseline: 'top' | 'middle' = 'top',
  scaleX: number = 1.0,
  align: CanvasTextAlign = 'left',
  strokeColor?: string,
  strokeWidth?: number,
) {
  let drawY = y
  if (baseline === 'top') {
    drawY = y + (font.ascender / font.unitsPerEm) * fontSize
  } else if (baseline === 'middle') {
    drawY = y + ((font.ascender + font.descender) / (2 * font.unitsPerEm)) * fontSize
  }

  let drawX = x
  if (align === 'center') {
    const width = measureTextOt(font, text, fontSize)
    drawX = x - (width * scaleX) / 2
  } else if (align === 'right') {
    const width = measureTextOt(font, text, fontSize)
    drawX = x - width * scaleX
  }

  const path = font.getPath(text, 0, 0, fontSize)
  ctx.save()
  ctx.translate(drawX, drawY)
  if (scaleX !== 1.0) {
    ctx.scale(scaleX, 1)
  }
  if (strokeColor && strokeWidth) {
    path.fill = null
    path.stroke = strokeColor
    path.strokeWidth = strokeWidth * 2
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.miterLimit = 2
    path.draw(ctx)
  }

  // 텍스트 내부 색상 채우기
  path.fill = color
  path.stroke = null
  path.draw(ctx)
  ctx.restore()
}

/** opentype 데이터 URL에서 opentype.Font를 파싱하고 캐싱 */
async function parseAndCacheOpentypeFont(familyName: string, dataUrl: string): Promise<opentype.Font> {
  if (opentypeCache.has(familyName)) return opentypeCache.get(familyName)!
  const buffer = base64ToArrayBuffer(dataUrl)
  let sfntBuffer = buffer
  const view = new DataView(buffer)
  if (buffer.byteLength > 4 && view.getUint32(0) === 0x774f4632) {
    const decompressed = await woff2Decode(new Uint8Array(buffer))
    sfntBuffer = decompressed.buffer as ArrayBuffer
  }
  const font = opentype.parse(sfntBuffer)
  opentypeCache.set(familyName, font)
  return font
}

/** FontFace 등록 완료된 패밀리 추적 */
const loadedFontFamilies = new Set<string>()

/**
 * 범용 폰트 로딩: FontFace 등록 + opentype 캐시를 한 번에 처리
 * @param faces - [{family: CSS family 이름, endpoint: API 경로}] 배열
 */
async function ensureFontFamily(faces: {family: string; endpoint: string}[]): Promise<void> {
  // 이미 모두 로드 완료된 경우 즉시 반환
  if (faces.every((f) => loadedFontFamilies.has(f.family) && opentypeCache.has(f.family))) return
  if (typeof document === 'undefined') return

  const dataUrls = await Promise.all(faces.map((f) => fetchFontDataUrl(f.endpoint)))

  // FontFace 등록 (아직 등록되지 않은 것만)
  const fontFacePromises: Promise<FontFace>[] = []
  for (let i = 0; i < faces.length; i++) {
    if (loadedFontFamilies.has(faces[i].family)) continue
    let alreadyRegistered = false
    for (const face of document.fonts) {
      if (face.family === faces[i].family) {
        alreadyRegistered = true
        break
      }
    }
    if (!alreadyRegistered) {
      const fontFace = new FontFace(faces[i].family, base64ToArrayBuffer(dataUrls[i]))
      fontFacePromises.push(fontFace.load())
    }
    loadedFontFamilies.add(faces[i].family)
  }
  const loadedFaces = await Promise.all(fontFacePromises)
  for (const face of loadedFaces) document.fonts.add(face)

  // opentype 파싱 (아직 캐시되지 않은 것만)
  await Promise.all(faces.map((f, i) => parseAndCacheOpentypeFont(f.family, dataUrls[i])))
}

export interface MessageItem {
  /** 'left' = 왼쪽(학생), 'right' = 오른쪽(선생), 'bond' = 인연 스토리 */
  type: 'left' | 'right' | 'bond'
  /** 학생 이름 (type === 'left' 또는 'bond' 일 때만 사용) */
  name?: string
  /** 프로필 사진 URL (type === 'left' 일 때만 사용) */
  portrait?: string
  /** 말풍선 목록. 첫 번째는 프로필+이름과 함께, 나머지는 프로필 없이 아래에 딸림 */
  text: string[]
}

export interface ConversationData {
  messages: MessageItem[]
  theme: ThemeName
  lang: Language
}

/**
 * SVG 문자열에서 data URL을 만들어 Image로 로드
 */
function loadSvgAsImage(svgText: string, width: number, height: number): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const blob = new Blob([svgText], {type: 'image/svg+xml;charset=utf-8'})
    const url = URL.createObjectURL(blob)
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = (e) => {
      URL.revokeObjectURL(url)
      reject(e)
    }
    img.width = width
    img.height = height
    img.src = url
  })
}

/**
 * URL에서 Image를 로드하고 가끔 필요할 때 Data URL로 변환
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = (e) => reject(e)
    img.src = url
  })
}

/** Data URL 변환용 재사용 캔버스 (DOM 생성 비용 절감) */
let sharedDataUrlCanvas: HTMLCanvasElement | null = null
let sharedDataUrlCtx: CanvasRenderingContext2D | null = null

async function getImageAsDataUrl(url: string): Promise<string> {
  try {
    const img = await getCachedImage(url)
    if (!sharedDataUrlCanvas) {
      sharedDataUrlCanvas = document.createElement('canvas')
      sharedDataUrlCtx = sharedDataUrlCanvas.getContext('2d')
    }
    if (!sharedDataUrlCtx) return url
    sharedDataUrlCanvas.width = img.naturalWidth
    sharedDataUrlCanvas.height = img.naturalHeight
    sharedDataUrlCtx.clearRect(0, 0, img.naturalWidth, img.naturalHeight)
    sharedDataUrlCtx.drawImage(img, 0, 0)
    return sharedDataUrlCanvas.toDataURL('image/png')
  } catch (err) {
    // 개발 환경에서는 이미지 로드 실패 시 투명 이미지로 대체하여 SVG 내보내기 중단을 방지
    if (!rendererIsProd) {
      console.warn(`[SVG Export] Failed to load image: ${url}. Using placeholder.`)
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
    }
    throw err
  }
}

/**
 * 둥근 사각형 패스 (클리핑용)
 */
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

/** 텍스트 줄바꿈 결과 캐시 (동일 입력 시 재계산 방지) */
const wrapTextCache = new Map<string, string[]>()
const WRAP_CACHE_MAX = 500

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  otFont?: opentype.Font,
  otFontSize?: number,
  breakHangul: boolean = true,
): string[] {
  // 캐시 키: 텍스트 + 폰트 + 최대 너비 + breakHangul
  const cacheKey = otFont
    ? `ot:${otFontSize}:${maxWidth}:${breakHangul}:${text}`
    : `cv:${ctx.font}:${maxWidth}:${breakHangul}:${text}`
  const cached = wrapTextCache.get(cacheKey)
  if (cached) return cached
  const result = wrapTextCore(ctx, text, maxWidth, otFont, otFontSize, breakHangul)
  wrapTextCache.set(cacheKey, result)
  if (wrapTextCache.size > WRAP_CACHE_MAX) {
    const oldest = wrapTextCache.keys().next().value
    if (oldest !== undefined) wrapTextCache.delete(oldest)
  }
  return result
}

function wrapTextCore(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  otFont?: opentype.Font,
  otFontSize?: number,
  breakHangul: boolean = true,
): string[] {
  const lines: string[] = []
  // 먼저 명시적 줄바꿈 분리
  const paragraphs = text.split('\n')

  // 알파벳, 숫자, 그리고 단어 내에서 쓰일 수 있는 특수기호 (하이픈, 어포스트로피, 마침표, 쉼표)
  // breakHangul이 false인 경우 한글도 단어 단위로 취급하여 단어 중간 줄바꿈 방지
  const isAlphaNum = (char: string) => {
    if (breakHangul) {
      return /^[a-zA-Z0-9_\-\u00C0-\u024F'’.,]+$/.test(char)
    }
    return /^[a-zA-Z0-9_\-\u00C0-\u024F'’.,\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]+$/.test(char)
  }
  // 줄바꿈 시 앞 글자에 붙어야 하는 닫는 문장부호들
  const isClosingPunctuation = (char: string) => /^[)\]>}"”',.!?;:。、！？》」』】…~・·）］｝〉»]+$/.test(char)
  // 줄바꿈 시 뒷 글자에 붙어야 하는 여는 문장부호들
  const isOpeningPunctuation = (char: string) => /^[([<{"‘“《「『【（［｛〈«]+$/.test(char)

  for (const paragraph of paragraphs) {
    if (paragraph.trim() === '') {
      lines.push('')
      continue
    }

    // 1. 단어나 문장부호 단위로 쪼개기 (Kinsoku Shori & 단어 보호)
    const chunks: string[] = []
    let currentChunk = ''
    let lastChar = ''

    // 이모지 등 다국어 서로게이트 쌍 처리를 위해 Array.from 사용
    for (const char of Array.from(paragraph)) {
      if (currentChunk.length === 0) {
        currentChunk += char
        lastChar = char
        continue
      }

      // Case 1: 영어/숫자 등 단어의 연속
      if (isAlphaNum(lastChar) && isAlphaNum(char)) {
        currentChunk += char
        lastChar = char
        continue
      }

      // Case 2: 공백의 연속
      if (lastChar === ' ' && char === ' ') {
        currentChunk += char
        lastChar = char
        continue
      }

      // Case 3: 닫는 문장부호는 이전 글자에 붙임
      if (isClosingPunctuation(char)) {
        currentChunk += char
        lastChar = char
        continue
      }

      // Case 4: 여는 문장부호는 다음 글자에 붙임 (현재 청크에 계속 누적)
      if (isOpeningPunctuation(lastChar)) {
        currentChunk += char
        lastChar = char
        continue
      }

      // 끊어야 하는 경우
      chunks.push(currentChunk)
      currentChunk = char
      lastChar = char
    }
    if (currentChunk.length > 0) {
      chunks.push(currentChunk)
    }

    // 2. 청크 단위로 너비를 측정하며 줄바꿈 처리
    let currentLine = ''
    for (const chunk of chunks) {
      // 줄의 시작 부분에 나오는 공백은 포함하지 않음
      if (currentLine.length === 0 && chunk.trim() === '') {
        continue
      }

      const testLine = currentLine + chunk
      const testWidth = measureTextWidth(testLine, ctx, otFont, otFontSize)

      if (testWidth > maxWidth) {
        // 이미 쌓인 텍스트가 있으면 현재 줄을 확정
        if (currentLine.length > 0) {
          lines.push(currentLine.trimEnd())
          currentLine = chunk.trim() === '' ? '' : chunk
        } else {
          currentLine = chunk
        }

        // 단일 청크 자체가 maxWidth보다 긴 경우, 강제로 글자 단위로 쪼갬
        while (measureTextWidth(currentLine, ctx, otFont, otFontSize) > maxWidth) {
          let breakIdx = 1
          const lineChars = Array.from(currentLine)
          while (breakIdx < lineChars.length) {
            if (measureTextWidth(lineChars.slice(0, breakIdx + 1).join(''), ctx, otFont, otFontSize) > maxWidth) break
            breakIdx++
          }
          lines.push(lineChars.slice(0, breakIdx).join(''))
          currentLine = lineChars.slice(breakIdx).join('')
        }
      } else {
        currentLine = testLine
      }
    }

    // 남은 글자가 있다면 추가 (우측 공백 제거)
    if (currentLine.trimEnd().length > 0) {
      lines.push(currentLine.trimEnd())
    }
  }
  return lines
}

/** SVG 모듈 (한 번만 평가) */
const svgModules = import.meta.glob('$lib/assets/message-maker/*.svg', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

/** SVG 아이콘들을 미리 캐시 */
const iconCache = new Map<string, HTMLImageElement>()

async function getIcon(name: string, size: number): Promise<HTMLImageElement> {
  const key = `${name}-${size}`
  if (iconCache.has(key)) return iconCache.get(key)!

  const path = `/src/lib/assets/message-maker/${name}.svg`
  let svgText = svgModules[path]
  if (!svgText) {
    throw new Error(`SVG icon not found: ${name}`)
  }

  const img = await loadSvgAsImage(svgText, size, size)
  iconCache.set(key, img)
  return img
}

/** 이미지 캐시 (LRU, 최대 50개) */
const IMAGE_CACHE_MAX = 50
const imageCache = new Map<string, HTMLImageElement>()

async function getCachedImage(url: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(url)
  if (cached) {
    // LRU: 접근 시 맨 뒤로 이동
    imageCache.delete(url)
    imageCache.set(url, cached)
    return cached
  }
  const img = await loadImage(url)
  imageCache.set(url, img)
  // 최대 크기 초과 시 가장 오래된 항목 제거
  if (imageCache.size > IMAGE_CACHE_MAX) {
    const oldest = imageCache.keys().next().value
    if (oldest !== undefined) imageCache.delete(oldest)
  }
  return img
}

/**
 * 말풍선 레이아웃 계산 결과
 */
interface BubbleLayout {
  lines: string[]
  lineH: number
  textBlockWidth: number
  bubbleW: number
  bubbleH: number
}

/**
 * 말풍선 하나의 레이아웃을 계산하는 헬퍼 (높이 계산 / Canvas 렌더링 / SVG 내보내기 공통)
 */
function computeBubbleLayout(
  ctx: CanvasRenderingContext2D,
  text: string,
  bubbleConfig: {
    fontSize: number
    lineHeight: number
    paddingTop: number
    paddingRight: number
    paddingBottom: number
    paddingLeft: number
    maxWidthRatio: number
    font: string
  },
  chatAreaWidth: number,
  otFont?: opentype.Font,
  breakHangul: boolean = true,
): BubbleLayout {
  const maxBubbleWidth = chatAreaWidth * bubbleConfig.maxWidthRatio
  const maxTextWidth = maxBubbleWidth - bubbleConfig.paddingLeft - bubbleConfig.paddingRight
  ctx.font = `${bubbleConfig.fontSize}px ${bubbleConfig.font}`
  const lines = wrapText(ctx, text, maxTextWidth, otFont, bubbleConfig.fontSize, breakHangul)
  const lineH = bubbleConfig.fontSize * bubbleConfig.lineHeight
  const textBlockWidth = Math.max(...lines.map((l) => measureTextWidth(l, ctx, otFont, bubbleConfig.fontSize)))
  const bubbleW = textBlockWidth + bubbleConfig.paddingLeft + bubbleConfig.paddingRight
  const bubbleH = lines.length * lineH + bubbleConfig.paddingTop + bubbleConfig.paddingBottom
  return {lines, lineH, textBlockWidth, bubbleW, bubbleH}
}

/**
 * Canvas에 텍스트 그리기 (opentype 가능 시 Path 렌더링, 아니면 Canvas fallback)
 */
function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  fontFamily: string,
  color: string,
  otFont?: opentype.Font,
  baseline: 'top' | 'middle' = 'top',
  scaleX: number = 1.0,
  align: CanvasTextAlign = 'left',
  strokeColor?: string,
  strokeWidth?: number,
) {
  if (otFont) {
    drawTextOt(ctx, otFont, text, x, y, fontSize, color, baseline, scaleX, align, strokeColor, strokeWidth)
  } else {
    ctx.fillStyle = color
    ctx.font = `${fontSize}px ${fontFamily}`
    ctx.textBaseline = baseline === 'middle' ? 'middle' : 'top'
    ctx.textAlign = align
    if (scaleX !== 1.0) {
      ctx.save()
      ctx.scale(scaleX, 1)
      if (strokeColor && strokeWidth) {
        ctx.strokeStyle = strokeColor
        ctx.lineWidth = strokeWidth * 2
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'
        ctx.miterLimit = 2
        ctx.strokeText(text, x / scaleX, y)
      }
      ctx.fillStyle = color
      ctx.fillText(text, x / scaleX, y)
      ctx.restore()
    } else {
      if (strokeColor && strokeWidth) {
        ctx.strokeStyle = strokeColor
        ctx.lineWidth = strokeWidth * 2
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'
        ctx.miterLimit = 2
        ctx.strokeText(text, x, y)
      }
      ctx.fillStyle = color
      ctx.fillText(text, x, y)
    }
  }
}

/** 텍스트 측정용 재사용 캔버스 (DOM 생성 비용 절감) */
let sharedMeasureCanvas: HTMLCanvasElement | null = null
let sharedMeasureCtx: CanvasRenderingContext2D | null = null

function getMeasureCtx(width: number): CanvasRenderingContext2D {
  if (!sharedMeasureCanvas) {
    sharedMeasureCanvas = document.createElement('canvas')
    sharedMeasureCanvas.height = 100
    sharedMeasureCtx = sharedMeasureCanvas.getContext('2d')!
  }
  if (sharedMeasureCanvas.width !== width) {
    sharedMeasureCanvas.width = width
  }
  return sharedMeasureCtx!
}

/**
 * 캔버스 높이를 계산
 */
export function calculateCanvasHeight(
  messages: MessageItem[],
  config: ThemeConfig,
  lang?: Language,
  themeName?: ThemeName,
): number {
  const breakHangul = themeName !== 'momotalk'
  const tempCtx = getMeasureCtx(config.canvasWidth)

  // opentype 폰트 resolve (캐시에 있으면 사용, 없으면 Canvas fallback)
  const otBubbleLeft = resolveOpentypeFont(config.bubbleLeft.font)
  const otBubbleRight = resolveOpentypeFont(config.bubbleRight.font)

  const chatAreaWidth = config.canvasWidth - config.sidebar.width - config.chat.paddingLeft - config.chat.paddingRight

  let totalHeight = config.header.height + config.chat.paddingTop

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    if (i > 0) {
      if (msg.type === 'bond') {
        totalHeight += config.chat.messageGap
      } else {
        totalHeight += config.chat.groupGap
      }
    }

    const isLeft = msg.type === 'left'
    if (isLeft) {
      totalHeight += config.name.marginTop + config.name.fontSize + config.name.marginBottom
    }

    if (msg.type === 'bond') {
      const name = msg.name || ''
      const text =
        lang === 'ja'
          ? `${name}の絆ストーリーへ`
          : lang === 'ko'
            ? `${name}의 인연 스토리로`
            : `To ${name}'s Relationship Story`
      const otBondFont = resolveOpentypeFont(config.bond.font)
      tempCtx.font = `${config.bond.fontSize}px ${config.bond.font}`

      if (themeName === 'momotalk') {
        const bannerLeftOffset = config.profile.size + config.bubbleLeft.marginLeft
        const availableWidth = chatAreaWidth - bannerLeftOffset - config.bond.marginLeft - config.bond.marginRight
        const bannerW = availableWidth * config.bond.maxWidthRatio
        const btnW = bannerW - config.bond.buttonMarginX * 2
        const buttonInnerW = btnW - config.bond.buttonPaddingLeft - config.bond.buttonPaddingRight

        const lines = wrapText(tempCtx, text, buttonInnerW, otBondFont, config.bond.fontSize, breakHangul)
        const buttonH =
          lines.length * config.bond.fontSize * 1.2 + config.bond.buttonPaddingTop + config.bond.buttonPaddingBottom
        const headerH = Math.max(config.bond.headerBarHeight, config.bond.headerFontSize)

        const bannerH =
          config.bond.paddingTop +
          headerH +
          config.bond.dividerMarginTop +
          config.bond.dividerThickness +
          config.bond.buttonMarginTop +
          buttonH +
          config.bond.paddingBottom
        totalHeight += config.bond.marginTop + bannerH + config.bond.marginBottom
      } else {
        const bannerLeftOffset = config.profile.size + config.bubbleLeft.marginLeft
        const availableWidth = chatAreaWidth - bannerLeftOffset - config.bond.marginLeft - config.bond.marginRight
        const maxTextWidth =
          availableWidth * config.bond.maxWidthRatio - config.bond.paddingLeft - config.bond.paddingRight
        const lines = wrapText(tempCtx, text, maxTextWidth, otBondFont, config.bond.fontSize, breakHangul)
        const lineH = config.bond.fontSize * 1.2
        const bannerH = lines.length * lineH + config.bond.paddingTop + config.bond.paddingBottom
        totalHeight += config.bond.marginTop + bannerH + config.bond.marginBottom
      }
    } else {
      const bubbleCfg = isLeft ? config.bubbleLeft : config.bubbleRight
      const otFont = isLeft ? otBubbleLeft : otBubbleRight

      for (let bi = 0; bi < msg.text.length; bi++) {
        if (bi > 0) totalHeight += config.chat.messageGap
        const {bubbleH} = computeBubbleLayout(tempCtx, msg.text[bi], bubbleCfg, chatAreaWidth, otFont, breakHangul)
        totalHeight += bubbleH
      }
    }
  }

  totalHeight += config.chat.paddingBottom
  return Math.max(totalHeight, config.canvasWidth)
}

/** 마지막 렌더링 ID (중복 실행 방지용) */
let lastRenderId = 0

/** 정적 크롬(헤더+사이드바) 오프스크린 캐시 */
let chromeCache: {hash: string; canvas: HTMLCanvasElement; height: number} | null = null

/** 메시지 그룹별 오프스크린 캐시 */
let groupCaches: {hash: string; canvas: HTMLCanvasElement; width: number; height: number}[] = []

function hashMessage(msg: MessageItem): string {
  return `${msg.type}\0${msg.name ?? ''}\0${msg.portrait ?? ''}\0${msg.text.join('\0')}`
}

let sharedRenderBufferCanvas: HTMLCanvasElement | null = null

/**
 * 메인 렌더링 함수
 */
export async function renderCanvas(
  canvas: HTMLCanvasElement,
  messages: MessageItem[],
  themeName: ThemeName,
  lang: Language,
): Promise<void> {
  const renderId = ++lastRenderId
  const config = resolveThemeConfig(themes[themeName], lang)

  // 폰트 준비
  if (themeName === 'momotalk') {
    const faces: {family: string; endpoint: string}[] = [
      {family: 'Jalnan2', endpoint: '/api/font/jalnan'},
      {family: 'GyeonggiTitle', endpoint: '/api/font/gyeonggi'},
      {family: 'GyeonggiTitleBold', endpoint: '/api/font/gyeonggi-bold'},
    ]
    if (lang === 'ja') {
      faces.push({family: 'ShinMGo-Medium', endpoint: '/api/font/shinmgo'})
      faces.push({family: 'ShinMGo-DeBold', endpoint: '/api/font/shinmgo-debold'})
    }
    if (lang === 'en') {
      faces.push({family: 'NotoSans', endpoint: '/api/font/notosans'})
      faces.push({family: 'NotoSansBold', endpoint: '/api/font/notosans-bold'})
    }
    await ensureFontFamily(faces)
  }

  // 최신 렌더링 요청인지 확인
  if (renderId !== lastRenderId) return

  const height = calculateCanvasHeight(messages, config, lang, themeName)

  // 깜빡임(flickering) 방지를 위한 더블 버퍼링
  if (!sharedRenderBufferCanvas) {
    sharedRenderBufferCanvas = document.createElement('canvas')
  }
  sharedRenderBufferCanvas.width = config.canvasWidth
  sharedRenderBufferCanvas.height = height

  const bufferCtx = sharedRenderBufferCanvas.getContext('2d')!

  // 오프스크린 버퍼에 모든 비동기 드로잉 작업 수행
  await renderToContext(bufferCtx, messages, themeName, 1, renderId, height, lang)

  // 렌더링 중 새로운 요청이 들어왔으면 폐기
  if (renderId !== lastRenderId) return

  // 준비된 버퍼를 화면 캔버스에 한 번에 복사
  if (canvas.width !== config.canvasWidth || canvas.height !== height) {
    canvas.width = config.canvasWidth
    canvas.height = height
  }
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(sharedRenderBufferCanvas, 0, 0)
}

async function renderChrome(
  ctx: CanvasRenderingContext2D,
  config: ThemeConfig,
  themeName: ThemeName,
  width: number,
  height: number,
  otHeaderFont: opentype.Font | undefined,
  isObsolete: () => boolean,
): Promise<void> {
  // ── 헤더 배경 ──
  if (config.header.backgroundGradient) {
    const grad = ctx.createLinearGradient(0, 0, 0, config.header.height)
    const colorMatches = config.header.backgroundGradient.match(/#[0-9a-fA-F]{6}/g)
    if (colorMatches && colorMatches.length >= 2) {
      grad.addColorStop(0, colorMatches[0])
      grad.addColorStop(1, colorMatches[1])
    } else {
      grad.addColorStop(0, config.header.backgroundColor)
      grad.addColorStop(1, config.header.backgroundColor)
    }
    ctx.fillStyle = grad
  } else {
    ctx.fillStyle = config.header.backgroundColor
  }
  ctx.fillRect(0, 0, width, config.header.height)

  // ── 헤더 내용 ──
  if (themeName === 'momotalk') {
    try {
      const momotalkLogo = await getIcon('momotalk', config.header.logoSize)
      if (isObsolete()) return
      const titleText = 'MomoTalk'
      ctx.font = `${config.header.titleFontSize}px ${config.header.titleFont}`
      const titleWidth = otHeaderFont
        ? measureTextOt(otHeaderFont, titleText, config.header.titleFontSize) * config.header.titleScaleX
        : ctx.measureText(titleText).width * config.header.titleScaleX
      const startX = config.header.paddingLeft
      const centerY = config.header.height / 2

      ctx.drawImage(
        momotalkLogo,
        startX,
        centerY - config.header.logoSize / 2 + config.header.logoOffsetY,
        config.header.logoSize,
        config.header.logoSize,
      )

      const titleX = startX + config.header.logoSize + config.header.logoGap
      if (otHeaderFont) {
        drawTextOt(
          ctx,
          otHeaderFont,
          titleText,
          titleX,
          centerY + config.header.titleOffsetY,
          config.header.titleFontSize,
          config.header.titleColor,
          'middle',
          config.header.titleScaleX,
        )
      } else {
        ctx.fillStyle = config.header.titleColor
        ctx.font = `${config.header.titleFontSize}px ${config.header.titleFont}`
        ctx.textBaseline = 'middle'
        ctx.save()
        ctx.scale(config.header.titleScaleX, 1)
        ctx.fillText(titleText, titleX / config.header.titleScaleX, centerY + config.header.titleOffsetY)
        ctx.restore()
      }

      if (config.header.helpIconSize > 0) {
        const helpIcon = await getIcon('help', config.header.helpIconSize)
        if (isObsolete()) return
        ctx.drawImage(
          helpIcon,
          startX + config.header.logoSize + config.header.logoGap + titleWidth + config.header.helpIconGap,
          centerY - config.header.helpIconSize / 2 + config.header.helpIconOffsetY,
          config.header.helpIconSize,
          config.header.helpIconSize,
        )
      }

      if (config.header.closeIconSize > 0) {
        const closeIcon = await getIcon('close', config.header.closeIconSize)
        if (isObsolete()) return
        ctx.drawImage(
          closeIcon,
          width + config.header.closeIconOffsetX - config.header.closeIconSize,
          centerY - config.header.closeIconSize / 2 + config.header.closeIconOffsetY,
          config.header.closeIconSize,
          config.header.closeIconSize,
        )
      }
    } catch {
      const titleX = config.header.paddingLeft
      if (otHeaderFont) {
        drawTextOt(
          ctx,
          otHeaderFont,
          'MomoTalk',
          titleX,
          config.header.height / 2 + config.header.titleOffsetY,
          config.header.titleFontSize,
          config.header.titleColor,
          'middle',
          config.header.titleScaleX,
        )
      } else {
        ctx.fillStyle = config.header.titleColor
        ctx.font = `${config.header.titleFontSize}px ${config.header.titleFont}`
        ctx.textBaseline = 'middle'
        ctx.save()
        ctx.scale(config.header.titleScaleX, 1)
        ctx.fillText(
          'MomoTalk',
          titleX / config.header.titleScaleX,
          config.header.height / 2 + config.header.titleOffsetY,
        )
        ctx.restore()
      }
    }
  } else {
    const titleMap: Record<ThemeName, string> = {
      momotalk: 'MomoTalk',
      imessage: 'Messages',
      line: 'LINE',
      kakaotalk: 'KakaoTalk',
    }
    ctx.fillStyle = config.header.titleColor
    ctx.font = `bold ${config.header.titleFontSize}px ${config.header.titleFont}`
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    ctx.save()
    ctx.scale(config.header.titleScaleX, 1)
    ctx.fillText(
      titleMap[themeName],
      width / 2 / config.header.titleScaleX,
      config.header.height / 2 + config.header.titleOffsetY,
    )
    ctx.restore()
    ctx.textAlign = 'start'
  }

  // ── 사이드바 (MomoTalk 전용) ──
  if (config.sidebar.width > 0) {
    ctx.fillStyle = config.sidebar.backgroundColor
    ctx.fillRect(0, config.header.height, config.sidebar.width, height - config.header.height)

    const sidebarCenterX = config.sidebar.width / 2
    let sidebarY = config.header.height + config.sidebar.paddingTop

    if (config.sidebar.studentIconSize > 0) {
      try {
        const studentIcon = await getIcon('student', config.sidebar.studentIconSize)
        if (isObsolete()) return
        ctx.save()
        ctx.globalAlpha = config.sidebar.studentIconOpacity
        ctx.drawImage(
          studentIcon,
          sidebarCenterX - config.sidebar.studentIconSize / 2,
          sidebarY,
          config.sidebar.studentIconSize,
          config.sidebar.studentIconSize,
        )
        ctx.restore()
      } catch {
        // fallback
      }
      sidebarY += config.sidebar.studentIconSize + config.sidebar.iconGap
    }

    if (config.sidebar.chatIconSize > 0) {
      try {
        // 배경색 (활성화 상태)
        if (config.sidebar.activeChatBackgroundColor && config.sidebar.activeChatBackgroundColor !== 'transparent') {
          ctx.fillStyle = config.sidebar.activeChatBackgroundColor
          ctx.fillRect(
            0,
            sidebarY + config.sidebar.activeChatBackgroundOffsetY,
            config.sidebar.width,
            config.sidebar.activeChatBackgroundHeight,
          )
        }

        const chatIcon = await getIcon('chat', config.sidebar.chatIconSize)
        if (isObsolete()) return
        const chatX = sidebarCenterX - config.sidebar.chatIconSize / 2
        ctx.drawImage(chatIcon, chatX, sidebarY, config.sidebar.chatIconSize, config.sidebar.chatIconSize)
      } catch {
        // fallback
      }
    }
  }
}

/**
 * 특정 컨텍스트에 렌더링 (배율 지원)
 */
async function renderToContext(
  ctx: CanvasRenderingContext2D,
  messages: MessageItem[],
  themeName: ThemeName,
  scale: number,
  renderId: number = 0,
  precomputedHeight?: number,
  lang?: Language,
): Promise<void> {
  const config = resolveThemeConfig(themes[themeName], lang || 'ko')
  const width = config.canvasWidth
  const height = precomputedHeight ?? calculateCanvasHeight(messages, config, lang, themeName)

  const breakHangul = themeName !== 'momotalk'

  // opentype 폰트 resolve (브라우저 독립 렌더링용)
  const otNameFont = resolveOpentypeFont(config.name.font)
  const otBubbleLeftFont = resolveOpentypeFont(config.bubbleLeft.font)
  const otBubbleRightFont = resolveOpentypeFont(config.bubbleRight.font)
  const otHeaderFont = resolveOpentypeFont(config.header.titleFont)
  const otBondFont = resolveOpentypeFont(config.bond.font)

  const isObsolete = () => renderId !== 0 && renderId !== lastRenderId

  // 캐싱은 scale === 1 (미리보기)에서만 사용. 내보내기(scale > 1)에서는 매번 풀렌더링.
  const useCache = scale === 1

  ctx.save()
  if (scale !== 1) {
    ctx.scale(scale, scale)
  }

  ctx.clearRect(0, 0, width, height)

  // 배경
  ctx.fillStyle = config.backgroundColor
  ctx.fillRect(0, 0, width, height)

  // ── 정적 크롬 (헤더+사이드바) ──
  const chromeHash = `${themeName}:${lang}:${width}:${height}`
  if (useCache && chromeCache && chromeCache.hash === chromeHash) {
    // 캐시된 크롬 비트맵 합성
    ctx.drawImage(chromeCache.canvas, 0, 0)
  } else {
    // 크롬을 새로 렌더링
    await renderChrome(ctx, config, themeName, width, height, otHeaderFont, isObsolete)
    if (isObsolete()) return

    // scale === 1일 때만 캐시 저장
    if (useCache) {
      const cc = chromeCache?.canvas ?? document.createElement('canvas')
      cc.width = width
      cc.height = height
      const cctx = cc.getContext('2d')!
      cctx.clearRect(0, 0, width, height)
      // 배경+헤더+사이드바 영역만 복사
      cctx.drawImage(ctx.canvas, 0, 0)
      chromeCache = {hash: chromeHash, canvas: cc, height}
    }
  }

  // ── 대화 영역 ──
  const chatLeft = config.sidebar.width + config.chat.paddingLeft
  const chatRight = width - config.chat.paddingRight
  const chatAreaWidth = chatRight - chatLeft

  // 그룹 캐시 배열 크기 조정
  if (useCache) {
    while (groupCaches.length > messages.length) groupCaches.pop()
  }

  let cursorY = config.header.height + config.chat.paddingTop

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    if (i > 0) {
      if (msg.type === 'bond') {
        cursorY += config.chat.messageGap
      } else {
        cursorY += config.chat.groupGap
      }
    }

    // 그룹 캐시 확인
    // 캔버스 높이가 변해도 기존 캐시를 재사용하기 위해 msgHash에서 height를 제외
    const msgHash = useCache ? `${themeName}:${lang}:${width}:${hashMessage(msg)}` : ''
    const cachedGroup = useCache ? groupCaches[i] : undefined
    if (cachedGroup && cachedGroup.hash === msgHash) {
      // 캐시된 그룹 비트맵 합성 (사이드바 영역을 제외한 채팅 영역)
      ctx.drawImage(cachedGroup.canvas, config.sidebar.width, cursorY)
      cursorY += cachedGroup.height
      continue
    }

    const groupStartY = cursorY

    if (msg.type === 'left') {
      // ── 학생 메시지 (왼쪽) ──
      const profileX = chatLeft
      const profileY = cursorY

      // 프로필 이미지
      if (config.profile.size > 0 && msg.portrait) {
        try {
          const finalUrl =
            msg.portrait.startsWith('http') || msg.portrait.startsWith('blob:')
              ? msg.portrait
              : getImageUrl(msg.portrait, {original: true}, rendererIsProd)
          const profileImg = await getCachedImage(finalUrl)
          if (isObsolete()) return
          ctx.save()
          if (config.profile.circular) {
            ctx.beginPath()
            ctx.arc(
              profileX + config.profile.size / 2,
              profileY + config.profile.size / 2,
              config.profile.size / 2,
              0,
              Math.PI * 2,
            )
            ctx.clip()
          } else {
            roundRect(ctx, profileX, profileY, config.profile.size, config.profile.size, 12)
            ctx.clip()
          }
          const zoom = config.profile.zoom || 1.0
          const size = config.profile.size
          const imgW = profileImg.naturalWidth
          const imgH = profileImg.naturalHeight

          // 소스 영역 계산 (중앙 유지하면서 zoom 적용)
          const minDim = Math.min(imgW, imgH)
          const sw = minDim / zoom
          const sh = minDim / zoom
          const sx = (imgW - sw) / 2
          const sy = (imgH - sh) / 2

          ctx.drawImage(profileImg, sx, sy, sw, sh, profileX, profileY, size, size)
          ctx.restore()

          // 테두리
          if (config.profile.borderWidth > 0) {
            ctx.strokeStyle = config.profile.borderColor
            ctx.lineWidth = config.profile.borderWidth
            if (config.profile.circular) {
              ctx.beginPath()
              ctx.arc(
                profileX + config.profile.size / 2,
                profileY + config.profile.size / 2,
                config.profile.size / 2,
                0,
                Math.PI * 2,
              )
              ctx.stroke()
            } else {
              roundRect(ctx, profileX, profileY, config.profile.size, config.profile.size, 12)
              ctx.stroke()
            }
          }
        } catch {
          // 이미지 로드 실패 시 placeholder
          ctx.fillStyle = '#ddd'
          if (config.profile.circular) {
            ctx.beginPath()
            ctx.arc(
              profileX + config.profile.size / 2,
              profileY + config.profile.size / 2,
              config.profile.size / 2,
              0,
              Math.PI * 2,
            )
            ctx.fill()
          } else {
            roundRect(ctx, profileX, profileY, config.profile.size, config.profile.size, 12)
            ctx.fill()
          }
        }
      }

      // 이름
      const nameX = profileX + (config.profile.size > 0 ? config.profile.size : 0) + config.name.marginLeft
      const nameY = cursorY + config.name.marginTop
      drawText(ctx, msg.name || '', nameX, nameY, config.name.fontSize, config.name.font, config.name.color, otNameFont)
      cursorY += config.name.marginTop + config.name.fontSize + config.name.marginBottom

      // 말풍선들
      const profileSize = config.profile.size > 0 ? config.profile.size : 0
      const bubbleStartX = profileX + profileSize + config.bubbleLeft.marginLeft
      for (let bi = 0; bi < msg.text.length; bi++) {
        if (bi > 0) cursorY += config.chat.messageGap

        const {lines, lineH, bubbleW, bubbleH} = computeBubbleLayout(
          ctx,
          msg.text[bi],
          config.bubbleLeft,
          chatAreaWidth,
          otBubbleLeftFont,
          breakHangul,
        )

        ctx.fillStyle = config.bubbleLeft.backgroundColor
        roundRect(ctx, bubbleStartX, cursorY, bubbleW, bubbleH, config.bubbleLeft.borderRadius)
        ctx.fill()

        // 첫 번째 말풍선에 꼬리 추가
        if (bi === 0 && config.bubbleLeft.tailWidth > 0) {
          ctx.beginPath()
          const tailY = cursorY + config.bubbleLeft.tailOffsetY
          ctx.moveTo(bubbleStartX, tailY)
          ctx.arcTo(
            bubbleStartX - config.bubbleLeft.tailWidth,
            tailY + config.bubbleLeft.tailHeight / 2,
            bubbleStartX,
            tailY + config.bubbleLeft.tailHeight,
            config.bubbleLeft.tailRadius,
          )
          ctx.lineTo(bubbleStartX, tailY + config.bubbleLeft.tailHeight)
          ctx.fill()
        }

        for (let li = 0; li < lines.length; li++) {
          const textX = bubbleStartX + config.bubbleLeft.paddingLeft
          const textY = cursorY + config.bubbleLeft.paddingTop + li * lineH
          drawText(
            ctx,
            lines[li],
            textX,
            textY,
            config.bubbleLeft.fontSize,
            config.bubbleLeft.font,
            config.bubbleLeft.textColor,
            otBubbleLeftFont,
          )
        }

        cursorY += bubbleH
      }
    } else if (msg.type === 'right') {
      // ── 선생님 메시지 (오른쪽) ──
      for (let bi = 0; bi < msg.text.length; bi++) {
        if (bi > 0) cursorY += config.chat.messageGap

        const {lines, lineH, bubbleW, bubbleH} = computeBubbleLayout(
          ctx,
          msg.text[bi],
          config.bubbleRight,
          chatAreaWidth,
          otBubbleRightFont,
          breakHangul,
        )

        const bubbleX = chatRight - bubbleW - config.bubbleRight.marginRight

        ctx.fillStyle = config.bubbleRight.backgroundColor
        roundRect(ctx, bubbleX, cursorY, bubbleW, bubbleH, config.bubbleRight.borderRadius)
        ctx.fill()

        // 첫 번째 말풍선에 꼬리 추가
        if (bi === 0 && config.bubbleRight.tailWidth > 0) {
          ctx.beginPath()
          const tailY = cursorY + config.bubbleRight.tailOffsetY
          ctx.moveTo(bubbleX + bubbleW, tailY)
          ctx.arcTo(
            bubbleX + bubbleW + config.bubbleRight.tailWidth,
            tailY + config.bubbleRight.tailHeight / 2,
            bubbleX + bubbleW,
            tailY + config.bubbleRight.tailHeight,
            config.bubbleRight.tailRadius,
          )
          ctx.lineTo(bubbleX + bubbleW, tailY + config.bubbleRight.tailHeight)
          ctx.fill()
        }

        for (let li = 0; li < lines.length; li++) {
          const textX = bubbleX + config.bubbleRight.paddingLeft
          const textY = cursorY + config.bubbleRight.paddingTop + li * lineH
          drawText(
            ctx,
            lines[li],
            textX,
            textY,
            config.bubbleRight.fontSize,
            config.bubbleRight.font,
            config.bubbleRight.textColor,
            otBubbleRightFont,
          )
        }

        cursorY += bubbleH
      }
    } else if (msg.type === 'bond') {
      // ── 인연 스토리 배너 ──
      const name = msg.name || ''
      const bondText =
        lang === 'ja'
          ? `${name}の絆ストーリーへ`
          : lang === 'ko'
            ? `${name}의 인연 스토리로`
            : `To ${name}'s Relationship Story`

      cursorY += config.bond.marginTop
      const bannerLeftOffset = config.profile.size + config.bubbleLeft.marginLeft
      const availableWidth = chatAreaWidth - bannerLeftOffset - config.bond.marginLeft - config.bond.marginRight

      if (themeName === 'momotalk') {
        const headerText = lang === 'ja' ? '絆イベント' : lang === 'ko' ? '인연 이벤트' : 'Relationship Event'

        const bannerW = availableWidth * config.bond.maxWidthRatio
        const btnW = bannerW - config.bond.buttonMarginX * 2
        const buttonInnerW = btnW - config.bond.buttonPaddingLeft - config.bond.buttonPaddingRight

        ctx.font = `${config.bond.fontSize}px ${config.bond.font}`
        const lines = wrapText(ctx, bondText, buttonInnerW, otBondFont, config.bond.fontSize, breakHangul)
        const buttonH =
          lines.length * config.bond.fontSize * 1.2 + config.bond.buttonPaddingTop + config.bond.buttonPaddingBottom
        const headerH = Math.max(config.bond.headerBarHeight, config.bond.headerFontSize)
        const bannerH =
          config.bond.paddingTop +
          headerH +
          config.bond.dividerMarginTop +
          config.bond.dividerThickness +
          config.bond.buttonMarginTop +
          buttonH +
          config.bond.paddingBottom

        const bannerX = chatLeft + bannerLeftOffset + config.bond.marginLeft + (availableWidth - bannerW) / 2

        // Outer Box
        ctx.save()
        ctx.fillStyle = config.bond.backgroundColor
        roundRect(ctx, bannerX, cursorY, bannerW, bannerH, config.bond.borderRadius)
        ctx.fill()

        if (config.bond.borderWidth > 0 && config.bond.borderColor !== 'transparent') {
          ctx.save()
          ctx.strokeStyle = config.bond.borderColor
          ctx.lineWidth = config.bond.borderWidth
          const bw = config.bond.borderWidth
          const r = Math.max(0, config.bond.borderRadius - bw / 2)
          roundRect(ctx, bannerX + bw / 2, cursorY + bw / 2, bannerW - bw, bannerH - bw, r)
          ctx.stroke()
          ctx.restore()
        }

        // Header Bar
        ctx.fillStyle = config.bond.headerBarColor
        ctx.fillRect(
          bannerX + config.bond.paddingLeft,
          cursorY + config.bond.paddingTop,
          config.bond.headerBarWidth,
          config.bond.headerBarHeight,
        )

        // Header Text
        const otHeaderFont = resolveOpentypeFont(config.bond.headerFont)
        drawText(
          ctx,
          headerText,
          bannerX + config.bond.paddingLeft + config.bond.headerBarWidth + config.bond.headerGap,
          cursorY + config.bond.paddingTop + (headerH - config.bond.headerFontSize) / 2,
          config.bond.headerFontSize,
          config.bond.headerFont,
          config.bond.headerColor,
          otHeaderFont,
        )

        // Divider
        ctx.fillStyle = config.bond.dividerColor
        ctx.fillRect(
          bannerX + config.bond.buttonMarginX,
          cursorY + config.bond.paddingTop + headerH + config.bond.dividerMarginTop,
          bannerW - config.bond.buttonMarginX * 2,
          config.bond.dividerThickness,
        )

        // Button Shadow / Bottom Edge
        const btnX = bannerX + config.bond.buttonMarginX
        const btnY =
          cursorY +
          config.bond.paddingTop +
          headerH +
          config.bond.dividerMarginTop +
          config.bond.dividerThickness +
          config.bond.buttonMarginTop

        if (config.bond.buttonShadowColor !== 'transparent') {
          ctx.save()
          ctx.globalAlpha = config.bond.buttonShadowOpacity
          ctx.fillStyle = config.bond.buttonShadowColor
          if (config.bond.buttonShadowBlur > 0) {
            ctx.shadowColor = config.bond.buttonShadowColor
            ctx.shadowBlur = config.bond.buttonShadowBlur * scale
            ctx.shadowOffsetY = config.bond.buttonShadowHeight * scale
          }
          const bs = config.bond.buttonShadowSize
          roundRect(
            ctx,
            btnX - bs,
            btnY + (config.bond.buttonShadowBlur > 0 ? 0 : config.bond.buttonShadowHeight) - bs,
            btnW + bs * 2,
            buttonH + bs * 2,
            config.bond.buttonBorderRadius,
          )
          ctx.fill()
          ctx.restore()
        }

        // Button Background
        ctx.fillStyle = config.bond.buttonBackgroundColor
        roundRect(ctx, btnX, btnY, btnW, buttonH, config.bond.buttonBorderRadius)
        ctx.fill()

        // Button Border
        if (config.bond.buttonBorderWidth > 0 && config.bond.buttonBorderColor !== 'transparent') {
          ctx.save()
          ctx.strokeStyle = config.bond.buttonBorderColor
          ctx.lineWidth = config.bond.buttonBorderWidth
          ctx.globalAlpha = config.bond.buttonBorderOpacity
          const bbw = config.bond.buttonBorderWidth
          const r = Math.max(0, config.bond.buttonBorderRadius - bbw / 2)
          roundRect(ctx, btnX + bbw / 2, btnY + bbw / 2, btnW - bbw, buttonH - bbw, r)
          ctx.stroke()
          ctx.restore()
        }

        // Button Text
        for (let li = 0; li < lines.length; li++) {
          const textY = btnY + config.bond.buttonPaddingTop + li * config.bond.fontSize * 1.2
          drawText(
            ctx,
            lines[li],
            btnX + btnW / 2,
            textY,
            config.bond.fontSize,
            config.bond.font,
            config.bond.textColor,
            otBondFont,
            'top',
            1.0,
            'center',
            config.bond.buttonTextBorderColor,
            config.bond.buttonTextBorderWidth,
          )
        }
        ctx.restore() // restore outer save

        cursorY += bannerH + config.bond.marginBottom
      } else {
        const maxTextWidth =
          availableWidth * config.bond.maxWidthRatio - config.bond.paddingLeft - config.bond.paddingRight
        ctx.font = `${config.bond.fontSize}px ${config.bond.font}`
        const lines = wrapText(ctx, bondText, maxTextWidth, otBondFont, config.bond.fontSize, breakHangul)
        const lineH = config.bond.fontSize * 1.2
        const textBlockWidth = Math.max(...lines.map((l) => measureTextWidth(l, ctx, otBondFont, config.bond.fontSize)))
        const bannerW = textBlockWidth + config.bond.paddingLeft + config.bond.paddingRight
        const bannerH = lines.length * lineH + config.bond.paddingTop + config.bond.paddingBottom

        const bannerX = chatLeft + bannerLeftOffset + config.bond.marginLeft + (availableWidth - bannerW) / 2

        ctx.fillStyle = config.bond.backgroundColor
        roundRect(ctx, bannerX, cursorY, bannerW, bannerH, config.bond.borderRadius)
        ctx.fill()

        if (config.bond.borderWidth > 0 && config.bond.borderColor !== 'transparent') {
          ctx.save()
          ctx.strokeStyle = config.bond.borderColor
          ctx.lineWidth = config.bond.borderWidth
          const bw = config.bond.borderWidth
          const r = Math.max(0, config.bond.borderRadius - bw / 2)
          roundRect(ctx, bannerX + bw / 2, cursorY + bw / 2, bannerW - bw, bannerH - bw, r)
          ctx.stroke()
          ctx.restore()
        }

        for (let li = 0; li < lines.length; li++) {
          const textX = bannerX + config.bond.paddingLeft
          const textY = cursorY + config.bond.paddingTop + li * lineH
          drawText(
            ctx,
            lines[li],
            textX,
            textY,
            config.bond.fontSize,
            config.bond.font,
            config.bond.textColor,
            otBondFont,
            'top',
            1.0,
            'left',
            config.bond.buttonTextBorderColor,
            config.bond.buttonTextBorderWidth,
          )
        }

        cursorY += bannerH + config.bond.marginBottom
      }
    }

    // 그룹 캐시 저장
    if (useCache) {
      const groupHeight = cursorY - groupStartY
      const gc = cachedGroup?.canvas ?? document.createElement('canvas')
      const chatWidth = width - config.sidebar.width
      gc.width = chatWidth
      gc.height = groupHeight
      const gctx = gc.getContext('2d')!
      gctx.clearRect(0, 0, chatWidth, groupHeight)
      // 메인 캔버스에서 그룹 영역 스냅샷 (사이드바 제외)
      gctx.drawImage(
        ctx.canvas,
        config.sidebar.width,
        groupStartY,
        chatWidth,
        groupHeight,
        0,
        0,
        chatWidth,
        groupHeight,
      )
      groupCaches[i] = {hash: msgHash, canvas: gc, width: chatWidth, height: groupHeight}
    }
  }
  ctx.restore()
}

/**
 * PNG로 내보내기
 * density > 1이면 고해상도로 새로 렌더링
 */
export async function exportAsPng(
  _canvas: HTMLCanvasElement,
  density: number,
  messages: MessageItem[],
  themeName: ThemeName,
  lang: Language,
): Promise<void> {
  const config = resolveThemeConfig(themes[themeName], lang || 'ko')
  const height = calculateCanvasHeight(messages, config, lang, themeName)
  const width = config.canvasWidth

  const hiDpiCanvas = document.createElement('canvas')
  hiDpiCanvas.width = width * density
  hiDpiCanvas.height = height * density
  const hiCtx = hiDpiCanvas.getContext('2d', {alpha: false})!

  // 고밀도 렌더링
  await renderToContext(hiCtx, messages, themeName, density, 0, undefined, lang)

  // toBlob 사용으로 메모리 효율 개선 (toDataURL은 거대한 base64 문자열 생성)
  const blob = await new Promise<Blob | null>((resolve) => hiDpiCanvas.toBlob(resolve, 'image/png'))

  // 임시 캔버스 메모리 즉시 해제
  hiDpiCanvas.width = 0
  hiDpiCanvas.height = 0

  if (!blob) return

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = `message_${themeName}_${density}x.png`
  link.href = url
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 캔버스 내용을 클립보드에 PNG로 복사
 * Safari 호환성을 위해 Promise를 직접 ClipboardItem에 전달
 */
export async function copyCanvasToClipboard(canvas: HTMLCanvasElement): Promise<void> {
  try {
    if (!navigator.clipboard || !window.ClipboardItem) {
      throw new Error('Clipboard API not supported')
    }

    const item = new ClipboardItem({
      'image/png': new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Failed to create blob'))
        }, 'image/png')
      }),
    })

    await navigator.clipboard.write([item])
  } catch (err) {
    console.error('Failed to copy image to clipboard:', err)
    throw err
  }
}

/**
 * 모든 렌더러 캐시 초기화 (페이지 이탈 시 메모리 해제용)
 */
export function clearCaches(): void {
  imageCache.clear()
  iconCache.clear()
  loadedFontFamilies.clear()
  opentypeCache.clear()
  fontDataUrlCache.clear()
  wrapTextCache.clear()
  chromeCache = null
  for (const gc of groupCaches) {
    gc.canvas.width = 0
    gc.canvas.height = 0
  }
  groupCaches = []
  if (sharedMeasureCanvas) {
    sharedMeasureCanvas.width = 0
    sharedMeasureCanvas.height = 0
    sharedMeasureCanvas = null
    sharedMeasureCtx = null
  }
  if (sharedDataUrlCanvas) {
    sharedDataUrlCanvas.width = 0
    sharedDataUrlCanvas.height = 0
    sharedDataUrlCanvas = null
    sharedDataUrlCtx = null
  }
  if (sharedRenderBufferCanvas) {
    sharedRenderBufferCanvas.width = 0
    sharedRenderBufferCanvas.height = 0
    sharedRenderBufferCanvas = null
  }
}

/** svgModules에서 직접 SVG 소스를 가져옴 (별도 캐시 불필요) */
function getSvgSource(name: string): string {
  const path = `/src/lib/assets/message-maker/${name}.svg`
  const svgText = svgModules[path]
  if (!svgText) throw new Error(`SVG source not found: ${name}`)
  return svgText
}

/**
 * 캔버스 로직을 미러링하여 실제 벡터 SVG 문자열 생성
 */
export async function exportAsVectorSvg(messages: MessageItem[], themeName: ThemeName, lang?: Language): Promise<void> {
  try {
    const config = resolveThemeConfig(themes[themeName], lang || 'ko')
    const height = calculateCanvasHeight(messages, config, lang, themeName)
    const width = config.canvasWidth
    const breakHangul = themeName !== 'momotalk'

    const nameFont = config.name.font
    const bubbleLeftFont = config.bubbleLeft.font
    const bubbleRightFont = config.bubbleRight.font
    const bondFont = config.bond.font

    // 폰트 데이터 가져오기 (SVG 패스 변환용) — fetchFontDataUrl 캐시 재활용
    if (themeName === 'momotalk') {
      const faces: {family: string; endpoint: string}[] = [
        {family: 'Jalnan2', endpoint: '/api/font/jalnan'},
        {family: 'GyeonggiTitle', endpoint: '/api/font/gyeonggi'},
        {family: 'GyeonggiTitleBold', endpoint: '/api/font/gyeonggi-bold'},
      ]
      if (lang === 'ja') {
        faces.push({family: 'ShinMGo-Medium', endpoint: '/api/font/shinmgo'})
        faces.push({family: 'ShinMGo-DeBold', endpoint: '/api/font/shinmgo-debold'})
      } else if (lang === 'en') {
        faces.push({family: 'NotoSans', endpoint: '/api/font/notosans'})
        faces.push({family: 'NotoSansBold', endpoint: '/api/font/notosans-bold'})
      }
      const dataUrls = await Promise.all(faces.map((f) => fetchFontDataUrl(f.endpoint)))
      await Promise.all(faces.map((f, i) => parseAndCacheOpentypeFont(f.family, dataUrls[i])))
    }

    function renderSvgText(
      text: string,
      x: number,
      y: number,
      fontFamily: string,
      fontSize: number,
      color: string,
      align: 'start' | 'center' | 'middle' = 'start',
      baseline: 'top' | 'hanging' | 'middle' = 'hanging',
      fontWeight: string = 'normal',
      scaleX: number = 1.0,
      strokeColor?: string,
      strokeWidth?: number,
    ) {
      const font = resolveOpentypeFont(fontFamily)

      if (font) {
        const path = font.getPath(text, 0, 0, fontSize)

        let drawX = x
        if (align === 'center' || align === 'middle') {
          const w = font.getAdvanceWidth(text, fontSize)
          drawX -= (w / 2) * scaleX
        }

        let drawY = y
        if (baseline === 'hanging' || baseline === 'top') {
          // 'top' 기준선은 폰트의 ascender만큼 내림 (Canvas의 top 동작과 유사)
          drawY = y + (font.ascender / font.unitsPerEm) * fontSize
        } else if (baseline === 'middle') {
          // 'middle' 기준선은 ascender와 descender의 중간 지점을 y에 맞춤 (2.5px 수동 보정으로 PNG와 일치시킴)
          drawY = y + ((font.ascender + font.descender) / (2 * font.unitsPerEm)) * fontSize - 2.5
        }

        const svgPath = path.toSVG(2)
        const strokeAttr =
          strokeColor && strokeWidth
            ? ` stroke="${strokeColor}" stroke-width="${strokeWidth * 2}" stroke-linejoin="round" stroke-linecap="round" paint-order="stroke fill"`
            : ''
        if (scaleX !== 1.0) {
          return svgPath.replace(
            '<path ',
            `<path fill="${color}"${strokeAttr} transform="translate(${drawX}, ${drawY}) scale(${scaleX}, 1)" `,
          )
        } else {
          return svgPath.replace(
            '<path ',
            `<path fill="${color}"${strokeAttr} transform="translate(${drawX}, ${drawY})" `,
          )
        }
      } else {
        const anchor = align === 'center' || align === 'middle' ? 'middle' : 'start'
        const strokeAttr =
          strokeColor && strokeWidth
            ? ` stroke="${strokeColor}" stroke-width="${strokeWidth * 2}" stroke-linejoin="round" stroke-linecap="round" paint-order="stroke fill"`
            : ''
        const transformAttr =
          scaleX !== 1.0 ? ` transform="translate(${x}, ${y}) scale(${scaleX}, 1) translate(${-x}, ${-y})"` : ''
        return `<text x="${x}" y="${y}" fill="${color}"${strokeAttr} font-family="${fontFamily}" font-size="${fontSize}" font-weight="${fontWeight}" text-anchor="${anchor}" dominant-baseline="${baseline}"${transformAttr}>${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>`
      }
    }

    let svgParts: string[] = []

    // 배경
    svgParts.push(`<rect width="${width}" height="${height}" fill="${config.backgroundColor}" />`)

    // 헤더
    if (config.header.backgroundGradient) {
      const colorMatches = config.header.backgroundGradient.match(/#[0-9a-fA-F]{6}/g) || [
        config.header.backgroundColor,
        config.header.backgroundColor,
      ]
      svgParts.push(`
      <defs>
        <linearGradient id="headerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${colorMatches[0]};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colorMatches[1]};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${config.header.height}" fill="url(#headerGrad)" />
    `)
    } else {
      svgParts.push(
        `<rect width="${width}" height="${config.header.height}" fill="${config.header.backgroundColor}" />`,
      )
    }

    // 헤더 아이콘 & 텍스트
    if (themeName === 'momotalk') {
      const logoSvg = await getSvgSource('momotalk')
      const centerY = config.header.height / 2

      // 로고 (간단하게 <g>로 삽입하거나 <image>로 삽입. 원본 소스가 있으니 <svg> 내부 삽입 시도)
      // 여기선 호환성을 위해 base64 image로 처리하거나 svg injection
      const logoB64 = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(logoSvg)))}`
      svgParts.push(
        `<image x="${config.header.paddingLeft}" y="${centerY - config.header.logoSize / 2 + config.header.logoOffsetY}" width="${config.header.logoSize}" height="${config.header.logoSize}" href="${logoB64}" />`,
      )

      const titleX = config.header.paddingLeft + config.header.logoSize + config.header.logoGap
      const titleY = centerY + config.header.titleOffsetY
      svgParts.push(
        renderSvgText(
          'MomoTalk',
          titleX,
          titleY,
          config.header.titleFont,
          config.header.titleFontSize,
          config.header.titleColor,
          'start',
          'middle',
          'bold',
          config.header.titleScaleX,
        ),
      )

      if (config.header.helpIconSize > 0) {
        const helpSvg = await getSvgSource('help')
        const helpB64 = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(helpSvg)))}`
        // 대략적인 텍스트 너비 (opentype 우선, Canvas fallback)
        const otTitleFont = resolveOpentypeFont(config.header.titleFont)
        const helpMeasureCtx = getMeasureCtx(width)
        helpMeasureCtx.font = `${config.header.titleFontSize}px ${config.header.titleFont}`
        const titleWidth =
          measureTextWidth('MomoTalk', helpMeasureCtx, otTitleFont, config.header.titleFontSize) *
          (config.header.titleScaleX || 1.0)

        svgParts.push(
          `<image x="${titleX + titleWidth + config.header.helpIconGap}" y="${centerY - config.header.helpIconSize / 2 + config.header.helpIconOffsetY}" width="${config.header.helpIconSize}" height="${config.header.helpIconSize}" href="${helpB64}" />`,
        )
      }

      if (config.header.closeIconSize > 0) {
        const closeSvg = await getSvgSource('close')
        const closeB64 = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(closeSvg)))}`
        svgParts.push(
          `<image x="${width + config.header.closeIconOffsetX - config.header.closeIconSize}" y="${centerY - config.header.closeIconSize / 2 + config.header.closeIconOffsetY}" width="${config.header.closeIconSize}" height="${config.header.closeIconSize}" href="${closeB64}" />`,
        )
      }
    }

    // 사이드바
    if (config.sidebar.width > 0) {
      svgParts.push(
        `<rect x="0" y="${config.header.height}" width="${config.sidebar.width}" height="${height - config.header.height}" fill="${config.sidebar.backgroundColor}" />`,
      )

      let sidebarY = config.header.height + config.sidebar.paddingTop
      if (config.sidebar.studentIconSize > 0) {
        const studentSvg = await getSvgSource('student')
        const studentB64 = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(studentSvg)))}`
        svgParts.push(
          `<image x="${config.sidebar.width / 2 - config.sidebar.studentIconSize / 2}" y="${sidebarY}" width="${config.sidebar.studentIconSize}" height="${config.sidebar.studentIconSize}" href="${studentB64}" opacity="${config.sidebar.studentIconOpacity}" />`,
        )
        sidebarY += config.sidebar.studentIconSize + config.sidebar.iconGap
      }

      if (config.sidebar.chatIconSize > 0) {
        if (config.sidebar.activeChatBackgroundColor && config.sidebar.activeChatBackgroundColor !== 'transparent') {
          svgParts.push(
            `<rect x="0" y="${sidebarY + config.sidebar.activeChatBackgroundOffsetY}" width="${config.sidebar.width}" height="${config.sidebar.activeChatBackgroundHeight}" fill="${config.sidebar.activeChatBackgroundColor}" />`,
          )
        }
        const chatSvg = await getSvgSource('chat')
        const chatB64 = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(chatSvg)))}`
        const chatX = config.sidebar.width / 2 - config.sidebar.chatIconSize / 2
        svgParts.push(
          `<image x="${chatX}" y="${sidebarY}" width="${config.sidebar.chatIconSize}" height="${config.sidebar.chatIconSize}" href="${chatB64}" />`,
        )
      }
    }

    // 대화 영역
    const chatLeft = config.sidebar.width + config.chat.paddingLeft
    const chatRight = width - config.chat.paddingRight
    const chatAreaWidth = chatRight - chatLeft
    let cursorY = config.header.height + config.chat.paddingTop

    const tempCtx = getMeasureCtx(width)
    const otLeft = resolveOpentypeFont(bubbleLeftFont)
    const otRight = resolveOpentypeFont(bubbleRightFont)

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i]
      if (i > 0) {
        if (msg.type === 'bond') {
          cursorY += config.chat.messageGap
        } else {
          cursorY += config.chat.groupGap
        }
      }

      if (msg.type === 'left') {
        const profileX = chatLeft
        if (config.profile.size > 0 && msg.portrait) {
          const zoom = config.profile.zoom || 1.0
          const size = config.profile.size
          const finalUrl =
            msg.portrait.startsWith('http') || msg.portrait.startsWith('blob:')
              ? msg.portrait
              : getImageUrl(msg.portrait, {original: true}, rendererIsProd)
          const portraitDataUrl = await getImageAsDataUrl(finalUrl)
          if (config.profile.circular) {
            svgParts.push(`
            <clipPath id="circleView${i}">
              <circle cx="${profileX + size / 2}" cy="${cursorY + size / 2}" r="${size / 2}" />
            </clipPath>
            <circle cx="${profileX + size / 2}" cy="${cursorY + size / 2}" r="${size / 2}" fill="#ddd" />
            <g clip-path="url(#circleView${i})">
              <image x="${profileX - (size * (zoom - 1)) / 2}" y="${cursorY - (size * (zoom - 1)) / 2}" width="${size * zoom}" height="${size * zoom}" href="${portraitDataUrl}" preserveAspectRatio="xMidYMid slice" />
            </g>
          `)
          } else {
            svgParts.push(
              `<rect x="${profileX}" y="${cursorY}" width="${size}" height="${size}" rx="12" fill="#ddd" />`,
            )
            svgParts.push(
              `<image x="${profileX - (size * (zoom - 1)) / 2}" y="${cursorY - (size * (zoom - 1)) / 2}" width="${size * zoom}" height="${size * zoom}" href="${portraitDataUrl}" preserveAspectRatio="xMidYMid slice" />`,
            )
          }
        }

        const nameX = profileX + (config.profile.size > 0 ? config.profile.size : 0) + config.name.marginLeft
        const nameY = cursorY + config.name.marginTop
        svgParts.push(
          renderSvgText(
            msg.name || '',
            nameX,
            nameY,
            nameFont,
            config.name.fontSize,
            config.name.color,
            'start',
            'hanging',
            'normal',
          ),
        )
        cursorY += config.name.marginTop + config.name.fontSize + config.name.marginBottom

        const profileSize = config.profile.size > 0 ? config.profile.size : 0
        const bubbleStartX = profileX + profileSize + config.bubbleLeft.marginLeft

        for (let bi = 0; bi < msg.text.length; bi++) {
          if (bi > 0) cursorY += config.chat.messageGap
          const {lines, lineH, bubbleW, bubbleH} = computeBubbleLayout(
            tempCtx,
            msg.text[bi],
            config.bubbleLeft,
            chatAreaWidth,
            otLeft,
            breakHangul,
          )

          svgParts.push(
            `<rect x="${bubbleStartX}" y="${cursorY}" width="${bubbleW}" height="${bubbleH}" rx="${config.bubbleLeft.borderRadius}" fill="${config.bubbleLeft.backgroundColor}" />`,
          )
          if (bi === 0 && config.bubbleLeft.tailWidth > 0) {
            const tailY = cursorY + config.bubbleLeft.tailOffsetY
            svgParts.push(
              `<path d="M${bubbleStartX},${tailY} L${bubbleStartX - config.bubbleLeft.tailWidth + config.bubbleLeft.tailRadius * 0.6},${tailY + config.bubbleLeft.tailHeight / 2 - config.bubbleLeft.tailRadius * 0.4} Q${bubbleStartX - config.bubbleLeft.tailWidth},${tailY + config.bubbleLeft.tailHeight / 2} ${bubbleStartX - config.bubbleLeft.tailWidth + config.bubbleLeft.tailRadius * 0.6},${tailY + config.bubbleLeft.tailHeight / 2 + config.bubbleLeft.tailRadius * 0.4} L${bubbleStartX},${tailY + config.bubbleLeft.tailHeight} Z" fill="${config.bubbleLeft.backgroundColor}" />`,
            )
          }
          for (let li = 0; li < lines.length; li++) {
            const textY = cursorY + config.bubbleLeft.paddingTop + li * lineH
            svgParts.push(
              renderSvgText(
                lines[li],
                bubbleStartX + config.bubbleLeft.paddingLeft,
                textY,
                bubbleLeftFont,
                config.bubbleLeft.fontSize,
                config.bubbleLeft.textColor,
                'start',
                'hanging',
                'normal',
              ),
            )
          }
          cursorY += bubbleH
        }
      } else if (msg.type === 'right') {
        // 선생님
        for (let bi = 0; bi < msg.text.length; bi++) {
          if (bi > 0) cursorY += config.chat.messageGap
          const {lines, lineH, bubbleW, bubbleH} = computeBubbleLayout(
            tempCtx,
            msg.text[bi],
            config.bubbleRight,
            chatAreaWidth,
            otRight,
            breakHangul,
          )
          const bubbleX = chatRight - bubbleW - config.bubbleRight.marginRight

          svgParts.push(
            `<rect x="${bubbleX}" y="${cursorY}" width="${bubbleW}" height="${bubbleH}" rx="${config.bubbleRight.borderRadius}" fill="${config.bubbleRight.backgroundColor}" />`,
          )
          if (bi === 0 && config.bubbleRight.tailWidth > 0) {
            const tailY = cursorY + config.bubbleRight.tailOffsetY
            svgParts.push(
              `<path d="M${bubbleX + bubbleW},${tailY} L${bubbleX + bubbleW + config.bubbleRight.tailWidth - config.bubbleRight.tailRadius * 0.6},${tailY + config.bubbleRight.tailHeight / 2 - config.bubbleRight.tailRadius * 0.4} Q${bubbleX + bubbleW + config.bubbleRight.tailWidth},${tailY + config.bubbleRight.tailHeight / 2} ${bubbleX + bubbleW + config.bubbleRight.tailWidth - config.bubbleRight.tailRadius * 0.6},${tailY + config.bubbleRight.tailHeight / 2 + config.bubbleRight.tailRadius * 0.4} L${bubbleX + bubbleW},${tailY + config.bubbleRight.tailHeight} Z" fill="${config.bubbleRight.backgroundColor}" />`,
            )
          }
          for (let li = 0; li < lines.length; li++) {
            const textY = cursorY + config.bubbleRight.paddingTop + li * lineH
            svgParts.push(
              renderSvgText(
                lines[li],
                bubbleX + config.bubbleRight.paddingLeft,
                textY,
                bubbleRightFont,
                config.bubbleRight.fontSize,
                config.bubbleRight.textColor,
                'start',
                'hanging',
                'normal',
              ),
            )
          }

          cursorY += bubbleH
        }
      } else if (msg.type === 'bond') {
        const name = msg.name || ''
        const bondText =
          lang === 'ja'
            ? `${name}の絆ストーリーへ`
            : lang === 'ko'
              ? `${name}의 인연 스토리로`
              : `To ${name}'s Relationship Story`
        const otBond = resolveOpentypeFont(bondFont)

        cursorY += config.bond.marginTop
        const bannerLeftOffset = config.profile.size + config.bubbleLeft.marginLeft
        const availableWidth = chatAreaWidth - bannerLeftOffset - config.bond.marginLeft - config.bond.marginRight

        if (themeName === 'momotalk') {
          const headerText = lang === 'ja' ? '絆イベント' : lang === 'ko' ? '인연 이벤트' : 'Relationship Event'

          const bannerW = availableWidth * config.bond.maxWidthRatio
          const btnW = bannerW - config.bond.buttonMarginX * 2
          const buttonInnerW = btnW - config.bond.buttonPaddingLeft - config.bond.buttonPaddingRight

          tempCtx.font = `${config.bond.fontSize}px ${bondFont}`
          const lines = wrapText(tempCtx, bondText, buttonInnerW, otBond, config.bond.fontSize, breakHangul)
          const buttonH =
            lines.length * config.bond.fontSize * 1.2 + config.bond.buttonPaddingTop + config.bond.buttonPaddingBottom
          const headerH = Math.max(config.bond.headerBarHeight, config.bond.headerFontSize)
          const bannerH =
            config.bond.paddingTop +
            headerH +
            config.bond.dividerMarginTop +
            config.bond.dividerThickness +
            config.bond.buttonMarginTop +
            buttonH +
            config.bond.paddingBottom

          const bannerX = chatLeft + bannerLeftOffset + config.bond.marginLeft + (availableWidth - bannerW) / 2

          const clipId = `bondClip-${i}`
          const gradId = `bondGrad-${i}`

          // Outer Box & Definitions
          const bw = config.bond.borderWidth
          const r = Math.max(0, config.bond.borderRadius - bw / 2)
          svgParts.push(`
            <rect x="${bannerX + bw / 2}" y="${cursorY + bw / 2}" width="${bannerW - bw}" height="${bannerH - bw}" rx="${r}" fill="${config.bond.backgroundColor}" stroke="${config.bond.borderColor}" stroke-width="${config.bond.borderWidth}" />
          `)

          // Header Bar & Text
          svgParts.push(`
            <rect x="${bannerX + config.bond.paddingLeft}" y="${cursorY + config.bond.paddingTop}" width="${config.bond.headerBarWidth}" height="${config.bond.headerBarHeight}" fill="${config.bond.headerBarColor}" />
            ${renderSvgText(headerText, bannerX + config.bond.paddingLeft + config.bond.headerBarWidth + config.bond.headerGap, cursorY + config.bond.paddingTop + (headerH - config.bond.headerFontSize) / 2, config.bond.headerFont, config.bond.headerFontSize, config.bond.headerColor, 'start', 'hanging', 'normal')}
            <rect x="${bannerX + config.bond.buttonMarginX}" y="${cursorY + config.bond.paddingTop + headerH + config.bond.dividerMarginTop}" width="${bannerW - config.bond.buttonMarginX * 2}" height="${config.bond.dividerThickness}" fill="${config.bond.dividerColor}" />
          `)

          // Button
          const btnX = bannerX + config.bond.buttonMarginX
          const btnY =
            cursorY +
            config.bond.paddingTop +
            headerH +
            config.bond.dividerMarginTop +
            config.bond.dividerThickness +
            config.bond.buttonMarginTop

          const bbw = config.bond.buttonBorderWidth
          const br = Math.max(0, config.bond.buttonBorderRadius - bbw / 2)
          const bs = config.bond.buttonShadowSize
          const bsh = config.bond.buttonShadowHeight
          const bsb = config.bond.buttonShadowBlur

          if (config.bond.buttonShadowColor !== 'transparent') {
            const filterId = `shadow-${i}`
            if (bsb > 0) {
              svgParts.push(`
                <defs>
                  <filter id="${filterId}" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="${bsb / 2}" />
                    <feOffset dx="0" dy="${bsh}" result="offsetblur" />
                    <feFlood flood-color="${config.bond.buttonShadowColor}" />
                    <feComposite in2="offsetblur" operator="in" />
                    <feMerge>
                      <feMergeNode />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
              `)
            }
            svgParts.push(`
              <rect x="${btnX - bs}" y="${btnY + (bsb > 0 ? 0 : bsh) - bs}" width="${btnW + bs * 2}" height="${buttonH + bs * 2}" rx="${config.bond.buttonBorderRadius}" fill="${config.bond.buttonShadowColor}" fill-opacity="${config.bond.buttonShadowOpacity}" ${bsb > 0 ? `filter="url(#${filterId})"` : ''} />
            `)
          }

          svgParts.push(`
            <rect x="${btnX + bbw / 2}" y="${btnY + bbw / 2}" width="${btnW - bbw}" height="${buttonH - bbw}" rx="${br}" fill="${config.bond.buttonBackgroundColor}" stroke="${config.bond.buttonBorderColor}" stroke-width="${config.bond.buttonBorderWidth}" stroke-opacity="${config.bond.buttonBorderOpacity}" />
          `)

          // Button Text
          for (let li = 0; li < lines.length; li++) {
            const textY = btnY + config.bond.buttonPaddingTop + li * config.bond.fontSize * 1.2
            svgParts.push(
              renderSvgText(
                lines[li],
                btnX + btnW / 2,
                textY,
                bondFont,
                config.bond.fontSize,
                config.bond.textColor,
                'middle',
                'hanging',
                'normal',
                1.0,
                config.bond.buttonTextBorderColor,
                config.bond.buttonTextBorderWidth,
              ),
            )
          }

          cursorY += bannerH + config.bond.marginBottom
        } else {
          const maxTextWidth =
            availableWidth * config.bond.maxWidthRatio - config.bond.paddingLeft - config.bond.paddingRight
          tempCtx.font = `${config.bond.fontSize}px ${bondFont}`
          const lines = wrapText(tempCtx, bondText, maxTextWidth, otBond, config.bond.fontSize, breakHangul)
          const lineH = config.bond.fontSize * 1.2
          const textBlockWidth = Math.max(
            ...lines.map((l) => measureTextWidth(l, tempCtx, otBond, config.bond.fontSize)),
          )
          const bannerW = textBlockWidth + config.bond.paddingLeft + config.bond.paddingRight
          const bannerH = lines.length * lineH + config.bond.paddingTop + config.bond.paddingBottom

          const bannerX = chatLeft + bannerLeftOffset + config.bond.marginLeft + (availableWidth - bannerW) / 2

          const bw = config.bond.borderWidth
          const r = Math.max(0, config.bond.borderRadius - bw / 2)
          svgParts.push(
            `<rect x="${bannerX + bw / 2}" y="${cursorY + bw / 2}" width="${bannerW - bw}" height="${bannerH - bw}" rx="${r}" fill="${config.bond.backgroundColor}" stroke="${config.bond.borderColor}" stroke-width="${config.bond.borderWidth}" />`,
          )

          for (let li = 0; li < lines.length; li++) {
            const textX = bannerX + config.bond.paddingLeft
            const textY = cursorY + config.bond.paddingTop + li * lineH
            svgParts.push(
              renderSvgText(
                lines[li],
                textX,
                textY,
                bondFont,
                config.bond.fontSize,
                config.bond.textColor,
                'start',
                'hanging',
                'normal',
                1.0,
                config.bond.buttonTextBorderColor,
                config.bond.buttonTextBorderWidth,
              ),
            )
          }

          cursorY += bannerH + config.bond.marginBottom
        }
      }
    }

    const finalSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
${svgParts.join('\n')}
</svg>`

    const blob = new Blob([finalSvg], {type: 'image/svg+xml;charset=utf-8'})
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = `message_${themeName}_vector.svg`
    link.href = url
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (err) {
    console.error('SVG export failed:', err)
  }
}
