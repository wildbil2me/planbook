# WO-3.74 — the notice opens when you leave a quarter that changed, and home carries the bar · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.74-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, at **Opus** (no `model` override): the work order touches **presentation mode** — the notice must never open under a projector — which is a sensitive surface in `ROUTING.md` § "Route to Claude", and it carries an open design question (how *once* is remembered) plus teacher-facing behaviour on two screens. The runner-up was Codex on the grounds that the engine reader already exists and the Acceptance list is concrete; set aside because the sensitive-surface rule decides it alone, and the Traps (no glance panel, nothing in the year document) are judgment, not mechanics.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.74 — the notice opens when you leave a quarter that changed, and home carries the bar

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-31 · **Size** M · **Depends on** WO-3.73, WO-3.77 · **Blocks** WO-3.75
**Closes roadmap** *(no box. Owner-directed, 2026-10-23, from the closing-a-quarter thread.)*

**Read [WO-3.72](#wo-372--a-quarters-grades-can-be-recorded-and-the-engine-says-when-they-stop-matching) first**: the thread, the drawing and the rulings that bind all four are there.

**Surface.** [`design/mockups/closing-a-quarter.html`](../../design/mockups/closing-a-quarter.html),
frames **C** (the notice is WO-3.73's changed-form dialog, opening by itself) and **E′**, and
[`proposed-quarter.css`](../../design/mockups/proposed-quarter.css) § RECORD NAG.

**Deliverables**
- **The notice opens by itself when the teacher leaves a recorded quarter that no longer matches**
  — tapping another term, another class, or All classes (the owner took the recommendation,
  2026-10-23). It never opens while the teacher is still in that quarter, so three corrections are
  not three interruptions.
- **A change made without visiting the quarter** — a weight changed from Q2, a sync from the other
  device — **opens it once**, the next time the class is opened.
- **Never under a projector**: it waits for the next opening with presentation mode off. Dismissed,
  the class bar stays.
- **The home bar (E′)**: one bar on All classes naming every class with an ended quarter unrecorded
  or changed, and a button per class that opens that class on the quarter's Scores with the dialog
  open. It names classes and counts, never a student. Not a glance panel: it sits with the backup
  nag, so `src/glance.js` and its fence are untouched. **Which quarter a class's button opens is
  read from [WO-3.77](#wo-377--the-record-bar-names-every-quarter-that-needs-it-newest-first)'s list
  reader, never from the single-term `termNeedingRecord()`**: a class with two terms waiting opens on
  the newest, and the class's own bar names the other. Added 2026-10-29 when WO-3.77 was booked.
  *(WO-3.77 retired `termNeedingRecord()` the same day; the list reader is `termsNeedingRecord()`,
  ordered unrecorded before changed, then newest — so its head is not always the newest term.
  **Ruled by the owner, 2026-10-30: "opens on the newest" wins.** The button opens the entry whose
  term is latest in the class's term order, not the list's head — with Q1 unrecorded and Q2
  changed, it opens Q2. Which entry is newest is the engine's to answer, by term order and never by
  label or date; the home bar does not re-order the list itself.)*
- **A mutation**: make the notice open on every tap of the changed quarter, show the check goes red,
  and revert it before writing anything else.
- **`CACHE` bump in `sw.js`**, **`TESTING.md` § WO-3.74** and the `CHANGELOG.md` entry.

**Acceptance**
- [ ] Changing a recorded quarter's score and then tapping another term, another class or All
      classes opens the notice once, listing who changed.
- [ ] Working in the quarter — several edits, moving between its screens — opens nothing.
- [ ] A change made from another quarter opens the notice once, the next time the class is opened,
      and not again for the same change.
- [ ] In presentation mode the notice does not open, and opens on the next opening with it off.
- [ ] The home bar names each class that needs recording, and its button lands on that class's
      Scores for the quarter with the dialog open.
- [ ] With a class's Q1 never recorded and its Q2 recorded and since changed, the home bar's button
      opens Q2, the newest by term order, though the class's own bar lists Q1 first.
- [ ] With the notice opening on every tap of the quarter, the check goes red. The mutation is
      reverted, and `TESTING.md` § WO-3.74 shows the red output.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
- [ ] 👤 On the iPad, the notice opens when leaving a changed quarter and not while working in it,
      and the home bar's buttons are in reach.
- [ ] `TESTING.md` § WO-3.74 carries these lines verbatim with the evidence for each.

**Open — the implementer's to propose, the owner's to confirm:** how *once* is remembered. Proposed:
in memory, keyed by the set of changed figures, so nothing reaches the document or `localStorage`; a
relaunch may show the same notice one more time, which is cheaper than a stored flag nothing else
reads.

**Traps** — **Nothing about the notice is stored in the year document.** **Do not make the home bar
a glance panel**: `src/glance.js` holds no arithmetic and no clock, and this condition reads both.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `design/mockups/closing-a-quarter.html`
  - `design/mockups/proposed-quarter.css`
  - `src/glance.js`
  - `tools/verify-shell.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `plans/closing-a-quarter.md` and **WO-3.72's** section of the phase file — the work order says to read it first; the rulings that bind all four quarter rows live there.
- `src/term-record.js` — `termsNeedingRecord()` (the list reader; WO-3.77 retired `termNeedingRecord()`), `noLongerMatching()`, `newestRecord()`. **The owner's 2026-10-30 ruling**: the home button opens the entry **latest in the class's term order**, not the list's head, and *which entry is newest is the engine's to answer* — if no engine reader answers it today, add one in `src/term-record.js` (by `cls.terms` order, never by label or date; WO-3.78's fixtures prove the reader already honours list order — do not add a `.sort(`/`.reverse(`, which the sweep refuses there). The home bar must not re-order the list itself.
- `src/term-record-view.js` — WO-3.73's changed-form dialog (the notice *is* that dialog, opening by itself) and WO-3.77's per-class bar; the existing `presentationMode()` refusals at lines ~277 and ~483 are the pattern to reuse, not to duplicate.
- `src/home.js` / `src/home.css` and wherever the backup reminder on All classes is drawn — frame E′ puts the new bar beside it. `src/glance.js` and `wo-sweep.mjs` § 31 are **not** to be touched.
- `src/shell.js` — the screen/term/class navigation is where "leaving a quarter" is observable. Remember no screen subscribes to `notify()` (only `src/sync-button.js` does), so a sync that changes a recorded quarter reaches you through `afterDownload()`/the next class opening, not a subscription.

**Traps the orchestrator adds:**
- **"Once" is the implementer's to propose and the owner's to confirm** — state the proposal and its reasoning in `TESTING.md` § WO-3.74 and the result file as an open question. The proposed default (in memory, keyed by the set of changed figures) satisfies the Trap that nothing about the notice reaches the year document; `localStorage` is UI-preferences only and is not the answer either.
- **The mutation** (notice opens on every tap of the changed quarter) is a live break to the tree. Revert it **before writing anything else**, and `grep -rn MUTATION src tools` must be empty before you report.
- `verify-shell.mjs`'s `check()` count is recorded in `tools/README.md`; adding checks moves it and the sweep goes red until the number is updated (WO-3.26's scar).
- Bump `CACHE` in `sw.js` (any SHELL file change).
- The `TESTING.md` § WO-3.74 section is a **deliverable**, not optional. The 👤 line stays `- [ ]`.

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

## 5. Done means these 10 lines, reported against one by one

1. Changing a recorded quarter's score and then tapping another term, another class or All classes opens the notice once, listing who changed.
2. Working in the quarter — several edits, moving between its screens — opens nothing.
3. A change made from another quarter opens the notice once, the next time the class is opened, and not again for the same change.
4. In presentation mode the notice does not open, and opens on the next opening with it off.
5. The home bar names each class that needs recording, and its button lands on that class's Scores for the quarter with the dialog open.
6. With a class's Q1 never recorded and its Q2 recorded and since changed, the home bar's button opens Q2, the newest by term order, though the class's own bar lists Q1 first.
7. With the notice opening on every tap of the quarter, the check goes red. The mutation is reverted, and `TESTING.md` § WO-3.74 shows the red output.
8. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
9. 👤 On the iPad, the notice opens when leaving a changed quarter and not while working in it, and the home bar's buttons are in reach.
10. `TESTING.md` § WO-3.74 carries these lines verbatim with the evidence for each.

**Write `TESTING.md` § WO-3.74 — it is a deliverable, not a permission.** Add `### WO-3.74 — the notice opens when you leave a quarter that changed, and home carries the bar` under `## Phase 3 — Gradebook`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-3.74` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

