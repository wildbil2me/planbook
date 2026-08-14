# WO-2.26 dispatch status (re-cut) — live log

Delete this file once `.claude/dispatch/WO-2.26-result.md` is rewritten by the re-cut dispatch; the
result supersedes it. A flat stretch below is the normal case, not an alarm — an implementer reads
for 20+ minutes before its first write.

- 2026-08-14 — gates checked, `node tools/wo-gate.mjs WO-2.26` → PASS. Three deps ✅ DONE
  (WO-2.6, WO-2.9, WO-3.7). Tree dirty with the first cut's 12 paths, as expected.
- 2026-08-14 — work order read in full, including the RE-CUT 2026-08-14 paragraph and the note under
  the Acceptance list. First cut's code read on disk: `studentPassSummary()` + `openStudentPasses()`
  in `src/pass-history.js`, the import and append in `src/attendance-report.js`, the CSS block, the
  `src/shell.js` comment, the eight harness checks.
- 2026-08-14 — ROUTE: **Claude, Opus.** Presentation mode is a never-delegate surface and this re-cut
  turns on it twice; plus a Roll Call! design lift and a judgment-shaped Traps section. Runner-up set
  aside: size S on a part-built tree looks like Sonnet-grade extraction, but size is not the criterion
  and the sensitive surface is disqualifying regardless. No Codex probe — not Codex-eligible.
- 2026-08-14 — `--start` refused (exit 1): the row is `🔨 IN PROGRESS`, and only `⬜ NOT STARTED` may be
  claimed. The tool's own message says picking up part-built work is a deliberate hand edit of the
  status line. Made that edit: `🔨 IN PROGRESS — re-cut 2026-08-14` → `🤖 CLAIMED — 2026-08-14 re-cut`,
  to arm the collision guard for this dispatch.
- 2026-08-14 — brief written to `.claude/dispatch/WO-2.26-brief.md`, all ORCHESTRATOR markers filled
  and deleted.
- 2026-08-14 — implementer spawned at Opus (work-order-implementer), awaiting return. Expect 20-40 min; a flat status file, an unchanged git status and an unrewritten result file are all normal for the first 20+ minutes while it reads. No second implementer will be spawned.
- 2026-08-14 08:0x — **ORCHESTRATOR KILLED MID-DISPATCH.** Not a code failure: `You've hit your
  session limit · resets 10am (America/New_York)`. The implementer had already run and written source
  before the kill; it never returned a report and never wrote a result file. The owner's session
  assessed the wreckage by hand rather than re-spawning, since the limit blocks agents until 10:00.
- 2026-08-14 — **STATUS LINE UNCLAIMED BY HAND.** The dead orchestrator left the row at
  `🤖 CLAIMED — 2026-08-14 re-cut`; a claim held by a process that no longer exists will either block
  the resuming dispatch or make it think a peer is live. Set back to `🔨 IN PROGRESS`. **Re-claim it
  before resuming**, the same deliberate hand edit the first re-cut made.

### Resume dispatch — 2026-08-14

- 2026-08-14 — **RESUME ORCHESTRATOR STARTED.** `git status --short` read before this file, per step 1.
  Tree matches the note: 13 modified paths + 3 untracked dispatch files. Gates re-checked,
  `node tools/wo-gate.mjs WO-2.26` → PASS; three deps still ✅ DONE (WO-2.6, WO-2.9, WO-3.7). The
  `🔨 IN PROGRESS` NOTE fired as the note predicted.
- 2026-08-14 — ROUTE: **Claude, Opus.** Unchanged from the killed dispatch and re-derived, not
  inherited: presentation mode is a never-delegate surface and this re-cut turns on it twice, plus a
  Roll Call! design lift and a judgment-shaped Traps section. Runner-up set aside: the residue is
  mostly harness re-pointing, which looks Sonnet-shaped, but the harness is what proves the
  presentation-mode suppression. No Codex probe — not Codex-eligible, so no probe result could move it.
