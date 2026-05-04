import opentype from 'opentype.js'
import {woff2Decode} from 'woff2-decode'
import {getImageUrl} from '../utils'
import type {Language, ThemeConfig, ThemeName} from './configs'
import {resolveThemeConfig, themes} from './configs'

const rendererIsProd = import.meta.env.PROD

/** Jalnan2 폰트 로드 상태 */
let jalnan2Loaded = false
/** GyeonggiTitle 폰트 로드 상태 */
let gyeonggiLoaded = false
/** ShinMGo 폰트 로드 상태 */
let shinmgoLoaded = false
/** NotoSans 폰트 로드 상태 */
let notosansLoaded = false

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
) {
  let drawY = y
  if (baseline === 'top') {
    drawY = y + (font.ascender / font.unitsPerEm) * fontSize
  } else if (baseline === 'middle') {
    drawY = y + ((font.ascender + font.descender) / (2 * font.unitsPerEm)) * fontSize
  }

  const path = font.getPath(text, 0, 0, fontSize)
  ctx.save()
  ctx.translate(x, drawY)
  if (scaleX !== 1.0) {
    ctx.scale(scaleX, 1)
  }
  path.fill = color
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

/**
 * Jalnan2 폰트를 FontFace API로 등록 (lazy load)
 */
async function ensureJalnan2Font(): Promise<void> {
  if (jalnan2Loaded && opentypeCache.has('Jalnan2')) return
  if (typeof document === 'undefined') return

  const fontDataUrl = await fetchFontDataUrl('/api/font/jalnan')

  if (!jalnan2Loaded) {
    let alreadyRegistered = false
    for (const face of document.fonts) {
      if (face.family === 'Jalnan2') {
        alreadyRegistered = true
        break
      }
    }
    if (!alreadyRegistered) {
      const font = new FontFace('Jalnan2', base64ToArrayBuffer(fontDataUrl))
      await font.load()
      document.fonts.add(font)
    }
    jalnan2Loaded = true
  }

  await parseAndCacheOpentypeFont('Jalnan2', fontDataUrl)
}

/**
 * GyeonggiTitle 폰트를 FontFace API로 등록 (lazy load)
 */
async function ensureGyeonggiFont(): Promise<void> {
  if (gyeonggiLoaded && opentypeCache.has('GyeonggiTitle') && opentypeCache.has('GyeonggiTitleBold')) return
  if (typeof document === 'undefined') return

  const [fontDataUrl, boldDataUrl] = await Promise.all([
    fetchFontDataUrl('/api/font/gyeonggi'),
    fetchFontDataUrl('/api/font/gyeonggi-bold'),
  ])

  if (!gyeonggiLoaded) {
    let alreadyRegistered = false
    for (const face of document.fonts) {
      if (face.family === 'GyeonggiTitle') {
        alreadyRegistered = true
        break
      }
    }
    if (!alreadyRegistered) {
      const font = new FontFace('GyeonggiTitle', base64ToArrayBuffer(fontDataUrl))
      const fontBold = new FontFace('GyeonggiTitleBold', base64ToArrayBuffer(boldDataUrl))
      await Promise.all([font.load(), fontBold.load()])
      document.fonts.add(font)
      document.fonts.add(fontBold)
    }
    gyeonggiLoaded = true
  }

  await Promise.all([
    parseAndCacheOpentypeFont('GyeonggiTitle', fontDataUrl),
    parseAndCacheOpentypeFont('GyeonggiTitleBold', boldDataUrl),
  ])
}

/**
 * ShinMGo 폰트를 FontFace API로 등록 (lazy load, 일본어 전용)
 */
async function ensureShinMGoFont(): Promise<void> {
  if (shinmgoLoaded && opentypeCache.has('ShinMGo-Medium') && opentypeCache.has('ShinMGo-DeBold')) return
  if (typeof document === 'undefined') return

  const [mediumDataUrl, deboldDataUrl] = await Promise.all([
    fetchFontDataUrl('/api/font/shinmgo'),
    fetchFontDataUrl('/api/font/shinmgo-debold'),
  ])

  if (!shinmgoLoaded) {
    let alreadyRegistered = false
    for (const face of document.fonts) {
      if (face.family === 'ShinMGo-Medium') {
        alreadyRegistered = true
        break
      }
    }
    if (!alreadyRegistered) {
      const mediumFont = new FontFace('ShinMGo-Medium', base64ToArrayBuffer(mediumDataUrl))
      const deboldFont = new FontFace('ShinMGo-DeBold', base64ToArrayBuffer(deboldDataUrl))
      await Promise.all([mediumFont.load(), deboldFont.load()])
      document.fonts.add(mediumFont)
      document.fonts.add(deboldFont)
    }
    shinmgoLoaded = true
  }

  await Promise.all([
    parseAndCacheOpentypeFont('ShinMGo-Medium', mediumDataUrl),
    parseAndCacheOpentypeFont('ShinMGo-DeBold', deboldDataUrl),
  ])
}

/**
 * NotoSans 폰트를 FontFace API로 등록 (lazy load, 영어 전용)
 */
async function ensureNotoSansFont(): Promise<void> {
  if (notosansLoaded && opentypeCache.has('NotoSans') && opentypeCache.has('NotoSansBold')) return
  if (typeof document === 'undefined') return

  const [fontDataUrl, boldDataUrl] = await Promise.all([
    fetchFontDataUrl('/api/font/notosans'),
    fetchFontDataUrl('/api/font/notosans-bold'),
  ])

  if (!notosansLoaded) {
    let alreadyRegistered = false
    for (const face of document.fonts) {
      if (face.family === 'NotoSans') {
        alreadyRegistered = true
        break
      }
    }
    if (!alreadyRegistered) {
      const font = new FontFace('NotoSans', base64ToArrayBuffer(fontDataUrl))
      const fontBold = new FontFace('NotoSansBold', base64ToArrayBuffer(boldDataUrl))
      await Promise.all([font.load(), fontBold.load()])
      document.fonts.add(font)
      document.fonts.add(fontBold)
    }
    notosansLoaded = true
  }

  await Promise.all([
    parseAndCacheOpentypeFont('NotoSans', fontDataUrl),
    parseAndCacheOpentypeFont('NotoSansBold', boldDataUrl),
  ])
}

export interface MessageItem {
  /** 'left' = 왼쪽(학생), 'right' = 오른쪽(선생) */
  type: 'left' | 'right'
  /** 학생 이름 (type === 'left' 일 때만 사용) */
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
): string[] {
  // 캐시 키: 텍스트 + 폰트 + 최대 너비
  const cacheKey = otFont ? `ot:${otFontSize}:${maxWidth}:${text}` : `cv:${ctx.font}:${maxWidth}:${text}`
  const cached = wrapTextCache.get(cacheKey)
  if (cached) return cached
  const result = wrapTextCore(ctx, text, maxWidth, otFont, otFontSize)
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
): string[] {
  const lines: string[] = []
  // 먼저 명시적 줄바꿈 분리
  const paragraphs = text.split('\n')

  // 알파벳, 숫자, 그리고 단어 내에서 쓰일 수 있는 특수기호 (하이픈, 어포스트로피, 마침표, 쉼표)
  const isAlphaNum = (char: string) => /^[a-zA-Z0-9_\-\u00C0-\u024F'’.,]+$/.test(char)
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
 * 말풍선 하나의 높이를 계산하는 헬퍼
 */
function measureBubbleHeight(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxTextWidth: number,
  fontSize: number,
  lineHeight: number,
  paddingTop: number,
  paddingBottom: number,
  otFont?: opentype.Font,
): number {
  const lines = wrapText(ctx, text, maxTextWidth, otFont, fontSize)
  const textHeight = lines.length * fontSize * lineHeight
  return textHeight + paddingTop + paddingBottom
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
export function calculateCanvasHeight(messages: MessageItem[], config: ThemeConfig, lang?: Language): number {
  const tempCtx = getMeasureCtx(config.canvasWidth)

  const bubbleLeftFont = config.bubbleLeft.font
  const bubbleRightFont = config.bubbleRight.font

  // opentype 폰트 resolve (캐시에 있으면 사용, 없으면 Canvas fallback)
  const otBubbleLeft = resolveOpentypeFont(bubbleLeftFont)
  const otBubbleRight = resolveOpentypeFont(bubbleRightFont)

  const chatAreaWidth = config.canvasWidth - config.sidebar.width - config.chat.paddingLeft - config.chat.paddingRight

  let totalHeight = config.header.height + config.chat.paddingTop

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    if (i > 0) totalHeight += config.chat.groupGap

    if (msg.type === 'left') {
      // 이름 높이
      totalHeight += config.name.marginTop + config.name.fontSize + config.name.marginBottom

      const maxBubbleWidth = chatAreaWidth * config.bubbleLeft.maxWidthRatio
      const maxTextWidth = maxBubbleWidth - config.bubbleLeft.paddingLeft - config.bubbleLeft.paddingRight
      tempCtx.font = `${config.bubbleLeft.fontSize}px ${bubbleLeftFont}`

      for (let bi = 0; bi < msg.text.length; bi++) {
        if (bi > 0) totalHeight += config.chat.messageGap
        totalHeight += measureBubbleHeight(
          tempCtx,
          msg.text[bi],
          maxTextWidth,
          config.bubbleLeft.fontSize,
          config.bubbleLeft.lineHeight,
          config.bubbleLeft.paddingTop,
          config.bubbleLeft.paddingBottom,
          otBubbleLeft,
        )
      }
    } else {
      const maxBubbleWidth = chatAreaWidth * config.bubbleRight.maxWidthRatio
      const maxTextWidth = maxBubbleWidth - config.bubbleRight.paddingLeft - config.bubbleRight.paddingRight
      tempCtx.font = `${config.bubbleRight.fontSize}px ${bubbleRightFont}`

      for (let bi = 0; bi < msg.text.length; bi++) {
        if (bi > 0) totalHeight += config.chat.messageGap
        totalHeight += measureBubbleHeight(
          tempCtx,
          msg.text[bi],
          maxTextWidth,
          config.bubbleRight.fontSize,
          config.bubbleRight.lineHeight,
          config.bubbleRight.paddingTop,
          config.bubbleRight.paddingBottom,
          otBubbleRight,
        )
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
    const fontPromises: Promise<void>[] = [ensureJalnan2Font(), ensureGyeonggiFont()]
    if (lang === 'ja') fontPromises.push(ensureShinMGoFont())
    if (lang === 'en') fontPromises.push(ensureNotoSansFont())
    await Promise.all(fontPromises)
  }

  // 최신 렌더링 요청인지 확인
  if (renderId !== lastRenderId) return

  const height = calculateCanvasHeight(messages, config, lang)

  // 캔버스 크기가 바뀌면 chrome 캐시 무효화 (사이드바 높이가 달라지므로)
  const prevHeight = canvas.height
  canvas.width = config.canvasWidth
  canvas.height = height

  const ctx = canvas.getContext('2d')!
  // 미리 계산한 height를 전달하여 renderToContext 내부의 중복 계산 방지
  await renderToContext(ctx, messages, themeName, 1, renderId, height, lang)
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
  const height = precomputedHeight ?? calculateCanvasHeight(messages, config, lang)

  const nameFont = config.name.font
  const bubbleLeftFont = config.bubbleLeft.font
  const bubbleRightFont = config.bubbleRight.font

  // opentype 폰트 resolve (브라우저 독립 렌더링용)
  const otNameFont = resolveOpentypeFont(nameFont)
  const otBubbleLeftFont = resolveOpentypeFont(bubbleLeftFont)
  const otBubbleRightFont = resolveOpentypeFont(bubbleRightFont)
  const otHeaderFont = resolveOpentypeFont(config.header.titleFont)

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
    if (i > 0) cursorY += config.chat.groupGap

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
          const imgAspect = imgW / imgH

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
      if (otNameFont) {
        drawTextOt(ctx, otNameFont, msg.name || '', nameX, nameY, config.name.fontSize, config.name.color)
      } else {
        ctx.fillStyle = config.name.color
        ctx.font = `${config.name.fontSize}px ${nameFont}`
        ctx.textBaseline = 'top'
        ctx.fillText(msg.name || '', nameX, nameY)
      }
      cursorY += config.name.marginTop + config.name.fontSize + config.name.marginBottom

      // 말풍선들
      const profileSize = config.profile.size > 0 ? config.profile.size : 0
      const bubbleStartX = profileX + profileSize + config.bubbleLeft.marginLeft
      for (let bi = 0; bi < msg.text.length; bi++) {
        if (bi > 0) cursorY += config.chat.messageGap

        const maxBubbleWidth = chatAreaWidth * config.bubbleLeft.maxWidthRatio
        const maxTextWidth = maxBubbleWidth - config.bubbleLeft.paddingLeft - config.bubbleLeft.paddingRight

        ctx.font = `${config.bubbleLeft.fontSize}px ${bubbleLeftFont}`
        const lines = wrapText(ctx, msg.text[bi], maxTextWidth, otBubbleLeftFont, config.bubbleLeft.fontSize)
        const lineH = config.bubbleLeft.fontSize * config.bubbleLeft.lineHeight
        const textBlockHeight = lines.length * lineH
        const textBlockWidth = Math.max(
          ...lines.map((l) => measureTextWidth(l, ctx, otBubbleLeftFont, config.bubbleLeft.fontSize)),
        )
        const bubbleW = textBlockWidth + config.bubbleLeft.paddingLeft + config.bubbleLeft.paddingRight
        const bubbleH = textBlockHeight + config.bubbleLeft.paddingTop + config.bubbleLeft.paddingBottom

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
          if (otBubbleLeftFont) {
            drawTextOt(
              ctx,
              otBubbleLeftFont,
              lines[li],
              textX,
              textY,
              config.bubbleLeft.fontSize,
              config.bubbleLeft.textColor,
            )
          } else {
            ctx.fillStyle = config.bubbleLeft.textColor
            ctx.font = `${config.bubbleLeft.fontSize}px ${bubbleLeftFont}`
            ctx.textBaseline = 'top'
            ctx.fillText(lines[li], textX, textY)
          }
        }

        cursorY += bubbleH
      }
    } else {
      // ── 선생님 메시지 (오른쪽) ──
      for (let bi = 0; bi < msg.text.length; bi++) {
        if (bi > 0) cursorY += config.chat.messageGap

        const maxBubbleWidth = chatAreaWidth * config.bubbleRight.maxWidthRatio
        const maxTextWidth = maxBubbleWidth - config.bubbleRight.paddingLeft - config.bubbleRight.paddingRight

        ctx.font = `${config.bubbleRight.fontSize}px ${bubbleRightFont}`
        const lines = wrapText(ctx, msg.text[bi], maxTextWidth, otBubbleRightFont, config.bubbleRight.fontSize)
        const lineH = config.bubbleRight.fontSize * config.bubbleRight.lineHeight
        const textBlockHeight = lines.length * lineH
        const textBlockWidth = Math.max(
          ...lines.map((l) => measureTextWidth(l, ctx, otBubbleRightFont, config.bubbleRight.fontSize)),
        )
        const bubbleW = textBlockWidth + config.bubbleRight.paddingLeft + config.bubbleRight.paddingRight
        const bubbleH = textBlockHeight + config.bubbleRight.paddingTop + config.bubbleRight.paddingBottom

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
          if (otBubbleRightFont) {
            drawTextOt(
              ctx,
              otBubbleRightFont,
              lines[li],
              textX,
              textY,
              config.bubbleRight.fontSize,
              config.bubbleRight.textColor,
            )
          } else {
            ctx.fillStyle = config.bubbleRight.textColor
            ctx.font = `${config.bubbleRight.fontSize}px ${bubbleRightFont}`
            ctx.textBaseline = 'top'
            ctx.fillText(lines[li], textX, textY)
          }
        }

        cursorY += bubbleH
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
  const height = calculateCanvasHeight(messages, config, lang)
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
  svgSourceCache.clear()
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
}

/**
 * 전역 SVG 아이콘 텍스트 캐시 (원시 SVG 코드)
 * svgModules는 이미 모듈 레벨에서 한 번 평가됨
 */
const svgSourceCache = new Map<string, string>()

async function getSvgSource(name: string): Promise<string> {
  if (svgSourceCache.has(name)) return svgSourceCache.get(name)!

  const path = `/src/lib/assets/message-maker/${name}.svg`
  const svgText = svgModules[path]
  if (!svgText) throw new Error(`SVG source not found: ${name}`)

  svgSourceCache.set(name, svgText)
  return svgText
}

const opentypeCache = new Map<string, opentype.Font>()

async function loadOpentypeFont(familyName: string, dataUrlPromise: Promise<string>): Promise<opentype.Font> {
  try {
    if (opentypeCache.has(familyName)) {
      return opentypeCache.get(familyName)!
    }
    const dataUrl = await dataUrlPromise
    const buffer = base64ToArrayBuffer(dataUrl)

    // WOFF2 시그니처 확인 (wOF2 = 0x774F4632) 후 필요시 압축 해제
    let sfntBuffer = buffer
    const view = new DataView(buffer)
    if (buffer.byteLength > 4 && view.getUint32(0) === 0x774f4632) {
      try {
        const decompressed = await woff2Decode(new Uint8Array(buffer))
        sfntBuffer = decompressed.buffer as ArrayBuffer
      } catch (err) {
        console.error(`Failed to decompress ${familyName}:`, err)
        throw err
      }
    }

    const font = opentype.parse(sfntBuffer)
    opentypeCache.set(familyName, font)
    return font
  } catch (err) {
    console.error(`Error loading opentype font ${familyName}:`, err)
    throw err
  }
}

/**
 * 캔버스 로직을 미러링하여 실제 벡터 SVG 문자열 생성
 */
export async function exportAsVectorSvg(messages: MessageItem[], themeName: ThemeName, lang?: Language): Promise<void> {
  try {
    const config = resolveThemeConfig(themes[themeName], lang || 'ko')
    const height = calculateCanvasHeight(messages, config, lang)
    const width = config.canvasWidth

    let jalnanFont: opentype.Font | undefined
    let gyeonggiFont: opentype.Font | undefined
    let gyeonggiBoldFont: opentype.Font | undefined
    let shinmgoMediumFont: opentype.Font | undefined
    let shinmgoDeboldFont: opentype.Font | undefined
    let notosansFont: opentype.Font | undefined
    let notosansBoldFont: opentype.Font | undefined

    const nameFont = config.name.font
    const bubbleLeftFont = config.bubbleLeft.font
    const bubbleRightFont = config.bubbleRight.font

    // 폰트 데이터 가져오기 (SVG 패스 변환용)
    let fontStyles = ''
    if (themeName === 'momotalk') {
      const jalnanPromise = fetch('/api/font/jalnan').then((r) => r.text())
      const gyeonggiPromise = fetch('/api/font/gyeonggi').then((r) => r.text())
      const gyeonggiBoldPromise = fetch('/api/font/gyeonggi-bold').then((r) => r.text())

      jalnanFont = await loadOpentypeFont('Jalnan2', jalnanPromise)
      gyeonggiFont = await loadOpentypeFont('GyeonggiTitle', gyeonggiPromise)
      gyeonggiBoldFont = await loadOpentypeFont('GyeonggiTitleBold', gyeonggiBoldPromise)

      if (lang === 'ja') {
        const shinmgoMediumPromise = fetch('/api/font/shinmgo').then((r) => r.text())
        const shinmgoDeboldPromise = fetch('/api/font/shinmgo-debold').then((r) => r.text())
        shinmgoMediumFont = await loadOpentypeFont('ShinMGo-Medium', shinmgoMediumPromise)
        shinmgoDeboldFont = await loadOpentypeFont('ShinMGo-DeBold', shinmgoDeboldPromise)
      } else if (lang === 'en') {
        const notosansPromise = fetch('/api/font/notosans').then((r) => r.text())
        const notosansBoldPromise = fetch('/api/font/notosans-bold').then((r) => r.text())
        notosansFont = await loadOpentypeFont('NotoSans', notosansPromise)
        notosansBoldFont = await loadOpentypeFont('NotoSansBold', notosansBoldPromise)
      }
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
    ) {
      let font: opentype.Font | undefined
      if (fontFamily.includes('Jalnan2')) font = jalnanFont
      else if (fontFamily.includes('ShinMGo-Medium')) font = shinmgoMediumFont
      else if (fontFamily.includes('ShinMGo-DeBold')) font = shinmgoDeboldFont
      else if (fontFamily.includes('NotoSansBold')) font = notosansBoldFont
      else if (fontFamily.includes('NotoSans')) font = notosansFont
      else if (fontFamily.includes('GyeonggiTitleBold')) font = gyeonggiBoldFont
      else if (fontFamily.includes('GyeonggiTitle')) font = gyeonggiFont

      if (font) {
        const path = font.getPath(text, 0, 0, fontSize)
        const bbox = path.getBoundingBox()

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
        if (scaleX !== 1.0) {
          return svgPath.replace(
            '<path ',
            `<path fill="${color}" transform="translate(${drawX}, ${drawY}) scale(${scaleX}, 1)" `,
          )
        } else {
          return svgPath.replace('<path ', `<path fill="${color}" transform="translate(${drawX}, ${drawY})" `)
        }
      } else {
        const anchor = align === 'center' || align === 'middle' ? 'middle' : 'start'
        const transformAttr =
          scaleX !== 1.0 ? ` transform="translate(${x}, ${y}) scale(${scaleX}, 1) translate(${-x}, ${-y})"` : ''
        return `<text x="${x}" y="${y}" fill="${color}" font-family="${fontFamily}" font-size="${fontSize}" font-weight="${fontWeight}" text-anchor="${anchor}" dominant-baseline="${baseline}"${transformAttr}>${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>`
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

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i]
      if (i > 0) cursorY += config.chat.groupGap

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
          const maxBubbleWidth = chatAreaWidth * config.bubbleLeft.maxWidthRatio
          const maxTextWidth = maxBubbleWidth - config.bubbleLeft.paddingLeft - config.bubbleLeft.paddingRight
          tempCtx.font = `${config.bubbleLeft.fontSize}px ${bubbleLeftFont}`
          const otLeft = resolveOpentypeFont(bubbleLeftFont)
          const lines = wrapText(tempCtx, msg.text[bi], maxTextWidth, otLeft, config.bubbleLeft.fontSize)
          const lineH = config.bubbleLeft.fontSize * config.bubbleLeft.lineHeight
          const textBlockWidth = Math.max(
            ...lines.map((l) => measureTextWidth(l, tempCtx, otLeft, config.bubbleLeft.fontSize)),
          )
          const bubbleW = textBlockWidth + config.bubbleLeft.paddingLeft + config.bubbleLeft.paddingRight
          const bubbleH = lines.length * lineH + config.bubbleLeft.paddingTop + config.bubbleLeft.paddingBottom

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
      } else {
        // 선생님
        for (let bi = 0; bi < msg.text.length; bi++) {
          if (bi > 0) cursorY += config.chat.messageGap
          const maxBubbleWidth = chatAreaWidth * config.bubbleRight.maxWidthRatio
          const maxTextWidth = maxBubbleWidth - config.bubbleRight.paddingLeft - config.bubbleRight.paddingRight
          tempCtx.font = `${config.bubbleRight.fontSize}px ${bubbleRightFont}`
          const otRight = resolveOpentypeFont(bubbleRightFont)
          const lines = wrapText(tempCtx, msg.text[bi], maxTextWidth, otRight, config.bubbleRight.fontSize)
          const lineH = config.bubbleRight.fontSize * config.bubbleRight.lineHeight
          const textBlockWidth = Math.max(
            ...lines.map((l) => measureTextWidth(l, tempCtx, otRight, config.bubbleRight.fontSize)),
          )
          const bubbleW = textBlockWidth + config.bubbleRight.paddingLeft + config.bubbleRight.paddingRight
          const bubbleH = lines.length * lineH + config.bubbleRight.paddingTop + config.bubbleRight.paddingBottom
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
      }
    }

    const finalSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
${fontStyles}
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
