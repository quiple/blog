// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
  }
  namespace Cloudflare {
    interface Env {
      R2: R2Bucket
      INTERNAL_IMAGE_SECRET?: string
    }
  }
}

export {}
