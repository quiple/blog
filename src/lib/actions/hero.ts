import {isHero} from '$lib/stores/header'

type HeroParams = {
  hasHero: boolean
}

/**
 * 컴포넌트의 생명주기에 맞춰 isHero 스토어를 관리하는 액션
 * @param _node - 액션이 사용된 HTML 요소
 * @param params.isLoading - 데이터 로딩 상태
 * @param params.hasHero - 배너 존재 여부
 */
export function hero(_node: HTMLElement, params: HeroParams) {
  const setHeroState = (p: HeroParams) => {
    isHero.set(p.hasHero ? true : null)
  }

  setHeroState(params)

  return {
    update: setHeroState,
    destroy() {
      isHero.set(false)
    },
  }
}
