# WO-8.18 — result

**Implementer:** Claude Opus, 2026-09-26. Not committed. `CHANGELOG.md` not touched. I ticked Acceptance
1–3 in `plans/work-orders/phase-8-packaging.md` and `TESTING.md`. I did not tick the 👤 line (4).
The row's status is still `🤖 CLAIMED`, and the handoff is the orchestrator's to write.

## What changed

- **`sw.js`**
  - Both lookups now go through `fromCurrent(key)`, which is `caches.open(CACHE).then(c => c.match(key))`.
    The network fallback is unchanged, and `./index.html` is still off `SHELL`.
  - Old copies are deleted by one helper, `clearOldShells()`, which filters with `isOldShell()`. It is
    called from `activate`, as before, and also from the navigate branch for the app's own document,
    under `event.waitUntil(served.catch(()=>{}).then(clearOldShells).catch(()=>{}))`. That runs after
    the response settles, so it never delays the launch and a failed delete breaks nothing.
  - `CACHE` goes from v134 to v135.
  - `skipWaiting` and `clients.claim` are untouched: same listeners, same place in each chain.
- **`tools/verify/stuck-update.mjs`** (new): ten `check()` sites, three static and seven driven.
  Registered in `tools/verify-shell.mjs` directly after `verify/worker-takeover.mjs`.
- **`tools/README.md`**
  - The call-site count goes from 1517 to 1527.
  - The file count goes from seventy-three to seventy-four.
  - New ledger paragraph for WO-8.18.
- **`TESTING.md`**: new § WO-8.18, with the evidence, the mutation round and the 👤 procedure.
- **`plans/work-orders/phase-8-packaging.md`**: Acceptance 1–3 ticked.
- **Comment-only corrections** where a comment said `activate` "deletes every cache that is not the
  current one", which is no longer true: `src/shell.js` (two places), `tools/verify/build-line.mjs`
  and `tools/wo-sweep.mjs` § 9. The About line's behaviour and wording did not change. Nothing under
  `docs/` describes the cleanup, so nothing there needed changing.

## Decisions the work order did not settle

1. **The cleanup runs after every app navigation, not on the first fetch of each worker lifetime.**
   - Every launch is a navigation to the app's own document: a cold launch, a force-quit relaunch,
     and WO-8.17's Reload all count.
   - It needs no module-level flag.
   - It makes the harness deterministic. A once-per-lifetime flag depends on whether Chromium happened
     to restart the idle worker, and I could not control that.
   - The cost is one `caches.keys()` per launch.
   - Why this point counts as "only once this worker is the active one": fetch events go only to the
     active worker, so `install` can never reach this code. The `sw.js` comment says so.
2. **The cleanup never deletes a shell cache numbered higher than `CACHE`.** The brief's rule was
   "prefix and not `CACHE`", and this narrows it further. The old worker keeps handling fetches while
   its successor installs. A launch in that window would otherwise delete the cache the successor is
   filling, and the successor would then activate over an empty cache: it works online and gives a
   white screen offline. `CACHE` only ever goes up, so a higher number always means a newer worker. A
   name under the prefix whose version will not parse is treated as old. The harness asserts that a
   newer shell cache survives. The same helper serves `activate`, so the prefix test and the version
   rule each exist in one place.
3. **The lookup uses `caches.open(CACHE)` rather than `caches.match(req, { cacheName: CACHE })`.** It
   means the same thing in every engine, and the failing engine is one nobody here can step through.
   The side effect is that a missing `CACHE` would be created empty; that only happens if something
   deleted it.
4. **The harness's iframe is `sandbox="allow-same-origin"`.** The document still goes through the
   worker, and no second copy of the app boots against the run's IndexedDB. policy-url.mjs's iframe
   lets the app boot; this one does not need to.
5. **The harness builds the order of Cache Storage on purpose.** The current cache is read out,
   deleted, and rebuilt after the plant, so the old copy is older. A check requires an unscoped
   `caches.match()` from the page to return the planted copy first. Without that check, a scoped
   lookup and an unscoped one would both pass the tag readings.

## Against the Acceptance list

1. **The document and a shell module both come from `CACHE` with an old copy planted. Ticked.**
   - Clean run: the module read `{"status":200,"tag":"current","planted":false,"length":320409}`.
   - The document, loaded in the iframe, read `{"reachable":true,"tag":"current","isApp":true,"title":"Planbook"}`.
   - The plant's precondition read `unscoped match: document = "planted", module = "planted"`, with
     `caches.keys()` listing `planbook-shell-v1` before `planbook-shell-v135`.
   - Under M1 (`fromCurrent` returning an unscoped `caches.match(key)`) the module read
     `"tag":"planted"` and the document read `"title":"wo818 planted old shell"`. Both went red.
