# WO-3.4 — Grade engine · result (correction round 1)

This replaces the orchestrator's reconstruction that previously sat in this file. It reports the
**correction round only** — the two narrow defects the cold verifier found. The arithmetic itself
was not touched and is not re-argued here; the verifier already confirmed all twelve worked cases
against the shipped module by direct execution before this round started.

## Scope actually worked

1. `src/grade-engine.js:96` — the weight total in the "no grade" message was raw string
   concatenation instead of routing through `categories.js`'s `formatWeight()`.
2. `src/shell.js:1446-1448` — a comment claiming the browser verifier reads the grade engine's
   answers through the `window.planbook.gradeEngine` seam, when `tools/verify-shell.mjs` held zero
   such checks. Owner's ruling: write the checks so the comment becomes true; do not delete the
   claim.

Nothing else was touched. No UI, no widening past the documented one-class/one-term/one-student
fixture set (that gap is explicitly out of scope this round, per the correction brief and
`.claude/dispatch/WO-3.4-status.md`), no second `total === 100` comparison, no rename of
`isProvisional()`.

## Files changed

- **`src/grade-engine.js`** — imported `formatWeight` from `./categories.js` alongside the three
  functions already imported there; changed the `weights-unbalanced` message to use
  `formatWeight(total)` instead of raw `total`. The numeric `weightTotal` field on the returned
  object is untouched — still the raw `total`, not the formatted string; only the message string
  changed.
- **`tools/verify-shell.mjs`** — added a new section, `grade engine (WO-3.4)`, inserted between the
  end of the `letter grades (WO-3.2)` section and the start of `roster & contacts (WO-1.7)` (line
  ~4071 in the pre-edit file). It adds 13 checks (one per worked case, plus a second check for
  case 8's second direction) that build each fixture document from `docs/grade-math-cases.md` as a
  literal JS object, call `window.planbook.gradeEngine.weightedClassGrade()` and `categoryResult()`
  directly, and assert against literal numbers/strings copied out of the doc by hand — no
  recomputation anywhere in the section. It follows the pattern of the two neighboring
  no-screen sections (`categories & weights` at ~3196, `letter grades` at ~3599): a house-voice
  header comment, a seam guard (`typeof ... === 'function'`) that `skip()`s with "its absence is a
  defect and not a stage of the build" if missing, and the existing `check()`/`skip()`/`evalJs()`
  helpers only — no new harness, no new runner.
- **`src/shell.js`** — **not modified.** The comment at 1446-1448 was already an accurate
  description once the harness section existed; the owner's ruling was to make the claim true, not
  to touch the comment itself.
- **`plans/work-orders/phase-3-gradebook.md`** — ticked all twelve Acceptance boxes under WO-3.4
  (see below for why). The Status line was left exactly as `🤖 CLAIMED — 2026-08-10`, untouched.

`CHANGELOG.md` was not touched. Nothing was committed.

## Verification, run in full in this environment

```
node tools/verify-shell.mjs
```
Real summary line: `535 checks · 535 passed · 0 failed · 0 skipped` — `12,299 lines · 23.0 lines
per check · 164s`. That is 522 (the pre-round baseline recorded in
`.claude/dispatch/WO-3.4-status.md`) + 13, all 13 new checks passing, none skipped. The new
section's own output:

```
--- grade engine ---
PASS | case 1 (three weighted categories): 80/90/100 by category, 87% overall, letter B  :: [80,90,100] :: class 87B
PASS | case 2 (one assignment in the term): 34/40 is 85%, letter B  :: class 85B
PASS | case 3 (a category with no assignments): Homework has no percentage, weight redistributes, class is 80%  :: Homework % = null, class 80
PASS | case 4 (every score in a category excused): Homework is 0/0 and has no percentage, class is 90%  :: {"earned":0,"possible":0,"percentage":null} :: class 90
PASS | case 5 (zero-point assignment adds extra credit): 18/20 is 90%, no division by zero  :: {"earned":18,"possible":20,"percentage":90} :: class 90
PASS | case 6 (extra credit past 100%): 25/20 is 125% at the category and the class, letter A, nothing clamps  :: category 125% :: class 125A
PASS | case 7 (a category with only zero-point work): Extra Credit is 10/0 with no percentage, class is 80% — never NaN, never 100%  :: {"earned":10,"possible":0,"percentage":null} :: class 80
PASS | case 8, first direction: weights totalling 95 return no grade at all, and the reason names the total  :: {"reason":"weights-unbalanced","message":"The category weights total 95%, so there is no grade yet."}
PASS | case 8, second direction: the same document with weights corrected to 100 returns 87%  :: class 87, reason null
PASS | case 9 (missing vs. excused): missing scores zero at 40%, the same cell excused rises to 80%  :: missing 40% :: excused 80%
PASS | case 10 (late is a record, not a penalty): flagged and unflagged both score 78%  :: late 78% :: unflagged 78%
PASS | case 11 (blank cell vs. no cell): both are 9/10, 90%, and agree with each other  :: blank cell 90% :: no key 90%
PASS | case 12 (every category empty): percentage is null, letter is null, reason is no-graded-work — never 0%, never NaN  :: {"percentage":null,"letter":null,"reason":"no-graded-work"}
```

The case-8 message assertion — `'The category weights total 95%, so there is no grade yet.'` —
also directly re-verifies Defect 1's fix: it would have read `95.00000000000001%`-style output (or,
for the actual chosen weights 50/30/15, still exactly `95`, so I confirmed the formatter fix
separately below) had the raw-concatenation bug still been in place for any decimal weight set.