- 2026-08-14 — `--start` refused again (`🔨 IN PROGRESS`, only `⬜ NOT STARTED` may be claimed).
  Re-claimed by hand: `🔨 IN PROGRESS — re-cut 2026-08-14, source built, harness owed` →
  `🤖 CLAIMED — 2026-08-14 resume (source built, harness owed)`.
- 2026-08-14 — brief **reused, not rewritten** (384 lines, no ORCHESTRATOR markers outstanding).
  Prepended § 1a, a resume addendum: what is built and must not be rebuilt; the harness CRASH at
  10479 as the blocking item with the per-check disposition; the out-of-term fixture trip; the
  hand-off restore; `TESTING.md`; `sw.js` v56 as the owner's call, not the implementer's; and the
  stale first-cut result file to be overwritten with freshly-run numbers. § 1b retitled as first-cut
  scope so its broader audit instruction does not override § 1a.

### What is done, verified by reading the diff — do not rebuild it

- **`src/passes.js`** — `passesForStudent()` gained optional `from`/`to`, inclusive, compared as
  strings the way `meetingDates()` does, with `passDate()` for the day and a documented refusal to
  use `Date.parse`. `passesForStudentInTerm()` wraps it. **The date window lives here and nowhere
  else**, which is the re-cut's first decision, discharged.
- **`src/pass-history.js`** — `studentPassCard(classId, studentId, term)` at ~557 and
  `studentPassSummary(classId, studentId, term)` at ~601, the latter now term-taking.
- **`src/detail.js`** — imports `studentPassCard`, appends it last in the right-hand column after
  `attendanceCard()`, and updates the page's own firewall sentence to name hall passes. The header
  carries the paragraph justifying the import at length; **the firewall is intact** — no
  `src/supports.js`, no `student.supports`.
- **`src/attendance-report.js`** — the 🚪 Every trip door is **deleted** (see its header, ~line 61),
  the count line stays, and it is term-scoped via `getSelectedTerm()`.
- **`src/detail.css` / `src/attendance.css`** — the card's table is styled where its class names
  live, and the print rules are at the foot of `attendance.css` under this surface's attribute.
- **The print decision is MADE and written** at `src/detail.js` § PRINTING A VIEW: trips print with
  the grade, four reasons, and `studentCsv()` deliberately untouched.

### What is owed, in the order it blocks

1. **`tools/verify-shell.mjs` lines ~10414–10614 — the whole WO-2.26 block, re-pointed.** This is the
   blocking item and it is why nothing else can be trusted yet. **The harness currently CRASHES**, it
   does not merely fail: `clickSel` at line 10479 throws `nothing to click for #attendanceHistoryBody
   [data-pass-history-student=…]` — the deleted door — so **every check after 10479 never runs**,
   including the whole of WO-2.3 and everything below it. Before the crash, check 51 FAILS on the old
   assertions at lines 10473–10474 (`/whole year, not just this term/` and `onReport.door === busiest`),
   both false by design now.
   - Of the eight checks: the **count-agrees** one needs rewriting for term scope and no door; **door
     opens the same view** and **the report is still open underneath / stacking** are about things
     that no longer exist and come out; **no trips is told so** keeps its first half and loses "and no
     door"; **the view behind strands nobody** survives unchanged (the per-student doors inside the
     class-wide 🚪 Passes dialog are still there — only the attendance-report one went); the two
     **presentation mode** ones drop their door halves; and the **44px `.attendance-report-door`
     rule** check needs re-aiming, since `src/detail.css` records that the new card holds no control
     at all.
   - **New coverage the re-cut needs and the old block cannot give:** the card on the Student Report
     screen (reached by `#scoresBody [data-student-detail="…"]`), the card and the dialog count line
     being **one number**, and — the important one — **a trip planted OUTSIDE the term window**, since
     every trip in the current fixture falls on 2026-08-14 and term-scoping is therefore invisible to
     it. A check that cannot fail when scoping is removed is not a check.
   - **Restore the hand-off.** The block ends by leaving two passes open and the registry on the
     right class; a walk to the Student Report screen and back must put that back (see the comment at
     ~10616 and `[data-class-screen="class"]`).
