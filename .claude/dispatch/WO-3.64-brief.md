# WO-3.64 — the move confirm's note and the categories panel's error line draw above their buttons · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.64-result.md` — as your last act, and return it in-band too.

**Routing: Claude Opus (no model override).** The deciding signal is teacher-facing prose: a `TESTING.md` section WO-3.64 and a `CHANGELOG.md` entry are deliverables, which ROUTING "Route to Claude" sends to Claude, and the Traps (do not give `#categoryError` a message; the `.modal-body p + .modal-section-label` margin) are judgment, not mechanics. Runner-up: Codex, since the code is two markup moves and two harness position checks; set aside on the prose, and to match WO-3.63, the sibling row from the same booking, which went Claude Opus.

**The Open line is answered. The owner ruled at dispatch, 2026-10-12: MOVE `#categoryError`**, not delete. So `#categoryError` goes directly after `#categoryTotal`, before `.category-actions`; the two harness reads in `tools/verify/categories-weights.mjs` stay, and you add a position check that it sits between the total and the Add row. **Record the ruling in the work order itself**: replace the `**Open — the owner, at dispatch: move ...**` paragraph with an `**Answered 2026-10-12, the owner, at dispatch: move.**` paragraph in the shape WO-3.63's *Answered* paragraph uses (~line 5145 of the phase file), keeping the reasoning the Open line gave. Leave the Acceptance lines' text as written (the "or gone" alternative is harmless once the Answered paragraph names the ruling).

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.64 — the move confirm's note and the categories panel's error line draw above their buttons

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-12 · **Size** S · **Depends on** WO-3.58
**Closes roadmap** *(no box. Owner-directed, 2026-10-12.)*

**Booked 2026-10-12** out of [WO-3.58](#wo-358--the-dialogs-behind-the-assignments-and-scores-screens-are-read-together-and-a-layout-is-ruled).
Two dialogs whose one stray element sits under their buttons. **`assignmentMoveModal`**: the note
*To change the date instead, close this and you are back in the assignment.* is a `.class-hint` after
`.modal-actions`. **`categoriesModal`**: `#categoryError`, a `.class-error` line, sits at the very
foot of the panel, under *Add a category* and under both hints — and **no code path has ever written
a sentence into it**: `showCategoryError()` is called five times in `src/categories.js`, each with
`''`, since WO-3.1, and `tools/verify/categories-weights.mjs` reads it only to assert it is empty.

**Surface.** [`design/mockups/dialog-messages.html`](../../design/mockups/dialog-messages.html),
frames 2 and 6.

**Rulings, the owner's, 2026-10-12** (WO-3.58's ruling 2, carried) — a dialog's messages draw above
its buttons, in one place. In `categoriesModal`, which has no Done, the button the rule is read
against is *Add a category*.

**Deliverables**
- **`index.html`**: in `#assignmentMoveModal`, the `.class-hint` moves to directly before
  `.modal-actions`. In `#categoriesModal`, `#categoryError` moves to directly after `#categoryTotal`,
  before `.category-actions` (or is deleted — the Open line).
- **The harness**: in `tools/verify/assignments.mjs`, the move confirm's note is above its buttons;
  in `tools/verify/categories-weights.mjs`, `#categoryError` is between the total and the Add row (or,
  if deleted, its two reads go with it and the *nothing is blocked* check keeps its other halves).
- **`TESTING.md` § WO-3.64**, the `CHANGELOG.md` entry, and **`CACHE` in `sw.js` bumped.**

**Acceptance**
- [ ] In the move confirm, the note is above *Move it to …* and *Keep it in …*, and nothing draws
      after `.modal-actions`. Its wording is unchanged.
- [ ] In Categories & weights, nothing draws after the two hints, and `#categoryError` is either
      directly under `#categoryTotal` or gone, as the owner ruled.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. `CACHE` in `sw.js` is bumped.

**Open — the owner, at dispatch: move `#categoryError`, or delete it.** The drawing moves it: the
harness's two reads stay meaningful and a future refusal has the place the rule names. Deleting it is
the other honest answer — a slot for a message nothing says is a slot nobody tests.

**Traps** — **`.modal-body p + .modal-section-label`** spaces a label after a paragraph; the move
confirm's note becomes the paragraph before `.modal-actions`, not before a label, so check nothing
else's margin changes with it. **Do not give `#categoryError` a message** in this row: what it says,
if anything, is a different work order.

**Not in scope** — the editor (WO-3.63), the Grade sheet (WO-3.65), and the weights total's own
wording.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `design/mockups/dialog-messages.html`
  - `src/categories.js`
  - `tools/verify-shell.mjs`
  - `tools/verify/assignments.mjs`
  - `tools/verify/categories-weights.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `plans/work-orders/phase-3-gradebook.md` WO-3.63 (~lines 5100-5160): the sibling row, built and verified today (PASS WITH MANUAL CHECKS, committed at 076ba24). Its *Answered* paragraph is the shape for recording this row's ruling, and `tools/verify/assignments.mjs` now carries its position checks (above Done, by bounding rect). **Match that convention for the move confirm's note rather than inventing a second one.** `TESTING.md` WO-3.63 is the model for this row's section.
- `design/mockups/dialog-messages.html` frames 2 and 6, and `design/mockups/README.md` "Where a dialog's messages go": if WO-3.63 recorded its ruling there, record this one beside it.
- `src/categories.js` (`showCategoryError`, `CATEGORY_ERROR_ID`): read only. It finds the element by id, so the move should need no JS change; if it does, say why in the result.
- **`CACHE` in `sw.js`** reads `planbook-shell-v192` (WO-3.63's bump, committed). Bump to v193.
- **CHANGELOG.md**: write the entry, in the voice of the surrounding entries, and quote it in your result.

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

## 5. Done means these 3 lines, reported against one by one

1. In the move confirm, the note is above *Move it to …* and *Keep it in …*, and nothing draws after `.modal-actions`. Its wording is unchanged.
2. In Categories & weights, nothing draws after the two hints, and `#categoryError` is either directly under `#categoryTotal` or gone, as the owner ruled.
3. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. `CACHE` in `sw.js` is bumped.

**Write `TESTING.md` § WO-3.64 — it is a deliverable, not a permission.** Add `### WO-3.64 — the move confirm's note and the categories panel's error line draw above their buttons` under `## Phase 3 — Gradebook`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-3.64` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

