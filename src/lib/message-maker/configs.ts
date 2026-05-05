export type Language = 'ko' | 'en' | 'ja'
export type LocalizedNumber = number | Partial<Record<Language, number>>
export type LocalizedFont = string | Partial<Record<Language, string>>

export interface RawThemeConfig {
  /** 캔버스 너비 (px) */
  canvasWidth: number

  /** 배경색 */
  backgroundColor: string

  /** 헤더 */
  header: {
    height: number
    backgroundColor: string
    /** 그라데이션 배경 (설정 시 backgroundColor 대신 사용) */
    backgroundGradient?: string
    titleColor: string
    titleFont: LocalizedFont
    titleFontSize: number
    /** 제목 글자 장평 (가로 비율) */
    titleScaleX: number
    /** 로고 아이콘 크기 */
    logoSize: number
    /** 로고와 제목 사이 간격 */
    logoGap: number
    /** 헤더 좌측 패딩 */
    paddingLeft: number
    /** 물음표 아이콘 크기 */
    helpIconSize: number
    /** 제목과 물음표 아이콘 사이 간격 */
    helpIconGap: number
    /** 제목 y축 오프셋 */
    titleOffsetY: number
    /** 로고 y축 오프셋 */
    logoOffsetY: number
    /** 물음표 아이콘 y축 오프셋 */
    helpIconOffsetY: number
    /** 닫기 아이콘 크기 */
    closeIconSize: number
    /** 닫기 아이콘 x축 오프셋 (우측 끝 기준) */
    closeIconOffsetX: number
    /** 닫기 아이콘 y축 오프셋 */
    closeIconOffsetY: number
  }

  /** 왼쪽 사이드바 */
  sidebar: {
    width: number
    backgroundColor: string
    /** 학생 아이콘 크기 */
    studentIconSize: number
    /** 채팅 아이콘 크기 */
    chatIconSize: number
    /** 아이콘 간 세로 간격 */
    iconGap: number
    /** 사이드바 상단 패딩 */
    paddingTop: number
    /** 학생 아이콘 투명도 (0~1) */
    studentIconOpacity: number
    /** 활성화된 채팅 배경색 */
    activeChatBackgroundColor: string
    /** 활성화된 채팅 배경 y축 오프셋 */
    activeChatBackgroundOffsetY: number
    /** 활성화된 채팅 배경 높이 */
    activeChatBackgroundHeight: number
  }

  /** 대화 영역 */
  chat: {
    /** 대화 영역 좌측 패딩 (사이드바 이후) */
    paddingLeft: number
    /** 대화 영역 우측 패딩 */
    paddingRight: number
    /** 대화 영역 상단 패딩 */
    paddingTop: number
    /** 대화 영역 하단 패딩 */
    paddingBottom: number
    /** 대화 그룹 간 간격 (같은 학생의 연달은 메시지는 그룹) */
    groupGap: number
    /** 같은 그룹 내 메시지 간 간격 */
    messageGap: number
  }

  /** 프로필 이미지 */
  profile: {
    size: number
    /** 원형 클리핑 여부 */
    circular: boolean
    /** 테두리 두께 */
    borderWidth: number
    borderColor: string
    /** 확대 배율 (1.0 = 원본) */
    zoom: number
  }

  /** 이름 표시 */
  name: {
    font: LocalizedFont
    fontSize: LocalizedNumber
    color: string
    /** 이름과 메시지 사이 간격 */
    marginBottom: LocalizedNumber
    /** 이름 텍스트 위쪽 간격 */
    marginTop: LocalizedNumber
    /** 프로필 이미지와 이름 사이 가로 간격 */
    marginLeft: LocalizedNumber
  }

