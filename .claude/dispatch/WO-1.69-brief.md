# WO-1.69 — a proposed stylesheet whose sections cannot be read passes the collision check unread · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.69-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, **Opus** (no model override). Deciding signal: it edits `tools/wo-sweep.mjs`, a pipeline file, and its second Deliverable carries a judgment call the work order hands to you in words ("if the header index turns out to be too loose to read reliably, say so at the check and keep only the first rule"), plus owed `TESTING.md` prose. Runner-up set aside: Codex — XS, no UI, a mechanically checkable mutation, and `wo-sweep.mjs` is seconds a run, so the budget would fit; the judgment clause and the pipeline-file status tipped it, and ties go to Claude.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.69 — a proposed stylesheet whose sections cannot be read passes the collision check unread

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-10 · **Size** XS · **Depends on** — · **Blocks** nothing
**Closes roadmap** *(no box. Tooling, not app — the same call WO-1.26 through WO-1.68 made.)*

**Booked 2026-10-09**, owner-directed, out of drawing the attendance screen (`8bfff03`). A ride-along
on `tools/wo-sweep.mjs` § 19: fold it into the next sitting that has that file open.

**Why it exists.** `design/mockups/proposed-attendance.css` was first written with one-line section
banners — `/* ══ § ATTENDANCE HEADER → src/attendance.css (WO-2.58 — not yet lifted) ══ */`. § 19
reads a section only where a `§` line sits directly under a rule of `═`, so it parsed **neither
section**, and the sweep stayed green: *"a pending mockup section styles no class src/ already
styles"* reported two pending sections, both from other sheets, and never looked at the nine new
class names; *"every drawing names an unbuilt work order that names it back"* never saw WO-2.58 or
WO-2.60. Caught by reading the PASS line's list, not by any FAIL, and fixed in the same sitting by
reshaping the banners.

**The guard that should have caught it is sheet-blind.** § 19's empty-parse check fires only when
*every* `proposed*.css` parses to zero sections (`!sheets.length || !sections.length`). One sheet
parsing to nothing among a dozen that parse is invisible — which is the guard's own warning, *"reads
green from a distance and is not"*, one level down.

**Deliverables**
- **§ 19 fails a `proposed*.css` that declares a class but parses to zero body sections**, naming the
  sheet and the banner shape it expects.
- **§ 19 fails a section named in a sheet's header index (`§ NAME → src/…`) that has no body banner**,
  which is what a mis-shaped banner looks like from the outside. If the header index turns out to be
  too loose to read reliably, say so at the check and keep only the first rule.
- **`tools/README.md`** and the § 19 banner in the sweep say what is now checked.

**Acceptance**
- [ ] On a scratch copy, rewriting one body banner of a real `proposed*.css` as a one-line comment
      turns the sweep red, naming that sheet. Reverted before anything else is written.
- [ ] Every `proposed*.css` in the tree today passes unchanged.
- [ ] `node tools/wo-sweep.mjs` is green and `node tools/wo-gate.mjs --audit` passes.
- [ ] `TESTING.md` § WO-1.69 carries these lines verbatim with the evidence for each.

**Traps** — **Do not widen the banner shape the parser accepts** to make the one-liner pass: the
shape is `PROTOCOL.md` rule 4's, and a looser parser is a second shape to keep in step. **Do not
count a sheet with no classes as a failure** — a sheet that only carries cross-cutting blocks is
legitimate. **This changes `tools/wo-sweep.mjs`, a pipeline file**: read `plans/work-orders/README.md`
§ "The pipeline's own files" before editing it. **Nothing in `src/` moves**, so no `CACHE` bump is
owed.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `design/mockups/proposed-attendance.css`
  - `plans/work-orders/README.md`
  - `src/attendance.css`
  - `tools/README.md`
  - `tools/wo-gate.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `design/mockups/PROTOCOL.md` rule 4 (the banner shape) and rule 5 (the collision rule § 19 enforces).
- `tools/wo-sweep.mjs` § 19, from line ~1649; the empty-parse guard this tightens is at ~1927
  (`!sheets.length || !sections.length`). The `declares`-a-class helper is at ~127 — reuse it for
  "declares a class"; do not write a second one.
- `plans/work-orders/README.md` § "The pipeline's own files" — read before editing the sweep.

**Traps the orchestrator found in the tree, 2026-10-10 — read before writing the rule:**
- **The header index is not one shape.** Index lines sit indented inside the opening comment, and some
  wrap onto a second line (`proposed-phase4.css:25`, `proposed-scores.css:37`, `:39`). `proposed-phase6.css:27`
  names `§ SHARED  →  whichever lands first`, not a `src/` path. Your rule must hold on all of them, or
  you take the work order's own exit and keep only the first rule — say which at the check.
- **Not every `§ … →` line in a sheet is the index.** Body banners carry the same `§ NAME → src/…` text
  (e.g. `proposed-attendance.css:49`, `:120`), and `proposed-phase7.css:79` is a body banner with a
  5-space indent like an index line. Bound "the header index" to the opening comment, not to a regex.
- **`proposed-phase7.css:19` is a live one-line banner** — `/* ══ § SYNC BUTTON → src/shell.css … */`,
  exactly the shape this work order exists to catch, sitting in the tree today. That sheet has no header
  index and parses `§ FIRST RUN`, so neither of your rules should fire on it, and Acceptance line 2 says
  every sheet passes **unchanged**. Do not reshape it and do not widen the parser to read it. Report it
  in your result file as a proposed follow-up (the gap neither rule reaches: a one-line banner in a
  sheet with no index and at least one good section). If your rules DO fire on it, stop and report that
  rather than editing the sheet.
- **The mutation is on a scratch copy and is reverted before anything else is written.** Run
  `grep -rn MUTATION` over what you touched before your result file. If the sweep reads files by fixed
  path, the scratch-copy method is yours to choose (a copy of the repo, or a temporary edit to a
  `proposed*.css` restored from `git show HEAD:`), but say exactly what you did in `TESTING.md`.
- **`tools/README.md` records counts for the sweep.** If you add `check()` call sites, update the
  recorded count in the same sitting — a stale count turns the sweep red (WO-3.26).

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

1. On a scratch copy, rewriting one body banner of a real `proposed*.css` as a one-line comment turns the sweep red, naming that sheet. Reverted before anything else is written.
2. Every `proposed*.css` in the tree today passes unchanged.
3. `node tools/wo-sweep.mjs` is green and `node tools/wo-gate.mjs --audit` passes.
4. `TESTING.md` § WO-1.69 carries these lines verbatim with the evidence for each.

**Write `TESTING.md` § WO-1.69 — it is a deliverable, not a permission.** Add `### WO-1.69 — a proposed stylesheet whose sections cannot be read passes the collision check unread` under `## Phase 1 — Shell, store, roster`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-1.69` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

