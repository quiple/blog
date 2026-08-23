interface CompiledPostContent {
  contentHtml: string
  description: string
  title: string
}

type CompiledContentMap = Record<string, CompiledPostContent>

export const compiledBlogPosts = import.meta.glob('/src/posts/blog/*.md', {
  query: '?compiled-post',
  import: 'default',
  eager: true,
}) as CompiledContentMap

export const compiledBlogArticles = import.meta.glob('/src/posts/article/*.md', {
  query: '?compiled-post',
  import: 'default',
  eager: true,
}) as CompiledContentMap

export const compiledBlogFonts = import.meta.glob('/src/posts/font/*.md', {
  query: '?compiled-post',
  import: 'default',
  eager: true,
}) as CompiledContentMap

export function getCompiledContent(path: string) {
  return compiledBlogPosts[path] ?? compiledBlogArticles[path] ?? compiledBlogFonts[path]
}
