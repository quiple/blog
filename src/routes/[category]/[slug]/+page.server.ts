import {error} from '@sveltejs/kit'
import {getCompiledContent} from '$lib/compiled-content'
import {
  blogArticles,
  blogFonts,
  blogPosts,
  getArticleMetadataFromMatter,
  getFontMetadataFromMatter,
  getPostMetadataFromMatter,
  parseMatter,
} from '$lib/content'
import type {PageServerLoad} from './$types'

export const load: PageServerLoad = async ({params}) => {
  const matchPath = `/src/posts/${params.category}/${params.slug}.md`
  const rawContent = blogPosts[matchPath] ?? blogArticles[matchPath] ?? blogFonts[matchPath]
  const compiledContent = getCompiledContent(matchPath)
  if (!rawContent || !compiledContent) return error(404)

  const {data} = parseMatter(rawContent as string)
  const isBlog = params.category === 'blog'
  const isArticle = params.category === 'article'
  const isFont = params.category === 'font'
  const postMetadata = isArticle
    ? getArticleMetadataFromMatter(params.category, params.slug, data)
    : isFont
      ? getFontMetadataFromMatter(params.category, params.slug, data)
      : getPostMetadataFromMatter(params.category, params.slug, data)

  postMetadata.title = compiledContent.title
  postMetadata.description ??= compiledContent.description

  const blogData = isBlog ? (postMetadata as ReturnType<typeof getPostMetadataFromMatter>) : undefined
  const articleData = isArticle ? (postMetadata as ReturnType<typeof getArticleMetadataFromMatter>) : undefined
  const fontData = isFont ? (postMetadata as ReturnType<typeof getFontMetadataFromMatter>) : undefined

  return {
    ...postMetadata,
    contentHtml: compiledContent.contentHtml,
    origDate: articleData?.origDate ?? fontData?.origDate ?? blogData?.origDate,
    media: articleData?.media,
    source: articleData?.source,
    author: articleData?.author,
    authorURL: articleData?.authorURL,
    downloadURL: fontData?.downloadURL,
  }
}
