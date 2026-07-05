import {getAllBlogContentMetadata} from '$lib/content'
import {absoluteUrl, toSitemapDateTime} from '$lib/seo'
import {getImageUrl} from '$lib/utils'
import {XMLBuilder} from 'fast-xml-parser'
import type {RequestHandler} from './$types'

export const prerender = true

export const GET: RequestHandler = async () => {
  const posts = getAllBlogContentMetadata()
  const latestPostDate = posts[0]?.pubDate
  const sitemapObject = {
    urlset: {
      '@_xmlns': 'http://www.sitemaps.org/schemas/sitemap/0.9',
      '@_xmlns:image': 'https://www.google.com/schemas/sitemap-image/1.1',
      url: [
        {
          loc: absoluteUrl('/'),
          ...(latestPostDate ? {lastmod: toSitemapDateTime(latestPostDate)} : {}),
          changefreq: 'daily',
          priority: '1.0',
        },
      ].concat(
        posts.map((post) => ({
          loc: post.canonicalURL,
          lastmod: toSitemapDateTime(post.pubDate),
          changefreq: 'monthly',
          priority: post.category === 'font' ? '0.9' : '0.8',
          ...((post.thumbnail ?? post.image)
            ? {
                'image:image': {
                  'image:loc': getImageUrl(post.thumbnail ?? post.image ?? '', {w: 1200, absolute: true}, true),
                  'image:title': post.title,
                },
              }
            : {}),
        })),
      ),
    },
  }

  const builder = new XMLBuilder({
    ignoreAttributes: false,
    format: true,
  })

  const sitemapXml = builder.build(sitemapObject)

  return new Response(sitemapXml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
