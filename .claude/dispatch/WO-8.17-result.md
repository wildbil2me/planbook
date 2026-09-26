# WO-8.17 — result (implementer, Claude Opus)

Three of the four Acceptance lines are met and ticked, each backed by harness output quoted below. The fourth is the 👤 line. It is still `- [ ]` and the owner has to read it on the iPad and on a laptop app window.

## Files changed

- `src/shell.js`
  - The WO-8.17 comment block, `UPDATE_CHECK_EVERY_MS` (5 min), `checkForUpdate()`, the `visibilitychange` listener, `refreshUpdateBanner()` and `reloadForUpdate()`.
  - `refreshUpdateBanner()` is called from the existing `controllerchange` listener and at the end of `flipPresentationMode()`.
  - The `data-update-reload` route is in the delegated click listener, and the hook is listed in the header's hook list.
- `index.html`: `#updateBanner`, placed directly after `#presentationStrip`. It ships `hidden`.
- `src/shell.css`: `.update-banner`, `.update-banner-text` and `.update-banner-btn`.
  - The button is added to the grouped `touch-action` selector.
  - Under `@media (pointer: coarse)` the button gets `min-height: 44px`.
  - The 640px block gets the narrower side padding.
- `sw.js`: `CACHE` goes from v133 to v134. Nothing else in the file changed.
- `tools/verify/worker-takeover.mjs`: eleven new `check()` sites inside the existing WO-8.11 section.
- `tools/README.md`: the recorded call-site count goes from 1506 to 1517, plus a WO-8.17 paragraph.
- `TESTING.md`: a new § WO-8.17, with the 👤 procedure written out for the owner.
- `plans/work-orders/phase-8-packaging.md`: Acceptance 1–3 ticked. The status stays `🤖 CLAIMED`, and I ran no `--tick`.

The five code files are **staged**. I staged them before the mutation round, following the mutation-safety rule. Nothing is committed. `CHANGELOG.md` is untouched.

## Acceptance, line by line

1. **[x] A return to `visible` calls `registration.update()`, and a second return inside the window does not. Mutation-proved.**
   - Evidence from `node tools/verify-shell.mjs`: `update() calls after each return = [1,1,2], window = 300000ms`.
     - The first return made one call.
     - A second return 20s later made none.
     - A third return past the window made one more, which shows the silence comes from the throttle and not from a listener that fires once.
   - Precondition check: `getRegistration() resolved to a registration = true`.
   - How the harness does it:
     - `update()` is stubbed on `ServiceWorkerRegistration.prototype`.
     - The throttle is crossed by shifting `Date.now`, not by waiting. The window size is read from `src/shell.js`.
     - After each return, the harness waits on its own `getRegistration()` call instead of a sleep.
   - Mutation M1 (listener never attached): both checks went red at `[0,0,0]`.
2. **[x] A replacement shows the notice, and a first install does not.** Both halves use a real worker, not a `dispatchEvent`, reusing WO-8.11's `./sw.js?wo811=1` takeover and its unregister-and-reload first-install path.
   - After the takeover: `{"hidden":false,"height":43,… "button":"Reload","presenting":false}`, with no modal open.
   - On the first install (`controller at document start = null`, then claimed): `{"hidden":true,"height":0,…}, controllerchange events on this document = 1`.
   - Before the takeover the strip was hidden as well. That reading is its own check, so "shown after" is a change and not a standing state.
   - Ruling 2, driven through the real header button both ways: `projecting = {"presenting":true,"hidden":true}, after = {"presenting":false,"hidden":false}`.
   - 44px under an emulated coarse pointer: `{"coarse":true,"w":75.77,"h":44}`.
   - Mutation M3 (strip keyed off `controller` instead of the flag) turned the first-install check red at `"hidden":false`.
   - Mutation M4 (presentation mode ignored) turned the ruling-2 check red.
3. **[x] Reload flushes the store before it reloads.**
   - Setup: a change is made through the store inside the 800ms debounce, then the real Reload is tapped.
   - Result: `log across the reload = ["click","landed","pagehide"], new document = true`, and the change reads back out of IndexedDB after the reload.
   - Mutation M2 (flush removed) gave `["click","pagehide"]`. The change was also lost outright: `stored teacher.adminEmail = "dean@example.edu"`. The write the store's own `pagehide` listener started never landed, which is exactly the case the explicit flush guards against.
