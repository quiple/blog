// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    interface Platform {
      env: {
        R2: R2Bucket
      }
      context: {
        waitUntil(promise: Promise<unknown>): void
      }
      caches: CacheStorage & {default: Cache}
    }
  }
}

export {}
