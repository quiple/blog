import fs from 'fs/promises'
import path from 'path'
import {Readable} from 'stream'
import {remark} from 'remark'
import remarkDirective from 'remark-directive'
import sharp from 'sharp'
import {visit} from 'unist-util-visit'

const POSTS_DIR = path.resolve('src/posts')
const SIZES_FILE = path.resolve('src/lib/image-sizes.json')

// Base URL to fetch images from (can be prod URL where images are hosted)
const IMAGE_BASE_URL = 'https://quiple.dev/img'

async function getMarkdownFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, {withFileTypes: true})
  const files: string[] = []
  for (const entry of entries) {
    const res = path.resolve(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await getMarkdownFiles(res)))
    } else if (res.endsWith('.md')) {
      files.push(res)
    }
  }
  return files
}

async function probeImageSize(url: string): Promise<{width: number; height: number} | null> {
  const res = await fetch(url, {
    headers: {
      'x-internal-secret': 'fb5328098e2fab0277635ff61df13870',
    },
  })
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)

  // Stream the response body into sharp instead of buffering entire file
  const reader = res.body?.getReader()
  if (!reader) throw new Error('No response body')

  const readable = new Readable({
    async read() {
      const {done, value} = await reader.read()
      if (done) {
        this.push(null)
      } else {
        this.push(Buffer.from(value))
      }
    },
  })

  const pipeline = sharp()
  readable.pipe(pipeline)

  const metadata = await pipeline.metadata()

  // Destroy the stream early — we only needed the header
  readable.destroy()

  let {width, height, orientation} = metadata

  // Swap width and height if orientation is 5, 6, 7, or 8
  if (orientation && orientation >= 5) {
    ;[width, height] = [height, width]
  }

  if (width && height) return {width, height}
  return null
}

async function run() {
  let sizes: Record<string, {width: number; height: number}> = {}

  try {
    const data = await fs.readFile(SIZES_FILE, 'utf-8')
    sizes = JSON.parse(data)
  } catch {
    // File doesn't exist or invalid JSON, start fresh
  }

  const files = await getMarkdownFiles(POSTS_DIR)

  // Use remark to parse files and find all images and figures
  const processor = remark().use(remarkDirective)

  const newSrcs = new Set<string>()

  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8')
    const tree = processor.parse(content)

    visit(tree, (node) => {
      let src = ''

      if (node.type === 'image' && typeof node.url === 'string') {
        src = node.url
      } else if ((node.type === 'containerDirective' || node.type === 'leafDirective') && node.name === 'figure') {
        const attributes = (node.attributes as Record<string, string>) || {}
        src = attributes.src
      }

      if (!src) return

      src = src.replace('\\_', '_')

      if (!sizes[src]) {
        newSrcs.add(src)
      }
    })
  }

  let addedCount = 0

  for (const src of newSrcs) {
    const url = `${IMAGE_BASE_URL}/${src}`
    console.log(`Probing: ${url}...`)

    try {
      const result = await probeImageSize(url)
      if (result) {
        sizes[src] = result
        addedCount++
        console.log(`  -> ${result.width}x${result.height}`)
      } else {
        console.error(`  -> Could not get dimensions for ${url}`)
      }
    } catch (error) {
      console.error(`  -> Failed to probe ${url}:`, error)
    }
  }

  if (addedCount > 0) {
    await fs.writeFile(SIZES_FILE, JSON.stringify(sizes, null, 2), 'utf-8')
    console.log(`\n✅ Added ${addedCount} new image sizes to ${SIZES_FILE}`)
  } else {
    console.log('\n✅ No new images found. Cache is up to date.')
  }
}

run().catch(console.error)
