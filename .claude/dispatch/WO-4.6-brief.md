# WO-4.6 — A rule that cannot fire *yet* is a different sentence from a rule that is not built · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-4-signals.md`
**Report to** `.claude/dispatch/WO-4.6-result.md` — as your last act, and return it in-band too.

**Routing decision (2026-09-20).** Claude at Opus, on the merits. The deciding signal is that the
spec for *when is each rule's window full* is written nowhere outside this work order — fourteen
registered rules, each needing its own reading of what its thresholds ask for — and the Traps are
judgment rather than mechanics (do not simulate; do not overload `inert`). The runner-up was Codex:
a pure engine module, no UI, no sensitive surface, mechanically checkable Acceptance — set aside
because the spec is not external to the work order, and "what counts as full" is the unwritten half.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-4.6 — A rule that cannot fire *yet* is a different sentence from a rule that is not built

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-20 · **Size** S · **Depends on** WO-4.1, WO-4.3

**Why it exists.** `inertRules()` answers one question — *which rules are registered and cannot fire
because the code behind them does not exist* — and it has answered `[]` since WO-4.4 landed and the
last `inert` string came out. It is still wired: `src/signals-view.js` reads it into `model.inert`
and `.sig-inert` draws *"One rule is not running yet: …"* from the length of the list, so the machinery
for saying this on screen is built and has nothing to say.

The question nobody has an answer for is the **other** one. In the first fortnight of a term, several
rules cannot fire because the term has not produced enough data yet — a grade fall wants four
assignments, a turnaround wants a window to look back across — and on those mornings the concern
column is short for a reason that has nothing to do with the students in it. **A teacher reading a
thin list in week one cannot tell "nobody qualified" from "not enough term yet",** which is the exact
confusion WO-4.2 built `inert` to prevent, arriving from the calendar's side instead of the
build's.

**This was declined once, deliberately, and this row is not that decision reversed.** WO-6.7 asked
whether the glance page's quiet panel should wear a "not yet" sentence, and the answer was **no** —
correctly, because `inertRules()` filters on a static per-rule string, knows nothing about term
length, and would have drawn nothing. **The screen was never the missing piece; the engine answer
was.** Book the engine answer here, in the phase that owns the rules, and let a screen wear it
afterwards if it earns the room.

**Deliverables**
- A second exported answer in `src/signals.js` — *rules that are built, registered, and cannot fire
  yet against this document on this date* — beside `inertRules()` and never folded into it. The two
  say different things and a screen that merged them would tell a teacher a rule is unbuilt when it
  is merely early.
- Each entry carries the rule's id, its direction, its text from `ruleText()`, and **why** in the
  same shape `inertRules()` already returns, so a caller that draws one can draw the other.
- The reason is **measured, not asserted**: a rule is not-yet because the data its own thresholds
  ask for is not there, read through `thresholdsOf()` like every other threshold read.

**Acceptance**
- [ ] Against a document in the first week of a term, the new answer names the rules whose windows
      are not full and no others; against a document with a full term behind it, it returns `[]`.
- [ ] `inertRules()` is unchanged and still returns `[]` — the two answers are separate functions
      with separate meanings, and no caller has to know which it is holding.
