# WO-1.91 — h.load() sleeps a fixed 800 ms, and every section reloads through it · result

**Implementer:** Claude Opus (work-order-implementer), 2026-11-02. Not committed. The row is left at
`🤖 CLAIMED` and neither `--tick` nor `--release` was run.

## Verdict in one paragraph

The suspect named in the work order is **refuted**. In this Edge, `waitForBoot()` never read the
page being left: there were 0 such reads in 256 scripted navigations across eight shapes.
`Page.navigate` answers only after the commit. `Page.reload` answers early, but CDP holds the next
`Runtime.evaluate` until the commit. **The `sync-button.mjs` throw was caused by the other half of
`load()`**: `waitForBoot()` ran out its 8s on a new document that was still booting, and `load()`
**threw that `false` away** and returned. The section then read `window.planbook.driveSync` on a page
whose modules had not run. I reproduced this on demand: with `src/shell.js` blocked, the unchanged
`load()` returns after 8912ms with `window.planbook` undefined. The changed `load()` marks the
document it leaves, polls one reading until the mark is gone and the loading screen is down, and
throws at 10s, or at once on a failed boot, naming the state it reached. In this sitting's first full
run it then **caught the real flake in a full run**: `readyState: complete`, `modulesRan: false`.
That means the module graph *failed*, not that the page was slow. What makes it fail is **not
reproduced**. So `load()` now also quotes the page's own uncaught exceptions and error-level log
entries, and the next occurrence will name the cause.

## Against the Acceptance list

1. **[x] `TESTING.md` § WO-1.91 says whether `waitForBoot()` can read the page being left, names the cause …, or says plainly it could not be reproduced and what was tried.**
   — §§ 1–2 of the section.
   - **Can `waitForBoot()` read the page being left: no.** 0 old-page reads in 256 navigations
     (`repro191.mjs` in the session scratchpad, not committed). The shapes were plain navigate,
     `index.html` held 2.5s, `Page.reload`, reload with `index.html` held, an old page busy for 1.5s,
     the section's `FIXED_CLOCK` pinned at 23:30 with the worker off (25) and with it on (150), and
     modules held 3s.
   - **Cause: the discarded `false`.** The throw needs a document whose modules have not run, since
     `window.planbook` is assigned at module scope in `src/shell.js`. The unchanged `load()` hands
     exactly that page back.
   - **The record behind it:** 6 throws in 101 earlier full-run logs that reached that point, read
     from earlier session scratchpads on this machine, all at the same reload. Two of them are the two
     in `.claude/dispatch/WO-3.73-result.md`.
   - **Not reproduced:** why that one reload's module graph fails. The pinned clock alone is clean
     (175/175). The section cannot run without the 87 sections before it. No `src/` module computes a
     date at module scope.
2. **[x] `load()` no longer depends on a fixed sleep, and it does not return until the new document has replaced the old one and booted.**
   — `grep -n "setTimeout(r, 800)" tools/verify-shell.mjs` finds nothing. The only exit that does not
   throw is a single reading with `window.__loadLeaving` gone and `#loadingScreen` hidden. I measured
   that a same-URL navigation to `?door=skip` drops the mark (20/20, and 11/11 under a slow response).
3. **[x] A `load()` whose new page never boots still fails loudly, and does not read as a pass.**
   — These are probe sections in a scratch copy of the harness (`make-only.mjs` writes it into the
   scratchpad, so **no mutation was put in the tree**).
   - **Blocked `src/shell.js`:** `FAIL | § probe191-block … gave up after 10000ms — states booting, last reading {…"ready":"complete","modulesRan":false…}; the page reported no exception and no error-level log entry since the navigation`.
   - **IndexedDB throwing:** `FAIL | § probe191-fail … the boot failed and said so — states booting>failed …`.
   - After both, `probe191-after` PASSes, so the page came back.
   - On the unchanged `load()`, both probes returned normally, after 8912ms and 8874ms.
   - In the wild: the pre-capture full run failed `sync-button.mjs` on `load()`'s own message instead
     of a TypeError.
4. **[x] Three consecutive full runs … green, run lines quoted.**
   - All five runs were on tree md5 `dda4e9be512e`, sequential, with nothing beside them. Each was
     waited out to its `EXIT=`.
   - Run 1: `2205 checks · 2205 passed · 0 failed · 0 skipped`, 1217s, EXIT=0.
   - Run 2: `2186 checks · 2185 passed · 1 failed`, 1209s, EXIT=1. This was
     `verify/cooldown-quiet.mjs`'s **own** `reload45()` (WO-1.89's local wait, not `load()`):
     `the reload never handed back a new, booted document inside 10s: {"left":true,"booted":false}`.
     It is the same non-boot family, in a section this work order does not touch.
   - **Runs 3, 4, 5: `2205 checks · 2205 passed · 0 failed · 0 skipped`**, 1196s, 1193s and 1194s,
     EXIT=0 each. Those are the three consecutive greens.
   - An earlier run (`4818607bd2a7`, before the error capture was added) was red at `sync-button`'s
     same-day reload. It is recorded as diagnosis and not counted.
