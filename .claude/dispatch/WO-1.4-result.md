# Result — WO-1.4 Year document store

Implementer: Claude (work-order-implementer), 2026-08-04. Branch `phase/1-shell-store-roster`.
This run **finished and corrected an interrupted draft** of `src/store.js` rather than starting
from scratch — see the status file's 09:12 correction.

Nothing was committed. No roadmap box ticked, nothing under `plans/` touched, `CHANGELOG.md` and
`TESTING.md` untouched.

---

## 1. The draft: what I kept, what I changed

**I kept `src/store.js` almost entirely.** I read it line by line against the brief,
`docs/data-model.md`, and the Traps line first. The audit found the module sound: one object
store keyed by year, the whole document as one record, no index, `rev` bumped once per save and
rolled back on a failed write, a retry before the error state, the debounce + `visibilitychange`
+ `pagehide` trio, and a migration ladder that refuses a newer document and refuses a gap. The
document shape matches `docs/data-model.md` field for field, `scores` seeds to `{}` (a cell is
always an object), and there is no schedule model. Its comments carry the reasoning and are
untouched.

**The only change I made to the draft** is one addition, ~14 lines:

- `leaveCurrent()` — extracted the `await flush()` that `openYear()` and `createYear()` already
  did, and made it **refuse to switch years when the flush did not land** (`dirty` still true
  means the last change is in memory and nowhere else; replacing `current` there is the one way
  this store can drop a grade with no error anywhere). `flush()` still resolves through a failed
  write, because it is also called from `pagehide` where throwing helps nobody — so the refusal
  lives at the call site, not in `flush()`. The thrown message is teacher-readable and reaches
  the year picker's error line.

Everything else in `store.js` is the draft's, verbatim.

**I did not rewrite anything.** The two defects the orchestrator found were both outside
`store.js`: an undeclared preference key, and the fact that nothing imported the module.

---

## 2. The two known defects

**(1) `setPref('openYear', …)` was refused at runtime.** Confirmed by reading `prefs.js`
(`setPref` returns `false` and logs for any key not in `PREF_DEFAULTS`) — the guard is working as
designed. Fixed by **declaring the key**, not by weakening the guard: `PREF_DEFAULTS.openYear`
now exists with a default of `''` and a comment saying the last-open year is a fact about this
browser and not about a student, that only the label is stored, and that the iPad and the laptop
are each allowed to sit on a different year. Verified live: the harness reads
`planbook_openYear = "2030-2031"` after a year switch, and the pre-existing check
"every planbook_ key present is a declared UI preference, and no student data" still passes with
that key present.

**(2) The store was wired into nothing.** Both unlanded deliverables now land:

- **Save indicator wired to real save state.** `src/shell.js` boots the store on
  `DOMContentLoaded` and hides the loading screen behind it. The chip now shows `saving` →
  `saved` on every real write and `retry` → `error` on a failed one. Verified by measurement,
  not by reading (see Acceptance 3).
- **Year switching UI.** New module `src/year-picker.js` + a header button + `#yearModal` in
  `index.html`: it lists the years on this device, marks the open one, switches on tap, and
  creates a new year from a form field. Driven end to end by the harness.

---

## 3. Files

| Path | What |
|---|---|
| `c:\dev\planbook\src\store.js` | **New (the draft, finished).** Kept as written; added `leaveCurrent()` and used it in `openYear()` / `createYear()`. |
| `c:\dev\planbook\src\year-picker.js` | **New.** The header year button and the picker modal's behavior. |
| `c:\dev\planbook\src\prefs.js` | Declared `openYear` in `PREF_DEFAULTS`, with the reason. |
| `c:\dev\planbook\src\shell.js` | Boots the store; hides the loading screen after it; boot-failure screen; three new `data-*` hooks + the one `submit` listener; `store` added to the `window.planbook` seam; hook list in the header comment extended. |
| `c:\dev\planbook\src\save-indicator.js` | Header comment updated to say what now drives it, and why `demoSaveCycle()` outlives WO-1.4. No behavior change. |
| `c:\dev\planbook\src\shell.css` | `.hdr-year-btn`, the `YEAR PICKER` section, and the loading-screen error copy — each with its `@media (pointer: coarse)` entry in the same pass, and the two new tappable classes added to the `touch-action` group. Colors inline. No dark mode. |
| `c:\dev\planbook\index.html` | Year button in the header, `#yearModal`, loading-screen error block, and three stale comments/copy corrected (see §6). |
| `c:\dev\planbook\tools\verify-shell.mjs` | One new section, `--- year document store ---`, plus a coarse-pointer measurement of the year picker. No second harness, no new tool. |

