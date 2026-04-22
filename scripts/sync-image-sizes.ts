import fs from 'fs/promises'
import path from 'path'
import probe from 'probe-image-size'

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
  const srcRegex = /::figure(?:\{[^}]*?src=["']([^"']+)["'][^}]*?\})/g

  let addedCount = 0

  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8')
    let match

    while ((match = srcRegex.exec(content)) !== null) {
      const src = match[1].replace('\\_', '_') // as done in +page.server.ts

      if (sizes[src]) {
        continue // Already fetched
      }

      const url = `${IMAGE_BASE_URL}/${src}`
      console.log(`Probing: ${url}...`)

      try {
        const result = await probe(url)
        sizes[src] = {width: result.width, height: result.height}
        addedCount++
        console.log(`  -> ${result.width}x${result.height}`)
      } catch (error) {
        console.error(`  -> Failed to probe ${url}:`, error)
      }
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