  /** 다른 사람(학생) 메시지 말풍선 */
  bubbleLeft: {
    backgroundColor: string
    textColor: string
    font: LocalizedFont
    fontSize: LocalizedNumber
    lineHeight: LocalizedNumber
    /** 말풍선 내부 여백 */
    paddingTop: LocalizedNumber
    paddingRight: LocalizedNumber
    paddingBottom: LocalizedNumber
    paddingLeft: LocalizedNumber
    /** 말풍선 모서리 반경 */
    borderRadius: number
    /** 말풍선 최대 너비 비율 (대화 영역 대비) */
    maxWidthRatio: number
    /** 프로필 이미지와 말풍선 사이 가로 간격 */
    marginLeft: number
    /** 삼각형 꼬리 너비 */
    tailWidth: number
    /** 삼각형 꼬리 높이 */
    tailHeight: number
    /** 삼각형 꼬리 세로 위치 오프셋 (말풍선 상단 기준) */
    tailOffsetY: number
    /** 삼각형 꼬리 끝부분 반경 */
    tailRadius: number
  }

  /** 내(선생님) 메시지 말풍선 */
  bubbleRight: {
    backgroundColor: string
    textColor: string
    font: LocalizedFont
    fontSize: LocalizedNumber
    lineHeight: LocalizedNumber
    paddingTop: LocalizedNumber
    paddingRight: LocalizedNumber
    paddingBottom: LocalizedNumber
    paddingLeft: LocalizedNumber
    borderRadius: number
    maxWidthRatio: number
    /** 우측 여백 */
    marginRight: number
    /** 삼각형 꼬리 너비 */
    tailWidth: number
    /** 삼각형 꼬리 높이 */
    tailHeight: number
    /** 삼각형 꼬리 세로 위치 오프셋 (말풍선 상단 기준) */
    tailOffsetY: number
    /** 삼각형 꼬리 끝부분 반경 */
    tailRadius: number
  }

  /** 인연 스토리 배너 (가운데 정렬) */
  bond: {
    backgroundColor: string
    borderColor: string
    textColor: string
    font: LocalizedFont
    fontSize: LocalizedNumber
    paddingTop: LocalizedNumber
    paddingRight: LocalizedNumber
    paddingBottom: LocalizedNumber
    paddingLeft: LocalizedNumber
    borderRadius: number
    /** 배너 최대 너비 비율 (대화 영역 대비) */
    maxWidthRatio: number
    /** 헤더 텍스트 폰트 크기 */
    headerFontSize: number
    /** 헤더 텍스트 색상 */
    headerColor: string
    /** 헤더 좌측 바 너비 */
    headerBarWidth: number
    /** 헤더 좌측 바 높이 */
    headerBarHeight: number
    /** 헤더 좌측 바 색상 */
    headerBarColor: string
    /** 구분선 색상 */
    dividerColor: string
    /** 버튼 그라데이션 시작 색상 */
    buttonGradientStart: string
    /** 버튼 그라데이션 끝 색상 */
    buttonGradientEnd: string
    /** 버튼 그림자/하단 테두리 색상 */
    buttonShadowColor: string
    /** 버튼 그림자/하단 테두리 두께 */
    buttonShadowHeight: number
    /** 버튼 모서리 반경 */
    buttonBorderRadius: number
    /** 버튼과 좌우 여백 */
    buttonPaddingX: number
    /** 버튼과 상단(구분선) 간격 */
    buttonMarginTop: number
  }
}