`tools/verify-shell.mjs` run: **52 checks · 52 passed · 0 failed · 0 skipped** (the 28 that
existed at WO-1.3 all still pass; three consecutive identical runs, so it is not timing-flaky).
I deliberately did **not** update the "It went green at WO-1.3, 28 of 28" line in
`tools/README.md`: recording a verified green count is the teacher's to write after the verifier
reports, not mine.

---

## 4. Acceptance, line by line

**1. A change persists across a full reload, and across an app relaunch on iPad.**

- Reload half — **verified by running it.** The harness edits `teacher.name`, flushes,
  `Page.reload`s, waits for boot, and re-reads: `{"year":"2026-2027","rev":4,
  "docId":"32e5…","name":"Persisted Probe","school":"probe two","label":"2026-2027"}`. The value,
  the `rev`, and the `docId` all survive, and the loading screen came down only after the
  document was in memory. Two checks.
- iPad relaunch half — **not verified. Needs a real device.** Steps for the teacher:
  1. `node tools/make-cert.mjs` (once) then `node tools/serve-https.mjs`; open the **HTTPS**
     URL on the iPad (a LAN address over plain HTTP is not a secure context — this cost WO-1.2 a
     false pass) and Add to Home Screen.
  2. Launch from the home-screen icon. Tap the year button; note the year.
  3. In Safari's console you cannot reach the store from a home-screen launch, so make the
     change the app can make on its own: create a year (e.g. `2027-2028`) from the picker. The
     chip should flash *Saving…* then *✓ Saved*.
  4. Swipe the app away from the multitasking switcher — a real kill, not a background — and
     relaunch it from the icon.
  5. It must open on `2027-2028` and the picker must still list both years.

**2. `rev` increases by exactly one per save; two rapid edits inside the debounce window are one
save and one `rev`.** — **verified by running it.** Three checks:
`rev 1 → 2` across two `update()` calls 60 ms apart with the later value stored
(`teacher.school = "probe two"`); `rev` unchanged *during* the debounce window (it counts saves,
not keystrokes); and a subsequent single save moving `rev 3 → 4` with a fresh `updatedAt` inside
120 s of now.

**3. A save failure surfaces the error state on the indicator and does not silently swallow.** —
**verified by running it**, with a real failure and nothing stubbed: the harness puts a function
into the document, so `put()` throws `DataCloneError` out of the same line a full disk would.
Four checks: the chip goes `save-indicator error` / `✕ Save failed`; the live region receives
"Save failed. Your last change may not be stored." (the `error`/`retry` announcements are by
design — noted in the brief); `rev` is rolled back so memory never claims a save storage never
saw; and the failure reaches the console at error level naming the year — captured from
`Runtime.consoleAPICalled`, which is the only way "does not silently swallow" is falsifiable.

**4. Two year documents coexist; switching between them shows the right data.** — **verified by
running it, through the UI rather than the API**, since the deliverable is about controls a
teacher can reach. The harness clicks the header year button, asserts the picker lists exactly
the one year that exists and marks it current, types `2030-2031` into the field, submits the
form, and asserts: two records in the store, the new one open, `rev 1`, zero students, a
different `docId`, the modal closed, and the header relabelled. It then re-opens the picker,
clicks the first year's row, and asserts the first year's data is back (`docId`, `teacher.name`,
`teacher.school`, `rev`) and not the second's.

**5. A document written before a schema bump loads through the migration hook without loss.** —
**verified by running it.** `MIGRATIONS` is empty today, so what is shown is that the path
exists and runs: the harness writes a `schemaVersion: 0` document straight into IndexedDB (with
a class, a student, a `{v:87}` score cell and an attendance mark), installs a step at
`MIGRATIONS[0]` for the length of one `openYear()`, and removes it. Three checks: the step ran
exactly once and `schemaVersion` is now 1; students, scores, marks, `docId` and teacher all
survive; and the migrated document was **written back** (`rev 7 → 8`, and the stored copy —
re-read off disk, not from memory — carries the new version), so a document migrates once rather
than on every open.

