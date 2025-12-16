import {error} from '@sveltejs/kit'
import {blogPosts, getMetadataFromMatter} from '$lib/content'
import matter from 'gray-matter'
import {marked} from 'marked'
import markedFootnote from 'marked-footnote'
import {markedSmartypantsLite} from 'marked-smartypants-lite'
import markedSubSuper from 'marked-subsuper-text'
import type {PageServerLoad} from './$types'

export const load: PageServerLoad = async ({params}) => {
  const matchPath = `/src/posts/${params.category}/${params.slug}.md`
  const rawContent = blogPosts[matchPath]
  if (!rawContent) return error(404)

  const {content, data} = matter(rawContent)

  marked.use(markedSmartypantsLite())
  marked.use(markedSubSuper())
  marked.use(markedFootnote())
  const contentHTML = marked.parse(content)

  const postMetaData = getMetadataFromMatter(params.category, params.slug, data)

  return {
    ...postMetaData,
    contentHTML,
  }
}