export type ThemeConfig = Omit<RawThemeConfig, 'header' | 'name' | 'bubbleLeft' | 'bubbleRight' | 'bond'> & {
  header: Omit<RawThemeConfig['header'], 'titleFont'> & {
    titleFont: string
  }
  name: Omit<RawThemeConfig['name'], 'font' | 'fontSize' | 'marginTop' | 'marginBottom' | 'marginLeft'> & {
    font: string
    fontSize: number
    marginTop: number
    marginBottom: number
    marginLeft: number
  }
  bubbleLeft: Omit<
    RawThemeConfig['bubbleLeft'],
    'font' | 'fontSize' | 'lineHeight' | 'paddingTop' | 'paddingRight' | 'paddingBottom' | 'paddingLeft'
  > & {
    font: string
    fontSize: number
    lineHeight: number
    paddingTop: number
    paddingRight: number
    paddingBottom: number
    paddingLeft: number
  }
  bubbleRight: Omit<
    RawThemeConfig['bubbleRight'],
    'font' | 'fontSize' | 'lineHeight' | 'paddingTop' | 'paddingRight' | 'paddingBottom' | 'paddingLeft'
  > & {
    font: string
    fontSize: number
    lineHeight: number
    paddingTop: number
    paddingRight: number
    paddingBottom: number
    paddingLeft: number
  }
  bond: Omit<
    RawThemeConfig['bond'],
    'font' | 'fontSize' | 'paddingTop' | 'paddingRight' | 'paddingBottom' | 'paddingLeft'
  > & {
    font: string
    fontSize: number
    paddingTop: number
    paddingRight: number
    paddingBottom: number
    paddingLeft: number
  }
}

export function resolveThemeConfig(config: RawThemeConfig, lang: Language): ThemeConfig {
  const resolveNum = (val: LocalizedNumber) => {
    if (typeof val === 'number') return val
    return val[lang] ?? val['ko'] ?? Object.values(val)[0] ?? 0
  }
  const resolveStr = (val: LocalizedFont) => {
    if (typeof val === 'string') return val
    return val[lang] ?? val['ko'] ?? Object.values(val)[0] ?? ''
  }
  return {
    ...config,
    header: {
      ...config.header,
      titleFont: resolveStr(config.header.titleFont),
    },
    name: {
      ...config.name,
      font: resolveStr(config.name.font),
      fontSize: resolveNum(config.name.fontSize),
      marginTop: resolveNum(config.name.marginTop),
      marginBottom: resolveNum(config.name.marginBottom),
      marginLeft: resolveNum(config.name.marginLeft),
    },
    bubbleLeft: {
      ...config.bubbleLeft,
      font: resolveStr(config.bubbleLeft.font),
      fontSize: resolveNum(config.bubbleLeft.fontSize),
      lineHeight: resolveNum(config.bubbleLeft.lineHeight),
      paddingTop: resolveNum(config.bubbleLeft.paddingTop),
      paddingRight: resolveNum(config.bubbleLeft.paddingRight),
      paddingBottom: resolveNum(config.bubbleLeft.paddingBottom),
      paddingLeft: resolveNum(config.bubbleLeft.paddingLeft),
    },
    bubbleRight: {
      ...config.bubbleRight,
      font: resolveStr(config.bubbleRight.font),
      fontSize: resolveNum(config.bubbleRight.fontSize),
      lineHeight: resolveNum(config.bubbleRight.lineHeight),
      paddingTop: resolveNum(config.bubbleRight.paddingTop),
      paddingRight: resolveNum(config.bubbleRight.paddingRight),
      paddingBottom: resolveNum(config.bubbleRight.paddingBottom),
      paddingLeft: resolveNum(config.bubbleRight.paddingLeft),
    },
    bond: {
      ...config.bond,
      font: resolveStr(config.bond.font),
      fontSize: resolveNum(config.bond.fontSize),
      paddingTop: resolveNum(config.bond.paddingTop),
      paddingRight: resolveNum(config.bond.paddingRight),
      paddingBottom: resolveNum(config.bond.paddingBottom),
      paddingLeft: resolveNum(config.bond.paddingLeft),
    },
  }
}

