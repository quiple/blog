import path from 'path'
import {sveltekit} from '@sveltejs/kit/vite'
import tailwindcss from '@tailwindcss/vite'
import {defineConfig} from 'vite'

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  assetsInclude: ['**/*.md'],
  resolve: {
    alias: [
      {
        find: /^remark-github-alerts$/,
        replacement: path.resolve('node_modules/remark-github-alerts/src/index.ts'),
      },
    ],
  },
})
