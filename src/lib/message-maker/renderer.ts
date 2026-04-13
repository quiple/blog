import opentype from 'opentype.js'
import type {Language, ThemeConfig, ThemeName} from './configs'
import {themes} from './configs'

/** Jalnan2 폰트 로드 상태 */
let jalnan2Loaded = false
/** GyeonggiTitle 폰트 로드 상태 */
let gyeonggiLoaded = false

/**
 * Jalnan2 폰트를 FontFace API로 등록 (lazy load)
 */
async function ensureJalnan2Font(): Promise<void> {
  if (jalnan2Loaded) return
  if (typeof document === 'undefined') return

  for (const face of document.fonts) {
    if (face.family === 'Jalnan2') {
      jalnan2Loaded = true
      return
    }
  }

  const {default: fontDataUrl} = await import('./font-data')
  const font = new FontFace('Jalnan2', `url(${fontDataUrl})`)
  await font.load()
  document.fonts.add(font)
  jalnan2Loaded = true
}

/**
 * GyeonggiTitle 폰트를 FontFace API로 등록 (lazy load)
 */
async function ensureGyeonggiFont(): Promise<void> {
  if (gyeonggiLoaded) return
  if (typeof document === 'undefined') return

  for (const face of document.fonts) {
    if (face.family === 'GyeonggiTitle') {
      gyeonggiLoaded = true
      return
    }
  }

  const {default: fontDataUrl} = await import('./font-data-gyeonggi')
  const font = new FontFace('GyeonggiTitle', `url(${fontDataUrl})`)
  await font.load()
  document.fonts.add(font)
  gyeonggiLoaded = true
}

export interface MessageItem {
  /** 'student' = 왼쪽(학생), 'sensei' = 오른쪽(선생) */
  type: 'student' | 'sensei'
  /** 학생 이름 (type === 'student' 일 때만 사용) */
  studentName: string
  /** 프로필 사진 URL (type === 'student' 일 때만 사용) */
  portrait: string
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

async function getImageAsDataUrl(url: string): Promise<string> {
  const img = await getCachedImage(url)
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return url
  ctx.drawImage(img, 0, 0)
  return canvas.toDataURL('image/png')
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

/**
 * 텍스트를 maxWidth에 맞게 줄바꿈하여 줄 배열을 반환
 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  // 먼저 명시적 줄바꿈 분리
  const paragraphs = text.split('\n')
  for (const paragraph of paragraphs) {
    if (paragraph.trim() === '') {
      lines.push('')
      continue
    }
    let currentLine = ''
    // 한 글자씩 처리 (한국어에는 공백 기반 단어 분리가 적합하지 않음)
    for (let i = 0; i < paragraph.length; i++) {
      const char = paragraph[i]

      // 줄의 시작 부분에 나오는 공백은 포함하지 않음
      if (currentLine.length === 0 && char.trim() === '') {
        continue
      }

      const testLine = currentLine + char
      const metrics = ctx.measureText(testLine)

      if (metrics.width > maxWidth && currentLine.length > 0) {
        // 최대 너비를 초과하면 현재까지의 문자열을 한 줄로 확정 (우측 공백 제거)
        lines.push(currentLine.trimEnd())
        // 현재 문자가 공백이면 다음 줄도 공백으로 시작하지 않게 빈 문자열 처리
        currentLine = char.trim() === '' ? '' : char
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

/** SVG 아이콘들을 미리 캐시 */
const iconCache = new Map<string, HTMLImageElement>()

async function getIcon(name: string, size: number): Promise<HTMLImageElement> {
  const key = `${name}-${size}`
  if (iconCache.has(key)) return iconCache.get(key)!

  const modules = import.meta.glob('$lib/assets/message-maker/*.svg', {eager: true, query: '?raw', import: 'default'})
  const path = `/src/lib/assets/message-maker/${name}.svg`
  const svgText = modules[path] as string
  if (!svgText) {
    throw new Error(`SVG icon not found: ${name}`)
  }
  const img = await loadSvgAsImage(svgText, size, size)
  iconCache.set(key, img)
  return img
}

/** 이미지 캐시 */
const imageCache = new Map<string, HTMLImageElement>()

async function getCachedImage(url: string): Promise<HTMLImageElement> {
  if (imageCache.has(url)) return imageCache.get(url)!
  const img = await loadImage(url)
  imageCache.set(url, img)
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
): number {
  const lines = wrapText(ctx, text, maxTextWidth)
  const textHeight = lines.length * fontSize * lineHeight
  return textHeight + paddingTop + paddingBottom
}

/**
 * 캔버스 높이를 계산
 */
export function calculateCanvasHeight(messages: MessageItem[], config: ThemeConfig): number {
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = config.canvasWidth
  tempCanvas.height = 100
  const tempCtx = tempCanvas.getContext('2d')!

  const chatAreaWidth = config.canvasWidth - config.sidebar.width - config.chat.paddingLeft - config.chat.paddingRight

  let totalHeight = config.header.height + config.chat.paddingTop

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    if (i > 0) totalHeight += config.chat.groupGap

    if (msg.type === 'student') {
      // 이름 높이
      totalHeight += config.name.marginTop + config.name.fontSize + config.name.marginBottom

      const maxBubbleWidth = chatAreaWidth * config.bubbleLeft.maxWidthRatio
      const maxTextWidth = maxBubbleWidth - config.bubbleLeft.paddingLeft - config.bubbleLeft.paddingRight
      tempCtx.font = `${config.bubbleLeft.fontWeight} ${config.bubbleLeft.fontSize}px ${config.bubbleLeft.font}`

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
        )
      }
    } else {
      const maxBubbleWidth = chatAreaWidth * config.bubbleRight.maxWidthRatio
      const maxTextWidth = maxBubbleWidth - config.bubbleRight.paddingLeft - config.bubbleRight.paddingRight
      tempCtx.font = `${config.bubbleRight.fontWeight} ${config.bubbleRight.fontSize}px ${config.bubbleRight.font}`

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
        )
      }
    }
  }

  totalHeight += config.chat.paddingBottom
  return Math.max(totalHeight, config.header.height + 100)
}

