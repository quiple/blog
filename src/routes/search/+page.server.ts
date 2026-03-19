import {redirect} from '@sveltejs/kit'
import type {PageServerLoad} from './$types'

export const load: PageServerLoad = async ({url}) => {
  const perPage = 128
  const currentPage = url.searchParams.get('page') ? Number(url.searchParams.get('page')) : 1
  const searchQuery = url.searchParams.get('q')
  console.log(searchQuery)

  let matches = null
  let totalCount = null

  return {perPage, currentPage, searchQuery, totalCount, matches}
}