export const momotalk: RawThemeConfig = {
  canvasWidth: 1282,
  backgroundColor: '#ffffff',
  header: {
    height: 132,
    backgroundColor: '#ff8fa0',
    backgroundGradient: 'linear-gradient(180deg, #FD889D 0%, #F79AAB 100%)',
    titleColor: '#ffffff',
    titleFont: 'Jalnan2, sans-serif',
    titleFontSize: 54,
    titleScaleX: 1.1,
    logoSize: 57,
    logoGap: 12,
    paddingLeft: 38,
    helpIconSize: 100,
    helpIconGap: 2,
    titleOffsetY: 8,
    logoOffsetY: 0,
    helpIconOffsetY: 9,
    closeIconSize: 100,
    closeIconOffsetX: -20,
    closeIconOffsetY: 0,
  },
  sidebar: {
    width: 201,
    backgroundColor: '#4C5B6F',
    studentIconSize: 100,
    chatIconSize: 100,
    iconGap: 103,
    paddingTop: 50,
    studentIconOpacity: 0.25,
    activeChatBackgroundColor: '#67788D',
    activeChatBackgroundOffsetY: -52,
    activeChatBackgroundHeight: 200,
  },
  chat: {
    paddingLeft: 31,
    paddingRight: 46,
    paddingTop: 39,
    paddingBottom: 28.5,
    groupGap: 38.5,
    messageGap: 15.5,
  },
  profile: {
    size: 140,
    circular: true,
    borderWidth: 0,
    borderColor: '#ffffff',
    zoom: 1.1,
  },
  name: {
    font: {
      ko: 'GyeonggiTitleBold, sans-serif',
      ja: 'ShinMGo-DeBold, sans-serif',
      en: 'NotoSansBold, sans-serif',
    },
    fontSize: {ko: 43, ja: 41, en: 43},
    color: '#3F444A',
    marginTop: {ko: 1.5, ja: 1.5, en: -8},
    marginBottom: {ko: 7.5, ja: 9, en: 17},
    marginLeft: {ko: 32, ja: 32, en: 32},
  },
  bubbleLeft: {
    backgroundColor: '#4C5B6F',
    textColor: '#ffffff',
    font: {
      ko: 'GyeonggiTitle, sans-serif',
      ja: 'ShinMGo-Medium, sans-serif',
      en: 'NotoSans, sans-serif',
    },
    fontSize: {ko: 44.5, ja: 43, en: 44.5},
    lineHeight: {ko: 1.25, ja: 1.25, en: 1.25},
    paddingTop: {ko: 20, ja: 18, en: 10},
    paddingRight: {ko: 23, ja: 23, en: 23},
    paddingBottom: {ko: 10, ja: 12, en: 20},
    paddingLeft: {ko: 23, ja: 23, en: 23},
    borderRadius: 23,
    maxWidthRatio: 0.82,
    marginLeft: 30,
    tailWidth: 13,
    tailHeight: 16,
    tailOffsetY: 24,
    tailRadius: 1.5,
  },
  bubbleRight: {
    backgroundColor: '#4A8ACB',
    textColor: '#ffffff',
    font: {
      ko: 'GyeonggiTitle, sans-serif',
      ja: 'ShinMGo-Medium, sans-serif',
      en: 'NotoSans, sans-serif',
    },
    fontSize: {ko: 44.5, ja: 43, en: 44.5},
    lineHeight: {ko: 1.25, ja: 1.25, en: 1.25},
    paddingTop: {ko: 20, ja: 18, en: 10},
    paddingRight: {ko: 23, ja: 23, en: 23},
    paddingBottom: {ko: 10, ja: 12, en: 20},
    paddingLeft: {ko: 23, ja: 23, en: 23},
    borderRadius: 23,
    maxWidthRatio: 0.82,
    marginRight: 0,
    tailWidth: 13,
    tailHeight: 16,
    tailOffsetY: 24,
    tailRadius: 1.5,
  },
  bond: {
    backgroundColor: '#FFEDF1',
    borderColor: '#F1DDE1',
    textColor: '#ffffff',
    font: {
      ko: 'GyeonggiTitle, sans-serif',
      ja: 'ShinMGo-Medium, sans-serif',
      en: 'NotoSans, sans-serif',
    },
    fontSize: {ko: 38, ja: 36, en: 38},
    paddingTop: {ko: 24, ja: 24, en: 24},
    paddingRight: {ko: 30, ja: 30, en: 30},
    paddingBottom: {ko: 24, ja: 24, en: 24},
    paddingLeft: {ko: 30, ja: 30, en: 30},
    borderRadius: 12,
    maxWidthRatio: 0.95,
    headerFontSize: 32,
    headerColor: '#4C5B6F',
    headerBarWidth: 5,
    headerBarHeight: 28,
    headerBarColor: '#F2899A',
    dividerColor: '#E2D2D7',
    buttonGradientStart: '#FF8DA1',
    buttonGradientEnd: '#FB728A',
    buttonShadowColor: '#E05F77',
    buttonShadowHeight: 4,
    buttonBorderRadius: 16,
    buttonPaddingX: 30,
    buttonMarginTop: 24,
  },
}

