# WO-7.7 — a sync that downloads leaves the screen showing the document it replaced · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-7-sync.md`
**Report to** `.claude/dispatch/WO-7.7-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude, at **Opus** (no model override). Phase 7 is Claude-only per `ROUTING.md` § "Later phases", and the deciding signal is a judgment trap: the obvious fix — subscribing screens to the store — is exactly what six modules refuse, and the choice between `afterYearChange()` and a named sibling has to be argued at the call. The runner-up was Codex on size (S, mechanical-looking): set aside because the Acceptance wants a clean run plus mutation runs of a ~5-minute harness, and the header door needs a small cross-module design decision.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-7.7 — a sync that downloads leaves the screen showing the document it replaced

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-26 · **Size** S · **Depends on** WO-7.2 — the download path this repaints after
**Closes roadmap** *(no box. A defect in WO-7.2's download, found reading WO-7.5.)*

**Booked 2026-09-26**, from the owner's iPad reading of WO-7.5 on the deployed v131: *"syncing isn't
redrawing the screen when it's pulling down information."* WO-7.5 itself passed. This fault is older.
WO-7.5 just made it easy to hit, because the header button lets a teacher sync while she is looking
at the gradebook instead of from inside About.

**Why it happens.** When `syncNow()` in `src/drive-sync.js` plans `download`, it calls
`store.adoptRemoteDocument(incoming)`. That puts the downloaded document in memory and in IndexedDB,
and then calls the store's `notify()`. **No screen subscribes to the store, on purpose**:
`src/classes.js`, `src/home.js`, `src/scores.js`, `src/detail.js`, `src/assignments.js` and
`src/calendar-view.js` each say they do not subscribe, because a subscriber fires on every save.
The only subscriber is `src/sync-button.js`. So the data changes underneath and the screen keeps
drawing the document it replaced until something else redraws it: a navigation, a reload, a
relaunch. **The comment above the `[data-drive-sync]` handler in `src/shell.js` (~2150-2155) says the
opposite**: *"notify() is what every screen in this app already listens to."* That was false the day
it was written, and it is why nothing repaints.

**The precedent is already in the file.** A restore also replaces the whole document, and
`src/shell.js` repaints after it by chaining `afterRestore` onto `backup.confirmRestore()`. A year
switch does the same with `afterYearChange()` (~912), which redraws the class bar, the open screen
and the header identity, and empties the template editor. A download is the same kind of event.

**Deliverables**
- **After a sync whose outcome is `downloaded`, the open screen is redrawn from the new document.**
  This applies from both doors: the About panel's **Sync** and the header button's tap
  (`src/sync-button.js` `tapSyncButton()`, which today repaints only the button via `afterSync`).
  Use the repaint the year switch and the restore already use rather than a new one, chained where
  those are chained, in `src/shell.js`, not inside `src/drive-sync.js` (the import-loop reason the
  restore's comment gives). The implementer decides whether that is `afterYearChange()` itself or a
  named sibling, and says why at the call.
- **Only on `downloaded`.** An upload, *nothing to do*, a conflict or a failure leaves this device's
  document as it was, so the screen does not need redrawing and must not flicker.
- **The false comment in `src/shell.js`** says what is true, and so does any other note that claims
  screens hear `notify()`.
- **`CACHE` in `sw.js` bumped**, because `src/shell.js` is in `SHELL`.

**Acceptance**
- [ ] In the harness, a download from each door changes what the open screen draws. Plant a remote
      document with a different score or student name, sync, and read the new value off the page
      with no navigation in between. Mutation-proved: removing the repaint turns the check red.
- [ ] An upload and an in-sync sync do not redraw the screen, asserted in the harness.
- [ ] 👤 Laptop and iPad on the deployed app: change a grade on one device, sync; on the other,
      with the same class's screen open, tap the header button and the new grade appears without
      leaving the screen.

**Traps** — **Do not subscribe screens to the store** to fix this. Six modules explain why they do
not: a subscriber fires on every save and redraws while a teacher is typing. **A download never
lands on unsaved work**: `planFor()` downloads only when this device is unchanged since the last
sync, so the redraw cannot throw away something she typed. If it looks like it might, that is a
different bug; report it instead of guarding for it here. **Do not reload the page** to get the
redraw: it throws away the in-memory token, so every download would also sign her out.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/assignments.js`
  - `src/calendar-view.js`
  - `src/classes.js`
  - `src/detail.js`
  - `src/drive-sync.js`
  - `src/home.js`
  - `src/scores.js`
  - `src/shell.js`
  - `src/sync-button.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `src/drive-sync.js` ~500 (`syncNow()`), ~673-679 (the only `settle('downloaded', …)`), and
  `syncState()` ~745 — `outcome` is the kind of the **last** settled sync.
- `tools/verify/drive-sync.mjs` and `tools/verify/sync-button.mjs` — the existing fake-Drive fixtures
  for both doors. Extend these; do not build a third fake Drive.

### Traps the orchestrator found reading the tree (not in the work order)

- **The header door has no hook today.** `tapSyncButton()` in `src/sync-button.js` keeps its
  `syncing` promise private and returns a string; `src/shell.js` cannot chain onto it as written.
  Whatever you add (return the promise, a registered callback, …), `src/sync-button.js` must not
  import `src/shell.js`, `src/classes.js` or any screen — the import-loop reason is the same one
  `afterYearChange()`'s comment gives. Say at the call why you chose the shape you did.
- **"Only on `downloaded`" must mean *this* sync's outcome.** `syncState().outcome` is sticky: it is
  whatever the last *settled* sync was. If `syncNow()` can reject or return without settling, a stale
  `downloaded` from an earlier sync would repaint on a failure. Check that path rather than assume it;
  the Acceptance's no-flicker line should cover a sync that follows a download.
- **`afterRestore()` differs from `afterYearChange()`**: it also calls `outreachView.resetOutreach()`
  (an open draft is about a student in the replaced document) and skips the backup nag. A download
  replaces the document the same way a restore does — weigh that when choosing which to reuse, and
  say which and why. (It also calls `resetOutreach()` twice; that is not this work order's — note it
  as a proposed follow-up, do not fix it.)
- **The false comment is at `src/shell.js` ~2150-2155.** `grep -rn "listens to" src/ docs/` for any
  other note claiming screens hear `notify()` (CLAUDE.md's WO-7.5 block says `src/sync-button.js` is
  the only subscriber — that is true; leave it).
- **Mutation discipline** (`AGENTS.md`): every mutation is reverted before you write anything else,
  and `grep -rn MUTATION src/ tools/` is empty before your result file is written.
- **Session-limit risk is high on this dispatch**: the rolling window already read 23.2M units at
  claim time, above the median death point. Write your result file early and append to it, so a kill
  leaves a record of what was decided and what was proven.


---

## 3. Constraints — non-negotiable, and each one has already cost someone a day

Codex does not read `CLAUDE.md`. It reads [`../../AGENTS.md`](../../AGENTS.md), which points back at
it — but the pointer is not enough for the constraints that matter. The orchestrator inlines these
into every brief, verbatim:

- No dependencies, no framework, no bundler, no linter, no test framework. No `package.json`.
- Colors inline, not CSS variables. No dark mode anywhere — no `prefers-color-scheme`, no
  `[data-theme]`.
- Every new control gets a 44px minimum in the `@media (pointer: coarse)` block.
- `localStorage` prefix `planbook_`, UI preferences only — never student data.
- No merge field, log line, print surface, or export emits accommodation, medical, or plan data.
- `late` and `missing` are teacher-marked, never inferred from a date. Blank means ungraded.
- Empty categories redistribute their weight.
- Taken · dropped · not-taken-yet are three states. Everything counts recorded meetings, never
  calendar days.
- Stay inside the work order's **Out of scope** line.
- You may tick the boxes your own run closed, and update `plans/` and `TESTING.md` as you go. Two
  exceptions: **never tick a 👤 or 📆 line** — one needs a real iPad you do not have, the other a date
  that has not arrived — and leave the `CHANGELOG.md` entry to the teacher, who decides what a change
  means. Anything you do tick must be
  something you actually checked; a tick you cannot point at evidence for is worse than a blank box.

---

## 4. Verification

```
node tools/verify-shell.mjs      # measures what a stylesheet review gets wrong
node tools/wo-sweep.mjs          # the eight standing greps
```

Both must be green before you report. **Do not write a second harness** — if this work order
needs a check `verify-shell.mjs` cannot make, say so in your report as a proposed follow-up.
Add checks for what you build; a fixture that cannot express the failure is not evidence.

---

## 5. Done means these 3 lines, reported against one by one

1. In the harness, a download from each door changes what the open screen draws. Plant a remote document with a different score or student name, sync, and read the new value off the page with no navigation in between. Mutation-proved: removing the repaint turns the check red.
2. An upload and an in-sync sync do not redraw the screen, asserted in the harness.
3. 👤 Laptop and iPad on the deployed app: change a grade on one device, sync; on the other, with the same class's screen open, tap the header button and the new grade appears without leaving the screen.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

