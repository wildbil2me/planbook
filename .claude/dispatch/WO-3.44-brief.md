# WO-3.44 — a comment says a misfiled copy looks identical on the list · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.44-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, at **Opus** (no model override). The deciding signal is that the deliverable is prose whose whole value is accuracy about runtime behaviour: the new sentence has to be checked against what `duplicateAssignment` (or whatever `src/assignments.js` calls it) and `renderAssignments()` actually do, which is the rubric's teacher-prose/judgment column rather than a fully specified transform. Runner-up set aside: Codex, since the change is XS and mechanically checkable by `git diff`; ties go to Claude, and a probe plus a detached dispatch costs more than the edit. Note this row wears the 🎒 ride-along mark in the README running order; the owner named it directly, so it is taken alone.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.44 — a comment says a misfiled copy looks identical on the list

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-04 · **Size** XS · **Depends on** WO-3.40 — the two comments it corrected
**Closes roadmap** *(no box. Owner-directed, 2026-10-04.)*

**Booked 2026-10-04**, owner-directed, out of WO-3.40's verdict. A comment fix and nothing else, so it
rides with the next work order that has `src/shell.js` open.

**The defect.** The comment above `assignments, screenNav` in the `window.planbook` seam
(`src/shell.js` ~4599) says the naive duplicate, which carried the source's `categoryId` across a
class boundary, and this build's duplicate are *"invisible on screen because both look identical on
the list"*. That is false when the target class has a category of the same name. This build files
the copy under the matching category. The naive copy carries a `categoryId` the target lacks, so
`renderAssignments()` lists it under *Not in a category*. They look the same only when the target has
no category that matches. WO-3.40's implementer read this comment, ruled it a different claim from the
two that work order fixed, and left it. The verifier agreed with that ruling and confirmed the
overstatement.

**Deliverables**
- **The comment says what a click can and cannot show.** When the target has a matching category,
  the two builds file the copy in different groups. What no click shows is that the copy carries the
  target's own ids and that `scores` grew no column for it. Keep the rest of the comment, including the
  breadcrumb half.

**Acceptance**
- [ ] The comment no longer says the two duplicates always look identical on the list.
- [ ] No line outside a comment moves: `git diff` touches comment lines only.

**Traps** — **Do not change the copy rule**, as WO-3.40's Traps said. **The `CACHE` question is
WO-1.60's**: if this rides with a work order that bumps `CACHE` for its own code, nothing more is
needed. Taken alone, it leaves `wo-sweep.mjs` § 9 red as WO-3.40 did, until WO-1.60 says otherwise.
*(`src/assignments.js` ~925, "invisible on every term's list", was the third comment named in
WO-3.40's verdict. It was read the day this was booked and is true: `assignmentsOf()` matches `termId`
exactly, so a `termId` of `''` is on no term's list. Nothing to fix there.)*

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/assignments.js`
  - `src/shell.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `.claude/dispatch/WO-3.40-result.md` (and its status/verdict files if present) — the sibling comment fix; match how it worded the *Not in a category* group so the two comments agree.
- In `src/assignments.js`, the duplicate function and how it maps `categoryId` to the target class (matching by name, else what?) — the new sentence must say exactly what happens when the target has **no** category of that name, because the claim *does* hold there. Read it; do not infer it from this brief.
- `renderAssignments()` — confirm where an assignment whose `categoryId` is not in its class's categories is listed.

**Traps specific to this dispatch.**
- The edit is to ONE comment block in `src/shell.js` (~4597–4606). The second Acceptance line is literal: `git diff --stat` must show `src/shell.js` only, plus the phase file / TESTING.md if you tick or note there, and every changed `src/shell.js` line must sit inside the `/* … */` block. No `CACHE` bump in `sw.js` — that is WO-1.60's question.
- **`wo-sweep.mjs` § 9 is expected red after this edit** (a shell file changed with no `CACHE` bump), exactly as WO-3.40 left it. Report that line as expected-and-why, and confirm every OTHER section is green. Check first whether § 9 is already red on a clean `main` (WO-3.40 landed in `de61b73`) and say which.
- `verify-shell.mjs` takes ~4.4 minutes; one clean run is enough. No mutation round is warranted for a comment.
- Do not write a CHANGELOG entry. Ticking the two Acceptance boxes yourself is allowed if you checked them.

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

## 5. Done means these 2 lines, reported against one by one

1. The comment no longer says the two duplicates always look identical on the list.
2. No line outside a comment moves: `git diff` touches comment lines only.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