### The Traps (not on the Acceptance list, but what the work order protects)

- **One object store, one record per year.** Verified by measurement: `stores=["years"]`,
  `keyPath=year`, `indexes=[]`, and every record is the whole document (has `students`,
  `classes`, `attendance`, `scores`, `rev`). Nothing normalized out.
- **Debounce, and flush on `visibilitychange`.** Verified by measurement and by timing:
  `document.visibilityState` is shadowed to `'hidden'` and the event dispatched, and the edit is
  on disk **2 ms** later — while the 800 ms debounce would still have had 800 ms to run. The
  `pagehide` listener is code-read only; it cannot be dispatched meaningfully in this harness,
  and the iOS behavior it exists for needs hardware regardless.

---

## 5. What I could not verify

- **Anything on a real iPad.** The relaunch half of Acceptance 1; that iOS actually delivers
  `visibilitychange`/`pagehide` before killing a backgrounded tab; that the year button and the
  picker are comfortable under a thumb. The harness proves the geometry (every year-picker
  control measures ≥44 px on an emulated coarse pointer, measured with the modal open because
  a closed modal's controls measure 0×0 and would pass vacuously) — it does not prove the feel.
- **Appearance.** Nothing in this run looked at the app. The header year button and the picker
  are built from the style guide's on-dark grammar and the existing modal tier, but a human
  should open `node tools/serve-https.mjs` and look at them before this is called done.
- **The boot-failure screen.** If `boot()` throws, the loading screen stays up and explains
  itself (private browsing is the usual cause). I reasoned this path, read it, and did not
  execute it — forcing it would mean injecting a broken `indexedDB` before page load
  (`Page.addScriptToEvaluateOnNewDocument`), which is harness machinery for a behavior that is
  not on the Acceptance list. Proposed as a follow-up below.
- **`onblocked` / two-tab behavior.** Read, not exercised.

---

## 6. Decisions the work order did not settle

1. **A year switch refuses when the current document has an unsaved change** (`leaveCurrent()`).
   Slightly beyond the letter of "open one", and I went this way because the alternative is a
   silent data loss in exactly the situation the chip is red about. The teacher sees the reason
   in the picker.
2. **A boot failure keeps the loading screen up** rather than revealing an empty shell. An app
   that shows a working-looking gradebook it cannot save into is the worse of two lies. The copy
   lives in `index.html`, following the install banner's precedent (teacher-facing copy should be
   revisable without opening a module).
3. **The picker is its own module**, `src/year-picker.js`, not lines in `shell.js` —
   `install-banner.js` set that shape, and it keeps `store.js` free of the DOM.
4. **The header button uses `data-year-picker`, not `data-modal-open="yearModal"`**, because the
   list has to come out of IndexedDB before the panel is on screen. Side benefit: the existing
   modal checks in the harness, which assume every `[data-modal-open]` opens `#aboutModal`, are
   untouched.
5. **`store` added to the `window.planbook` console seam**, with a comment. Justified the same
   way the rest of that seam is: nothing on screen writes to a year document until WO-1.6/1.7,
   so `update()` — and every acceptance line about `rev` — is otherwise unreachable. It goes when
   the shelf goes.
6. **`demoSaveCycle()` and the shelf's five state buttons stay.** Removing them would not break a
   verify-shell check (I checked: the harness never touches `data-save-cycle` or
   `data-save-state`), so this is a judgment call rather than a forced hand: removing the stub
   now would leave six shelf fixtures wired to nothing, and WO-1.10 owns the shelf's removal
   whole. `save-indicator.js`'s header now says what drives the chip *and* why the stub outlives
   this work order. Its comment about the deliberately-absent `queued` state is untouched.
7. **List rows are built with `createElement`, not an `innerHTML` template**, and I wrote the
   reason into `year-picker.js` because this is the first list rendered from the document and
   sets the convention: the roster screen will render names pasted out of the SIS.