/**
 * 메인 렌더링 함수
 */
export async function renderCanvas(
  canvas: HTMLCanvasElement,
  messages: MessageItem[],
  themeName: ThemeName,
  _lang: Language,
): Promise<void> {
  const config = themes[themeName]

  // 폰트 준비
  if (themeName === 'momotalk') {
    await Promise.all([ensureJalnan2Font(), ensureGyeonggiFont()])
  }

  const height = calculateCanvasHeight(messages, config)

  canvas.width = config.canvasWidth
  canvas.height = height

  const ctx = canvas.getContext('2d')!
  await renderToContext(ctx, messages, themeName, 1)
}

/**
 * 특정 컨텍스트에 렌더링 (배율 지원)
 */
async function renderToContext(
  ctx: CanvasRenderingContext2D,
  messages: MessageItem[],
  themeName: ThemeName,
  scale: number,
): Promise<void> {
  const config = themes[themeName]
  const width = config.canvasWidth
  const height = calculateCanvasHeight(messages, config)

  ctx.save()
  if (scale !== 1) {
    ctx.scale(scale, scale)
  }

  ctx.clearRect(0, 0, width, height)

  // 배경
  ctx.fillStyle = config.backgroundColor
  ctx.fillRect(0, 0, width, height)

  // ── 헤더 ──
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

  // 헤더 내용
  if (themeName === 'momotalk') {
    try {
      const momotalkLogo = await getIcon('momotalk', config.header.logoSize)
      const titleText = 'MomoTalk'
      ctx.font = `${config.header.titleFontSize}px ${config.header.titleFont}`
      const titleWidth = ctx.measureText(titleText).width * config.header.titleScaleX
      const startX = config.header.paddingLeft
      const centerY = config.header.height / 2

      ctx.drawImage(
        momotalkLogo,
        startX,
        centerY - config.header.logoSize / 2 + config.header.logoOffsetY,
        config.header.logoSize,
        config.header.logoSize,
      )

      ctx.fillStyle = config.header.titleColor
      ctx.font = `${config.header.titleFontSize}px ${config.header.titleFont}`
      const titleX = startX + config.header.logoSize + config.header.logoGap
      ctx.save()
      ctx.scale(config.header.titleScaleX, 1)
      ctx.fillText(titleText, titleX / config.header.titleScaleX, centerY + config.header.titleOffsetY)
      ctx.restore()

      if (config.header.helpIconSize > 0) {
        const helpIcon = await getIcon('help', config.header.helpIconSize)
        ctx.drawImage(
          helpIcon,
          startX + config.header.logoSize + config.header.logoGap + titleWidth + 12,
          centerY - config.header.helpIconSize / 2 + config.header.helpIconOffsetY,
          config.header.helpIconSize,
          config.header.helpIconSize,
        )
      }
    } catch {
      ctx.fillStyle = config.header.titleColor
      ctx.font = `${config.header.titleFontSize}px ${config.header.titleFont}`
      ctx.textBaseline = 'middle'
      ctx.save()
      ctx.scale(config.header.titleScaleX, 1)
      ctx.fillText(
        'MomoTalk',
        config.header.paddingLeft / config.header.titleScaleX,
        config.header.height / 2 + config.header.titleOffsetY,
      )
      ctx.restore()
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
        const chatX = sidebarCenterX - config.sidebar.chatIconSize / 2
        ctx.drawImage(chatIcon, chatX, sidebarY, config.sidebar.chatIconSize, config.sidebar.chatIconSize)

        if (config.sidebar.badgeSize > 0) {
          const badgeX = chatX + config.sidebar.chatIconSize - 4
          const badgeY = sidebarY - 2
          ctx.fillStyle = config.sidebar.badgeColor
          ctx.beginPath()
          ctx.arc(badgeX, badgeY + config.sidebar.badgeSize / 2, config.sidebar.badgeSize / 2, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = config.sidebar.badgeTextColor
          ctx.font = `bold ${config.sidebar.badgeFontSize}px ${config.sidebar.badgeFont}`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('1', badgeX, badgeY + config.sidebar.badgeSize / 2)
          ctx.textAlign = 'start'
        }
      } catch {
        // fallback
      }
    }
  }

  // ── 대화 영역 ──
  const chatLeft = config.sidebar.width + config.chat.paddingLeft
  const chatRight = width - config.chat.paddingRight
  const chatAreaWidth = chatRight - chatLeft

  let cursorY = config.header.height + config.chat.paddingTop

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    if (i > 0) cursorY += config.chat.groupGap

    if (msg.type === 'student') {
      // ── 학생 메시지 (왼쪽) ──
      const profileX = chatLeft
      const profileY = cursorY

      // 프로필 이미지
      if (config.profile.size > 0 && msg.portrait) {
        try {
          const profileImg = await getCachedImage(msg.portrait)
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
      ctx.fillStyle = config.name.color
      ctx.font = `${config.name.fontWeight} ${config.name.fontSize}px ${config.name.font}`
      ctx.textBaseline = 'top'
      ctx.fillText(msg.studentName, nameX, nameY)
      cursorY += config.name.marginTop + config.name.fontSize + config.name.marginBottom

      // 말풍선들
      const profileSize = config.profile.size > 0 ? config.profile.size : 0
      const bubbleStartX = profileX + profileSize + config.bubbleLeft.marginLeft
      for (let bi = 0; bi < msg.text.length; bi++) {
        if (bi > 0) cursorY += config.chat.messageGap

        const maxBubbleWidth = chatAreaWidth * config.bubbleLeft.maxWidthRatio
        const maxTextWidth = maxBubbleWidth - config.bubbleLeft.paddingLeft - config.bubbleLeft.paddingRight

        ctx.font = `${config.bubbleLeft.fontWeight} ${config.bubbleLeft.fontSize}px ${config.bubbleLeft.font}`
        const lines = wrapText(ctx, msg.text[bi], maxTextWidth)
        const lineH = config.bubbleLeft.fontSize * config.bubbleLeft.lineHeight
        const textBlockHeight = lines.length * lineH
        const textBlockWidth = Math.max(...lines.map((l) => ctx.measureText(l).width))
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
          ctx.lineTo(bubbleStartX - config.bubbleLeft.tailWidth, tailY + config.bubbleLeft.tailHeight / 2)
          ctx.lineTo(bubbleStartX, tailY + config.bubbleLeft.tailHeight)
          ctx.fill()
        }

        ctx.fillStyle = config.bubbleLeft.textColor
        ctx.font = `${config.bubbleLeft.fontWeight} ${config.bubbleLeft.fontSize}px ${config.bubbleLeft.font}`
        ctx.textBaseline = 'top'
        for (let li = 0; li < lines.length; li++) {
          ctx.fillText(
            lines[li],
            bubbleStartX + config.bubbleLeft.paddingLeft,
            cursorY + config.bubbleLeft.paddingTop + li * lineH,
          )
        }

        cursorY += bubbleH
      }
    } else {
      // ── 선생님 메시지 (오른쪽) ──
      for (let bi = 0; bi < msg.text.length; bi++) {
        if (bi > 0) cursorY += config.chat.messageGap

        const maxBubbleWidth = chatAreaWidth * config.bubbleRight.maxWidthRatio
        const maxTextWidth = maxBubbleWidth - config.bubbleRight.paddingLeft - config.bubbleRight.paddingRight

        ctx.font = `${config.bubbleRight.fontWeight} ${config.bubbleRight.fontSize}px ${config.bubbleRight.font}`
        const lines = wrapText(ctx, msg.text[bi], maxTextWidth)
        const lineH = config.bubbleRight.fontSize * config.bubbleRight.lineHeight
        const textBlockHeight = lines.length * lineH
        const textBlockWidth = Math.max(...lines.map((l) => ctx.measureText(l).width))
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
          ctx.lineTo(bubbleX + bubbleW + config.bubbleRight.tailWidth, tailY + config.bubbleRight.tailHeight / 2)
          ctx.lineTo(bubbleX + bubbleW, tailY + config.bubbleRight.tailHeight)
          ctx.fill()
        }

        ctx.fillStyle = config.bubbleRight.textColor
        ctx.font = `${config.bubbleRight.fontWeight} ${config.bubbleRight.fontSize}px ${config.bubbleRight.font}`
        ctx.textBaseline = 'top'
        for (let li = 0; li < lines.length; li++) {
          ctx.fillText(
            lines[li],
            bubbleX + config.bubbleRight.paddingLeft,
            cursorY + config.bubbleRight.paddingTop + li * lineH,
          )
        }

        cursorY += bubbleH
      }
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
  _lang: Language,
): Promise<void> {
  const config = themes[themeName]
  const height = calculateCanvasHeight(messages, config)
  const width = config.canvasWidth

  const hiDpiCanvas = document.createElement('canvas')
  hiDpiCanvas.width = width * density
  hiDpiCanvas.height = height * density
  const hiCtx = hiDpiCanvas.getContext('2d', {alpha: false})!

  // 고밀도 렌더링
  await renderToContext(hiCtx, messages, themeName, density)

  const dataUrl = hiDpiCanvas.toDataURL('image/png')
  const link = document.createElement('a')
  link.download = `message_${themeName}_${density}x.png`
  link.href = dataUrl
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
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
 * 전역 SVG 아이콘 텍스트 캐시 (원시 SVG 코드)
 */
const svgSourceCache = new Map<string, string>()

async function getSvgSource(name: string): Promise<string> {
  if (svgSourceCache.has(name)) return svgSourceCache.get(name)!

  const modules = import.meta.glob('$lib/assets/message-maker/*.svg', {eager: true, query: '?raw', import: 'default'})
  const path = `/src/lib/assets/message-maker/${name}.svg`
  const svgText = modules[path] as string
  if (!svgText) throw new Error(`SVG source not found: ${name}`)

  svgSourceCache.set(name, svgText)
  return svgText
}

const opentypeCache = new Map<string, opentype.Font>()

function dataUrlToArrayBuffer(dataUrl: string): ArrayBuffer {
  const base64 = dataUrl.split(',')[1]
  const binaryString = window.atob(base64)
  const len = binaryString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

async function loadOpentypeFont(familyName: string, modulePromise: Promise<{default: string}>): Promise<opentype.Font> {
  if (opentypeCache.has(familyName)) {
    return opentypeCache.get(familyName)!
  }
  const {default: dataUrl} = await modulePromise
  const buffer = dataUrlToArrayBuffer(dataUrl)
  const font = opentype.parse(buffer)
  opentypeCache.set(familyName, font)
  return font
}

/**
 * 캔버스 로직을 미러링하여 실제 벡터 SVG 문자열 생성
 */
export async function exportAsVectorSvg(messages: MessageItem[], themeName: ThemeName): Promise<void> {
  const config = themes[themeName]
  const height = calculateCanvasHeight(messages, config)
  const width = config.canvasWidth

  let jalnanFont: opentype.Font | undefined
  let gyeonggiFont: opentype.Font | undefined

  // 폰트 데이터 가져오기 (인라인 포함)
  let fontStyles = ''
  if (themeName === 'momotalk') {
    const jalnanPromise = import('./font-data')
    const gyeonggiPromise = import('./font-data-gyeonggi')

    jalnanFont = await loadOpentypeFont('Jalnan2', jalnanPromise)
    gyeonggiFont = await loadOpentypeFont('GyeonggiTitle', gyeonggiPromise)

    const jalnan2 = (await jalnanPromise).default
    const gyeonggi = (await gyeonggiPromise).default
    fontStyles = `
  <style>
    @font-face {
      font-family: 'Jalnan2';
      src: url('${jalnan2}') format('opentype');
    }
    @font-face {
      font-family: 'GyeonggiTitle';
      src: url('${gyeonggi}') format('opentype');
    }
  </style>`
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
    else if (fontFamily.includes('GyeonggiTitle')) font = gyeonggiFont

    if (font) {
      let drawX = x
      if (align === 'center' || align === 'middle') {
        const w = font.getAdvanceWidth(text, fontSize)
        drawX -= (w / 2) * scaleX
      }

      let drawY = y
      if (baseline === 'hanging' || baseline === 'top') {
        drawY += (font.ascender / font.unitsPerEm) * fontSize
      } else if (baseline === 'middle') {
        drawY += (font.ascender / font.unitsPerEm) * fontSize - fontSize / 2
      }

      const path = font.getPath(text, 0, 0, fontSize)
      path.fill = color
      const svgPath = path.toSVG(2)

      if (scaleX !== 1.0) {
        return svgPath.replace('<path ', `<path transform="translate(${drawX}, ${drawY}) scale(${scaleX}, 1)" `)
      } else {
        return svgPath.replace('<path ', `<path transform="translate(${drawX}, ${drawY})" `)
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
  <rect width="${width}" height="${config.header.height}" fill="url(#headerGrad)" />`)
  } else {
    svgParts.push(`<rect width="${width}" height="${config.header.height}" fill="${config.header.backgroundColor}" />`)
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
      // 대략적인 텍스트 너비 (Canvas API 빌려씀)
      const tempCanvas = document.createElement('canvas')
      const tempCtx = tempCanvas.getContext('2d')!
      tempCtx.font = `${config.header.titleFontSize}px ${config.header.titleFont}`
      const titleWidth = tempCtx.measureText('MomoTalk').width * (config.header.titleScaleX || 1.0)

      svgParts.push(
        `<image x="${titleX + titleWidth + 12}" y="${centerY - config.header.helpIconSize / 2 + config.header.helpIconOffsetY}" width="${config.header.helpIconSize}" height="${config.header.helpIconSize}" href="${helpB64}" />`,
      )
    }
  }

  // 사이드바
  if (config.sidebar.width > 0) {
    svgParts.push(
      `<rect x="0" y="${config.header.height}" width="${config.sidebar.width}" height="${height - config.header.height}" fill="${config.sidebar.sidebarBackgroundColor || config.sidebar.backgroundColor}" />`,
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

      if (config.sidebar.badgeSize > 0) {
        const badgeX = chatX + config.sidebar.chatIconSize - 4
        const badgeY = sidebarY - 2 + config.sidebar.badgeSize / 2
        svgParts.push(
          `<circle cx="${badgeX}" cy="${badgeY}" r="${config.sidebar.badgeSize / 2}" fill="${config.sidebar.badgeColor}" />`,
        )
        svgParts.push(
          renderSvgText(
            '1',
            badgeX,
            badgeY,
            config.sidebar.badgeFont,
            config.sidebar.badgeFontSize,
            config.sidebar.badgeTextColor,
            'middle',
            'middle',
            'bold',
          ),
        )
      }
    }
  }

  // 대화 영역
  const chatLeft = config.sidebar.width + config.chat.paddingLeft
  const chatRight = width - config.chat.paddingRight
  const chatAreaWidth = chatRight - chatLeft
  let cursorY = config.header.height + config.chat.paddingTop

  const tempCanvas = document.createElement('canvas')
  const tempCtx = tempCanvas.getContext('2d')!

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    if (i > 0) cursorY += config.chat.groupGap

    if (msg.type === 'student') {
      const profileX = chatLeft
      if (config.profile.size > 0 && msg.portrait) {
        const zoom = config.profile.zoom || 1.0
        const size = config.profile.size
        const portraitDataUrl = await getImageAsDataUrl(msg.portrait)
        if (config.profile.circular) {
          svgParts.push(`
  <clipPath id="circleView${i}">
    <circle cx="${profileX + size / 2}" cy="${cursorY + size / 2}" r="${size / 2}" />
  </clipPath>
  <g clip-path="url(#circleView${i})">
    <image x="${profileX - (size * (zoom - 1)) / 2}" y="${cursorY - (size * (zoom - 1)) / 2}" width="${size * zoom}" height="${size * zoom}" href="${portraitDataUrl}" preserveAspectRatio="xMidYMid slice" />
  </g>`)
        } else {
          svgParts.push(`<rect x="${profileX}" y="${cursorY}" width="${size}" height="${size}" rx="12" fill="#ddd" />`)
          svgParts.push(
            `<image x="${profileX - (size * (zoom - 1)) / 2}" y="${cursorY - (size * (zoom - 1)) / 2}" width="${size * zoom}" height="${size * zoom}" href="${portraitDataUrl}" preserveAspectRatio="xMidYMid slice" />`,
          )
        }
      }

      const nameX = profileX + (config.profile.size > 0 ? config.profile.size : 0) + config.name.marginLeft
      const nameY = cursorY + config.name.marginTop
      svgParts.push(
        renderSvgText(
          msg.studentName,
          nameX,
          nameY,
          config.name.font,
          config.name.fontSize,
          config.name.color,
          'start',
          'hanging',
          config.name.fontWeight,
        ),
      )
      cursorY += config.name.marginTop + config.name.fontSize + config.name.marginBottom

      const profileSize = config.profile.size > 0 ? config.profile.size : 0
      const bubbleStartX = profileX + profileSize + config.bubbleLeft.marginLeft

      for (let bi = 0; bi < msg.text.length; bi++) {
        if (bi > 0) cursorY += config.chat.messageGap
        const maxBubbleWidth = chatAreaWidth * config.bubbleLeft.maxWidthRatio
        const maxTextWidth = maxBubbleWidth - config.bubbleLeft.paddingLeft - config.bubbleLeft.paddingRight
        tempCtx.font = `${config.bubbleLeft.fontWeight} ${config.bubbleLeft.fontSize}px ${config.bubbleLeft.font}`
        const lines = wrapText(tempCtx, msg.text[bi], maxTextWidth)
        const lineH = config.bubbleLeft.fontSize * config.bubbleLeft.lineHeight
        const textBlockWidth = Math.max(...lines.map((l) => tempCtx.measureText(l).width))
        const bubbleW = textBlockWidth + config.bubbleLeft.paddingLeft + config.bubbleLeft.paddingRight
        const bubbleH = lines.length * lineH + config.bubbleLeft.paddingTop + config.bubbleLeft.paddingBottom

        svgParts.push(
          `<rect x="${bubbleStartX}" y="${cursorY}" width="${bubbleW}" height="${bubbleH}" rx="${config.bubbleLeft.borderRadius}" fill="${config.bubbleLeft.backgroundColor}" />`,
        )
        if (bi === 0 && config.bubbleLeft.tailWidth > 0) {
          const tailY = cursorY + config.bubbleLeft.tailOffsetY
          svgParts.push(
            `<path d="M${bubbleStartX},${tailY} L${bubbleStartX - config.bubbleLeft.tailWidth},${tailY + config.bubbleLeft.tailHeight / 2} L${bubbleStartX},${tailY + config.bubbleLeft.tailHeight} Z" fill="${config.bubbleLeft.backgroundColor}" />`,
          )
        }
        for (let li = 0; li < lines.length; li++) {
          const textY = cursorY + config.bubbleLeft.paddingTop + li * lineH
          svgParts.push(
            renderSvgText(
              lines[li],
              bubbleStartX + config.bubbleLeft.paddingLeft,
              textY,
              config.bubbleLeft.font,
              config.bubbleLeft.fontSize,
              config.bubbleLeft.textColor,
              'start',
              'hanging',
              config.bubbleLeft.fontWeight,
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
        tempCtx.font = `${config.bubbleRight.fontWeight} ${config.bubbleRight.fontSize}px ${config.bubbleRight.font}`
        const lines = wrapText(tempCtx, msg.text[bi], maxTextWidth)
        const lineH = config.bubbleRight.fontSize * config.bubbleRight.lineHeight
        const textBlockWidth = Math.max(...lines.map((l) => tempCtx.measureText(l).width))
        const bubbleW = textBlockWidth + config.bubbleRight.paddingLeft + config.bubbleRight.paddingRight
        const bubbleH = lines.length * lineH + config.bubbleRight.paddingTop + config.bubbleRight.paddingBottom
        const bubbleX = chatRight - bubbleW - config.bubbleRight.marginRight

        svgParts.push(
          `<rect x="${bubbleX}" y="${cursorY}" width="${bubbleW}" height="${bubbleH}" rx="${config.bubbleRight.borderRadius}" fill="${config.bubbleRight.backgroundColor}" />`,
        )
        if (bi === 0 && config.bubbleRight.tailWidth > 0) {
          const tailY = cursorY + config.bubbleRight.tailOffsetY
          svgParts.push(
            `<path d="M${bubbleX + bubbleW},${tailY} L${bubbleX + bubbleW + config.bubbleRight.tailWidth},${tailY + config.bubbleRight.tailHeight / 2} L${bubbleX + bubbleW},${tailY + config.bubbleRight.tailHeight} Z" fill="${config.bubbleRight.backgroundColor}" />`,
          )
        }
        for (let li = 0; li < lines.length; li++) {
          const textY = cursorY + config.bubbleRight.paddingTop + li * lineH
          svgParts.push(
            renderSvgText(
              lines[li],
              bubbleX + config.bubbleRight.paddingLeft,
              textY,
              config.bubbleRight.font,
              config.bubbleRight.fontSize,
              config.bubbleRight.textColor,
              'start',
              'hanging',
              config.bubbleRight.fontWeight,
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
}