5. **[x] `node tools/wo-sweep.mjs` passes.**
   - `52 checks · 49 passed · 0 failed · 3 to review`, EXIT=0, the three standing reviews.
   - It was run after run 5, and again after the ticks were written.
   - `node tools/wo-gate.mjs --audit` also PASSes.
6. **[x] `TESTING.md` § WO-1.91 carries these lines verbatim with the evidence for each.**
   - It is under `## Phase 1`, after § WO-1.90.

No 👤 and no 📆 lines. Nothing in `src/` moved (`git status --short src/` empty), so no `CACHE` bump
is owed. No `check(` was added, so neither count in `tools/README.md` moved.

## Files changed

- `c:\dev\planbook\tools\verify-shell.mjs`
  - `load()`: mark, a single-reading poll, a 10s deadline, a throw on failure, and the page's errors
    quoted in that throw.
  - The first `load()` call is wrapped in `bail()`.
  - New `pageErrors` capture in `ws.onmessage`, from `Runtime.exceptionThrown` and error-level
    `Log.entryAdded`.
  - `Log.enable` after `Runtime.enable`.
  - A comment on `waitForBoot()` saying why it is not taught the difference.
- `c:\dev\planbook\tools\README.md`: the WO-1.91 ledger paragraph after WO-1.90's.
- `c:\dev\planbook\TESTING.md`: § WO-1.91.
- `c:\dev\planbook\plans\work-orders\phase-1-shell-store-roster.md`: the six Acceptance boxes ticked.
  The status line is the orchestrator's earlier edit.

`grep -rn MUTATION` over the changed files: the diff adds none (`git diff | grep '^+' | grep -c
MUTATION` → 0, and `tools/verify-shell.mjs` has none). No scratch file is in `tools/`.

## Decisions the work order did not settle

- **The deadline is 10s.** That is WO-1.89's `reload45()` budget. The old effective wait was 8.8s.
  It is a deadline, not a sleep: a good load returns at its first `booted` reading.
- **A failed boot throws at once** rather than burning the budget. No caller of `load()` expects a
  boot failure.
- **The first call bails the run** with the message rather than escaping as an unhandled rejection.
- **The page-error capture (`Log.enable` + `pageErrors`) goes slightly past "fix `load()`".** I added
  it after the first full run showed `readyState: complete, modulesRan: false`, because without it
  the next occurrence would again say *what* and not *why*. It is passive, it is read only by
  `load()`'s throw, and a blocked request shows no event at all (measured). The orchestrator may
  prefer to split it out. It is a few lines in one file.
- **`waitForBoot()` was not changed.** Its comment says why: it has no "before" to compare against,
  and the old-page read does not happen in this browser.
- **The local copies stay local.** `cooldown-quiet.mjs`'s `reload45()` checks the stored fixture
  before reloading. `front-door.mjs` navigates without `?door=skip` and waits for `door`. Both are
  green and both already wait on the condition `load()` now waits on.

## Follow-ups (not done, out of scope)

1. **101 `await waitForBoot();` sites in `tools/verify/` discard its `false`.** That is defect (b) in
   other places. A section-local reload that does not boot carries on and fails later on an unrelated
   read.
2. **`cooldown-quiet.mjs`'s `reload45()` failed run 2 with a non-boot**, and its message cannot say
   whether the modules ran. Either it moves to `h.load()` (it would gain the state and the page
   errors) or it gains the same reading.
3. **The non-boot itself.** On this machine, this morning, a fresh document failed to boot in 2 of 6
   full runs. One was through `load()` and one through a section's own reload. The next `load()`
   failure will quote the exception or log entry. If it names a `src/` module, that is an app work
   order.
4. **`load()` does not assert the seam.** A probe that made the `window.planbook` assignment throw
   *after* the boot listener was registered still booted, and `load()` returned in 297ms. A booted page
   without `window.planbook` would be an app defect, and the next read throws loudly anyway, so I left
   it out.

## Draft CHANGELOG entry (the teacher decides)

> **The harness stops handing sections a page that never started (WO-1.91).** `verify-shell.mjs`'s
> shared `load()` used to sleep 800ms, wait up to 8s for the app to boot, and return whether it had
> or not. That last part is what made `sync-button.mjs` throw `reading 'driveSync'` in about one run
> in seventeen. Now it waits until the old page is gone and the new one is up, and when the new one
> never starts it fails at once and says how far the page got and what the page reported. It does not
> carry on into a confusing error three reads later. The suspicion that it was reading the page it
> had just left turned out to be wrong: in 256 tries it never did.