8. **Three stale comments and one piece of teacher-facing copy corrected**, because they became
   false with this change rather than because they wanted tidying: `index.html`'s header comment
   ("IndexedDB and the year document — WO-1.4" under *deliberately still absent*), the loading
   screen's comment, the shelf's save-chip comment, and the About modal's "**Nothing is stored
   yet.**" — that last one is read by a teacher and is now wrong. All four are additive edits;
   no reasoning was removed anywhere.

---

## 7. Out of scope — noted, not done

Nothing here was built. Listing them so the temptation is on the record rather than in a
transcript:

- **Sync, conflict handling, Drive.** Phase 7. `deviceId` is generated and nothing reads it;
  nothing ever sets the chip's `syncing` state (only the WO-1.2 demo stub can paint it).
- **Backup / restore.** WO-1.5, and the gate before any feature that writes student data. The
  store can now write a year document and there is still no way to get one back out — that is
  the next work order and it should stay the next work order.
- **A `subscribe()` consumer.** The store notifies subscribers after every save; nothing
  subscribes yet (the picker re-renders at open time on purpose, so a save does not re-read every
  key out of IndexedDB to redraw a modal nobody is looking at). The first real screen — WO-1.6 /
  WO-1.10 — is what should use it.

### Proposed follow-ups (not widened into this work order)

1. **A harness check for the boot-failure screen.** Inject a throwing `indexedDB` with
   `Page.addScriptToEvaluateOnNewDocument`, assert the loading screen stays up with
   `#loadingError` visible, then remove the script and reload. Small, and it covers the one path
   in this work order that is reasoned rather than measured.