2. **`TESTING.md` ~2854–2916** still describes the deleted door and the year-wide agreement — "the
   number 🚪 Passes showed for the same student" is now wrong twice, and line ~2916's 👤 line walks a
   teacher through a door that is gone.
3. **`sw.js` is still at `planbook-shell-v55`**, the first cut's bump. Six more files changed since,
   and the dev server was up on the LAN during that window, so a client may hold v55. **Owner's call
   whether that is a v56** — flagged, deliberately not taken.
4. **The Acceptance list, the result file and the CHANGELOG** — all untouched, all owed to the
   verifier and the owner rather than to whoever finishes the harness.
- 2026-08-14 — implementer spawned at **Opus** (work-order-implementer), awaiting return. Expect
  20-40 min. A flat status file, an unchanged `git status` and an unrewritten result file are all
  normal for the first 20+ minutes while it reads — this one has ~10 source files and a 200-line
  harness block to read before its first write. No second implementer will be spawned; the row reads
  `🤖 CLAIMED` and only `--release` clears it.
- 2026-08-14 08:44 — **SECOND KILL, DIFFERENT CAUSE: the device crashed** and took the Claude Code
  process, the orchestrator and the implementer with it. Unrelated to the 10:00 session limit that
  killed the first attempt, and unrelated to the work.
  - **Nothing was lost and nothing was gained on the blocking item.** `tools/verify-shell.mjs` mtime
    is still **06:08**, the first cut's — the second implementer died inside its reading window and
    never wrote. Line 10479 still clicks the deleted door, so the crash described above is still the
    live state of the harness.
  - What the dead run *did* leave behind is a better brief: `WO-2.26-brief.md` grew 27.5KB → 33.5KB
    at 08:30. **Reuse it. It is the third orchestrator's inheritance, not scrap.**
  - **Status line unclaimed by hand again**, for the same reason as the first time: a `🤖 CLAIMED` held
    by a process that no longer exists will either block the resuming dispatch or make it believe a
    peer is live. Back to `🔨 IN PROGRESS`; re-claim it deliberately on resume.
  - **The two source-state sections above remain accurate as written.** They were verified by reading
    the diff, not by trusting a report, and no process has touched `src/` since. Do not re-derive
    them and do not rebuild the source.

### Resume dispatch 2 — 2026-08-14 (after the device crash)

- 2026-08-14 — **THIRD ORCHESTRATOR STARTED.** `git status --short` read first, per step 1: 13 modified
  paths + 3 untracked dispatch files, unchanged from the crash note. Gates re-checked,
  `node tools/wo-gate.mjs WO-2.26` → PASS, three deps still ✅ DONE (WO-2.6, WO-2.9, WO-3.7). The
  `🔨 IN PROGRESS` NOTE fired again as the two previous notes predicted.
