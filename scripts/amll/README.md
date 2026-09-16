# AMLL document-scroll adapter

The app uses the installed `@applemusic-like-lyrics/core` **0.5.2** DOM engine.
It does not carry a copy of AMLL's renderer, optimizer, timeline or spring library.

`document.patch.json` records the exact upstream code before and after each
integration change. `plugin.ts` checks the package's SHA-256, applies those edits
in memory, and bundles the DOM export through Vite. `node_modules` is unchanged.
An AMLL update fails explicitly until this patch has been reviewed for that
version; do not simply replace the checksum.

## Scope

Document scrolling requires changing the native layout's common origin, mounting
and measuring rows outside a fixed viewport, maintaining document content height,
and positioning interlude dots between animated rows. Layout still uses native
viewport coordinates to calculate stagger delays before translating final DOM
positions. The native wheel/touch scroll adapter is not attached.
Unused internal scroll-boundary updates and hidden bottom-line positioning are
omitted. Patch entries retain only the changed code and enough unique context;
unchanged upstream method bodies are not duplicated in the patch.

The app also fixes the reported ruby/line-timing issues: line timing is determined
before background timestamp normalization; line-timed annotated words use native
ruby DOM without karaoke masks; kana are distributed within the original timed
ruby span. These are rendering fixes, not replacements for AMLL's word renderer.
The remaining masks, word emphasis, springs, grouping, duet, pronunciation,
translation, timeline and background animations remain upstream implementations.

`src/lib/lyrics/document-player.ts` exposes coordinates.
`src/lib/components/lyrics/SyncedLyrics.svelte` handles document scrolling,
manual-scroll suspension, pause/resume anchoring and bottom spacing.
`src/lib/lyrics/document-player.css` contains the small scoped CSS adjustments.

Source: https://github.com/amll-dev/applemusic-like-lyrics
Original author: SteveXMH and AMLL contributors. Upstream code in the patch is
AGPL-3.0-only, like the app; see the repository `LICENSE`. Modifications dated
2026-09-16. Original implementation was inspected using the installed package's
`dist/amll-core.mjs.map` sourcesContent. See `tests/lyrics/README.md` for checks.