2. **Two tabs on the same year.** Each holds its own in-memory copy and the last one to save
   wins, silently — the same last-writer-wins rule sync uses, but between tabs and with no
   `rev` comparison. Out of scope here (that is the sync design's problem, Phase 7), but it is a
   real single-device case and someone should decide deliberately rather than discover it.
3. **`newId()` is exported and unused** until WO-1.6/1.7 create classes and students. Worth a
   glance from whoever writes the first caller: it produces a 10-character base36 tail, which is
   fine for ids read by a human once, and it is not a UUID by intent.

---
---

# Correction round 1 — the service worker precache

**Verdict being answered:** FAIL on Acceptance 1. `sw.js` was byte-identical to HEAD while
`src/shell.js` had gained two static imports, so `./src/store.js` and `./src/year-picker.js` were
outside the precache and `CACHE` was still `planbook-shell-v1`. Two consequences, both correctly
called: an installed app with no network never resolves the module graph and dies before reaching
IndexedDB, and an already-installed device never receives this build at all because a browser only
installs a new worker when `sw.js`'s bytes differ.

The verdict is right, and `sw.js`'s own header at lines 14-17 states the rule that round 1 broke.

## What changed

**`c:\dev\planbook\sw.js`** — the only file touched this round. Three lines:

- `CACHE` bumped `'planbook-shell-v1'` → `'planbook-shell-v2'` (line 26).
- `'./src/store.js'` and `'./src/year-picker.js'` added to `SHELL`, after `'./src/install-banner.js'`
  and before the icons — continuing the list's existing order, which is the order the modules were
  added.

`git diff --stat sw.js` = `1 file changed, 3 insertions(+), 1 deletion(-)`. The header comment,
including the rule at lines 14-17, is untouched, as is every other comment in the file.

## Why exactly those two entries and no others

I walked the static import graph rather than trusting the verifier's list:

```
shell.js       -> modal, live-region, save-indicator, prefs, install-banner, store, year-picker
store.js       -> save-indicator, live-region, prefs
year-picker.js -> store, modal, live-region
index.html     -> src/shell.css, src/shell.js, manifest.webmanifest, icons/152, 167, 180
```

Every leaf but `store.js` and `year-picker.js` was already listed. There are no dynamic `import()`
calls anywhere in `src/`, so the note at `sw.js:71-79` about `skipWaiting` still holds and I left
it alone. `SHELL` is now 17 entries and the live cache reports 17 (`'./'` and `'./index.html'`
being two distinct cache keys).

## What I ran to confirm the offline boot

A throwaway CDP probe, written to the session scratchpad and **not** to the repo — it is a
measurement, not a harness, and this round's bounds forbid a second one on disk. It mirrors
`tools/verify-shell.mjs`'s CDP setup (port 0 + `DevToolsActivePort`, throwaway `--user-data-dir`)
and, unlike that harness's server, sends `Cache-Control: no-store` on every response so a reload
cannot be answered by the HTTP cache — the "green while measuring nothing" trap in
`tools/README.md`. It is harsher than the verifier's probe in one way: as well as
`Network.emulateNetworkConditions {offline:true}` it **closes the HTTP server outright** and then
asserts that zero further requests were served, so there is no network left to quietly answer.

Sequence: load over `http://127.0.0.1:<port>/` (a secure context, so the worker registers) → wait
for `navigator.serviceWorker.ready` → read Cache Storage → write a real change through
`store.update()` + `store.flush()` → go offline and close the server → `Page.reload`.

```
service worker ready   : true
cache names            : planbook-shell-v2
cache entry count      : 17
WO-1.4 modules cached  : ["/src/store.js","/src/year-picker.js"]
WO-1.4 modules MISSING : []

wrote before going offline: {"year":"2026-2027","rev":2,"teacherName":"Offline Probe"}
server closed. requests served so far: 30

OFFLINE reload -> {
  "loadingHidden": true,
  "loadingErrorShown": false,
  "yearLabel": "2026-2027",
  "hasStore": true,
  "docYear": "2026-2027",
  "docRev": 2,
  "teacherName": "Offline Probe"
}
requests served after close: 0 (must be 0)
```

Read against the verifier's failing measurement: `loadingHidden` false → **true**, `yearLabel` `—`
→ **2026-2027**, `hasStore` false → **true**, and the two modules that were missing from the
precache are in it. The `teacherName` and `rev` lines are the part the verifier's probe could not
reach: the change written *before* the network went away is still in the document after a boot
with no network at all. That is the desktop half of Acceptance 1 performed under offline
conditions, which is as close to an iPad relaunch as this machine gets. Run twice, identical both
times.

## `tools/verify-shell.mjs` — and an intermittent failure that is not mine

Re-run after the fix: **52 checks · 52 passed · 0 failed · 0 skipped.** That is the run the working
tree stands on.

But I ran it repeatedly, and it is **intermittently red**. The verifier should know this before it
surprises them:

| `sw.js` | runs | red runs |
|---|---|---|
| with this fix | 5 | 2 |
| at HEAD (fix temporarily reverted, then restored) | 9 | 1 |

The same three checks each time, all in the forced-save-failure block at
`tools/verify-shell.mjs:707-722`:

```
  - a save failure paints the error state on the indicator
      class="save-indicator retry" text="↻ Retrying…"
  - and it is announced as well as shown — the chip is not something a screen reader watches
      live region = "Retrying the last save."
  - and rev is rolled back, so memory never claims a save that storage never saw
      rev 4 -> 5
```

Three points, stated as honestly as I can:

1. **It is pre-existing, not caused by the precache change.** It reproduces with `sw.js` reverted
   to HEAD (run 9 of 9). I reverted, ran nine times, and restored the fixed file byte-for-byte from
   a scratchpad copy; `git diff sw.js` afterwards is the three-line diff above and nothing else.
2. **It looks like the harness racing, not the store failing.** The three values are internally
   consistent with a *second* save having started after `flush()` resolved and being measured
   mid-retry: the chip reads `retry` (not a stale `error`), the live region says "Retrying", and
   `rev` is one *up* rather than rolled back — i.e. bumped by an attempt still in the air.
   `writeCurrent` leaves `dirty` true after a permanent failure by design (`store.js:383-388`), so
   anything that calls `save()` again restarts the same doomed write; a `maxWaitTimer` that
   survived because `save()` returns early at `store.js:343` without clearing timers is the
   candidate. The check then reads the chip after a fixed `setTimeout(150)`.
3. **I did not fix it,** because the bounds of this round are the one ❌, and because fixing it
   means editing a harness that is already over its soft cap. **Proposed follow-up:** replace the
   fixed 150ms wait at `tools/verify-shell.mjs:712` with a poll for a settled chip (`error` or
   `saved`, with a timeout), and separately decide whether `save()`'s early return at
   `store.js:343` should clear the max-wait timer. Both are small; neither is mine this round.

I also considered and rejected adding a harness check that `SHELL` covers every module reachable
from `index.html`. It would have caught this defect statically and cheaply — `verify-shell.mjs`
currently contains no reference to `sw.js` at all, since it drives a page and never an installed
app — so it is the right check, and I am still not writing it this round: the harness is over its
soft cap and that is an open question for the teacher. Recorded here so the idea survives.

## Acceptance 1, restated

**1. A change persists across a full reload, and across an app relaunch on iPad.**

- Reload half — verified in round 1, unchanged.
- Offline-boot precondition — **now verified by measurement** (above): the installed shell resolves
  its whole module graph from Cache Storage with the server closed, and a document written before
  the network went away is intact after the reload.
- **iPad relaunch half — still owed to a human, and the reinstall is now mandatory rather than
  optional.** The device carries a `planbook-shell-v1` worker from WO-1.3. `skipWaiting` +
  `clients.claim()` mean the v2 worker should take over on its own once the new `sw.js` bytes are
  fetched, but a tester who does not force the issue may measure the WO-1.3 build and tick the
  wrong box. Steps:
  1. `node tools/serve-https.mjs`; open the **HTTPS** URL on the iPad (not the HTTP setup page).
  2. **Delete the existing home-screen app and clear website data for the host** (Settings →
     Safari → Advanced → Website Data). This is the step that makes the pass mean anything.
  3. Load the app, Share → Add to Home Screen, then launch from the home screen.
  4. Confirm the year button in the header shows a year rather than `—`. Create a second year
     while you are there; that is Acceptance 4's manual half.
  5. **Turn Wi-Fi off at the iPad**, hard-close the app (swipe up from the app switcher), and
     relaunch from the home screen.
  6. Expect: the loading screen comes down, the header shows the same year, and what was entered
     is still there. A spinner that never clears, or `—` in the header, is the failure this round
     exists to remove.
  7. Optional, if a Mac is handy: with Wi-Fi still off, inspect the app in Safari's Web Inspector
     and confirm Cache Storage is named `planbook-shell-v2`. Without one, step 5 is the evidence.

Nothing else in the work order was touched. Acceptance 2-5 and both Traps stand as they were at the
end of round 1.

---

# Orchestrator record — dispatch history for WO-1.4

Folded in from `WO-1.4-status.md`, which is retired now that this result file exists. This run was
unusually broken and the record should say so.

- **Routed to Codex** per the Ship 1 pre-routing table, re-derived and agreed: the spec is complete
  in `docs/data-model.md`, the Acceptance list is mechanically checkable, and ROUTING names "store
  layer" as the canonical Codex shape.
- **Codex could not start.** `codex-windows-sandbox-setup.exe` is missing from the install (`bin/`
  holds only `codex.exe` and `codex-code-mode-host.exe`). Every exec and a direct write probe
  failed. Zero repo changes, confirmed with `git status`. Transcript: `WO-1.4-codex-blocked.md`.
  The sandbox was **not** raised to `danger-full-access` — that is the teacher's call, and it would
  not have fixed a missing binary.
- **Re-routed to Claude** against the same brief, unchanged. Ties and unavailable routes go to Claude.
- **Implementer run 1** was killed by a process crash before writing anything.
- **Implementer run 2** was cut off by an API session limit after writing `src/store.js` alone —
  501 lines, syntactically whole, wired into nothing, and never verified.
- **Implementer run 3** was dispatched explicitly as *finish and correct this draft*, not *build
  this*, carrying two orchestrator-found defects: `setPref('openYear')` refused because the key was
  never declared in `PREF_DEFAULTS`, and `store.js` imported by no file. It kept the draft
  essentially whole and landed the wiring.
- **Verifier pass 1: FAIL** — `sw.js` precached neither new module and `CACHE` was not bumped.
- **Correction round** — `sw.js` only, 3 insertions and 1 deletion.
- **Verifier pass 2: PASS WITH MANUAL CHECKS.**

The lesson worth keeping: run 2's draft was ~90% of a good implementation and would have been
thrown away by a from-scratch re-dispatch, but it also carried a defect (`setPref` on an undeclared
key) that blind trust would have shipped. Unverified draft, audited line by line — neither deleted
nor trusted.
