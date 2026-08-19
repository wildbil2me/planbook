# WO-4.1 — continuation result: the harness section

**Scope worked:** the `tools/verify-shell.mjs` section only. No file under `src/`, `index.html`,
`sw.js`, `plans/` or `design/mockups/` was modified. `src/signals.js` and `src/signal-settings.js`
are byte-for-byte what I found (sha256 `479879e8…` and `f06f5017…`, taken before I started and
re-taken after the last mutation run — they match). The status line and all five Acceptance boxes in
`plans/work-orders/phase-4-signals.md` are untouched; the one-line diff that file shows is the
orchestrator's own `🤖 CLAIMED — 2026-08-19`, which was already there.

## Files changed

- `C:\dev\planbook\tools\verify-shell.mjs` — **+427 lines, 0 deletions.** One new section,
  `--- the signal engine and its thresholds (WO-4.1) ---`, appended at the foot of the file
  immediately before the summary block.
- `C:\dev\planbook\tools\README.md` — **+45, −1.** The recorded call-site count moved 943 → 955
  (this is asserted by `tools/wo-sweep.mjs`, which went red until I updated it), plus the entry that
  paragraph's convention requires: what moved the number, the executed-check count taken from a run,
  and the mutation evidence.

Nothing committed, nothing pushed.

## The run

`node tools/verify-shell.mjs`, on the tree as delivered, run to completion — 311 seconds, exit 0.
Full summary as printed:

```
================ SUMMARY ================
975 checks · 975 passed · 0 failed · 0 skipped
26,354 lines · 27.0 lines per check · 311s
(health, not a gate — see plans/verification-tooling.md § "Retiring the line cap")

This tool measures. It does not replace TESTING.md, and nothing here closes a 👤 item —
the iPad checks stay owed to a human no matter how green this run is.
```

963 → 975. The twelve new lines, verbatim from that run:

```
--- the signal engine and its thresholds (WO-4.1) ---
PASS | the signal engine and the threshold panel are both reachable through window.planbook, which is the purpose src/shell.js states over that seam  :: signals and signalSettings both present
PASS | the class manager opens the threshold panel over itself, with one numeric field per threshold this build names — all twenty-two, in the order the data model tabulates them, under Concern, Praise and Cooldown  :: 22 field(s) in ["Concern","Praise","Cooldown"] :: ["gradeBelow","gradeFellPoints","gradeFellAssignments","lowScoreRun"] …
PASS | typing into two of the fields writes exactly those two keys and no others — the twenty a teacher has not touched are still absent from the document rather than seeded into it  :: {"gradeBelow":70,"cooldownDays":21,"wo41NotOurs":7} :: "2 thresholds of 22 differ from what Planbook shi"
PASS | the reset DELETES the twenty-two keys rather than writing twenty-two numbers into the document, and a key this build does not name survives it untouched  :: signals now holds ["wo41NotOurs"]
PASS | and all twenty-two resolve to the number docs/data-model.md tabulates, with the panel showing every one of them — an absent key IS its default, which is the whole reason the reset is allowed to be a delete  :: all 22 at their shipped values, and the fields show ["65","10","4","3"] …
PASS | the WO-4.1 fixture installed on the open document and was taken back off it again  :: restored: true
PASS | ONE PASS returns both directions, and the student failing with perfect attendance comes back on both lists at once — one student, two hits, two different sentences, and neither hit knows it has a twin  :: 2 hit(s): ["concern grade-below","praise attendance-window"] :: ["In WO-4.1 Fixture A, Ada Fixture’s grade is 55.00%, below 65%.","In WO-4.1 Fixture A, Ada Fixture’s attendance across the last 20 recorded meetings is 100.00%, at or above 100%."]
PASS | every hit carries a non-empty bag of finite numbers, and no sentence anywhere in this section holds a placeholder, an "undefined" or a NaN  :: 6 hit(s) swept
PASS | a grade of 64.9985% against the 65% line says 64.999%, NOT the "65.00%, below 65%" that two decimals would round it into — and the hit still carries the unrounded number  :: 1 hit(s) :: ["In WO-4.1 Fixture B, Bo Fixture’s grade is 64.999%, below 65%."] :: numbers {"percentage":64.9985,"below":65}
PASS | and the same escalation happens in the at-or-above direction: 85.714% against an 85.714 line, where two decimals would have printed 85.71% and read as false  :: ["In WO-4.1 Fixture B, Bo Fixture’s grade is 64.999%, below 65%.","In WO-4.1 Fixture B, Bo Fixture’s attendance across the last 7 recorded meetings is 85.714%, at or above 85.71%."]
PASS | a class six recorded meetings into the term says SIX and is never padded up to the twenty it asked for — and its student, who has no graded work, is on no concern list  :: 1 hit(s) :: ["In WO-4.1 Fixture C, Cy Fixture’s attendance across the last 6 recorded meetings is 100.00%, at or above 100%."]
PASS | a class with no recorded meetings at all fires nothing — the no-window arm, not a rate of 0% and not one of 100%, on a class that does have graded work  :: 0 hit(s) :: [] :: lastMeetings returned []
```

