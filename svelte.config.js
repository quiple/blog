import adapter from '@sveltejs/adapter-cloudflare'
import {vitePreprocess} from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
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
  },
}

export default config
