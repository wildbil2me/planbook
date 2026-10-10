# WO-2.61 — the search box's focus ring traces the field inside it, not the box you see · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.61-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, at **Opus** (no model override). The deciding signal is that this rebuilds a visible control whose result is judged by eye — the ring's shape against the guardian dialog's Relation field is the 👤 line — and the Traps are judgment rather than mechanics: the two-line `:focus-within` fix is the obvious move and is ruled out, and so is the 44px on the wrapper. Runner-up was Codex (XS, spec fully written, one clean run plus one mutation run is ~9 min and fits the cap); set aside because the work also owes `TESTING.md` and `CHANGELOG.md` prose and ties go to Claude.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.61 — the search box's focus ring traces the field inside it, not the box you see

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-10 · **Size** XS · **Depends on** —
**Closes roadmap** *(no box. Owner-directed, 2026-10-09.)*

**Booked 2026-10-09**, owner-directed, the day WO-2.58 gave both search boxes a ✕. The owner
compared two screenshots: the Relation field in the guardian dialog, whose focus ring is a rounded
halo just outside its border, and the Scores box's *Find a student…*, whose ring is a square
rectangle drawn **inside** the rounded box, with the 🔍 left outside it. **It is the same ring.**
`src/shell.css`'s one global `:focus-visible` outline lands on whatever has focus, and in
`.search-box` that is a borderless, square-cornered `<input>` sitting beside the glyph — the visible
rounded border belongs to the wrapper `<div>`, which never has focus. A text field draws
`:focus-visible` on a tap as well as from a keyboard, so this is what a teacher sees on every
search. **It is the only field in the app built this way**; the guardian dialog, the score cells
and the template editor all put the border on the field itself.

**Rulings, the owner's, 2026-10-09**
1. **Rebuild the box; do not move the ring.** The `<input>` becomes the rounded, bordered thing —
   `.search-box`'s border, radius and padding move onto it — and the 🔍 and the ✕ sit over its left
   and right edges, with the field's own padding keeping the text clear of both. The global ring
   then draws around it exactly as it does around Relation.
2. **The focus rule is not touched.** The rejected alternative — the ring drawn on the wrapper with
   `:focus-within` and the field's own ring suppressed — is two lines of CSS, and breaks WO-1.2's
   *"no rule removes an outline anywhere"*, `wo-sweep.mjs` § 8 and `tools/verify/focus-ring.mjs`'s
   second check, all three of which would need an exception written into them. This shape needs none.

**Deliverables**
- **`src/shell.css`**: `.search-box` and `.search-box input` rebuilt per ruling 1; `.search-clear`
  placed over the field's right edge; the coarse block's `.search-box` rules moved with them, the
  44px still on the `<input>` (the WO-1.2 `.search-box` lesson, written at the coarse block). The
  comment at `.search-box input` that explains why the source template's suppressed outline was not
  lifted stays true and is kept.
- **`src/attendance.css`**: `.attendance-find`'s 360→200 width still governs the box on the
  attendance screen; and § the coarse note at its line ~1202 kept true.
- **`src/scores.css`**: the Scores toolbar's box, likewise, if anything there reaches into it.
- **`index.html`**: only if the glyph needs a hook to position — the box stays markup and the ✕ stays
  a sibling of the field, per WO-2.58.
- **The harness**: `tools/verify/score-search.mjs` (both boxes), and the WO-2.58 strip and toolbar
  checks in `tools/verify/attendance-header.mjs` re-read, not loosened.
- **`TESTING.md` § WO-2.61**, the `CHANGELOG.md` entry, and **`CACHE` in `sw.js` bumped.**

**Acceptance**
- [ ] On both screens the focused element is the bordered one: with the field focused, the
      `<input>`'s bounding box equals the visible border's box (it carries the border-radius and the
      border), and the 🔍 and the ✕ lie inside it. Mutation-proved against putting the border back
      on the wrapper.
- [ ] Typed text never runs under the glyph or the ✕: with a long string in the field, the text's
      visible start is right of the 🔍 and its end is left of the ✕.
- [ ] The ✕ keeps every WO-2.58 behaviour on both screens — absent on an empty field, a tap empties it,
      restores the list and leaves the field unfocused, Escape empties it — and is still a 44px
      target under a coarse pointer; the field is still ≥44px tall there.
