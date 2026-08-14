export interface NavigationLike {
  from?: {
    route?: {id: string | null}
    url?: URL | null
    params?: {category?: string; slug?: string} | null
  } | null
  to?: {
    route?: {id: string | null}
    url?: URL | null
    params?: {category?: string; slug?: string} | null
  } | null
}

export function isRoutePagination(navigation: NavigationLike, routeId: string) {
  return navigation.from?.route?.id === routeId && navigation.to?.route?.id === routeId
}

export function isGoingForward(navigation: NavigationLike) {
  const fromPage = Number(navigation.from?.url?.searchParams.get('p')) || 1
  const toPage = Number(navigation.to?.url?.searchParams.get('p')) || 1
  return toPage > fromPage
}
