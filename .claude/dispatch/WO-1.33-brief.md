# WO-1.33 — the second fixture student fires no rules · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.33-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude at the **Opus** tier. The deciding signal is the sensitive
surface: Acceptance line 2 requires mutating `src/merge-fields.js` — the merge-field resolver, which
`ROUTING.md` names as never delegated — and restoring it. The runner-up consideration set aside: the
work is otherwise Codex-shaped (a fully-specified fixture change with mechanically checkable
acceptance and no UI), and it independently fails the Codex budget bullet at ~13.2 minutes of harness
against a 20-minute cap — but a work order in the Claude column on its own merits is Opus whatever the
stopwatch says, so this is not a Sonnet fallback.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.33 — the second fixture student fires no rules

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-28 · **Size** S · **Depends on** — · **Blocks** nothing
**Closes roadmap** Phase 1 → *(no box. Tooling, not app. Booked 2026-08-28, owner-directed, found by
WO-5.1's verifier.)*

**Why it exists.** `{{signals.list}}` filters hits by `studentId` and — deliberately, and with a
comment saying so — **not by class**. `tools/verify/merge-fields.mjs` cannot prove that filter is
there. Its second fixture student is described in its own comment as *"deliberately unremarkable"*,
meaning **he fires no rules at all**, so a build that dropped the `studentId` filter entirely would
produce byte-identical output on this fixture. Every one of the nineteen WO-5.1 checks would stay
green while one student's signal sentences leaked into another student's draft.

**The code is correct.** WO-5.1's verifier tested it by hand, out of the browser, with a constructed
`hits` array carrying a sentence tagged to the other student: `{{signals.list}}` resolved to this
student's sentence only. **It is the instrument that cannot express the failure**, which is the same
shape as the backup-nag escape recorded in `TESTING.md` § WO-1.10 and the redraw gap beside it — a
green run over a fixture that cannot fail is this project's recurring defect, and it is worth one
planted hit to stop it recurring here.

**The shape to build.** Give the second fixture student **one signal hit of his own**, with an
explanation string that occurs nowhere else in the repository, and assert it is absent from the first
student's resolved `{{signals.list}}`. It is a fixture change and an assertion, not a new section.

**Traps**

- **The planted sentence must be searched for in the whole resolved draft**, not only in
  `{{signals.list}}` — the leak this guards against would arrive through any field that walks hits.
- **Do not disturb the sixteen-field draft check.** A sibling assertion requires every field to
  resolve with `blocked === false` for the probe student; a second student gaining a hit must not
  change what the first one resolves to. Assert the before and after are identical.
- **The teardown already counts two students** and every assignment, attendance row, log entry and
  score bag it plants. A hit that arrives through a new log entry or score has to come back off, or
  the foot check goes red on a run that was otherwise fine.
- **Prove it non-vacuously.** Deleting the `studentId` filter in `src/merge-fields.js` must turn the
  new assertion red; a fixture change that cannot fail is the defect being fixed, arriving again.

**Acceptance**
- [ ] The second fixture student carries at least one signal hit whose explanation string is unique
      in the repository.
- [ ] Removing `{{signals.list}}`'s `studentId` filter turns the new assertion **red**; restoring it
      turns it green.
- [ ] The first student's sixteen-field draft resolves byte-identically to what it did before the
      fixture gained the hit.
- [ ] The fixture teardown leaves nothing behind, and the foot check still reports zero of everything.
- [ ] `node tools/verify-shell.mjs` is green, and `tools/README.md`'s call-site count is recomputed
      by the sweep.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/merge-fields.js`
  - `tools/README.md`
  - `tools/verify-shell.mjs`
  - `tools/verify/merge-fields.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**Four things you would not guess from the work order.**

1. **The mutation comes back out before you write anything else — this is the freshest scar in the
   repository.** WO-5.1, 2026-08-28, planted a mutation in `src/merge-fields.js` to prove its own
   check non-vacuous and was killed between *the check went red* and *the mutation came out*. The
   delivered tree resolved `{{student.supports.medical}}` to the roster string while every document
   read ✅ DONE. So: apply the mutation, take the reading, **revert it immediately**, and only then
   write prose. Revert the one file by name — `git checkout -- src/merge-fields.js` — never
   `git checkout .`, which eats your own unstaged edits in `tools/verify/merge-fields.mjs`. Before
   your result file, run `git status --short` and `grep -rn MUTATION src tools` and report both.

2. **A green `wo-sweep.mjs` proves nothing about the mutation, and § 20 claim 5 will not catch it.**
   The sweep was green at 34 · 31 · 0 · 3 with WO-5.1's hole wide open; claim 5 forbids a *dynamic
   property read*, and deleting a `.filter()` is not one. The greps are not your safety net here —
   your own eyes on the diff are.

3. **Acceptance line 5's "call-site count is recomputed by the sweep" is the line that goes red on
   work being done.** `tools/README.md` records a `check()` count; adding assertions changes it, and
   a stale number turns the sweep red on an otherwise clean build. That is exactly what a dead
   dispatch left behind at WO-3.26. Run `node tools/wo-sweep.mjs` last, and again after you edit the
   count.

4. **Stay out of WO-1.34.** It sits immediately below this work order in the same phase file and is
   about widening claim 5's scanner in `wo-sweep.mjs`. It is a separate work order, already booked,
   and touching it is widening this one.

**If `verify-shell.mjs` cannot run in your sandbox, say so as an environment report, not a result** —
do not tick Acceptance line 5 on a run that did not happen. Both harness commands are in § 4.

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

1. The second fixture student carries at least one signal hit whose explanation string is unique in the repository.
2. Removing `{{signals.list}}`'s `studentId` filter turns the new assertion **red**; restoring it turns it green.
3. The first student's sixteen-field draft resolves byte-identically to what it did before the fixture gained the hit.
4. The fixture teardown leaves nothing behind, and the foot check still reports zero of everything.
5. `node tools/verify-shell.mjs` is green, and `tools/README.md`'s call-site count is recomputed by the sweep.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