- [ ] `tools/verify/focus-ring.mjs` and `wo-sweep.mjs` § 8 pass **unchanged**: one global ring, and
      no rule removes an outline.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. `CACHE` in `sw.js` is bumped.
- [ ] 👤 On the iPad, after a force-quit: tap into each search box and read the ring — rounded,
      outside the border, the 🔍 inside it, the same shape as the guardian dialog's Relation field.

**Traps** — **Do not suppress the field's outline** — not on `:focus`, not on `:focus-visible`, not
in the coarse block; ruling 2 is the whole reason for this shape. **Do not put the 44px on the
wrapper**: that is the WO-1.2 defect this file names a dozen times. **The ✕ is not a re-render** —
WO-2.58's rule, written above the attendance box in `index.html`. **Safari's ring follows a
border-radius only since 16.4**; the 👤 line is where that is settled, not a headless run.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/attendance.css`
  - `src/scores.css`
  - `src/shell.css`
  - `tools/verify-shell.mjs`
  - `tools/verify/attendance-header.mjs`
  - `tools/verify/focus-ring.mjs`
  - `tools/verify/score-search.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**Pointers and traps from the orchestrator** (things you would not guess):

- `src/shell.css` ~509–533 is the box and the ✕; the coarse block ~2326–2349 currently gives the
  **wrapper** `min-height: 44px` and padding. After the rebuild the wrapper should be a positioning
  context with no border, padding or height of its own — the Acceptance's first line asks that the
  `<input>`'s box *equal* the visible border's box, so any leftover wrapper padding or height that
  keeps a visible gap fails it. The `(max-width: 1024px)` rule at ~2349 and `src/attendance.css`
  ~246 (`.attendance-find` width, and its specificity note about beating that rule) must still
  govern width.
- The two boxes are `index.html` ~948 (attendance, `.search-box attendance-find`) and ~1476 (Scores
  toolbar). Read the WO-2.58 comment above the attendance box before touching markup — the ✕ is
  shown/hidden by class, never re-rendered.
- Find out how the 🔍 is drawn today (markup or CSS) before positioning it. If it is
  a pseudo-element or text node on the wrapper it can stay on the wrapper, absolutely positioned
  over the field's left edge; it must not intercept a tap meant for the field (`pointer-events`).
- The ✕ must stay a 44px target under a coarse pointer while sitting **over** the field: the field's
  right padding must clear it, and the ✕'s hit area must not cover typed text (Acceptance line 2 —
  measure the text's visible extent, e.g. via a Range or `scrollWidth` against padding, not by
  eyeballing).
- Mutation for line 1: put the border back on the wrapper (and off the input), run, see red,
  **revert before writing anything else**, re-run green. Mark it `MUTATION` while it is in, so a
  dead run is greppable.
- Do not edit `tools/verify/focus-ring.mjs` or § 8 of `wo-sweep.mjs` — Acceptance line 4 is that
  they pass *unchanged*. New assertions go into `tools/verify/score-search.mjs`.
- If `tools/README.md` records a `check()` count for a harness file you grow, update it, or the
  sweep goes red on finished work (WO-3.26).
- Leave the 👤 line `- [ ]`. Draft the `CHANGELOG.md` entry; `TESTING.md` § WO-2.61 is a
  deliverable, not optional.

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

1. On both screens the focused element is the bordered one: with the field focused, the `<input>`'s bounding box equals the visible border's box (it carries the border-radius and the border), and the 🔍 and the ✕ lie inside it. Mutation-proved against putting the border back on the wrapper.
2. Typed text never runs under the glyph or the ✕: with a long string in the field, the text's visible start is right of the 🔍 and its end is left of the ✕.
3. The ✕ keeps every WO-2.58 behaviour on both screens — absent on an empty field, a tap empties it, restores the list and leaves the field unfocused, Escape empties it — and is still a 44px target under a coarse pointer; the field is still ≥44px tall there.
4. `tools/verify/focus-ring.mjs` and `wo-sweep.mjs` § 8 pass **unchanged**: one global ring, and no rule removes an outline.
5. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. `CACHE` in `sw.js` is bumped.
6. 👤 On the iPad, after a force-quit: tap into each search box and read the ring — rounded, outside the border, the 🔍 inside it, the same shape as the guardian dialog's Relation field.

**Write `TESTING.md` § WO-2.61 — it is a deliverable, not a permission.** Add `### WO-2.61 — the search box's focus ring traces the field inside it, not the box you see` under `## Phase 2 — Attendance`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-2.61` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