`node tools/wo-sweep.mjs` — `22 checks · 19 passed · 0 failed · 3 to review`. The three reviews are
pre-existing and none is mine (sensitive field names outside `src/backup.js`; `.signal-list` with no
coarse-block rule; due-date beside late/missing). On the middle one I read `src/shell.css:1516-1534`:
`.signal-num` carries `min-height: 44px` inside `@media (pointer: coarse)` and `.signal-list` is a
flex column container rather than a control, so the review is correctly a review. It belongs to the
implementation round, not to this one, and I changed nothing about it.

## A green run proves nothing on its own, so: four mutation runs

Each was chosen so its reds could be attributed. Every one of them was run to completion; the two
modules were restored from a byte-for-byte copy between runs and hash-verified at the end.

| Mutation | Result | Which checks went red |
|---|---|---|
| `gradeBelow.direction` → `'praise'`; `resetThresholds()` writes `defaultThreshold(key)` instead of `delete` | `975 · 973 passed · 2 failed` | the both-directions check, and the delete-vs-write check |
| `sayPercent()` forced to `return formatPercent(Number(value))` — no escalation | `975 · 973 passed · 2 failed` | both case-2 checks |
| praise sentence says `numbers.asked` not `numbers.meetings`; no-window arm answers `percent: 100` not `null` | `975 · 971 passed · 4 failed` | partial-window, no-meetings, the at-or-above sentence, and the all-hits sweep |
| `cooldownDays` default seeded at 15; `editThreshold()` writes a second key beside the one typed | `975 · 973 passed · 2 failed` | the shipped-defaults check, and the typing check |

Two details worth keeping:

- Under the *write-the-defaults-in* half of mutation 1, **everything else about the reset stayed
  green** — all twenty-two still resolved to their shipped numbers, `changedThresholds()` was still
  empty, the standing line still read *All 22 thresholds are at the values Planbook ships with*, and
  every field on screen still showed the shipped figure. That is the whole argument for the check:
  the two builds are indistinguishable until a default is re-tuned, and only `getDoc().signals` can
  see it. The failure detail printed the twenty-two keys sitting in the document.
- Under mutation 2 the failure details print the defect in the app's own words: *"is 65.00%, below
  65%"* and *"is 85.71%, at or above 85.71%"* — two sentences a reader can see are false, about hits
  that are perfectly correct. That is exactly the rounded lie the check exists for, and it is
  unreachable on a round fixture grade.

Eleven of the twelve checks were proved red by these four runs. The twelfth — *the signal engine and
the threshold panel are both reachable through `window.planbook`* — I did **not** mutate; it is a
guard whose falsifiability is by inspection (it asserts `typeof … === 'function'` on five exports),
and reddening it would have meant deleting the seam and taking most of the other eleven down with it.

## Against the four cases in the brief, one by one

**1 — a student failing with perfect attendance.** Fixture class A: one student, one category at
100%, 55/100 on the one assignment, present at all twenty recorded meetings. One `evaluate()` call
returns two hits, `concern`/`grade-below` then `praise`/`attendance-window`, same `studentId`, same
`classId`, same `termId`, with two sentences asserted as hand-written literals. Verified — and proved
red by flipping `gradeBelow`'s direction.

**2 — a grade within 0.005 of a threshold.** Fixture class B: 649985/1000000 = 64.9985% against the
65 line. `formatPercent()` prints that as `65.00%`; the shipped module escalates and the sentence
reads `64.999%`, and the hit still carries `percentage: 64.9985`. Verified, and proved red by
deleting the escalation.

