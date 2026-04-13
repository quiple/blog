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
 * URL에서 Image를 로드
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
    if (paragraph === '') {
      lines.push('')
      continue
    }
    let currentLine = ''
    // 한 글자씩 처리 (한국어에는 공백 기반 단어 분리가 적합하지 않음)
    for (let i = 0; i < paragraph.length; i++) {
      const char = paragraph[i]
      const testLine = currentLine + char
      const metrics = ctx.measureText(testLine)
      if (metrics.width > maxWidth && currentLine.length > 0) {
        lines.push(currentLine)
        currentLine = char
      } else {
        currentLine = testLine
      }
    }
    if (currentLine) {
      lines.push(currentLine)
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
  paddingY: number,
): number {
  const lines = wrapText(ctx, text, maxTextWidth)
  const textHeight = lines.length * fontSize * lineHeight
  return textHeight + paddingY * 2
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
      totalHeight += config.name.fontSize + config.name.marginBottom

      const maxBubbleWidth = chatAreaWidth * config.bubbleLeft.maxWidthRatio
      const maxTextWidth = maxBubbleWidth - config.bubbleLeft.paddingX * 2
      tempCtx.font = `${config.bubbleLeft.fontWeight} ${config.bubbleLeft.fontSize}px ${config.bubbleLeft.font}`

      for (let bi = 0; bi < msg.text.length; bi++) {
        if (bi > 0) totalHeight += config.chat.messageGap
        totalHeight += measureBubbleHeight(
          tempCtx,
          msg.text[bi],
          maxTextWidth,
          config.bubbleLeft.fontSize,
          config.bubbleLeft.lineHeight,
          config.bubbleLeft.paddingY,
        )
      }
    } else {
      const maxBubbleWidth = chatAreaWidth * config.bubbleRight.maxWidthRatio
      const maxTextWidth = maxBubbleWidth - config.bubbleRight.paddingX * 2
      tempCtx.font = `${config.bubbleRight.fontWeight} ${config.bubbleRight.fontSize}px ${config.bubbleRight.font}`

      for (let bi = 0; bi < msg.text.length; bi++) {
        if (bi > 0) totalHeight += config.chat.messageGap
        totalHeight += measureBubbleHeight(
          tempCtx,
          msg.text[bi],
          maxTextWidth,
          config.bubbleRight.fontSize,
          config.bubbleRight.lineHeight,
          config.bubbleRight.paddingY,
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
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 배경
  ctx.fillStyle = config.backgroundColor
  ctx.fillRect(0, 0, canvas.width, canvas.height)

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
  ctx.fillRect(0, 0, canvas.width, config.header.height)

  // 헤더 내용
  if (themeName === 'momotalk') {
    try {
      const momotalkLogo = await getIcon('momotalk', config.header.logoSize)
      const titleText = 'MomoTalk'
      ctx.font = `${config.header.titleFontSize}px ${config.header.titleFont}`
      const titleWidth = ctx.measureText(titleText).width
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
      ctx.textBaseline = 'middle'
      ctx.fillText(
        titleText,
        startX + config.header.logoSize + config.header.logoGap,
        centerY + config.header.titleOffsetY,
      )

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
      ctx.fillText('MomoTalk', config.header.paddingLeft, config.header.height / 2 + config.header.titleOffsetY)
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
    ctx.fillText(titleMap[themeName], canvas.width / 2, config.header.height / 2 + config.header.titleOffsetY)
    ctx.textAlign = 'start'
  }

  // ── 사이드바 (MomoTalk 전용) ──
  if (config.sidebar.width > 0) {
    ctx.fillStyle = config.sidebar.backgroundColor
    ctx.fillRect(0, config.header.height, config.sidebar.width, canvas.height - config.header.height)

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
  const chatRight = canvas.width - config.chat.paddingRight
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
          ctx.drawImage(profileImg, profileX, profileY, config.profile.size, config.profile.size)
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
      ctx.fillStyle = config.name.color
      ctx.font = `${config.name.fontWeight} ${config.name.fontSize}px ${config.name.font}`
      ctx.textBaseline = 'top'
      ctx.fillText(msg.studentName, nameX, cursorY)
      cursorY += config.name.fontSize + config.name.marginBottom

      // 말풍선들
      const bubbleStartX = nameX
      for (let bi = 0; bi < msg.text.length; bi++) {
        if (bi > 0) cursorY += config.chat.messageGap

        const maxBubbleWidth = chatAreaWidth * config.bubbleLeft.maxWidthRatio
        const maxTextWidth = maxBubbleWidth - config.bubbleLeft.paddingX * 2

        ctx.font = `${config.bubbleLeft.fontWeight} ${config.bubbleLeft.fontSize}px ${config.bubbleLeft.font}`
        const lines = wrapText(ctx, msg.text[bi], maxTextWidth)
        const lineH = config.bubbleLeft.fontSize * config.bubbleLeft.lineHeight
        const textBlockHeight = lines.length * lineH
        const textBlockWidth = Math.max(...lines.map((l) => ctx.measureText(l).width))
        const bubbleW = textBlockWidth + config.bubbleLeft.paddingX * 2
        const bubbleH = textBlockHeight + config.bubbleLeft.paddingY * 2

        ctx.fillStyle = config.bubbleLeft.backgroundColor
        roundRect(ctx, bubbleStartX, cursorY, bubbleW, bubbleH, config.bubbleLeft.borderRadius)
        ctx.fill()

        ctx.fillStyle = config.bubbleLeft.textColor
        ctx.font = `${config.bubbleLeft.fontWeight} ${config.bubbleLeft.fontSize}px ${config.bubbleLeft.font}`
        ctx.textBaseline = 'top'
        for (let li = 0; li < lines.length; li++) {
          ctx.fillText(
            lines[li],
            bubbleStartX + config.bubbleLeft.paddingX,
            cursorY + config.bubbleLeft.paddingY + li * lineH,
          )
        }

        cursorY += bubbleH
      }
    } else {
      // ── 선생님 메시지 (오른쪽) ──
      for (let bi = 0; bi < msg.text.length; bi++) {
        if (bi > 0) cursorY += config.chat.messageGap

        const maxBubbleWidth = chatAreaWidth * config.bubbleRight.maxWidthRatio
        const maxTextWidth = maxBubbleWidth - config.bubbleRight.paddingX * 2

        ctx.font = `${config.bubbleRight.fontWeight} ${config.bubbleRight.fontSize}px ${config.bubbleRight.font}`
        const lines = wrapText(ctx, msg.text[bi], maxTextWidth)
        const lineH = config.bubbleRight.fontSize * config.bubbleRight.lineHeight
        const textBlockHeight = lines.length * lineH
        const textBlockWidth = Math.max(...lines.map((l) => ctx.measureText(l).width))
        const bubbleW = textBlockWidth + config.bubbleRight.paddingX * 2
        const bubbleH = textBlockHeight + config.bubbleRight.paddingY * 2

        const bubbleX = chatRight - bubbleW - config.bubbleRight.marginRight

        ctx.fillStyle = config.bubbleRight.backgroundColor
        roundRect(ctx, bubbleX, cursorY, bubbleW, bubbleH, config.bubbleRight.borderRadius)
        ctx.fill()

        ctx.fillStyle = config.bubbleRight.textColor
        ctx.font = `${config.bubbleRight.fontWeight} ${config.bubbleRight.fontSize}px ${config.bubbleRight.font}`
        ctx.textBaseline = 'top'
        for (let li = 0; li < lines.length; li++) {
          ctx.fillText(
            lines[li],
            bubbleX + config.bubbleRight.paddingX,
            cursorY + config.bubbleRight.paddingY + li * lineH,
          )
        }

        cursorY += bubbleH
      }
    }
  }
}

/**
 * PNG로 내보내기
 * density > 1이면 원본 캔버스를 기반으로 고해상도 이미지를 생성
 */
export async function exportAsPng(
  canvas: HTMLCanvasElement,
  density: number,
  messages: MessageItem[],
  themeName: ThemeName,
  _lang: Language,
): Promise<void> {
  if (density <= 1) {
    const link = document.createElement('a')
    link.download = 'message.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
    return
  }

  // 고밀도 내보내기: 새 캔버스에 density 배율로 다시 렌더링
  const config = themes[themeName]
  const height = calculateCanvasHeight(messages, config)

  const hiDpiCanvas = document.createElement('canvas')
  hiDpiCanvas.width = config.canvasWidth * density
  hiDpiCanvas.height = height * density
  const hiCtx = hiDpiCanvas.getContext('2d')!
  hiCtx.scale(density, density)

  // 원본 캔버스의 렌더링 결과를 재사용 (이미 렌더링된 이미지를 스케일)
  hiCtx.drawImage(canvas, 0, 0, config.canvasWidth, height)

  const link = document.createElement('a')
  link.download = `message@${density}x.png`
  link.href = hiDpiCanvas.toDataURL('image/png')
  link.click()
}

/**
 * SVG로 내보내기 (캔버스 내용을 SVG 내 embedded image로 감싸기)
 */
export function exportAsSvg(canvas: HTMLCanvasElement): void {
  const dataUrl = canvas.toDataURL('image/png')
  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">
  <image width="${canvas.width}" height="${canvas.height}" xlink:href="${dataUrl}"/>
</svg>`
  const blob = new Blob([svgContent], {type: 'image/svg+xml'})
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = 'message.svg'
  link.href = url
  link.click()
  URL.revokeObjectURL(url)
}
