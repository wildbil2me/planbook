# WO-1.74 — a roster row's "also in" note sits under the name · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.74-result.md` — as your last act, and return it in-band too.

**Routing: Claude Opus** (no model override). The deciding signal is the Trap on the support dot: the row's order changes around a control that exists only when `supportsVisible()` allows it, which is presentation mode and accommodation data, a sensitive surface the rubric never delegates, and the deliverables include `TESTING.md` and `CHANGELOG.md` prose. The runner-up was Codex, since an XS lift of an already drawn mockup section is pattern-matching work; I set it aside because of the sensitive surface. The Ship 1 table names no route for this row.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.74 — a roster row's "also in" note sits under the name

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-10 · **Size** XS · **Depends on** — · **Blocks** nothing
**Closes roadmap** *(no box. Owner-directed, 2026-10-10.)*

**Booked 2026-10-10**, owner-directed, out of reading the roster dialog drawn as the heaviest door
behind WO-1.71's hub. A student in two classes gets *"also in AP Literature"* right-aligned before the
row's actions, and at 480px that pushes ✎ · Edit · Remove onto a second line — so the students a
teacher shares with a colleague are the rows twice the height of everyone else's.

**Surface.** [`design/mockups/settings-hub.html`](../../design/mockups/settings-hub.html), frame G,
styled in [`design/mockups/proposed-settings.css`](../../design/mockups/proposed-settings.css)
§ ROSTER WHO.

**Rulings, the owner's, 2026-10-10**
1. **The note goes under the name**, in its own grey, and the actions stay on the first line.
2. **The note is not built when it would be empty.** Today `studentRow()` appends an empty span to
   every row.

**Deliverables**
- **`src/roster.js`**: `studentRow()` wraps the name and the note in `.roster-row-who`. The same rows
  draw under *Not in any class*, so they change too.
- **`src/shell.css`**: § ROSTER WHO lifted.
- **The harness**: a row with a note and a row without are one line tall at 480px; the note is the
  name's sibling, under it; no empty note in the DOM.
- **`design/mockups/proposed-settings.css`'s banner** and its `README.md` section amended.
- **`TESTING.md` § WO-1.74**, the `CHANGELOG.md` entry, and **`CACHE` in `sw.js` bumped.**

**Acceptance**
- [ ] At 480px a roster row for a student in three classes is the height of a row for a student in
      one, with the note under the name and ✎ · Edit · Remove on the name's line.
- [ ] No row carries an empty `.roster-row-note`.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. `CACHE` in `sw.js` is bumped.
- [ ] `TESTING.md` § WO-1.74 carries these lines verbatim with the evidence for each.

**Traps** — **The support dot stays where it is**, after the name block and before the actions, and
it is still built only when `supportsVisible()` says so — WO-1.9's acceptance is that it is absent
from the DOM under a projector, not hidden in it. **`.roster-row-name`'s own `flex` is not edited**:
the column takes it, and its children take none, which is what keeps a stacked name from growing
140px tall.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `design/mockups/proposed-settings.css`
  - `design/mockups/settings-hub.html`
  - `src/roster.js`
  - `src/shell.css`
  - `tools/verify-shell.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**Traps the work order does not spell out (orchestrator, from reading the tree):**

- **`.roster-row-name` and `.roster-row-note` are shared.** `src/days-off.js:384-389` and `src/events.js:375-380` build rows with the same two classes, and `src/shell.css:1442-1444` plus the coarse block at about line 2375 style them for everyone. That is why the mockup writes § ROSTER WHO as a *child* rule (`.roster-row-who`, `.roster-row-who > *`). Lift it as written, leave the days-off and events rows alone, and do not edit the shared rules.
- **Existing harness readers assume every row has a note.** `tools/verify/roster-contacts.mjs:43` maps `.roster-row-note` textContent per row, and `attendance-passes.mjs:2309` / `calendar-events.mjs:194` do the same for other lists. Once the note is not built, `(null||{}).textContent` is `undefined` where it used to be `''`. Check whether any assertion compares against `''`, and fix the reader rather than the rule.
- **Required order after the change:** avatar, `.roster-row-who` (name, then the note only if non-empty), support dot (only when `supportsVisible() && hasSupports`), actions. To measure "one line tall", compare the row's own box height with and without the note. Don't measure the text. Use a fixture student in three classes and one in one class, at a 480px panel width.
- **`proposed-settings.css`**: change the line-39 index entry and the § ROSTER WHO banner to "lifted", the way § SETTINGS HUB reads, and keep the section's rules. `wo-sweep.mjs` § 19 reads these banners. Run it.

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

## 5. Done means these 4 lines, reported against one by one

1. At 480px a roster row for a student in three classes is the height of a row for a student in one, with the note under the name and ✎ · Edit · Remove on the name's line.
2. No row carries an empty `.roster-row-note`.
3. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. `CACHE` in `sw.js` is bumped.
4. `TESTING.md` § WO-1.74 carries these lines verbatim with the evidence for each.

**Write `TESTING.md` § WO-1.74 — it is a deliverable, not a permission.** Add `### WO-1.74 — a roster row's "also in" note sits under the name` under `## Phase 1 — Shell, store, roster`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-1.74` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