- 2026-08-14 — **Disk state re-verified independently, not inherited.** `tools/verify-shell.mjs` mtime
  **06:08** (first cut's — confirmed untouched by both dead implementers); source at 07:45–07:52
  (`passes.js` 07:45, `pass-history.js` 07:49, `attendance-report.js`/`detail.js` 07:50,
  `detail.css`/`attendance.css` 07:52); `sw.js` 06:05 (still v55); `TESTING.md` 06:15. Crash site read
  at line 10479 and confirmed live: `clickSel('#attendanceHistoryBody [data-pass-history-student="…"]')`
  on the deleted door, with the two false assertions at 10473–10474 above it.
- 2026-08-14 — ROUTE: **Claude, Opus.** Re-derived, not inherited from either dead run: presentation
  mode is a never-delegate surface and this re-cut turns on it twice, plus a Roll Call! design lift and
  a judgment-shaped Traps section. Runner-up set aside: the residue is now almost entirely harness
  re-pointing, which reads Sonnet-shaped, but the harness is precisely what proves the presentation-mode
  suppression, so the sensitive surface still governs. No Codex probe — not Codex-eligible.
- 2026-08-14 — Row re-claimed by hand, the third time and for the same reason: `--start` only accepts
  `⬜ NOT STARTED`, and `--release` refuses `🔨` by design. `🔨 IN PROGRESS — re-cut 2026-08-14, source
  built, harness owed` → `🤖 CLAIMED — 2026-08-14 resume 2 (source built, harness owed)`.
- 2026-08-14 — brief **reused, not rewritten** for the second time (the second orchestrator's 33.5KB
  improvement is the inheritance). One surgical edit only: § 1a's opening paragraph described just the
  first kill, so it now names all three dispatches, records the disk re-verification (verify-shell.mjs
  still 06:08, line 10479 still live, sw.js still v55) so the implementer knows nothing below it is
  stale, and carries the instruction to write progress to this status file as it goes. No ORCHESTRATOR
  markers outstanding.
- 2026-08-14 — implementer spawned at **Opus** (work-order-implementer), awaiting return. Expect
  20-40 min. A flat status file, an unchanged `git status` and an unrewritten result file are all
  normal for the first 20+ minutes while it reads — ~10 source files and a 200-line harness block
  precede its first write. No second implementer will be spawned; the row reads `🤖 CLAIMED`.

### Implementer — resume 2 (third dispatch against this brief)

- 2026-08-14 08:47 — IMPLEMENTER STARTED READING. Brief read in full (§ 1a first, then § 1b),
  status file read. Next: CLAUDE.md on disk, then the six source files, then the harness block.
  No writes yet.
- 2026-08-14 09:05 — Reading done on the source diff (all 13 paths) and on the harness block
  10414–10618. Baseline `node tools/wo-sweep.mjs` run: **17 checks · 15 passed · 0 failed · 2 to
  review** (both reviews are the standing ones). Baseline `node tools/verify-shell.mjs` started in
  the background to confirm the crash and that the harness runs in this environment. No writes yet.
  - Fixture problem found while reading: `#scoresBody [data-student-detail]` does NOT exist on the
    pass class — `renderScores()` returns early with an empty-state whenever the class has no term
    or no assignment, and the pass class has neither. So the walk to the Student Report screen needs
    a planted dated term (which the term-scoping check needs anyway) and one planted assignment,
    both torn down at the foot of the block.
- 2026-08-14 09:35 — **FIRST WRITE LANDED.** `tools/verify-shell.mjs` lines 10414–10614 replaced
  wholesale: the eight door-aimed checks are gone, fourteen re-pointed ones are in, `node --check`
  clean, `wo-sweep` counts **748** call sites (742 − 8 + 14). Baseline run before the edit reproduced
  the crash exactly as the brief described (`Error: nothing to click for #attendanceHistoryBody
  [data-pass-history-student="s_2i62382t37"]` at verify-shell.mjs:10479, after `FAIL | the student
  attendance report carries this student's hall-pass count`). Fixture: the pass class is put on a
  dated term (today ±7) and two trips are planted on the busiest student — one inside the window
  with a note, one 60 days outside — then both are removed and the class's own terms restored.
  Still owed: the run itself, `tools/README.md`'s count, `TESTING.md`, the acceptance ticks, the
  work-order note, the result file.
- 2026-08-14 09:58 — **HARNESS RUN 1 (with the new block): 746 checks · 745 passed · 1 failed ·
  0 skipped · 245s.** No crash — WO-2.3 and everything below it ran for the first time since the
  first cut. All fourteen WO-2.26 checks PASSED, including the out-of-term one ("4 trips · 14
  minutes out" on the card against "5 trips · 21 minutes out" for the year, and the app's own two
  readers answering 4 and 5).
  - The single FAIL is **not** in the WO-2.26 block: it is WO-2.6's *"every print rule is gated"*
    check at verify-shell.mjs:15661, which the FIRST CUT's CSS broke and which nothing could see
    while the run died 5,000 lines earlier. `src/attendance.css` grew eight `body[data-detail-print]`
    rules for the trip table on the card; that check required every `.attendance-report-*` print rule
    to carry `data-attendance-print`. Fixed by sorting rules by which surface's attribute gates them
    — ungated is still a failure, and the borrowed arm is counted so losing it goes red.
  - `tools/README.md` count moved 742 → 748 with the narrative rewritten for the re-cut.
  - Re-run started to confirm green on the final tree.
- 2026-08-14 10:22 — **BOTH COMMANDS GREEN ON THE FINAL TREE.**
  `node tools/verify-shell.mjs` → **746 checks · 746 passed · 0 failed · 0 skipped**, 246s, exit 0.
  `node tools/wo-sweep.mjs` → **17 checks · 15 passed · 0 failed · 2 to review**, exit 0 (both
  reviews are the standing pair). `TESTING.md` § WO-2.26 rewritten for the card. Still owed: the
  acceptance ticks in `plans/work-orders/phase-2-attendance.md`, the note replacing the first cut's,
  and the result file.
- 2026-08-14 10:40 — **DONE.** `.claude/dispatch/WO-2.26-result.md` overwritten wholesale with the
  re-cut's result. Seven acceptance lines ticked in `plans/work-orders/phase-2-attendance.md`, the
  first cut's italic note replaced, the two 👤 lines left open. Files changed by this dispatch:
  `tools/verify-shell.mjs`, `tools/README.md`, `TESTING.md`,
  `plans/work-orders/phase-2-attendance.md`. No `src/` file was touched — the source was right.
  `sw.js` left at v55 as the owner's question. This status file can be deleted; the result
  supersedes it.
- 2026-08-14 — **IMPLEMENTER RETURNED** (~36 min, first of three dispatches to return at all). Result
  file rewritten. No `src/` file touched, as instructed. Harness block 10414–10614 replaced wholesale
  plus a re-pointed check at :15661; `tools/README.md`, `TESTING.md`, `phase-2-attendance.md` updated.
  Reports `verify-shell.mjs` 746/746 pass exit 0, `wo-sweep.mjs` 15 pass + 2 standing REVIEW exit 0.
  Ticked seven acceptance lines itself; 8 and 9 left ❌ as 👤. Flags one defect the crash had hidden
  (WO-2.6's print-rule gate check), one departure from § 1a (walk route via *Grades for …* rather than
  `#scoresBody`, because the pass class has no assignment), and `sw.js` v55 surfaced as the owner's
  question, not decided. Self-assessment only — not the outcome; verifier next.
- 2026-08-14 — verifier dispatched at **Opus** (never overridden), awaiting verdict. Told explicitly
  not to accept any acceptance tick on the grounds it was ticked before the re-cut.
- 2026-08-14 — **VERIFIER RETURNED: PASS WITH MANUAL CHECKS.** No ❌. Seven acceptance lines re-earned
  against the re-cut (not carried over from the first cut); 8 and 9 🙋, correctly blank, owed to a
  printer and to eyes. Ran both commands itself — `wo-sweep` 15 pass + the 2 standing REVIEW, exit 0;
  `verify-shell` twice at 746/746, 0 skipped, exit 0, with WO-2.3 and everything below it running for
  the first time since the first cut. **Tested the scoping claim rather than reading it**: copied the
  tree, reduced `passesForStudentInTerm()` to `passesForStudent()`, got 739/746 with 7 red, deleted the
  copy. Hand-off restore asserted. Agrees the `sw.js` bump is owed and correctly left to the owner.
  Books two residual items: WO-3.7 exercises the `#scoresBody` route but does not assert the card on
  it, and no trip is planted AFTER `term.end`, so a dropped upper bound would stay green.
- 2026-08-14 — **NOT TICKED.** Verdict reported to the owner; no `--tick`, no `--release` until the
  owner says go. Note for whoever runs it: two 👤 acceptance lines are `[ ]`, so `--tick` will refuse
  ✅ DONE by design and write `🔨 IN PROGRESS` naming them. That is correct, not a failure.
