import {isHero} from '$lib/stores/header'

type HeroParams = {
  hasHero: boolean
}

/**
 * 컴포넌트의 생명주기에 맞춰 isHero 스토어를 관리하는 액션
 * @param node - 액션이 사용된 HTML 요소
 * @param params.hasHero - 배너 존재 여부
 */
export function hero(node: HTMLElement, params: HeroParams) {
  let observer: IntersectionObserver

  const setHeroState = (p: HeroParams) => {
    if (observer) observer.disconnect()

    if (p.hasHero) {
      observer = new IntersectionObserver((entries) => {
        isHero.set(entries[0].isIntersecting)
      })
      observer.observe(node)
    } else {
      isHero.set(null)
    }
  }

  setHeroState(params)

  return {
    update: setHeroState,
    destroy() {
      if (observer) observer.disconnect()
      isHero.set(false)
    },
  }
}
