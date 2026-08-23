import {getAllBlogContentMetadata} from '$lib/content'
import {absoluteUrl, toSitemapDateTime} from '$lib/seo'
import {getImageUrl} from '$lib/utils'
import type {RequestHandler} from './$types'

export const prerender = true

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case '&':
        return '&amp;'
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '"':
        return '&quot;'
      default:
        return '&apos;'
    }
  })
}

function xmlElement(name: string, value: string) {
  return `<${name}>${escapeXml(value)}</${name}>`
}

export const GET: RequestHandler = async () => {
  const posts = getAllBlogContentMetadata()
  const latestPostDate = toSitemapDateTime(posts[0]?.pubDate)
  const urls = [
    [
      xmlElement('loc', absoluteUrl('/')),
      latestPostDate ? xmlElement('lastmod', latestPostDate) : '',
      xmlElement('changefreq', 'daily'),
      xmlElement('priority', '1.0'),
    ],
    ...posts.map((post) => {
      const image = post.thumbnail ?? post.image
      const lastModified = toSitemapDateTime(post.pubDate)
      return [
        xmlElement('loc', post.canonicalURL),
        lastModified ? xmlElement('lastmod', lastModified) : '',
        xmlElement('changefreq', 'monthly'),
        xmlElement('priority', post.category === 'font' ? '0.9' : '0.8'),
        image
          ? `<image:image>${xmlElement('image:loc', getImageUrl(image, {w: 1200, absolute: true}))}${xmlElement('image:title', post.title)}</image:image>`
          : '',
      ]
    }),
  ]

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="https://www.google.com/schemas/sitemap-image/1.1">\n${urls
    .map(
      (elements) =>
        `  <url>\n${elements
          .filter(Boolean)
          .map((element) => `    ${element}`)
          .join('\n')}\n  </url>`,
    )
    .join('\n')}\n</urlset>\n`

  return new Response(sitemapXml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
