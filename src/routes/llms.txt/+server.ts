import {BASE_URL} from '$lib/constants'
import {getAllBlogContentMetadata} from '$lib/content'

export const prerender = true

export const GET = async () => {
  const allPosts = getAllBlogContentMetadata()

  const markdown = `# quiple

## Full Content

- [Full Blog Archive](${BASE_URL}/llms-full.txt): A single text file containing all posts and articles on this blog.

## Posts

${allPosts.map((p) => `- [${p.title}](${BASE_URL}${p.relativeURL}.md)${p.description ? `: ${p.description}` : ''}`).join('\n')}
`

  return new Response(markdown, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
    },
  })
}
