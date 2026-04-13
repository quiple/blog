export type Language = 'ko' | 'en' | 'ja'

export interface ThemeConfig {
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
    titleFont: string
    titleFontSize: number
    /** 로고 아이콘 크기 */
    logoSize: number
    /** 로고와 제목 사이 간격 */
    logoGap: number
    /** 헤더 좌측 패딩 */
    paddingLeft: number
    /** 물음표 아이콘 크기 */
    helpIconSize: number
    /** 물음표 아이콘 우측 여백 */
    helpIconRight: number
  }

  /** 왼쪽 사이드바 */
  sidebar: {
    width: number
    backgroundColor: string
    /** 학생 아이콘 크기 */
    studentIconSize: number
    /** 채팅 아이콘 크기 */
    chatIconSize: number
    /** 알림 뱃지 크기 */
    badgeSize: number
    badgeColor: string
    badgeTextColor: string
    badgeFont: string
    badgeFontSize: number
    /** 아이콘 간 세로 간격 */
    iconGap: number
    /** 사이드바 상단 패딩 */
    paddingTop: number
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
  }

  /** 이름 표시 */
  name: {
    font: string
    fontSize: number
    fontWeight: string
    color: string
    /** 이름과 메시지 사이 간격 */
    marginBottom: number
    /** 프로필 이미지와 이름 사이 가로 간격 */
    marginLeft: number
  }

  /** 다른 사람(학생) 메시지 말풍선 */
  bubbleLeft: {
    backgroundColor: string
    textColor: string
    font: string
    fontSize: number
    fontWeight: string
    lineHeight: number
    /** 말풍선 내부 여백 */
    paddingX: number
    paddingY: number
    /** 말풍선 모서리 반경 */
    borderRadius: number
    /** 말풍선 최대 너비 비율 (대화 영역 대비) */
    maxWidthRatio: number
    /** 프로필 이미지와 말풍선 사이 가로 간격 */
    marginLeft: number
  }

  /** 내(선생님) 메시지 말풍선 */
  bubbleRight: {
    backgroundColor: string
    textColor: string
    font: string
    fontSize: number
    fontWeight: string
    lineHeight: number
    paddingX: number
    paddingY: number
    borderRadius: number
    maxWidthRatio: number
    /** 우측 여백 */
    marginRight: number
  }
}

export const momotalk: ThemeConfig = {
  canvasWidth: 1024,
  backgroundColor: '#f0f4fa',
  header: {
    height: 72,
    backgroundColor: '#ff8fa0',
    backgroundGradient: 'linear-gradient(180deg, #FD889D 0%, #F79AAB 100%)',
    titleColor: '#ffffff',
    titleFont: 'M PLUS Rounded 1c, sans-serif',
    titleFontSize: 34,
    logoSize: 40,
    logoGap: 10,
    paddingLeft: 24,
    helpIconSize: 38,
    helpIconRight: 20,
  },
  sidebar: {
    width: 84,
    backgroundColor: '#4C5B6F',
    studentIconSize: 52,
    chatIconSize: 52,
    badgeSize: 22,
    badgeColor: '#ff3b30',
    badgeTextColor: '#ffffff',
    badgeFont: 'sans-serif',
    badgeFontSize: 13,
    iconGap: 14,
    paddingTop: 20,
  },
  chat: {
    paddingLeft: 20,
    paddingRight: 24,
    paddingTop: 24,
    paddingBottom: 32,
    groupGap: 28,
    messageGap: 6,
  },
  profile: {
    size: 68,
    circular: true,
    borderWidth: 3,
    borderColor: '#c8cfe0',
  },
  name: {
    font: 'Noto Sans KR, sans-serif',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a5568',
    marginBottom: 6,
    marginLeft: 12,
  },
  bubbleLeft: {
    backgroundColor: '#4a5568',
    textColor: '#ffffff',
    font: 'Noto Sans KR, sans-serif',
    fontSize: 20,
    fontWeight: 'normal',
    lineHeight: 1.5,
    paddingX: 18,
    paddingY: 12,
    borderRadius: 16,
    maxWidthRatio: 0.65,
    marginLeft: 12,
  },
  bubbleRight: {
    backgroundColor: '#4a9df8',
    textColor: '#ffffff',
    font: 'Noto Sans KR, sans-serif',
    fontSize: 20,
    fontWeight: 'normal',
    lineHeight: 1.5,
    paddingX: 18,
    paddingY: 12,
    borderRadius: 16,
    maxWidthRatio: 0.55,
    marginRight: 0,
  },
}