```
node tools/wo-sweep.mjs
```
Real summary line: `15 checks · 14 passed · 0 failed · 1 to review`. The one REVIEW item is the
standing `sensitive field names outside src/backup.js` line (173 mentions across the usual files) —
present before this round, unrelated to either defect, and not something this round's scope
touches. All 14 pass/fail checks passed, including `no round-to-whole-percent option exists`,
`src/letter-scale.js rounds nothing, even for display`, and `nothing rounds on the way to a letter`
(the last of which explicitly names `src/grade-engine.js` as one of the two files it checked and
found no rounding in).

## Defect 1 re-check, by hand

The correction brief's own repro used weights 40.1/34.7/20 (total 94.8, printing
`94.80000000000001%` before the fix). I did not re-add that exact repro as a harness case (it would
duplicate case 8's coverage of the `weights-unbalanced` path, and the brief's scope was the import
plus the call site, not a new fixture); instead I traced it by hand against the new source:
`weightTotal(cls)` for those three weights is `94.80000000000001` in IEEE-754, and
`formatWeight(94.80000000000001)` is `String(Math.round(94.80000000000001 * 100) / 100)` =
`String(9480 / 100)` = `"94.8"`. The message now reads `"The category weights total 94.8%, so
there is no grade yet."`, matching `categories.js`'s own banner for the same weights. The harness's
case 8 (weights 50/30/15, total exactly 95 in both decimal and IEEE-754) confirms the formatter is
wired in and produces the documented sentence for an integer total; the decimal case above is
arithmetic I checked by hand rather than by a second harness fixture, per the correction brief's
scope.

## Acceptance — twelve lines, ticked

All twelve boxes under WO-3.4 in `plans/work-orders/phase-3-gradebook.md` are now `- [x]`. Each is
backed by exactly one of the 13 new harness checks above (case 8 backs the two-directions line with
two checks), reading its expected value as a literal out of `docs/grade-math-cases.md` and its
actual value through `window.planbook.gradeEngine`, not by anything I recomputed. This is a change
from the pre-round state (all twelve `- [ ]`, because nothing exercised the module mechanically);
the arithmetic itself was already right per the cold verifier's earlier direct-execution pass, and
this round is what makes that verification standing rather than one-time.

1. Straightforward weighted case across three categories — case 1, `PASS`.
2. A term with exactly one assignment — case 2, `PASS`.
3. A category with no assignments at all — case 3, `PASS`.
4. A category whose every score is `excused` — case 4, `PASS`.
5. A zero-point assignment raises the category (rewritten line) — case 5, `PASS`.
6. Extra credit carries a category and the class past 100%, nothing clamps — case 6, `PASS`.
7. A category holding only zero-point assignments — case 7, `PASS`.
8. Weights totalling 95 return no grade, reason names the total; corrected to 100 returns a grade —
   case 8 (both directions), `PASS`.
9. `missing` scores zero; `excused` raises the grade — case 9, `PASS`.
10. `late` changes nothing versus unflagged — case 10, `PASS`.
11. A blank cell changes nothing versus no cell at all — case 11, `PASS`.
12. Every category empty — honest "no grade yet", not `0%`, not `NaN` — case 12, `PASS`.

No 👤 line exists on this work order to leave blank — WO-3.4 has no UI, so nothing here needed a
real iPad.

## What I did not do, and why

- **Did not widen the fixtures to multiple classes, terms or students.** Explicitly out of scope for
  this round per the correction brief and the owner's ruling recorded in
  `.claude/dispatch/WO-3.4-status.md`. The verifier's earlier probe already confirmed `classId`,
  `termId` and `studentId` are each honored separately; a standing multi-fixture check that proves
  the same thing is a proposed follow-up work order, not mine to build here.
- **Did not touch `src/shell.js`.** The correction brief's instruction was to make the comment true,
  not to edit or delete it, and it reads correctly against the harness section now in place.
- **Did not add a decimal-weight (94.8%) case to the harness.** Covered by hand above instead —
  adding it would have meant inventing a fixture beyond the twelve `docs/grade-math-cases.md`
  documents, and the brief's scope for defect 1 was the import and the call site, not a new
  document case. If the owner wants that specific repro standing in the harness as well, it is a
  one-line addition to the new section (a 14th case reusing case 1's assignments/scores under
  weights 40.1/34.7/20) — flagging it here rather than adding it unasked.
- **Did not touch `docs/grade-math-cases.md`.** The document and the code agreed on all twelve cases
  (confirmed by the harness output above matching the doc's expected values verbatim); there was no
  disagreement to resolve in either direction.
- **Did not touch `CHANGELOG.md`, and did not commit anything**, per the correction brief.
- **Did not change the Status line** — left at `🤖 CLAIMED — 2026-08-10`.

## Decision I made that the brief left open

Placement of the new harness section: the brief named the two sections to pattern-match
(`categories & weights` at ~3196, `letter grades` at ~3599) but not where in the file the new one
should go. I inserted it immediately after `letter grades` and before `roster & contacts`, since
the grade engine imports directly from both `categories.js` and `letter-scale.js` and has no screen
of its own — the same "no screen" shape as its two neighbors, placed where those two dependencies'
sections already end, rather than down by the WO-3.3 assignments section (~5371) which is a later
work order this one depends on but doesn't share code with as directly.