2. **The planted cache is deleted without a new worker installing. Ticked.**
   - After one navigation: `caches.keys() = ["planbook-shell-v135","planbook-shell-v1135","planbook-wo818-not-the-shell"]`.
   - Registration: `installing:false, waiting:false, changes:0`, and both the active worker and the
     controller are `/sw.js`.
   - Under M2 (the navigation's `waitUntil` cleanup line deleted), `planbook-shell-v1` survived and the
     check went red.
3. **`skipWaiting` and `clients.claim` unchanged, and nothing outside the prefix deleted. Ticked.**
   - Static check: one `skipWaiting(`, at the end of install's chain, and one `clients.claim(`, at the
     end of activate's. No `caches.match(` in the code. A single `caches.delete(`, over
     `.filter(isOldShell)`, which requires `indexOf(SHELL_PREFIX) === 0`.
   - Driven check: `planbook-wo818-not-the-shell` survives.
   - The old `activate` deleted every name that was not `CACHE`, including caches outside the prefix.
     That is now narrowed.
4. **👤 The stuck iPad. Not ticked, and not verifiable here.** It needs the real device, still in its
   stuck state, after v135 deploys. The procedure is in `TESTING.md` § WO-8.18. It warns against any
   Safari step or clearing website data first, because either one destroys the state being read. It
   also says what each possible About reading would mean.

## Commands, from output I read

- `node tools/verify-shell.mjs`, clean, before the mutations: `1538 checks · 1538 passed · 0 failed · 0 skipped`,
  48,369 lines, 567s, EXIT=0.
- Mutation run (M1 and M2 together): `1538 checks · 1534 passed · 4 failed · 0 skipped`, EXIT=1.
  - The four FAILs were the static no-unscoped-lookup check, the module reading, the document reading
    and the deletion reading.
  - The hand-back check stayed green.
  - M1 and M2 hit different checks, so the reds can be told apart.
- Reverted by copying the clean `sw.js` back from the scratchpad.
- `grep -rn MUTATION sw.js src tools` after the revert finds only prose that was there before. I also
  reworded one comment of mine in `stuck-update.mjs` so it no longer contains the word.
- `node tools/verify-shell.mjs`, clean, after the revert and the comment edits: `1538 checks · 1538 passed · 0 failed · 0 skipped`,
  566s, EXIT=0.
- `node tools/wo-sweep.mjs`: `45 checks · 42 passed · 0 failed · 3 to review`. All three REVIEWs are
  standing ones. The sensitive-names hit on `sw.js` is the two SHELL entries that were already in
  HEAD.
- `node tools/wo-gate.mjs --audit`: PASS.

## The iOS question: bounded effort, nothing proven

- One piece of evidence is in the work order's own quote: About named **v132 and v134, not v133**,
  and v133 was deployed between them the same day. Two readings fit it, and I could not tell them
  apart from here:
  - The device never saw v133, and v134's `activate` was cut off before any delete landed.
  - The device did see v133, and a delete removed it while v132 survived every delete aimed at it.
    That is what WebKit declining or deferring the delete of a cache **in use** would look like. While
    lookups searched every cache, v132 was the cache every launch read from, so it was always in use.
- If the second reading is right, the scoped lookup ends the loop on its own.
- The fix depends on neither reading. It is recorded in a comment in `sw.js` above `shellVersion()`.
- **One limit, stated honestly:** if the iPad never installs or activates the new worker at all, this
  work order does not reach it. The 👤 procedure tells that case apart: if About lists no v135 at
  all, that is this case.

## Declined, out of scope

- I did not change the wording of WO-8.10's About line. The line itself still says "More than one
  means `activate` did not finish and the app may be serving a mix". With scoped lookups it no longer
  serves a mix, but the brief said not to change what that line reports.
- I did not add a cleanup trigger on `visibilitychange` or by `postMessage`. A launch is enough, and
  either would widen the change.

## Draft CHANGELOG entry (the teacher decides)

> An update that did not finish no longer leaves Planbook serving the old version. Planbook now reads
> only from the current copy stored on the device, and every launch tidies away older copies — so an
> iPad whose About screen named two copies should settle to one on the next relaunch, with no trip
> through Safari.