export const imessage: RawThemeConfig = {
  canvasWidth: 1024,
  backgroundColor: '#ffffff',
  header: {
    height: 64,
    backgroundColor: '#f8f8f8',
    titleColor: '#000000',
    titleFont: 'SF Pro Display, -apple-system, sans-serif',
    titleFontSize: 28,
    titleScaleX: 1.0,
    logoSize: 0,
    logoGap: 0,
    paddingLeft: 24,
    helpIconSize: 0,
    helpIconGap: 0,
    titleOffsetY: 0,
    logoOffsetY: 0,
    helpIconOffsetY: 0,
    closeIconSize: 0,
    closeIconOffsetX: 0,
    closeIconOffsetY: 0,
  },
  sidebar: {
    width: 0,
    backgroundColor: 'transparent',
    studentIconSize: 0,
    chatIconSize: 0,
    iconGap: 0,
    paddingTop: 0,
    studentIconOpacity: 1,
    activeChatBackgroundColor: 'transparent',
    activeChatBackgroundOffsetY: 0,
    activeChatBackgroundHeight: 0,
  },
  chat: {
    paddingLeft: 24,
    paddingRight: 24,
    paddingTop: 20,
    paddingBottom: 28,
    groupGap: 24,
    messageGap: 4,
  },
  profile: {
    size: 0,
    circular: true,
    borderWidth: 0,
    borderColor: 'transparent',
    zoom: 1.0,
  },
  name: {
    font: 'SF Pro Display, -apple-system, sans-serif',
    fontSize: 16,
    color: '#8e8e93',
    marginBottom: 4,
    marginTop: 0,
    marginLeft: 16,
  },
  bubbleLeft: {
    backgroundColor: '#e5e5ea',
    textColor: '#000000',
    font: 'SF Pro Display, -apple-system, sans-serif',
    fontSize: 20,
    lineHeight: 1.45,
    paddingTop: 10,
    paddingRight: 16,
    paddingBottom: 10,
    paddingLeft: 16,
    borderRadius: 20,
    maxWidthRatio: 0.7,
    marginLeft: 0,
    tailWidth: 0,
    tailHeight: 0,
    tailOffsetY: 0,
    tailRadius: 0,
  },
  bubbleRight: {
    backgroundColor: '#007aff',
    textColor: '#ffffff',
    font: 'SF Pro Display, -apple-system, sans-serif',
    fontSize: 20,
    lineHeight: 1.45,
    paddingTop: 10,
    paddingRight: 16,
    paddingBottom: 10,
    paddingLeft: 16,
    borderRadius: 20,
    maxWidthRatio: 0.7,
    marginRight: 0,
    tailWidth: 0,
    tailHeight: 0,
    tailOffsetY: 0,
    tailRadius: 0,
  },
  bond: {
    backgroundColor: '#e5e5ea',
    borderColor: 'transparent',
    textColor: '#000000',
    font: 'SF Pro Display, -apple-system, sans-serif',
    fontSize: 16,
    paddingTop: 8,
    paddingRight: 16,
    paddingBottom: 8,
    paddingLeft: 16,
    borderRadius: 16,
    maxWidthRatio: 1.0,
    headerFontSize: 16,
    headerColor: '#000000',
    headerBarWidth: 0,
    headerBarHeight: 0,
    headerBarColor: 'transparent',
    dividerColor: 'transparent',
    buttonGradientStart: 'transparent',
    buttonGradientEnd: 'transparent',
    buttonShadowColor: 'transparent',
    buttonShadowHeight: 0,
    buttonBorderRadius: 0,
    buttonPaddingX: 0,
    buttonMarginTop: 0,
  },
}

