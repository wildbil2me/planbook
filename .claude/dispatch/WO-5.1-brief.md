# WO-5.1 — Merge-field resolver · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-5-outreach.md`
**Report to** `.claude/dispatch/WO-5.1-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude at the **Opus** tier: WO-5.1 *is* the merge-field resolver, one of the
five surfaces `CLAUDE.md` names as never-delegated, and `ROUTING.md` § "Later phases, at a glance"
already rules all of Phase 5 Claude-only as a property of the work. The deciding signal is the Traps
line — whitelist, never blacklist — which is exactly the kind of rule a model optimizing for clean
code inverts. The runner-up I set aside: the field table is fully specified in `docs/data-model.md`
§ Outreach templates and every Acceptance line is mechanically checkable, which reads Codex-shaped
on the first two rubric bullets — the sensitive-surface bullet is disqualifying on its own, so no
Codex probe was run.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-5.1 — Merge-field resolver

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-28 · **Size** M · **Depends on** WO-3.4, WO-4.1
**Closes roadmap** Phase 5 → "An unresolved merge field never renders blank" and "No merge field
ever resolves accommodation, medical, or plan data."

**Why it exists.** A template system makes an IEP disclosure a one-keystroke mistake unless it is
impossible by construction. An email to an administrator that happens to quote a 504 plan is a
disclosure incident. And separately: "Dear ," going home is worse than sending nothing.

**Deliverables**
- Resolver over one student at send time, supporting exactly the documented fields:

  | Field | Resolves to |
  |---|---|
  | `{{student.first}}` `{{student.last}}` `{{student.nickname}}` | Name parts |
  | `{{guardian.name}}` | The recipient guardian |
  | `{{class.name}}` `{{teacher.name}}` | Context |
  | `{{grade.percent}}` `{{grade.letter}}` | Current weighted grade |
  | `{{grade.delta}}` | Change over the signal's window — the praise workhorse |
  | `{{missing.count}}` `{{missing.list}}` | Missing work |
  | `{{attendance.percent}}` `{{attendance.absences}}` `{{attendance.tardies}}` | Term totals |
  | `{{signals.list}}` | Why this student surfaced, in plain sentences |
  | `{{behavior.recent}}` | Recent behavior log entries |

- **A refusal list, enforced at the resolver, not at the template editor.** Any path reaching
  `supports`, `medical`, `behaviorPlan`, `plan`, `caseManager`, or `reviewDate` is refused — it does
  not render, and it raises a named error. `{{signals.list}}` and `{{behavior.recent}}` are
  explicitly filtered too, since either could otherwise carry a plan reference through.
- Unresolved fields render **visibly intact** (`{{guardian.name}}` stays on screen) and block the
  send with a named error saying which field and which student.
- Numbers come from WO-3.4 and WO-2.4, never recomputed here — two grade implementations will
  disagree eventually, and the email is the copy that's wrong.

**Acceptance**
- [ ] A template containing `{{supports.accommodations}}` (or any refused path) refuses with a named
      error and renders nothing sensitive. Verify every path in the refusal list individually.
- [ ] `{{signals.list}}` for a student with an accommodation-derived signal emits no plan reference.
- [ ] A student with no guardian on file blocks the send naming the missing field; the draft is not
      sendable in that state.
- [ ] `{{grade.percent}}` matches the gradebook exactly for the same student and term.
- [ ] `{{grade.delta}}` matches the delta shown on the praise signal that produced the draft.
- [ ] An unknown field name is refused, not silently blanked.

**Traps** — Whitelist the resolvable paths; do not blacklist the forbidden ones. A blacklist fails
open the moment someone adds a field to the data model.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `docs/data-model.md` § **Outreach templates** (~line 612) — the field table, and the
  never-render-blank rule in its own words. § **The document** (~line 45) has every shape you will
  read from: `teacher`, `students[]` with `guardians[]` and `supports`, `classes[].terms[]`,
  `log[]`, `templates[]`.
- `docs/data-model.md` § **Accommodations** — what `supports` holds and why it is fenced.
- **The modules that own every number.** Read their exports; do not reimplement any of them.
  - `src/grade-engine.js` — `weightedClassGrade(doc, cls, termId, studentId)` and `openWork(...)`.
    `{{grade.percent}}` / `{{grade.letter}}` / `{{missing.*}}` come from here or they are wrong.
  - `src/attendance.js` — `termTotals(classId, studentId, term)`, `percentText(totals)`.
  - `src/signals.js` — `evaluate()` returns hits carrying `{ ruleId, studentId, numbers,
    explanation }`; `signalFigure(hit)` is the figure. Note the comment at `signalFigure()`: it
    names WO-5.1 by ID and expects you to hold several evaluations' worth of hits at once.
  - `src/log.js` — `entriesOfKind()` / `visibleEntriesFor()`, and `logKindVisible()` in
    `src/supports.js`.
  - `src/supports.js` — `supportsVisible()`, `presentationMode()`. Read it to know what the fence
    is around, not to route data through it.

**Four things worth deciding deliberately, because each is a place this can fail open.**

1. **The whitelist is the deliverable.** A map from exact field name → a resolver function is the
   shape the Traps line is asking for; anything that walks a path expression against the document
   is the blacklist wearing a disguise, however well the refusal list is written. The refusal list
   in the Deliverables is then a *test surface* — every path in it must be provably unreachable —
   rather than a runtime filter. Acceptance line 1 says "verify every path individually," so the
   refusal check needs to be real, not implied by the whitelist's existence.
2. **`{{signals.list}}` is safe by construction, and you should say why in a comment rather than
   re-filter it.** `CLAUDE.md` § Data: a rule is handed its own measured numbers and nothing else,
   so `explanation` cannot carry a plan reference. If you find that is not true of some rule, that
   is a defect in `src/signals.js` worth naming in your report — not something to paper over here.
3. **`{{behavior.recent}}` is the genuinely hard one, and free text is why.** A behavior log body is
   whatever the teacher typed and can mention anything. Decide what "filtered" means for it, state
   the limit honestly in a comment, and do not claim a guarantee the code cannot make. `CLAUDE.md`
   § Accommodations records the parallel ruling for notes in presentation mode — read it before
   choosing.
4. **Refusal and unresolved are two different outcomes.** A refused path (`supports.…`) is a named
   error and renders nothing sensitive; an unknown or unresolvable field renders **visibly intact**
   and blocks the send naming the field and the student. Do not collapse them into one code path
   — Acceptance lines 1, 3 and 6 grade them separately.

**Scope.** This work order has no **Out of scope** line, so hold it to its Deliverables: a resolver
module plus whatever proof it needs. The template editor is WO-5.2 and the send flow is WO-5.3 —
"block the send" here means the resolver reports a blocking error a later work order acts on, not
that you build a send button. If a UI surface feels necessary to prove a line, say so in your
report as a proposed follow-up instead of widening this one.

**Proof.** `tools/verify-shell.mjs` and `tools/wo-sweep.mjs` are the only two harnesses; do not
write a third. Six Acceptance lines that are all mechanically checkable is a strong hint this module
wants real coverage in one of those two — pick the one whose shape fits and say why in your report.

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

## 5. Done means these 6 lines, reported against one by one

1. A template containing `{{supports.accommodations}}` (or any refused path) refuses with a named error and renders nothing sensitive. Verify every path in the refusal list individually.
2. `{{signals.list}}` for a student with an accommodation-derived signal emits no plan reference.
3. A student with no guardian on file blocks the send naming the missing field; the draft is not sendable in that state.
4. `{{grade.percent}}` matches the gradebook exactly for the same student and term.
5. `{{grade.delta}}` matches the delta shown on the praise signal that produced the draft.
6. An unknown field name is refused, not silently blanked.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