4. **[ ] 👤 iPad and laptop app window from `planbook.hwgteach.com`.** Not done; I have no device. The procedure is in `TESTING.md` § WO-8.17. It includes checking `location.origin` first, and a note that the throttle can swallow a switch-back made within five minutes of the previous one.

## Mutation round

- **How:** `src/shell.js` was staged and copied to the scratchpad. Four breaks were applied, each marked `MUTATION WO-8.17`, and tested in one run.
- **Result:** `1528 checks · 1522 passed · 6 failed · 0 skipped`, exit 1. The six reds are exactly the ones targeted (M1 accounts for two), and nothing else moved.
- **Revert:** I copied the clean file back before writing any doc. `git diff src/shell.js` against the staged copy is empty.
- **Grep:** `grep -rn "MUTATION WO-8.17" src/ tools/ sw.js index.html` returns nothing.
  - The broader `grep -rn MUTATION src/ tools/ sw.js index.html` is **not** empty, and it wasn't empty before I started either. It matches pre-existing prose: `src/shell.js:936` ("A CLASS MUTATION ADDED LATER") and harness and README comments that discuss past mutation rounds.
  - None of those matches is a live mutation, and I did not touch them.

## Final totals

- `node tools/verify-shell.mjs` on the delivered tree: `1528 checks · 1528 passed · 0 failed · 0 skipped`, 48,106 lines, 574s, exit 0.
  - I ran it twice with identical results: once before the mutation round and once after the revert and the doc edits.
  - The count is 1517 plus the 11 new checks.
- `node tools/wo-sweep.mjs`: `45 checks · 41 passed · 0 failed · 4 to review`.
  - § 11 reads 1517 call sites.
  - One REVIEW is new: `.update-banner-text` has no coarse rule. It is a paragraph, not a control, the same as `.presentation-strip-text`.
  - The sensitive-names REVIEW gained two lines from my diff. Both are the `supports.presentationMode()` accessor in a comment and in code; no data is emitted.
- `node tools/wo-gate.mjs --audit`: PASS.

## Decisions the work order left open

- **`location.reload()` is not stubbed; the harness taps the real Reload.** The brief asked for a stub, but Chromium's `location` is unforgeable. Stubbing it would need an indirection in `src/` that exists only for the harness. Instead, the order of events is read from a `sessionStorage` log, which survives the reload. That is a stronger check: M2 showed the data actually being lost, not just an ordering difference.
- **Colour: amber caution.** The strip is one line with the presentation strip's shape, in the install banner's amber and with the backup nag's solid button. The style guide's caution row is literally "offline/stale", and About's amber line already states this same fact. A blue "info" strip would have given one fact two colours.
- **No "Not now" button.** There is nothing to snooze: the strip disappears on any reload and only appears when a new build has taken over.
- **The first switch-back after launch always checks** (`lastUpdateCheckAt = -Infinity`). The throttle clock is stamped when a check is *attempted*, so an offline iPad isn't asked again on every switch.
- **All the code lives in `src/shell.js`, not a new module.** A new module would have to be added to `sw.js`'s `SHELL`, and the brief allows only the CACHE bump in that file.
- **The harness is in `worker-takeover.mjs`, not a new file.** That section already drives both real states the strip has to tell apart. A new file would have duplicated its worker machinery.
- **Wording:** "↻ A newer version of Planbook is ready. This screen is from the one before it. Reload when you are ready — your work is saved first." with a button labelled "Reload". This is the owner's to change.

## Things I did not do (possible follow-ups)

- **About's amber line says "pulling down to refresh does not clear this."** Now there is a strip offering a Reload for the same state, and the WO's 👤 line expects that Reload to clear it. If it does, the About sentence is misleading next to the strip. I left it alone because the brief doesn't cover it and a WO-8.11 check asserts that exact clause. Line 4's reading will settle it.
- **A Reload tapped after a failed save.** If the chip is already red (storage full), `flush()` resolves without landing the write, and the reload drops the in-memory change. `leaveCurrent()` refuses a year switch in that state. Refusing here would need a new `store` export, and nothing in the WO asks for one, so I didn't add it.
- **iOS resume may not fire `visibilitychange`**, just as it skips a page load. Only line 4 can show whether it does.

## Draft CHANGELOG line (the teacher decides)

> An open Planbook now notices a new version when you come back to it, and says so in a thin strip under the header with a Reload button — no force-quit, and nothing reloads until you tap it. The strip stays out of the way while presentation mode is on.
