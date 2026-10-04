import adapter from '@sveltejs/adapter-cloudflare'
import {vitePreprocess} from '@sveltejs/vite-plugin-svelte'
import {sveltekitOG} from '@ethercorps/sveltekit-og/plugin'
import {sveltekit} from '@sveltejs/kit/vite'
import tailwindcss from '@tailwindcss/vite'
import {defineConfig} from 'vite'
import {documentLyrics} from './scripts/amll/plugin.ts'
import {compiledMarkdown} from './scripts/compiled-markdown.ts'

export default defineConfig({
  plugins: [
    documentLyrics(),
    compiledMarkdown(),
    tailwindcss(),
    sveltekit({
      preprocess: vitePreprocess(),
      adapter: adapter(),
      prerender: {
        handleUnseenRoutes: (details) => {
          console.warn('handleUnseenRoutes', JSON.stringify(details, null, 2))

          return
        },

        handleHttpError: ({path, message}) => {
          console.log('handleHttpError', path, message)

          // ignore deliberate link to shiny 404 page
          if (path.split('/').length === 2) return

          if (path.startsWith('/og.png')) return

          // otherwise fail the build
          throw new Error(message)
        },

        handleMissingId: (details) => {
          console.log('handleMissingId', JSON.stringify(details, null, 2))

          return
        },
      },
    }),
    sveltekitOG(),
  ],
  assetsInclude: ['**/*.md'],
  build: {
    reportCompressedSize: false,
  },
})
