import type {PageServerLoad} from './$types'

export const load: PageServerLoad = ({setHeaders}) => {
  setHeaders({
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
  })
}
