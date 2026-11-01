# WO-3.79 — *What changed* names the cause honestly, and a recording closes the edit window · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.79-result.md` — as your last act, and return it in-band too.

**Routing.** Claude **Opus**, on its own merits: the seal changes the score-history version semantics that WO-3.33 and WO-3.52 ruled on, and getting the boundary into `reviseCell()` without a new import edge (Traps) is a convention call the work order explicitly leaves to you. The runner-up was Codex for the mechanical half (`newestRecord()` on instants, one string swap) — set aside because the seal is the bulk of the work, and the proof needs one clean harness run plus one per mutation (~3 × 4.4 min), which fails ROUTING.md's Codex budget bullet anyway.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.79 — *What changed* names the cause honestly, and a recording closes the edit window

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-31 · **Size** S · **Depends on** WO-3.75 · **Blocks** nothing
**Closes roadmap** *(no box. Owner-directed, 2026-10-31, out of WO-3.75's verdict.)*

**Booked 2026-10-31**, owner-directed, out of [WO-3.75](#wo-375--the-notice-says-which-score-changed)'s
verdict. Three gaps in what the Record dialog says about a changed quarter, each found by the
implementer or the verifier and each ruled on by the owner the same day.

**Why it exists.**
1. **The setting line names the wrong cause.** A grade can move with no score and no setting changed:
   an assignment deleted, its points, category or term changed, or a column held since the
   recording. Each of those gets *No score changed; a class setting did — weights, the letter scale
   or drop lowest*, which sends the teacher to the wrong place at the moment she is asking why.
   None of them keeps history, so the line cannot name which one — it can only stop naming too few.
2. **Recording and then fixing a typo reads as *not known*.** A write within five minutes of a
   cell's last one replaces it (WO-3.33), so an edit just after a recording can swallow the version
   the recording saw, and `scoreChangeSince()` honestly answers `then: null`. That is the commonest
   moment to edit a score, so the line will be common. **The owner's ruling: fix the store, not the
   wording** — a recording becomes a version boundary, the way a commit already is.
3. **`newestRecord()` compares `at` as strings.** A local stamp carries its offset, so two
   recordings either side of a daylight-saving change, or both inside the repeated hour, can sort
   wrongly. `scoreChangeSince()` and `reviseCell()` already compare parsed instants; this reader
   was missed.

**Deliverables**
- **The setting line reads**: *No score changed. Something else did — weights, the letter scale,
  drop lowest, or an assignment's points, category or term, or one held or deleted.* The check that
  pins the old wording is updated, not loosened to a substring.
- **A recording seals the window.** In `reviseCell()`, a cell last written at or before the newest
  recording of its class and term has its version **pushed** by the first write after that
  recording, however soon — `sealed`'s rule for `committedAt`, extended. The boundary reaches
  `reviseCell()` from its callers (`src/scores.js`, `src/past-due.js`) through the `column`
  argument or one beside it; how is the implementer's call, stated at the point of departure.
- **`newestRecord()` compares `at` as parsed instants**, the tie still going to the later write.
- **`docs/data-model.md`** § the term record and § score history say a recording is a version
  boundary.
- **Two mutations**, each shown red and reverted before writing anything else: the seal removed, and
  `newestRecord()` back on string comparison.
- **`CACHE` bump in `sw.js`**, **`TESTING.md` § WO-3.79** and the `CHANGELOG.md` entry.

**Acceptance**
- [ ] A student whose grade moved only because an assignment was deleted gets the new setting line,
      word for word.
- [ ] A score recorded at 4, edited to 9 one minute after the recording, reads *4 → 9 of 10*, not
      *not known*.
- [ ] Two recordings of one quarter stamped `…T01:30:00-04:00` and then `…T01:10:00-05:00` on
      2026-11-01: `newestRecord()` returns the second.
- [ ] With the seal removed, the check goes red; with `newestRecord()` comparing strings, the check
      goes red. Both mutations are reverted, and `TESTING.md` § WO-3.79 shows the red output.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
- [ ] `TESTING.md` § WO-3.79 carries these lines verbatim with the evidence for each.

**Traps** — **`src/term-record.js` imports `src/scores.js`**, so the writer cannot import
`newestRecord()` back without closing an import loop this repo refuses; the boundary is found with no
new edge, or handed in by a caller that already has the document. **A held column is not touched**:
a held write replaces however long since (WO-3.52), *What changed* never lists a held column, and
the seal applies only to the ordinary branch. **Only new writes benefit**: an edit saved by an
earlier build before this lands still answers *not known*, and that line stays. **The seal pushes a
spare version for an edit just after recording a cell untouched since September** — that is the
point, and a spare trail entry is cheaper than a lost score that counted (WO-3.33's rule).

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `docs/data-model.md`
  - `src/past-due.js`
  - `src/scores.js`
  - `src/term-record.js`
  - `tools/verify-shell.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `src/score-history.js` — `reviseCell()` (~line 187) and its `sealed` rule for `committedAt` (~212–215): **extend that rule, do not build a parallel one.** `scoreChangeSince()` (~line 260+) and its `instantOf()` are the parsed-instant comparison `newestRecord()` should match.
- `src/term-record.js` — `newestRecord()` (~line 304) compares `String(entry.at)` with `>=`; keep the `>=` tie-to-later-write rule when moving to instants. Its import of `src/scores.js` is the loop the Traps name: `src/scores.js` / `src/past-due.js` must not import `src/term-record.js`. Both callers already have the document in hand where they build the `{ held, heldAt, committedAt }` column argument (`src/scores.js` ~528, `src/past-due.js` ~557).
- `src/term-record-view.js` line 385 — `SETTING_LINE`; and `tools/verify/term-record-cause.mjs` line 70 pins it. Update both to the new wording exactly; keep the check an equality, not a substring.
- Put the WO-3.79 checks beside the existing term-record / score-history verify modules under `tools/verify/` rather than in a new harness. The DST acceptance fixture (`2026-11-01T01:30:00-04:00` then `2026-11-01T01:10:00-05:00`) is a string-order inversion on purpose — the second string sorts *lower* and is the later instant.
- **Mutation discipline** (AGENTS.md): mark each mutation with a `MUTATION` comment, capture the red output, revert immediately, and `grep -rn MUTATION src tools` clean before writing any doc or tick. Two dispatches here have died holding a live mutation under ticked boxes.
- `TESTING.md` § WO-3.79 is a **deliverable**, not optional — Acceptance lines verbatim, the evidence under each, the two red outputs included.

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
- Write `TESTING.md` § <your work order>, every time: its Acceptance lines copied verbatim and the
  evidence for each. **It is a deliverable, not a permission** — the brief's § 5 names the heading,
  docs-only and process work owe one too (only a gate, whose boxes live in `gates.md`, does not), and
  `wo-gate.mjs --tick` refuses ✅ DONE without it.
- You may tick the boxes your own run closed, and update `plans/` and the rest of `TESTING.md` as
  you go. Two
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

## 5. Done means these 6 lines, reported against one by one

1. A student whose grade moved only because an assignment was deleted gets the new setting line, word for word.
2. A score recorded at 4, edited to 9 one minute after the recording, reads *4 → 9 of 10*, not *not known*.
3. Two recordings of one quarter stamped `…T01:30:00-04:00` and then `…T01:10:00-05:00` on 2026-11-01: `newestRecord()` returns the second.
4. With the seal removed, the check goes red; with `newestRecord()` comparing strings, the check goes red. Both mutations are reverted, and `TESTING.md` § WO-3.79 shows the red output.
5. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
6. `TESTING.md` § WO-3.79 carries these lines verbatim with the evidence for each.

**Write `TESTING.md` § WO-3.79 — it is a deliverable, not a permission.** Add `### WO-3.79 — *What changed* names the cause honestly, and a recording closes the edit window` under `## Phase 3 — Gradebook`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-3.79` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