- [ ] `src/signals.js` still holds **no writer of any kind** (WO-4.3's invariant) — the new answer
      reads the document and the clock through the pass's existing `{ through }`, and stores nothing.
- [ ] A rule is handed its own measured numbers and nothing else: the new answer does not pass a
      rule the document, and does not re-run `evaluate()` to find out whether a rule fired.
- [ ] No screen is changed by this row. *(Deliberate. The engine answer is the deliverable; which
      surface wears it — the signals screen's existing `.sig-inert` line, the glance page's quiet
      panel, or neither — is a separate call with its own room argument, and WO-6.7's `Open` line is
      the record of that call being made once already.)*

**Traps** — The obvious implementation walks every day of the term to find out when each window
fills, which is WO-2.13's defect reached from a fifth direction. Ask the thresholds what they want
and count what exists; do not simulate. And **do not give a rule an `inert` string to mean "early"** —
that field means *not built*, it is read by a screen that says so in those words, and overloading it
makes the one sentence this row exists to separate impossible to write.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/signals-view.js`
  - `src/signals.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `src/signals.js` — the seams, by line as of this dispatch: `SIGNAL_SETTINGS` (197) is the field
  table every threshold and every `ruleText()` comes from; `thresholdsOf()` (338); the `RULES`
  registry (1145), each rule carrying `keys` and a `measure(ctx, studentId)`; `inertRules()` (1326)
  is the shape to mirror — `{ id, direction, text, why }`; `makeContext()` (1449) and its memoized
  readers `meetings(count)`, `windowTotals`, `countedWork`, `termMarks`; `termRangeOf()` (1406);
  `evaluate()` (1707) and `quietMiddle()` (1854) for the `(doc, cls, termId, { through })` call
  shape a sibling answer should take.
- `src/glance.js` ~line 140, "IT DOES NOT WEAR THE 'NOT YET' LINE" — the WO-6.7 decline this row is
  the engine half of. Leave that comment and that file alone; it is the record of the screen call
  this row says is separate.
- `tools/verify/signal-engine.mjs` and `tools/verify/concern-list.mjs` — where the engine is
  driven over `window.planbook.signals.*`. `src/shell.js:740` is `import * as signals`, so a new
  export is on the seam with no shell edit.
- `docs/data-model.md` § Signal thresholds (line 528) — the rules' own tabulated thresholds and windows.

### What you would not guess from the work order

- **The answer is about a class and a term, not about a student.** The sentence it exists to feed
  is "not enough term yet", which is a fact about the term. Count what the class has produced —
  assignments in the term, recorded meetings through `through`, days of term behind `through` —
  against what each rule's thresholds ask for, read through `thresholdsOf()`. A per-student
  reading is the concern pass re-run in disguise, which Acceptance 4 forbids.
- **The one judgment in this row, and write it down at the point of decision.** Some rules with a
  window fire on a partial one by design — `grade-fell` measures over `slice(-asked)` whatever its
  length, `attendance-window` and `absence-window` fire on any non-empty window — while others
  refuse until it is full (`no-missing` has `rows.length < asked → null`; `low-score-run`,
  `high-score-run`, `absence-run`, `tardy-count`, `missing-count` need at least `need` of something
  to exist; `turnaround` needs `through − turnaroundDays` to land inside data). The title governs:
  a rule this answer names is one that **cannot** fire on this date for want of data, so the
  answer must never name a rule `evaluate()` could return a hit for the same morning. Read every
  `measure()`'s null arms before deciding which rules are window-shaped, and say in a comment why
  each is in or out. Acceptance 1's "windows are not full" is read through that lens.
- **The behavior window is days, not meetings, and probably never "not yet"** — two entries on
  day two fire it. Do not list a rule because its unit is a window; list it because the data it
  wants cannot exist yet.
- **Do not build a context per student, and do not simulate.** One `makeContext()` (or a lighter
  read of the same helpers) per class-and-term is the budget; `ctx.meetings(count).length` is the
  meeting count, not a walk of the ledger. WO-2.13 is the scar: five classes × one screen.
- **`why` is a string a screen can print beside `inertRules()`'s `why`**, e.g. "the term has 2
  assignments so far; this rule wants 4". Extra measured fields beside it (`have`, `want`, `unit`)
  are welcome; the string is required.
- **Name it so the two cannot be confused** — something like `notYetRules(doc, cls, termId, opts)`;
  never a second arm on `inertRules()` and never an `inert` string on a rule object.
- **Harness.** Add checks in `tools/verify/signal-engine.mjs` (or `concern-list.mjs`) under the
  existing fixture discipline there — fixture pushed and truncated inside one page-side block,
  expected values literal. Prove Acceptance 1 both ways: a thin term names exactly the expected
  set; a full term returns `[]`. Prove Acceptance 2 by asserting `inertRules()` is still `[]`
  beside it. **If you add `check()` call sites, the count in `tools/README.md` ("The harness holds
  1405 `check()` call sites") must move with them or `wo-sweep.mjs` § 22 goes red** — WO-3.26's scar.
- **Acceptance 5 is a `git diff --stat` line**: `src/signals-view.js`, `src/glance.js`,
  `index.html` and every `.css` file unchanged. No `CACHE` bump in `sw.js` is needed unless a
  `SHELL` file moved; `src/signals.js` is in `SHELL`, so check and bump if it is.
- **Mutation round, then revert**: (a) make the answer name a rule with a full window and watch
  the thin-term check go red; (b) return `[]` for the thin term. Stage your own edits before any
  `git checkout` of a mutated file. **Revert every mutation before you write a line of your
  report** — `grep -rn MUTATION src tools` must be empty at the end.

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

## 5. Done means these 5 lines, reported against one by one

1. Against a document in the first week of a term, the new answer names the rules whose windows are not full and no others; against a document with a full term behind it, it returns `[]`.
2. `inertRules()` is unchanged and still returns `[]` — the two answers are separate functions with separate meanings, and no caller has to know which it is holding.
3. `src/signals.js` still holds **no writer of any kind** (WO-4.3's invariant) — the new answer reads the document and the clock through the pass's existing `{ through }`, and stores nothing.
4. A rule is handed its own measured numbers and nothing else: the new answer does not pass a rule the document, and does not re-run `evaluate()` to find out whether a rule fired.
5. No screen is changed by this row. *(Deliberate. The engine answer is the deliverable; which surface wears it — the signals screen's existing `.sig-inert` line, the glance page's quiet panel, or neither — is a separate call with its own room argument, and WO-6.7's `Open` line is the record of that call being made once already.)*

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