export const line: RawThemeConfig = {
  canvasWidth: 1024,
  backgroundColor: '#8cabd9',
  header: {
    height: 64,
    backgroundColor: '#6e93c0',
    titleColor: '#ffffff',
    titleFont: 'Noto Sans KR, sans-serif',
    titleFontSize: 26,
    titleScaleX: 1.0,
    logoSize: 0,
    logoGap: 0,
    paddingLeft: 24,
    helpIconSize: 0,
    helpIconGap: 0,
    titleOffsetY: 0,
    logoOffsetY: 0,
    helpIconOffsetY: 0,
    closeIconSize: 0,
    closeIconOffsetX: 0,
    closeIconOffsetY: 0,
  },
  sidebar: {
    width: 0,
    backgroundColor: 'transparent',
    studentIconSize: 0,
    chatIconSize: 0,
    iconGap: 0,
    paddingTop: 0,
    studentIconOpacity: 1,
    activeChatBackgroundColor: 'transparent',
    activeChatBackgroundOffsetY: 0,
    activeChatBackgroundHeight: 0,
  },
  chat: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 16,
    paddingBottom: 24,
    groupGap: 20,
    messageGap: 4,
  },
  profile: {
    size: 56,
    circular: false,
    borderWidth: 0,
    borderColor: 'transparent',
    zoom: 1.0,
  },
  name: {
    font: 'Noto Sans KR, sans-serif',
    fontSize: 16,
    color: '#213a4f',
    marginBottom: 4,
    marginTop: 0,
    marginLeft: 12,
  },
  bubbleLeft: {
    backgroundColor: '#ffffff',
    textColor: '#333333',
    font: 'Noto Sans KR, sans-serif',
    fontSize: 19,
    lineHeight: 1.45,
    paddingTop: 10,
    paddingRight: 14,
    paddingBottom: 10,
    paddingLeft: 14,
    borderRadius: 14,
    maxWidthRatio: 0.65,
    marginLeft: 12,
    tailWidth: 0,
    tailHeight: 0,
    tailOffsetY: 0,
    tailRadius: 0,
  },
  bubbleRight: {
    backgroundColor: '#a3dd6e',
    textColor: '#333333',
    font: 'Noto Sans KR, sans-serif',
    fontSize: 19,
    lineHeight: 1.45,
    paddingTop: 10,
    paddingRight: 14,
    paddingBottom: 10,
    paddingLeft: 14,
    borderRadius: 14,
    maxWidthRatio: 0.55,
    marginRight: 0,
    tailWidth: 0,
    tailHeight: 0,
    tailOffsetY: 0,
    tailRadius: 0,
  },
  bond: {
    backgroundColor: '#6e93c0',
    borderColor: 'transparent',
    textColor: '#ffffff',
    font: 'Noto Sans KR, sans-serif',
    fontSize: 15,
    paddingTop: 6,
    paddingRight: 16,
    paddingBottom: 6,
    paddingLeft: 16,
    borderRadius: 16,
    maxWidthRatio: 1.0,
    headerFontSize: 16,
    headerColor: '#000000',
    headerBarWidth: 0,
    headerBarHeight: 0,
    headerBarColor: 'transparent',
    dividerColor: 'transparent',
    buttonGradientStart: 'transparent',
    buttonGradientEnd: 'transparent',
    buttonShadowColor: 'transparent',
    buttonShadowHeight: 0,
    buttonBorderRadius: 0,
    buttonPaddingX: 0,
    buttonMarginTop: 0,
  },
}

