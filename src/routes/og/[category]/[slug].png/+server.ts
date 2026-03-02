import {ImageResponse} from '@ethercorps/sveltekit-og'
import {error} from '@sveltejs/kit'
import OgImage from '$lib/components/og/post.svelte'
import {
  blogArticles,
  blogFonts,
  blogPosts,
  getArticleMetadataFromMatter,
  getFontMetadataFromMatter,
  getPostMetadataFromMatter,
} from '$lib/content'
import {generateDescription, processTitle} from '$lib/markdown'
import matter from 'gray-matter'
import type {RequestHandler} from '.$types'

export const prerender = true

export const GET: RequestHandler = async ({params}) => {
  const matchPath = `/src/posts/${params.category}/${params.slug}.md`
  const rawContent = blogPosts[matchPath] ?? blogArticles[matchPath] ?? blogFonts[matchPath]
  if (!rawContent) return error(404)

  const {content, data} = matter(rawContent)
  const isArticle = params.category === 'article'
  const isFont = params.category === 'font'
  const postMetaData = isArticle
    ? getArticleMetadataFromMatter(params.category, params.slug, data)
    : isFont
      ? getFontMetadataFromMatter(params.category, params.slug, data)
      : getPostMetadataFromMatter(params.category, params.slug, data)

  postMetaData.title = await processTitle(postMetaData.title)
  postMetaData.description = postMetaData.description ?? (await generateDescription(content))

  const articleData = isArticle ? (postMetaData as ReturnType<typeof getArticleMetadataFromMatter>) : undefined

  return {
    ...postMetaData,
    origDate: articleData?.origDate,
    media: articleData?.media,
    source: articleData?.source,
    author: articleData?.author,
    authorURL: articleData?.authorURL,
  }

  return new ImageResponse(OgImage, {
    width: 1200,
    height: 630,
  })
}
