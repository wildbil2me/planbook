# WO-8.16 — a first-time visitor meets the front page, not an empty gradebook · result

**Implementer:** Claude (Opus), 2026-10-09. Nothing committed. Row left at `🤖 CLAIMED`. No `--start` and no `--release` run.

## What was built

- **`src/front-door.js`** (new). It holds the decision and the door.
  - `mightBeAStranger()` is synchronous. It checks the loopback-only skip flag, then `isInstalled()`, then `getPref('openYear')`. If the preference is there, the app boots with no await in front of it (ruling 3).
  - `standAtDoor()` runs only when that returns true:
    1. It calls `store.yearDatabaseListed()`. Only a clean `false` goes on.
    2. It fetches `./about.html` with a 5s timeout.
    3. It lifts the pieces by their `data-front-door` markers and draws the door for this browser in a single task: door up, app chrome hidden, loading screen down.
    4. It waits for `enter()`.

    Any doubt opens the app: a missing or throwing `databases()`, a failed fetch, or a missing marker.
  - `skipAllowedOn()`, `skipAsked()` and `deviceOf()` are pure functions, exposed for the harness.
- **`src/store.js`** gained `yearDatabaseListed()`. It is read-only and calls `indexedDB.databases()` and nothing else. It returns `true`, `false`, or `null` for doubt, and it keeps `DB_NAME` inside the store.
- **`src/shell.js`**:
  - It asks the door at the head of the `DOMContentLoaded` boot, before `store.boot()`: `if (frontDoor.mightBeAStranger()) await frontDoor.standAtDoor();`
  - The click listener has a new `data-front-door-enter` branch, and the hook list names it.
  - `frontDoor` is added to the `window.planbook` seam.
- **`src/front-door.css`** (new). It is `proposed-phase8.css` § FRONT DOOR lifted whole: same names, same values. Two kinds of addition:
  - the rule that hides `body > header/main/aside` while the door is up;
  - about.html's own values for the words it lifts (`a`, `.quiet`, `code`, `.block-link`), scoped under `.front-door-body`. `.block-link` gets 44px in the coarse block.
- **`index.html`**:
  - one `<link>` to the new sheet;
  - `#frontDoor`, hidden in the markup. It holds only the door's own chrome, for three variants (`ios`, `laptop`, `cannot`): headings, subtitles, the button and the notes, as drawn. Every other word arrives through a `data-front-door-slot` placeholder.
- **`about.html`**: nine invisible `data-front-door` markers, plus a header paragraph saying the app reads this file. It still has no script and no manifest, and its visible text is unchanged.
- **`sw.js`**: `CACHE` bumped from v173 to v174, and `./src/front-door.css` and `./src/front-door.js` added to `SHELL`. The fetch handler is untouched.
- **Harness**:
  - `load()` now navigates to `/index.html?door=skip`, and `verify/first-run.mjs`'s fresh device does too.
  - New section `tools/verify/front-door.mjs` with 18 checks, registered after `verify/first-run.mjs`.
- **Docs**:
  - `design/mockups/proposed-phase8.css`: banner amended to "lifted 2026-10-09", with what the lift added.
  - `tools/README.md`: call-site count changed from 1860 to 1878, plus a ledger paragraph.
  - `TESTING.md`: new § WO-8.16 under Phase 8.
  - `plans/work-orders/phase-8-packaging.md`: Acceptance 1–4 ticked.

## Acceptance, line by line

1. **[x] A cold, non-installed visit with no stored year shows the front door. An installed launch, and a browser visit to a device that already holds a year, both open the app with no flash of it.**
   - **Evidence:** `verify/front-door.mjs` on a wiped `http://localhost:<port>` origin, with no flag.
   - **Cold visit:** settles on the door. Variants are `["laptop"]`, header and main are not laid out, the loading screen is down, and the observer reads `appSeen:false`.
   - **Same device reloaded once it holds a year:** `doorSeen:false`.
   - **Preference removed, database kept:** `databases()` names `planbook`, and `doorSeen:false`.
   - **`databases()` stubbed to return an empty list, preference present:** no door. This shows the preference is read first.
   - **Installed launch** (stand-in for `navigator.standalone`), on a cold device and on a device holding a year: no door either time.
   - **Limit:** "no flash" is read from a MutationObserver at task boundaries. It is not a paint reading.
2. **[x] The door is never the only way forward.**
   - The laptop and Firefox doors read "Use it in this browser" and it is the primary button.
   - The iPad door (user-agent stand-in) reads "Use it in Safari for now" and is not primary, as drawn.
   - Every door control measures at least 44px under a real coarse pointer.
   - Tapping it lands on home with `#homeFirstRun [data-backup-panel]` drawn. That is trap 4, checked rather than assumed.
3. **[x] An offline launch of the installed app is unchanged.**
   - The `sw.js` fetch handler is untouched.
   - Driven test: once the worker controls the second origin, an installed launch (standalone stand-in) to a unique `/index.html?wo816=…` made **0** requests to the static server. Nothing for the document, the door's files or about.html. The app booted with no door.
   - `verify/policy-url.mjs`'s existing Cache Storage check is still green.
   - No network-offline emulation was used. The evidence is what the server was asked for, the same reading WO-8.12's check uses.
