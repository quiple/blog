import {createHash} from 'node:crypto'
import {readFile} from 'node:fs/promises'
import {createRequire} from 'node:module'
import {build, type Plugin} from 'vite'
import patch from './document.patch.json' with {type: 'json'}

/** Apply the reviewed document adapter to this pinned AMLL build, not node_modules. */
export function documentLyrics(): Plugin {
  const source = createRequire(import.meta.url)
    .resolve('@applemusic-like-lyrics/core')
    .replace(/\.cjs$/, '.mjs')
  const id = `${source}?amll-document`
  let bundle: Promise<string> | undefined
  return {
    name: 'amll-document',
    enforce: 'pre',
    resolveId(name) {
      if (name === 'virtual:amll-document') return id
    },
    async load(name) {
      if (name !== id) return
      let code = await readFile(source, 'utf8')
      if (createHash('sha256').update(code).digest('hex') !== patch.sha256) {
        throw new Error(`AMLL changed: review the document adapter for core ${patch.version} before upgrading.`)
      }
      for (const {label, before, after} of patch.changes) {
        if (code.indexOf(before) < 0 || code.indexOf(before) !== code.lastIndexOf(before))
          throw new Error(`AMLL patch mismatch: ${label}`)
        code = code.replace(before, after)
      }
      // Bundle the DOM export so development also handles AMLL's CommonJS
      // dependencies. Unused renderer exports are tree-shaken by Vite.
      bundle ??= (async () => {
        const result = await build({
          configFile: false,
          publicDir: false,
          logLevel: 'silent',
          plugins: [
            {
              name: 'amll-dom-entry',
              resolveId(name) {
                if (name.endsWith('virtual:amll-entry')) return '\0amll-entry'
                if (name === id) return id
              },
              load(name) {
                if (name === '\0amll-entry') return `export {DomLyricPlayer} from ${JSON.stringify(id)}`
                if (name === id) return code
              },
            },
          ],
          build: {
            write: false,
            minify: false,
            lib: {entry: 'virtual:amll-entry', formats: ['es'], fileName: 'amll-document'},
          },
        })
        const outputs = Array.isArray(result) ? result : [result]
        for (const output of outputs)
          if ('output' in output)
            for (const chunk of output.output) if (chunk.type === 'chunk' && chunk.isEntry) return chunk.code
        throw new Error('AMLL DOM bundle was not generated')
      })()
      return {code: await bundle, map: null}
    },
  }
}