export const imessage: ThemeConfig = {
  canvasWidth: 1024,
  backgroundColor: '#ffffff',
  header: {
    height: 64,
    backgroundColor: '#f8f8f8',
    titleColor: '#000000',
    titleFont: 'SF Pro Display, -apple-system, sans-serif',
    titleFontSize: 28,
    logoSize: 0,
    logoGap: 0,
    paddingLeft: 24,
    helpIconSize: 0,
    helpIconRight: 0,
  },
  sidebar: {
    width: 0,
    backgroundColor: 'transparent',
    studentIconSize: 0,
    chatIconSize: 0,
    badgeSize: 0,
    badgeColor: 'transparent',
    badgeTextColor: 'transparent',
    badgeFont: 'sans-serif',
    badgeFontSize: 0,
    iconGap: 0,
    paddingTop: 0,
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
  },
  name: {
    font: 'SF Pro Display, -apple-system, sans-serif',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8e8e93',
    marginBottom: 4,
    marginLeft: 16,
  },
  bubbleLeft: {
    backgroundColor: '#e5e5ea',
    textColor: '#000000',
    font: 'SF Pro Display, -apple-system, sans-serif',
    fontSize: 20,
    fontWeight: 'normal',
    lineHeight: 1.45,
    paddingX: 16,
    paddingY: 10,
    borderRadius: 20,
    maxWidthRatio: 0.7,
    marginLeft: 0,
  },
  bubbleRight: {
    backgroundColor: '#007aff',
    textColor: '#ffffff',
    font: 'SF Pro Display, -apple-system, sans-serif',
    fontSize: 20,
    fontWeight: 'normal',
    lineHeight: 1.45,
    paddingX: 16,
    paddingY: 10,
    borderRadius: 20,
    maxWidthRatio: 0.7,
    marginRight: 0,
  },
}

export const line: ThemeConfig = {
  canvasWidth: 1024,
  backgroundColor: '#8cabd9',
  header: {
    height: 64,
    backgroundColor: '#6e93c0',
    titleColor: '#ffffff',
    titleFont: 'Noto Sans KR, sans-serif',
    titleFontSize: 26,
    logoSize: 0,
    logoGap: 0,
    paddingLeft: 24,
    helpIconSize: 0,
    helpIconRight: 0,
  },
  sidebar: {
    width: 0,
    backgroundColor: 'transparent',
    studentIconSize: 0,
    chatIconSize: 0,
    badgeSize: 0,
    badgeColor: 'transparent',
    badgeTextColor: 'transparent',
    badgeFont: 'sans-serif',
    badgeFontSize: 0,
    iconGap: 0,
    paddingTop: 0,
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
  },
  name: {
    font: 'Noto Sans KR, sans-serif',
    fontSize: 16,
    fontWeight: 'normal',
    color: '#213a4f',
    marginBottom: 4,
    marginLeft: 12,
  },
  bubbleLeft: {
    backgroundColor: '#ffffff',
    textColor: '#333333',
    font: 'Noto Sans KR, sans-serif',
    fontSize: 19,
    fontWeight: 'normal',
    lineHeight: 1.45,
    paddingX: 14,
    paddingY: 10,
    borderRadius: 14,
    maxWidthRatio: 0.65,
    marginLeft: 12,
  },
  bubbleRight: {
    backgroundColor: '#a3dd6e',
    textColor: '#333333',
    font: 'Noto Sans KR, sans-serif',
    fontSize: 19,
    fontWeight: 'normal',
    lineHeight: 1.45,
    paddingX: 14,
    paddingY: 10,
    borderRadius: 14,
    maxWidthRatio: 0.55,
    marginRight: 0,
  },
}

export const kakaotalk: ThemeConfig = {
  canvasWidth: 1024,
  backgroundColor: '#b3c9db',
  header: {
    height: 64,
    backgroundColor: '#3f3f3f',
    titleColor: '#ffffff',
    titleFont: 'Noto Sans KR, sans-serif',
    titleFontSize: 24,
    logoSize: 0,
    logoGap: 0,
    paddingLeft: 24,
    helpIconSize: 0,
    helpIconRight: 0,
  },
  sidebar: {
    width: 0,
    backgroundColor: 'transparent',
    studentIconSize: 0,
    chatIconSize: 0,
    badgeSize: 0,
    badgeColor: 'transparent',
    badgeTextColor: 'transparent',
    badgeFont: 'sans-serif',
    badgeFontSize: 0,
    iconGap: 0,
    paddingTop: 0,
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
  },
  name: {
    font: 'Noto Sans KR, sans-serif',
    fontSize: 16,
    fontWeight: 'normal',
    color: '#333333',
    marginBottom: 4,
    marginLeft: 12,
  },
  bubbleLeft: {
    backgroundColor: '#ffffff',
    textColor: '#333333',
    font: 'Noto Sans KR, sans-serif',
    fontSize: 19,
    fontWeight: 'normal',
    lineHeight: 1.45,
    paddingX: 14,
    paddingY: 10,
    borderRadius: 14,
    maxWidthRatio: 0.65,
    marginLeft: 12,
  },
  bubbleRight: {
    backgroundColor: '#fef01b',
    textColor: '#333333',
    font: 'Noto Sans KR, sans-serif',
    fontSize: 19,
    fontWeight: 'normal',
    lineHeight: 1.45,
    paddingX: 14,
    paddingY: 10,
    borderRadius: 14,
    maxWidthRatio: 0.55,
    marginRight: 0,
  },
}

export const themes = {momotalk, imessage, line, kakaotalk} as const
export type ThemeName = keyof typeof themes
