# WO-4.1 — Signal engine & thresholds · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-4-signals.md`
**Report to** `.claude/dispatch/WO-4.1-result.md` — as your last act, and return it in-band too.

**Routing decision.** Routed to **Claude at Opus tier**, on ROUTING.md's "it establishes a
convention" and "it produces teacher-facing prose" triggers: this work order builds the *evaluator
contract* — the hit shape and the rule-authored one-sentence explanation — that WO-4.2, WO-4.3,
WO-4.5 and WO-5.1's `{{signals.list}}` merge field all copy, and those explanations end up in mail
that goes home to a guardian. `ROUTING.md` § "Later phases, at a glance" calls WO-4.1 one of "the
strongest Codex candidates in the project"; **that advisory is not being followed**, because it reads
the phase-level name while this work order's own **Out of scope** line moves every rule and all of
the specified arithmetic to WO-4.2/WO-4.3 — what is left is convention, a settings editor, and prose.
The runner-up consideration set aside: the threshold *values* genuinely are fully tabulated in
`docs/data-model.md` § Signal thresholds, which is a real Codex signal, but a new settings editor and
a backup round-trip in the Acceptance keep it out of that column on two further counts.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-4.1 — Signal engine & thresholds

**Ship** 3 · **Status** 🤖 CLAIMED — 2026-08-19 · **Size** M · **Depends on** WO-2.4, WO-3.4
**Closes roadmap** Phase 4 → "Threshold engine reading every rule from the document, editable in
Settings", "One evaluator produces both lists", "Why is this student here?"

**Why it exists.** One evaluator produces both lists. A student can appear on both at once, and
**that is information rather than a bug** — a student whose grade is climbing while their attendance
falls is exactly who a teacher wants to see twice.

**Deliverables**
- `signals` block in the document holding every threshold — *not* `localStorage`, because these are
  the teacher's settings and must survive a device change and travel through sync.
- A settings editor for every threshold, with the documented defaults pre-filled and a reset.
- One evaluator: takes the document plus a class and term, returns a list of hits, each carrying
  direction (concern/praise), rule id, the student, the **numbers that produced it**, and a
  one-sentence explanation built from those numbers.
- **Windows count meetings, not days**, using WO-2.4's helper. A class may go a week without
  meeting; "4 absences in the last 20 days" is nonsense.
- Explanations are produced **by the rule itself**, not written per-screen — so "why is this student
  here?" is answered by construction and can never drift from the arithmetic.

**Out of scope** — the individual rules (WO-4.2, WO-4.3) and the UI lists.

**Acceptance**
- [ ] Every threshold is editable and persists through save, reload, and a backup round-trip.
- [ ] The evaluator returns both directions from a single pass.
- [ ] A student appearing on both lists renders on both, with different explanations.
- [ ] Every hit carries real numbers; no explanation contains a placeholder or a rounded lie.
- [ ] All windows are expressed in meetings. Grep for any day-based window and remove it.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `docs/data-model.md` § **Signal thresholds** (line ~431) — the tabulated defaults you must
  implement, both directions, plus the three rules stated under the tables: *praise ranks by delta
  not level*, *windows count meetings not days*, and the attendance formula
  `(P+T+E+D) / (P+T+A+E+D)`. Also § **Outreach templates**, for `{{signals.list}}` — "why this
  student surfaced, in plain sentences" is a downstream consumer of the explanation string you are
  designing, so write it as a sentence that can sit in an email, not as a debug label.
- `src/store.js` — **read the `signals: {}` comment in `newYearDocument()` before you design the
  block.** It is already seeded, and it already settles two things for you: the defaults are *not*
  pre-filled into the document, and **the evaluator must read a missing key as its default**, because
  every document written before a threshold existed is missing it. That means **no
  `SCHEMA_VERSION` bump and no `MIGRATIONS` entry** — do not add either. Read the migration ladder's
  header comment anyway, so you can see why.
- `src/grade-engine.js` (WO-3.4) — `weightedClassGrade(doc, cls, termId, studentId)`,
  `categoryResult`, `openWork`, `letterFromPercentage`. Anything grade-shaped comes from here; do
  not re-derive weighted-grade arithmetic in the signal engine.
- `src/attendance.js` (WO-2.4) — **`lastMeetings(classId, count, through)` at ~line 1365 is the
  meetings-window helper the Deliverables mean.** Also `termTotals`, `attendanceTotals`,
  `percentText`, `stateOf`, `countsFor`. Note `meetingDatesCallCount()` — WO-2.13's
  totals-once-per-render instrumentation; if your evaluator walks meetings per student it will show
  up there, so prefer one walk per class.
- `src/days-off.js` line ~100 and `plans/rotating-schedule.md` — what counts as a recorded meeting,
  and why there is no schedule model. Three states, not two.
- `src/categories.js` (~line 208) and `src/letter-scale.js` (~line 256) — **the settings-editor
  convention to lift for the threshold editor**: how a numeric settings panel debounces to the
  document rather than saving per keystroke, how it re-reads on open, and its markup and touch
  targets. Copy the pattern; do not invent a third one. `src/classes.js`'s note at ~line 332 about
  `<select>` on an iPad applies to any picker you add.
- `src/backup.js` — do not modify it, but confirm by running the round trip that the `signals` block
  survives export and restore (Acceptance line 1). `store.js`'s `restoreDocument()` is the other
  half.
- **Out of scope, and the line runs between the threshold and the rule.** Read it carefully, because
  it is the trap in this work order:
  - **In scope: every threshold.** The Deliverables say the `signals` block holds *every* threshold
    and the editor covers *every* threshold with the documented defaults pre-filled — so all nine
    concern values and all five praise values from `docs/data-model.md` § Signal thresholds live here,
    named and editable, plus the cooldown default (14 days). Naming them is exactly the
    convention-setting half of this work order: WO-4.2, WO-4.3 and WO-4.5 will read the keys you pick.
  - **Out of scope: the rules that evaluate them.** WO-4.2 owns the nine concern rules, WO-4.3 the
    five praise rules, WO-4.4 the behavior log, WO-4.5 cooldown enforcement, and **the concern and
    praise list UI is nobody's here** — "the UI lists" is named in Out of scope in as many words.
  - You do need **enough rules actually registered to prove the engine**: Acceptance 2 wants both
    directions from a single pass and Acceptance 3 wants one student on both lists with different
    explanations, and neither can be demonstrated by an engine with no rules in it. Register the
    minimum that proves the contract, **name in your report exactly which rule ids you registered and
    which Acceptance box each one was necessary for**, and leave the remainder to their work orders.
    If you find yourself writing the eighth rule, you have widened the work order.
  - Acceptance 3 says the student "renders on both" — with the list UI out of scope, satisfy it at the
    contract level: two hits, same student, opposite directions, demonstrably different explanation
    strings from one evaluator pass. Say in your report how you demonstrated it and what a future list
    screen would have to do to display it.
- **The working tree is already dirty in `design/mockups/`** (six modified, three untracked —
  `calendar.html`, `glance.html`, `proposed-phase6.css`). That is unrelated in-flight design work,
  not yours. **Do not touch, revert, tidy, or commit anything under `design/mockups/`.**

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

## 5. Done means these 5 lines, reported against one by one

1. Every threshold is editable and persists through save, reload, and a backup round-trip.
2. The evaluator returns both directions from a single pass.
3. A student appearing on both lists renders on both, with different explanations.
4. Every hit carries real numbers; no explanation contains a placeholder or a rounded lie.
5. All windows are expressed in meetings. Grep for any day-based window and remove it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

