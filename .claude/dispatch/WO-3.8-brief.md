# WO-3.8 — Accommodation prompts at point of use · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.8-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude at **Opus** tier. The deciding signal is `ROUTING.md`'s sensitive-surface
rule — this work order reads accommodation and plan data and must suppress it in presentation mode,
which is two never-delegated surfaces in one deliverable, and the "Later phases, at a glance" note
names WO-3.8 Claude-only by name. The runner-up consideration set aside: at size S with an `appliesTo`
match that is mostly set logic, it superficially reads like a Codex row — but here a plausible-looking
implementation is a disclosure to a classroom wall, so no Codex probe was run and no fallback applies.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.8 — Accommodation prompts at point of use

**Ship** 2 · **Status** 🤖 CLAIMED — 2026-08-13 · **Size** S · **Depends on** WO-1.8, WO-3.3
**Closes roadmap** Phase 3 → "Accommodation prompts at point of use."

**Why it exists.** "A list nobody opens protects nobody." A teacher is legally obligated to
implement accommodations; surfacing them at the moment of use is what turns stored data into
compliance.

**Deliverables**
- Creating an assignment in a category matching an accommodation's `appliesTo` surfaces a summary:
  *"3 students have extended time, 2 need a separate setting."*
- Aggregate counts by default; names on deliberate tap.
- The prompt respects `appliesTo` — an accommodation scoped to `tests` doesn't fire on homework. An
  empty `appliesTo` means everything.
- **Suppressed entirely in presentation mode.**

**Acceptance**
- [ ] Creating a test surfaces the counts; creating a homework assignment scoped elsewhere doesn't.
- [ ] The default view is counts, not names.
- [ ] In presentation mode nothing appears at all — not even the count.
- [ ] Marking a student absent for the Nth time surfaces an attendance-related plan clause if one
      exists. *(Deferred to Phase 4 if the behavior log isn't ready; note it if so.)*

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**The two dependencies you are building on top of, and must match rather than re-derive:**

- **`src/supports.js` — WO-1.8's accommodation module. This is the one you must not route around.**
  It already owns every rule this work order needs: `supportsVisible()`, `presentationMode()`,
  `sensitiveValue()`, `setSensitiveText()`, `accommodationsOf()`, `kindLabel()`, `parseAppliesTo()`,
  `appliesToText()`, and the `ACCOMMODATION_KINDS` list. Read all of it before writing a line.
  Reading `student.supports.accommodations` directly, or re-implementing a presentation-mode check
  with your own `if`, is how the suppression rule ends up enforced in two places and true in one.
- **`src/assignments.js` — WO-3.3's assignment editor**, which is where the prompt has to appear.
  `createAssignment()`, `openAssignmentEditor()`, `renderEditorFields()`, `categoryField()` and
  `setAssignmentCategory()` are the relevant seams. The prompt must react to the **category actually
  chosen**, including when the teacher changes it in an open editor — an accommodation summary that
  is computed once on open and then goes stale is worse than none, because it is read as current.
- `src/presentation.js` — `refreshPresentationChrome()` and `togglePresentationMode()`. Whatever you
  build must go dark on a *live* toggle, not only on next render.
- `docs/data-model.md` § Accommodations, roughly lines 335–356. **It contains this feature's own
  worked example verbatim** — *"3 students have extended time, 2 need a separate setting"*, and the
  absence-clause sentence behind Acceptance line 4. It is the spec; the work order is the summary.
- `src/roster.js` — how the same data is rendered under the discreet-by-default rule today. Copy that
  treatment; do not invent a second visual language for the same secret.
- `plans/gradebook-surfaces.md` — where gradebook UI is allowed to live, if you need a new surface.

**Three judgment calls this work order does not make for you. Decide them, and say in your result
which way you went and why.**

1. **What "a category matching an accommodation's `appliesTo`" means mechanically.** `appliesTo` is
   free text the teacher typed, split on commas (see `parseAppliesTo`); a category is a class-level
   record with a teacher-chosen name. So the match is between two pieces of teacher prose — `Tests`
   vs `tests` vs `Test`. Pick a rule, make it forgiving in the direction of *showing* a prompt rather
   than silently withholding one, and write the reasoning at the point of departure. Under-firing is
   the failure that matters here: a missed prompt is a legal obligation not surfaced, and it is
   invisible. Over-firing is a teacher reading one extra line.
2. **Where the names live, given "names on deliberate tap."** Counts are the default and that is
   Acceptance line 2, not a preference. The tap target is a new control — 44px in the
   `@media (pointer: coarse)` block. Consider whether revealing names should re-hide on close, and
   whether it can be reached at all while `presentationMode()` is on. It must not be.
3. **Acceptance line 4, and whether it is deferrable.** Its parenthetical defers it "if the behavior
   log isn't ready" — **WO-4.4 Behavior & note logging is ⬜ NOT STARTED**, so the log is not ready.
   But read the line again before you lean on that: it is about *marking a student absent for the Nth
   time*, and attendance marking has shipped (`src/attendance.js`, WO-2.1) with counts (WO-2.4). If
   the clause can be surfaced from attendance data plus `supports` alone, the behavior log is not
   actually what it was waiting on and the deferral does not apply. If you conclude it genuinely is
   deferred, do **not** tick it and do not delete it: follow `plans/work-orders/README.md` §
   "A re-homed Acceptance line stays `- [ ]`" — leave the box open, add a bare `→ WO-4.4` pointer,
   add `**Owes** WO-4.4` to the WO-3.8 header, and make sure the pointer lands on exactly one box
   still `[ ]` under WO-4.4 (adding one there if none fits). `--tick` and `--audit` both check this.

**Two traps specific to this surface.**

- **Presentation mode means nothing appears at all — not even the count.** Acceptance line 3 says
  "not even the count" because a count is itself a disclosure: *"3 students have extended time"* on a
  projected screen, in a room of thirty, with a roster on the wall next to it, narrows to individuals.
  A greyed-out, blurred, or collapsed-but-present prompt fails this line. Absent means absent from the
  DOM, and that is the version to build.
- **Nothing you add may reach a print surface, an export, or a log line.** WO-3.9's grades print and
  CSV are `presentation-mode safe; no supports data on either`, and they render from the same screens
  you are touching. If your prompt lives anywhere a `@media print` block can see it, gate it the way
  the print work orders gate theirs.

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
  exceptions: **never tick a 👤 line** — it needs a real iPad and you do not have one — and leave the
  `CHANGELOG.md` entry to the teacher, who decides what a change means. Anything you do tick must be
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

1. Creating a test surfaces the counts; creating a homework assignment scoped elsewhere doesn't.
2. The default view is counts, not names.
3. In presentation mode nothing appears at all — not even the count.
4. Marking a student absent for the Nth time surfaces an attendance-related plan clause if one exists. *(Deferred to Phase 4 if the behavior log isn't ready; note it if so.)*

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

