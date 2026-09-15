import {mkdir, copyFile, rm} from 'node:fs/promises'
import {createServer} from 'vite'
import {fileURLToPath} from 'node:url'
const root = fileURLToPath(new URL('../../', import.meta.url))
const route = new URL('../../src/routes/__amll-port/', import.meta.url)
await mkdir(route) // Refuse to overwrite an existing route.
await copyFile(new URL('./fixture.svelte', import.meta.url), new URL('+page.svelte', route))
await copyFile(new URL('./native.ts', import.meta.url), new URL('native.ts', route))
const server = await createServer({
  root,
  cacheDir: new URL('../../node_modules/.vite-amll-test', import.meta.url).pathname,
  server: {port: 5174, strictPort: true},
})
try {
  await server.listen()
} catch (error) {
  await server.close()
  await rm(route, {recursive: true, force: true})
  throw error
}
console.log('Open http://localhost:5174/__amll-port')
let stopping = false
async function stop() {
  if (stopping) return
  stopping = true
  await server.close()
  await rm(route, {recursive: true, force: true})
}
process.once('SIGINT', () => {
  void stop()
})
process.once('SIGTERM', () => {
  void stop()
})
