# WO-1.76 — the roster dialog is wide enough for its rows · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.76-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, at **Opus** (no model override): the row it measures carries the support dot, whose build sits behind `supportsVisible()` (WO-1.9, presentation mode — a sensitive surface the width must not touch), and its Traps are judgment rather than mechanics — the dot's position is an owner ruling, and a flex-growth cause must be reported, not fixed under a width work order. Codex was the runner-up and set aside: the Acceptance is a visual measurement plus an owner reading, and the dot question has no mechanical answer.

**The three owner questions, taken at their written defaults — none was answered at dispatch, so do not go beyond them:**
1. **Width: 640px**, on a class of its own (model: `.attendance-keys-panel` in `src/attendance.css` ~l.879–885, restated at ~l.1235 inside the coarse-pointer block because `src/shell.css` ~l.2523 sets `.modal-panel { width: 95vw; }` there). Put the new class in `src/shell.css`, beside `.modal-panel` (~l.741), with its own comment naming WO-1.76 and that the number is provisional pending the owner's iPad reading.
2. **Dialogs: the roster only** (`#rosterModal`, `index.html` ~l.3692). `#classesModal`, `#teacherModal`, confirms and the single-student form stay at 480 — and the harness asserts they do (Acceptance line 3; pick a representative set and name it in the result).
3. **The dot: not moved.** Measure where it lands at 640 with a long name + supports + an *also in* note. If it still sits away from the name (the `flex: 1 1 140px` growth on `.roster-row-name`), **report it with the measured geometry** in the result file and leave `src/roster.js` and the row CSS alone. Acceptance line 2's "the dot is where the owner ruled" is then **not closable by you** — leave it `- [ ]` with a note, it is the owner's ruling. Line 6 is 👤 and stays open.

**Traps you would not guess.** `#rosterModal` is also one of the three dialogs WO-1.72 gave a back button (`index.html` ~l.2559 comment) — don't disturb that header. An `index.html` edit means `CACHE` in `sw.js` is bumped (it is entry one of `SHELL`). Line endings: check `git diff --stat` before you finish; do not let an editor rewrite a file's endings. If you insert a mutation to prove a check bites, revert it **before writing anything else**, and `grep -rn MUTATION` your files before the result file. Expect one clean `verify-shell.mjs` run plus one per mutation (~4.4 min each). Write the `TESTING.md` § WO-1.76 section (owed, under Phase 1) and draft the `CHANGELOG.md` entry.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.76 — the roster dialog is wide enough for its rows

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-10 · **Size** S · **Depends on** WO-1.74 · **Blocks** nothing
**Closes roadmap** *(no box. Owner-directed, 2026-10-10.)*

**Booked 2026-10-10**, owner-directed, out of WO-1.71's iPad reading. Every line of that checklist
passed; the one remark was that **the support dot sits in an awkward position, probably because the
dialog is narrow**. The roster dialog is the heaviest door behind Settings, and it still draws at
`.modal-panel`'s default 480px — the width WO-2.59 found the attendance dialogs stuck at, and widened
to 640, 900 and 980 on classes of their own.

**What the row does today.** `studentRow()` in `src/roster.js` appends name · dot · note · actions.
`.roster-row-name` is `flex: 1 1 140px`, so the name grows and pushes the dot away from it, towards
the actions; at 480px with a long name or an *also in* note, the row wraps and the dot can land on a
line of its own. **The cause has been named by the owner, not measured** — read the row before
deciding that width alone fixes it.

**Questions at dispatch, for the owner**
1. **How wide.** 640px, on a class of its own the way `.attendance-keys-panel` is, is the starting
   proposal; the owner rules on the number after seeing it on the iPad.
2. **Which dialogs.** The roster is the one named. Classes and terms is the other door behind
   Settings that draws rows of names; widen it too only if the owner says so. Confirm dialogs and the
   small forms (Your details, a single student) stay at 480.
3. **Whether the dot moves.** If the dot still sits away from the name at the new width, say so with
   a screenshot and ask: beside the name, or where WO-1.74 left it. Do not move it without a ruling.

**Deliverables**
- **`src/shell.css`**: a width class on the roster dialog's panel (and on any other the owner names),
  restated in the coarse-pointer block if `.modal-panel { width: 95vw }` there would otherwise win,
  as `src/attendance.css` does for Keys. `.modal-panel`'s `max-width: 95vw` still governs at phone
  width.
- **`index.html`**: the class on the panel.
- **The harness**: the roster panel measures the chosen width at a laptop viewport and stays within
  95vw at 390×844; a row with the support dot, a note and a long name is one line tall at the new
  width.
- **`TESTING.md` § WO-1.76**, the `CHANGELOG.md` entry, and **`CACHE` in `sw.js` bumped.**

**Acceptance**
- [ ] The roster dialog's panel is the width the owner ruled at a 1280px viewport, and no wider than
      95vw at 390×844, with no horizontal overflow.
- [ ] At that width a roster row for a student with supports, a note and a long name is one line
      tall, the dot is where the owner ruled, and ✎ · Edit · Remove are on that line.
- [ ] Every dialog the owner did not name still measures 480px.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. `CACHE` in `sw.js` is bumped.
- [ ] `TESTING.md` § WO-1.76 carries these lines verbatim with the evidence for each.
- [ ] 👤 On the iPad, after a force-quit, upright and lying down: open Roster from Settings in a class
      with a student who has supports and one in two classes, and read where the dot sits.

**Traps** — **Depends on WO-1.74 on purpose**: its Acceptance measures a row at 480px, and widening
first would make that measurement pass for the wrong reason. **The dot is still built only when
`supportsVisible()` says so** — WO-1.9's acceptance is that it is absent from the DOM under a
projector, not hidden in it; a width change must not touch that branch. **Do not widen
`.modal-panel` itself**: thirty-odd dialogs share it, and a confirm at 640px is a sentence across a
laptop. **Width is not a substitute for a ruling on the dot** — if the measurement shows the flex
growth is the real cause, report it rather than fixing it under a width work order.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/attendance.css`
  - `src/roster.js`
  - `src/shell.css`
  - `tools/verify-shell.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `src/attendance.css` § "THE KEYS DIALOG'S WIDTH (WO-2.59)" and the 900/980 comments after it (~l.879–930) — the convention this width class copies, including the coarse-pointer restatement.
- WO-1.74's harness checks in `tools/verify-shell.mjs` (grep `WO-1.74`) — the 480px row measurement this work order must not make pass for the wrong reason; add beside it rather than altering it.

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

1. The roster dialog's panel is the width the owner ruled at a 1280px viewport, and no wider than 95vw at 390×844, with no horizontal overflow.
2. At that width a roster row for a student with supports, a note and a long name is one line tall, the dot is where the owner ruled, and ✎ · Edit · Remove are on that line.
3. Every dialog the owner did not name still measures 480px.
4. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. `CACHE` in `sw.js` is bumped.
5. `TESTING.md` § WO-1.76 carries these lines verbatim with the evidence for each.
6. 👤 On the iPad, after a force-quit, upright and lying down: open Roster from Settings in a class with a student who has supports and one in two classes, and read where the dot sits.

**Write `TESTING.md` § WO-1.76 — it is a deliverable, not a permission.** Add `### WO-1.76 — the roster dialog is wide enough for its rows` under `## Phase 1 — Shell, store, roster`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-1.76` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

