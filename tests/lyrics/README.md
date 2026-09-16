# Browser regression checks

Run `node tests/lyrics/serve.mjs`, then open the printed local URL in a browser.
The fixture runs automatically and shows JSON with `pass: true` when complete
(about 25 seconds). Stop the command to remove the temporary route.
It uses a synthetic playback clock; it does not contact a music provider.

Checks include 320 comparisons of native AMLL 0.5.2 and the document adapter (row
positions modulo the document origin, active states, opacity and stagger delay),
ruby baselines and absence of masks on line-timed ruby, initial/ended dots,
pause/resume anchoring with an inactive background row above the active row,
interlude overlap and natural gap removal, stable preceding-row positions across
interlude exit, and last-row document alignment.

`native.ts` gives both engines the same measured row heights to distinguish
layout behavior from native viewport virtualization. The fixture is not included
in the production routes or client bundle. It tests the DOM engine; actual
provider playback and cross-browser font rasterization require separate checks.
