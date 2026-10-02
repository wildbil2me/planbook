# WO-1.54 — the line that keeps two strips apart is proved by nothing · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.54-result.md` — as your last act, and return it in-band too.

**Routing.** Claude **Opus**, on its own merits. The deciding signal is Acceptance 3: where the
re-run instructions live so the next reader of § 26 finds them, and whether the proof stays a one-off
`--claims-in` run or becomes a standing plant (which moves the sweep's recorded 45-check count), are
judgment calls the work order leaves open — ROUTING § "Route to Claude", ambiguity and Traps.
Runner-up set aside: Codex — the mutation is mechanical and needs no `verify-shell.mjs` run, so the
budget fits easily — but ties go to Claude, and the sibling § 26 rows (WO-1.51, WO-1.52) went Claude Opus.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.54 — the line that keeps two strips apart is proved by nothing

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-01 · **Size** XS · **Depends on** WO-1.52 ✅ · **Blocks** nothing
**Closes roadmap** Phase 1 → *(no box. Tooling, not app — the same call WO-1.26 through WO-1.53 made.
Booked 2026-09-24 out of WO-1.52's verdict, whose verifier found the surviving mutation and declined
to widen a work order already verified.)*

**Why it exists.** WO-1.52's correction round gave `wo-sweep.mjs` § 26 a cell reader: when a work
order's id and its state sit in separate cells of one strip, it walks forward from the id cell to the
first cell that opens with a status. The walk stops early at another id cell —
`if (opensWith(cells[j], ID_AT)) break;`, at `tools/wo-sweep.mjs:3302` when this was booked — so that
one strip's state is never read as the claim of the id before it. **Deleting that line leaves the
sweep green**, because every strip in every document § 26 reads today holds exactly one id, so the
case the line exists for never occurs. The day a document puts two ids in one strip, with the state
only beside the second, the first id inherits it silently.

**Traps**

- **Do not edit a planning document to make the case occur.** Those documents are what § 26 reads,
  and planting a shape in one to test the checker is the check learning from the documents. Use
  `--claims-in=<scratch file>`, the route WO-1.52's own reproduction took.
- **Prove it with the mutation, not by reading it.** The line is only worth a check if deleting it
  turns something red.

**Acceptance**
- [ ] A scratch document with two id cells in one strip, the state beside only the second, is read by
      `node tools/wo-sweep.mjs --claims-in=<file>` as one claim for the second id and none for the first.
- [ ] With the break line deleted, that same run reports a claim for the first id — the mutation is
      caught — and the line is restored before anything else is written.
- [ ] How to re-run it is written where the next reader of § 26 will find it, and `node tools/wo-sweep.mjs`
      is green with its recorded check count matching `tools/README.md`.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `tools/README.md`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `tools/wo-sweep.mjs` § 26 — the cell reader around `if (opensWith(cells[j], ID_AT)) break;`
  (~line 3304 today, not 3302), the `--claims-in` banner at ~3166, and how a claim surfaces (a
  `REVIEW` for a contradicted claim, plus the per-document "at least one claim read" check).
- `tools/README.md`'s `wo-sweep.mjs` row (its § 26 paragraph and the 45-check count) and any mutation
  table it keeps. `.claude/dispatch/WO-1.51-result.md` is the nearest precedent for recording a
  mutation proof against this sweep.
- `AGENTS.md` § "If you were dispatched with a work order" — the mutation-revert rule.

**Traps the work order does not spell out**

- **§ 26 is silent on a claim that agrees with the tracker.** A scratch strip whose state matches
  both ids' real statuses proves nothing either way. Choose the ids and the state so the correct
  reading and the mutated reading produce *different, visible* output (e.g. a state true of the
  second id but contradicting the first id's tracker status), and quote both outputs in the result
  file. If "none for the first" can only be shown as silence, say why that silence is evidence.
- **Build the strip in the shape the cell reader actually reads** (model it on the
  `plans/runbooks/wo-3-18-runbook.html` dependency strip WO-1.52 fixed), and show the scratch file
  was read at all — a file the reader skipped must not pass as "no claim for the first id".
- **Revert the mutation before you write anything else**, and confirm with
  `git diff tools/wo-sweep.mjs` and `grep -n "ID_AT)) break" tools/wo-sweep.mjs`. Do not revert with
  `git checkout` if the file holds your own unstaged edits — stage first, or re-insert the line by hand.
- **Keep the scratch file out of the tree.** If you judge a committed fixture is the right home for
  the re-run, put it where § 26 does not read by default and argue it in the result file. Leave no
  scratch file in `tools/` (WO-3.26's last mile).
- **Nothing under `src/` moves**, so `verify-shell.mjs` (section 4 below) is not demanded by this
  Acceptance; `wo-sweep.mjs` is, green, with its count matching `tools/README.md`.
- Size XS. Do not widen § 26's reader; anything else you find is a proposed follow-up in the result file.

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

## 5. Done means these 3 lines, reported against one by one

1. A scratch document with two id cells in one strip, the state beside only the second, is read by `node tools/wo-sweep.mjs --claims-in=<file>` as one claim for the second id and none for the first.
2. With the break line deleted, that same run reports a claim for the first id — the mutation is caught — and the line is restored before anything else is written.
3. How to re-run it is written where the next reader of § 26 will find it, and `node tools/wo-sweep.mjs` is green with its recorded check count matching `tools/README.md`.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

