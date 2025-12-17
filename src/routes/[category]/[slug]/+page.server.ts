import {error} from '@sveltejs/kit'
import {blogPosts, getMetadataFromMatter} from '$lib/content'
import matter from 'gray-matter'
import {marked} from 'marked'
import {createDirectives, presetDirectiveConfigs, type DirectiveConfig} from 'marked-directive'
import markedFootnote from 'marked-footnote'
import {markedSmartypantsLite} from 'marked-smartypants-lite'
import markedSubSuper from 'marked-subsuper-text'
import type {PageServerLoad} from './$types'

const figureDirective: DirectiveConfig = {
  level: 'block',
  marker: '::',
  renderer(token) {
    if (token.meta.name === 'figure') {
      return `<figure><div class="self-center"><img class="not-prose" src="${token.attrs?.src}" alt="${token.text.replace(/<[^>]*>?/g, '')}"></div><figcaption>${token.text}</figcaption></figure>`
    }

    return false
  },
}

export const load: PageServerLoad = async ({params}) => {
  const matchPath = `/src/posts/${params.category}/${params.slug}.md`
  const rawContent = blogPosts[matchPath]
  if (!rawContent) return error(404)

  const {content, data} = matter(rawContent)

  const renderer = {
    link(link: any) {
      const linkStr = marked.Renderer.prototype.link.call(this, link)
      if (/^(https?:)?\/\//g.test(link.href)) {
        return linkStr.replace('<a', "<a target='_blank' rel='nofollow noreferrer noopener'")
      }
      return linkStr
    },
  }

  marked.use(markedSmartypantsLite())
  marked.use(createDirectives([...presetDirectiveConfigs, figureDirective]))
  marked.use(markedSubSuper())
  marked.use(markedFootnote())
  marked.use({renderer})
  const contentHTML = marked.parse(content)

  const postMetaData = getMetadataFromMatter(params.category, params.slug, data)

  return {
    ...postMetaData,
    contentHTML,
  }
}
