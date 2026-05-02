import {getAllBlogContentMetadata} from '$lib/content'

export const GET = async ({url}) => {
  const allPosts = getAllBlogContentMetadata()
  const origin = url.origin

  const markdown = `# quiple

> 이것저것 블로그.

## Posts

${allPosts.map((p) => `- [${p.title}](${origin}${p.relativeURL}): ${p.description || ''}`).join('\n')}
`

  return new Response(markdown, {
    headers: {
      'content-type': 'text/plain; charset=utf-8', // llms.txt is usually text/plain or text/markdown
    },
  })
}