export const kakaotalk: RawThemeConfig = {
  canvasWidth: 1024,
  backgroundColor: '#b3c9db',
  header: {
    height: 64,
    backgroundColor: '#3f3f3f',
    titleColor: '#ffffff',
    titleFont: 'Noto Sans KR, sans-serif',
    titleFontSize: 24,
    titleScaleX: 1.0,
    logoSize: 0,
    logoGap: 0,
    paddingLeft: 24,
    helpIconSize: 0,
    helpIconGap: 0,
    titleOffsetY: 0,
    logoOffsetY: 0,
    helpIconOffsetY: 0,
    closeIconSize: 0,
    closeIconOffsetX: 0,
    closeIconOffsetY: 0,
  },
  sidebar: {
    width: 0,
    backgroundColor: 'transparent',
    studentIconSize: 0,
    chatIconSize: 0,
    iconGap: 0,
    paddingTop: 0,
    studentIconOpacity: 1,
    activeChatBackgroundColor: 'transparent',
    activeChatBackgroundOffsetY: 0,
    activeChatBackgroundHeight: 0,
  },
  chat: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 16,
    paddingBottom: 24,
    groupGap: 22,
    messageGap: 4,
  },
  profile: {
    size: 52,
    circular: false,
    borderWidth: 0,
    borderColor: 'transparent',
    zoom: 1.0,
  },
  name: {
    font: 'Noto Sans KR, sans-serif',
    fontSize: 16,
    color: '#333333',
    marginBottom: 4,
    marginTop: 0,
    marginLeft: 12,
  },
  bubbleLeft: {
    backgroundColor: '#ffffff',
    textColor: '#333333',
    font: 'Noto Sans KR, sans-serif',
    fontSize: 19,
    lineHeight: 1.45,
    paddingTop: 10,
    paddingRight: 14,
    paddingBottom: 10,
    paddingLeft: 14,
    borderRadius: 14,
    maxWidthRatio: 0.65,
    marginLeft: 12,
    tailWidth: 0,
    tailHeight: 0,
    tailOffsetY: 0,
    tailRadius: 0,
  },
  bubbleRight: {
    backgroundColor: '#fef01b',
    textColor: '#333333',
    font: 'Noto Sans KR, sans-serif',
    fontSize: 19,
    lineHeight: 1.45,
    paddingTop: 10,
    paddingRight: 14,
    paddingBottom: 10,
    paddingLeft: 14,
    borderRadius: 14,
    maxWidthRatio: 0.55,
    marginRight: 0,
    tailWidth: 0,
    tailHeight: 0,
    tailOffsetY: 0,
    tailRadius: 0,
  },
  bond: {
    backgroundColor: '#3f3f3f',
    borderColor: 'transparent',
    textColor: '#ffffff',
    font: 'Noto Sans KR, sans-serif',
    fontSize: 15,
    paddingTop: 6,
    paddingRight: 16,
    paddingBottom: 6,
    paddingLeft: 16,
    borderRadius: 16,
    maxWidthRatio: 1.0,
    headerFontSize: 16,
    headerColor: '#000000',
    headerBarWidth: 0,
    headerBarHeight: 0,
    headerBarColor: 'transparent',
    dividerColor: 'transparent',
    buttonGradientStart: 'transparent',
    buttonGradientEnd: 'transparent',
    buttonShadowColor: 'transparent',
    buttonShadowHeight: 0,
    buttonBorderRadius: 0,
    buttonPaddingX: 0,
    buttonMarginTop: 0,
  },
}

export const themes = {momotalk, imessage, line, kakaotalk} as const
export type ThemeName = keyof typeof themes
