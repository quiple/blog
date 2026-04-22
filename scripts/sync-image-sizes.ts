import fs from 'fs/promises'
import path from 'path'
import probe from 'probe-image-size'
import {remark} from 'remark'
import remarkDirective from 'remark-directive'
import {visit} from 'unist-util-visit'

const POSTS_DIR = path.resolve('src/posts')
const SIZES_FILE = path.resolve('src/lib/image-sizes.json')

// Base URL to fetch images from (can be prod URL where images are hosted)
const IMAGE_BASE_URL = 'https://quiple.dev/img'

async function getMarkdownFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, {withFileTypes: true})
  const files = await Promise.all(
    entries.map(async (entry) => {
      const res = path.resolve(dir, entry.name)
      return entry.isDirectory() ? getMarkdownFiles(res) : res
    }),
  )
  return files.flat().filter((f) => f.endsWith('.md'))
}

async function run() {
  let sizes: Record<string, {width: number; height: number}> = {}

  try {
    const data = await fs.readFile(SIZES_FILE, 'utf-8')
    sizes = JSON.parse(data)
  } catch (e) {
    // File doesn't exist or invalid JSON, start fresh
  }

  const files = await getMarkdownFiles(POSTS_DIR)

  // Use remark to parse files and find all images and figures
  const processor = remark().use(remarkDirective)

  let addedCount = 0

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

      if (sizes[src]) return

      // We'll process this src later to avoid duplicate console logs/probes in the same run
      sizes[src] = {width: 0, height: 0}
    })
  }

  const srcsToProbe = Object.keys(sizes).filter((s) => sizes[s].width === 0)

  for (const src of srcsToProbe) {
    const url = `${IMAGE_BASE_URL}/${src}`
    console.log(`Probing: ${url}...`)

    try {
      const result = await probe(url)
      let {width, height, orientation} = result

      // Swap width and height if orientation is 5, 6, 7, or 8 (portrait/swapped)
      if (orientation !== undefined && orientation >= 5) {
        ;[width, height] = [height, width]
      }

      sizes[src] = {width, height}
      addedCount++
      console.log(`  -> ${width}x${height}${orientation ? ` (orientation: ${orientation})` : ''}`)
    } catch (error) {
      delete sizes[src]
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
