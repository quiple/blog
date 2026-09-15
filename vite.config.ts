import {sveltekitOG} from '@ethercorps/sveltekit-og/plugin'
import {sveltekit} from '@sveltejs/kit/vite'
import tailwindcss from '@tailwindcss/vite'
import {defineConfig} from 'vite'
import {documentLyrics} from './scripts/amll/plugin.ts'
import {compiledMarkdown} from './scripts/compiled-markdown.ts'

export default defineConfig({
  plugins: [documentLyrics(), compiledMarkdown(), tailwindcss(), sveltekit(), sveltekitOG()],
  assetsInclude: ['**/*.md'],
  build: {
    reportCompressedSize: false,
  },
})