4. **[x] Detecting "no school year stored" writes nothing.**
   - With the door up: `databases = []`, `localStorage keys = []`, and no document is open.
   - Only after the tap: `["planbook"]`, with keys `planbook_openYear` and `planbook_openView`.
   - Static check: the probe has no `open()` or `connect()`, the door module has no `.open(` and no `setPref`, and the door is asked before `await store.boot()`.
5. **[ ] 👤 iPad Safari, then installed, then laptop Edge, walked in cold. NOT VERIFIED.** There is no iPad here. A user-agent string is not Safari. Still unchecked: the real iPadOS `indexedDB.databases()`, the band's safe-area padding, and the real installed launch. To walk in cold, the origin's storage has to be cleared first: Safari → Advanced → Website Data, or a home-screen delete for the installed copy.

## Commands, from output I read

- **`node tools/verify-shell.mjs`** (final tree): `1881 checks · 1881 passed · 0 failed · 0 skipped`, `59,925 lines · 31.9 lines per check · 877s`, `EXIT=0`. That is 1863 plus 18. An earlier full run, before the Acceptance 3 check was added, read 1880/1880, exit 0.
- **`node tools/wo-sweep.mjs`** (final tree): `50 checks · 46 passed · 0 failed · 4 to review`. One of the reviews lists the new sheet's six layout classes. None of them is a touch target.
- **`node tools/wo-gate.mjs --audit`**: PASS.

## Mutation round

Each mutation was marked `MUTATION`, run on a scratchpad copy of the harness filtered to `localstorage-prefs|front-door`, and reverted before anything else was written.

- **M1.** The probe opens the database before listing: **7 checks went red.**
- **M2.** `null` draws the door: only "doubt draws no door" went red.
- **M3.** The preference check is skipped: only "the preference is asked first" went red.
- **M4.** `sw.js`'s navigate branch goes to the network: the Acceptance 3 check went red (`requests for the document = 1`). It was restored from a scratchpad copy.

Afterwards, `grep -rn MUTATION` over the delivered files finds only `src/shell.js`'s old prose line "A CLASS MUTATION ADDED LATER".

## Decisions the work order left open

- **How the words arrive (Deliverable 3): fetched.** `about.html` has no script by construction, and `about-page.mjs` asserts that. So it cannot load a copy kept in the shell, and the only alternative would be a second copy, which the Deliverable forbids. The fetch only happens on the launch that shows the door, and that launch is online. If the fetch fails or a marker is missing, there is no door and the app opens.
- **The door's own chrome lives in `index.html`:** headings, subtitles, button labels and the note line, taken from the drawing. This follows the install-banner convention that the copy a teacher reads lives in the markup.
- **What each door lifts from about.html:**

  | Door | Pieces |
  |---|---|
  | iOS | iPad steps, caution |
  | Laptop | install paragraph, Chrome/Edge steps, backup line |
  | Firefox | cannot-install paragraph, backup line |
  | All doors | lede, plus the "What it does" and "Where your students' information goes" panels, whole |

- **How browsers are told apart:**
  - iOS: `iPad|iPhone|iPod`, or `Macintosh` with more than 1 touch point.
  - "Cannot install": desktop Firefox only.
  - Everything else, including Mac Safari and Android, gets the laptop door.
  - `beforeinstallprompt` is not used (ruling 5).
- **Skip flag:** `?door=skip`, loopback hosts only (`localhost`, `127.0.0.1`), exact match.

## Known rough edges, flagged for the owner (not fixed)

- **"Open Planbook." as step 1.** The laptop door lifts about.html's Chrome/Edge steps word for word, so step 1 tells someone already in Planbook to open Planbook. Likewise the iOS steps begin "Open Planbook in Safari." The fix is a rewording in about.html, which changes both pages at once. That is the owner's call.
- **Mac Safari gets the laptop door,** whose install sentence describes Chrome and Edge. Safari 17's "Add to Dock" is not described anywhere.
- **The About page links back into the door.** about.html's "Open Planbook →" goes to `./`. For a stranger with no year, that lands on the door, which repeats the About content with a way in added. Accepted as harmless.
- **`tools/README.md` line 1319** still says "the eighty files under `tools/verify/`". That was already stale before this work order. Left alone.

## Out of scope, declined

`navigator.storage.persist()`, as the work order says. No `planbook_` key was added (ruling 2).

## Files changed

c:\dev\planbook\src\front-door.js (new), c:\dev\planbook\src\front-door.css (new), c:\dev\planbook\tools\verify\front-door.mjs (new), c:\dev\planbook\src\store.js, c:\dev\planbook\src\shell.js, c:\dev\planbook\index.html, c:\dev\planbook\about.html, c:\dev\planbook\sw.js, c:\dev\planbook\tools\verify-shell.mjs, c:\dev\planbook\tools\verify\first-run.mjs, c:\dev\planbook\tools\README.md, c:\dev\planbook\design\mockups\proposed-phase8.css, c:\dev\planbook\TESTING.md, c:\dev\planbook\plans\work-orders\phase-8-packaging.md

## Draft CHANGELOG entry (the teacher decides)

> Someone who types the address and has never used Planbook on that browser now sees what Planbook is, where student data goes and how to install it on their device, instead of an empty gradebook. "Use it in this browser" is always on the screen and leads to the home screen, where Restore is. Installed apps, and browsers that already hold a school year, open straight into the app as before.