I also added **one check beyond the four named cases**, in the same case: the mirror arm of
`satisfies()`. `sayPercent()` has two senses and only `below` was reachable from a grade. The
`atLeast` arm needs a figure that rounds *down* across its line, which needs a line with more than
two decimals on it — the nearest two-decimal value above 85.71 is 85.72, and that is above the
attendance itself. So the fixture plants `attendanceAtLeast: 85.714` **directly in the document**
rather than typing it, because the panel's field prints through `formatWeight()` at two decimals and
cannot hold it; a hand-edited or restored file is a shape `thresholdOf()` is explicitly written for.
The sentence that comes out is `"…is 85.714%, at or above 85.71%."` — the measured figure keeps its
third decimal, the threshold is written the way a teacher would have typed it. That is **not** a
rounded lie (the comparison as printed is true, and it agrees with what the panel shows), but it is
why that check's expected string looks lopsided, and it is the one place I widened the brief. I judged
it in scope because it is the other half of case 2's own branch rather than a new case; say so if
you disagree and I will pull it.

**3 — a partial window and a class with zero recorded meetings.** Fixture class C: six recorded
meetings, sentence asserted as `"across the last 6 recorded meetings"` with `numbers.asked === 20`
beside it, so a padded window fails. Its student also has no graded work, so the same check proves
the `percentage === null` arm keeps her off the concern list. Fixture class D: no attendance records
at all but a real graded assignment at 90%, so zero hits means *no window* rather than *no fixture*;
`lastMeetings()` is read back as `[]` in the same check. Both verified, both proved red.

**4 — the document read after `resetThresholds()`.** Driven through the real controls: the class
manager, `#classesModal [data-signal-panel]`, the real number fields, the real
*Put every threshold back* button. Asserted after the reset: none of the twenty-two keys is present
in `getDoc().signals`; a planted key this build does not name (`wo41NotOurs`) survives untouched; all
twenty-two resolve through `thresholdsOf()` to the numbers hand-copied from
`docs/data-model.md § Signal thresholds`; `changedThresholds()` is empty; and every field on screen
shows the shipped figure. Verified, and proved red.

**A decision the brief left ambiguous, and which way I went.** The brief says of case 4: *"assert all
22 keys are **present** with their shipped values."* Read literally against `doc.signals`, that
asserts the *write* behaviour — the opposite of what the module does, and the opposite of what
`src/shell.js`'s seam comment names as the thing no click can see. I read it as meaning *resolved*
values, and asserted both halves: the twenty-two are **absent from `doc.signals`** (delete, not
write) and **all twenty-two present at their shipped values in `thresholdsOf()`**, plus the weaker
`changedThresholds()` clause the brief warns against relying on alone. If the intent really was that
the reset should write the numbers in, that is a change to `src/signal-settings.js` and its long
argued comment, and it is not mine to make.

## What I could not verify

- **Nothing on an iPad.** WO-4.1 has no 👤 boxes and I ticked nothing anywhere. The 👤 sitting is
  already recorded as green in `WO-4.1-status.md`; I neither repeated nor relied on it.
- **`verify-shell.mjs` drives a page, not an installed app**, and has never seen a service worker.
  Everything above is a claim about a headless Edge tab on 127.0.0.1.
- **No defect found in either module.** I looked for one — that is what the four mutation runs are —
  and the shipped code came back correct on every case I could build. So there is nothing to report
  under the "report it, do not fix it" rule.

## Left undone, deliberately

- **`CHANGELOG.md`** — not written, per the standing rule. A draft is below.
- **The gap paragraph in `tools/README.md`** (*"It is 808 − 824 = −16 on this tree"*) was already
  stale by two work orders before I arrived; on this tree it is 955 − 975 = −20. My twelve sites
  produce twelve results, so I did not move it. I left it alone rather than re-deriving a chain I
  have not verified — the sweep asks for the count line and the executed-check count beside it, and
  those are both updated and green. Flag it if you want it corrected.
- **`TESTING.md`** — not touched. Nothing in this round is a manual step, and the harness section is
  recorded where the harness's own record lives.
- **The temptation I declined:** the singular case, *"across the last 1 recorded meeting"*, is one
  more line of fixture and would exercise `plural()`'s other arm. It is not one of the four named
  cases and the brief's scope is narrow, so it is not here. It is the cheapest thing to add if
  anyone wants it.

## Changelog draft, for the teacher to accept, reject or rewrite

> **Verification** — The browser harness now exercises the signal engine. Twelve checks cover the
> four things no click and no round fixture can reach: a student who is failing while attending
> every class, a grade that sits inside a hundredth of a percent of the line it crossed, a class six
> meetings into the term and a class that has never been marked, and what the *Put every threshold
> back* button actually writes into the year — a deletion, not twenty-two copies of today's numbers.
> Each was proved able to fail before it was trusted.
