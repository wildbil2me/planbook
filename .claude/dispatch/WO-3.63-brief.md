# WO-3.63 — the assignment editor's messages draw together, just above its buttons · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.63-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, Opus tier, routed on the merits: this work order produces teacher-facing prose
(`TESTING.md` § WO-3.63, the `CHANGELOG.md` entry, markup comments), and its Traps are judgment calls
(the refusal must not move beside the Name field; the accommodation prompt stays put). The runner-up
was Codex, since the change itself is a markup move with mechanically checkable geometry. I set it
aside because of the prose and the traps.

**The owner answered both Open questions at dispatch, 2026-10-12, and both answers are "as drawn".**
1. **Order inside the place.** The amber term note (`#assignmentTermNote`) goes first and the red
   refusal (`#assignmentError`) goes last, directly above `.modal-actions` and touching Done.
2. **The accommodation prompt** (`[data-accommodation-prompt]`, WO-3.8) **is not a message.** It stays
   under the fields, where it is now. Do not move it, and this row grows no line for it.

The Deliverables and Traps already match both answers. **Recording them is an added deliverable:**
- In the work order (`plans/work-orders/phase-3-gradebook.md`, WO-3.63's **"Open — the owner, at
  dispatch."** paragraph), rewrite the paragraph so it records both as **answered 2026-10-12, the
  owner: as drawn**. Keep the reasoning and remove the "open" framing. Also change the Deliverables
  line's "(the drawing's order; see the Open line)" and the Traps line "unless the Open line is
  answered that way" so neither one points at a question that is no longer open.
- In `design/mockups/README.md` § "The open questions, collected" (around lines 1268–1271), items
  1 and 2 still read *(Open on WO-3.63.)*. Mark each answered the way item 3 already is:
  *(**Answered 2026-10-12, the owner: as drawn** …)*. If that file has a rulings list above the
  collected questions (item 3's answer is recorded there), record these two there in the same style.
- Check `design/mockups/dialog-messages.html`'s own prose (and WO-3.58's section of the phase file)
  for any sentence that calls either question open. Correct what you find and name each edit in your
  result. Stay inside the WO-3.63 questions: questions 4 onward belong to other rows and stay open.

**Two cautions.** (1) The 👤 line stays `[ ]` no matter what you see headless. The keyboard Trap is
the reason that line exists. (2) If you insert a mutation to prove a geometry check bites, revert it
before you write a single line of prose (`AGENTS.md`). Before you report, run `grep -rn MUTATION` over
everything you touched.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.63 — the assignment editor's messages draw together, just above its buttons

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-12 · **Size** S · **Depends on** WO-3.58
**Closes roadmap** *(no box. Owner-directed, 2026-10-12.)*

**Booked 2026-10-12** out of [WO-3.58](#wo-358--the-dialogs-behind-the-assignments-and-scores-screens-are-read-together-and-a-layout-is-ruled),
the first case of its rule. The editor's *needs a name* refusal (`#assignmentError`, WO-3.56 ruling
4) draws **after** `.modal-actions`, under Done, where the owner missed it on the iPad. Its other
message, the amber *no term holds these dates* line (`#assignmentTermNote`, WO-3.50), draws in a
second place, under the fields and above the two hints.

**Surface.** [`design/mockups/dialog-messages.html`](../../design/mockups/dialog-messages.html),
frame 1. No stylesheet change is drawn: both elements keep their classes and their margins.

**Rulings, the owner's, 2026-10-12** (WO-3.58's ruling 2, carried)
1. A dialog's messages — refusals, warnings, notes — draw **above its buttons, in one place**.
2. The refusal moves to **just above** the buttons. **Not beside the Name field.**

**Deliverables**
- **`index.html`**: `#assignmentTermNote` and `#assignmentError` move to sit together directly before
  the editor's `.modal-actions`, after the two `.class-hint` paragraphs — the term note first and the
  refusal last, nearest Done (the drawing's order; see the Open line). The markup comments at both
  move with them and say why they are there.
- **`src/assignments.js`**: nothing should need to change — both are found by id. If a comment there
  says where either one sits, it is corrected.
- **The harness**: beside WO-3.56's refusal check in `tools/verify/copy-class.mjs`, and beside the
  term-note checks in `tools/verify/assignments.mjs` — with the refusal showing, its bottom is above
  the actions row's top, and nothing but the term note sits between them; with the term note
  showing, the same. Measured from `getBoundingClientRect()`, not from DOM order alone.
- **`TESTING.md` § WO-3.63**, the `CHANGELOG.md` entry, and **`CACHE` in `sw.js` bumped** —
  `index.html` is `SHELL` entry one.

**Acceptance**
- [ ] With the name blank, Done shows the refusal **above** the editor's buttons, the last thing
      before them, and still focuses the Name field. The same from *Copy into other classes…*.
- [ ] The amber term note, when it shows, sits in the same place, directly above the refusal (or
      directly above the buttons when the refusal is not showing). Nothing draws after
      `.modal-actions` in the editor.
- [ ] Both messages keep their wording and their colours; the refusal is still spoken by the live
      region.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. `CACHE` in `sw.js` is bumped.
- [ ] 👤 On the iPad, after a force-quit, upright: + New assignment, then Done with no name — the
      refusal is seen without looking for it.

**Open — the owner, at dispatch.** (a) **The order inside the place**: the drawing puts the refusal
last, touching Done, because it is about the tap just made; the other order is equally "one place."
(b) **The accommodation prompt** (`[data-accommodation-prompt]`, WO-3.8): the drawing reads it as
not a message — a panel about the category above it, with its own button — and leaves it under the
fields. If the rule takes it too, it joins the place and this row grows a line.

**Traps** — **The refusal is focus-bearing**: `refuseBlankName()` puts the caret in the Name field,
and on an iPad that raises the keyboard, which may cover the bottom of the dialog. Read the 👤 line
with that in mind; if the keyboard hides the refusal, say so, and do not move it beside the field —
the owner ruled that out. **Do not move the accommodation prompt** in this row unless the Open line
is answered that way.

**Not in scope** — every other dialog (WO-3.64, WO-3.65), and the wording of either message.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `design/mockups/dialog-messages.html`
  - `src/assignments.js`
  - `tools/verify-shell.mjs`
  - `tools/verify/assignments.mjs`
  - `tools/verify/copy-class.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `design/mockups/dialog-messages.html`, frame 1. This is the surface you are matching.
- `design/mockups/README.md` § "The open questions, collected" and the rulings above it. You edit
  both (see the routing block).
- WO-3.56's ruling 4 and `refuseBlankName()` in `src/assignments.js`, which covers the focus and the
  live region. WO-3.50's term note and WO-3.8's accommodation prompt, for context only: neither one's
  behaviour changes.

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

## 5. Done means these 5 lines, reported against one by one

1. With the name blank, Done shows the refusal **above** the editor's buttons, the last thing before them, and still focuses the Name field. The same from *Copy into other classes…*.
2. The amber term note, when it shows, sits in the same place, directly above the refusal (or directly above the buttons when the refusal is not showing). Nothing draws after `.modal-actions` in the editor.
3. Both messages keep their wording and their colours; the refusal is still spoken by the live region.
4. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. `CACHE` in `sw.js` is bumped.
5. 👤 On the iPad, after a force-quit, upright: + New assignment, then Done with no name — the refusal is seen without looking for it.

**Write `TESTING.md` § WO-3.63 — it is a deliverable, not a permission.** Add `### WO-3.63 — the assignment editor's messages draw together, just above its buttons` under `## Phase 3 — Gradebook`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-3.63` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

