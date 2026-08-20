# WO-2.54 — `Today` goes to the term, and there is no way back to today · implementation result

**Implementer** Claude Opus (work-order-implementer) · **Date** 2026-08-20
**Brief** `.claude/dispatch/WO-2.54-brief.md` · **Work order** `plans/work-orders/phase-2-attendance.md` § WO-2.54

**Headline.** Built as specified. `node tools/verify-shell.mjs` is green on the delivered tree —
`1067 checks · 1067 passed · 0 failed · 0 skipped`, exit 0 — with one mutation proof over the
nearest-term walk and `node tools/wo-sweep.mjs` at `25 checks · 23 passed · 0 failed · 2 to review`.
**Ten of the eleven Acceptance lines are closed; the eleventh is the 👤 iPad line and is not ticked,
because I have no iPad.** One Acceptance line (the gap) is met under the only self-consistent reading
of it and diverges from the arithmetic in its own second sentence — that is written up in full below
and recorded in the work order beside the line.

---

## Files changed

| Path | What |
|---|---|
| `c:\dev\planbook\src\classes.js` | `openTermForToday()` → `openTermNearToday()`, widened; new exported `termNearest()` (the read half); new private `dayIndex()` |
| `c:\dev\planbook\src\attendance.js` | import renamed + `termNearest` added; `pageDays('today')` moves the term, repaints the bar, renders, then announces; the sentence names the term only when it moved; the `Today` disabled test gains its third clause; `resetRegistry()` calls the renamed writer |
| `c:\dev\planbook\sw.js` | `CACHE` `planbook-shell-v89` → `planbook-shell-v90` |
| `c:\dev\planbook\tools\verify-shell.mjs` | new WO-2.54 section (17 call sites, 16 checks + 1 fixture-guard arm); five pre-existing checks in three sections repaired; `nodeToday` moved up the file |
| `c:\dev\planbook\tools\README.md` | recorded call-site count 1034 → 1051, plus the WO-2.54 paragraph with the run figures, the five repairs and the mutation |
| `c:\dev\planbook\TESTING.md` | the WO-2.54 entry, its ten ticked lines, the unticked 👤 line and the four-run table |
| `c:\dev\planbook\plans\work-orders\phase-2-attendance.md` | Status 🤖 CLAIMED → ✅ DONE; ten Acceptance boxes ticked; the divergence note under the gap line |

`CHANGELOG.md` is **not** touched — draft at the foot of this report, for the teacher to decide.
`CLAUDE.md` is **not** touched; its Ship 2 status prose still names WO-2.54 as outstanding (see
*Left undone*).

**Diffstat, checked before reporting (WO-2.49):** 7 files, 1023 insertions, 78 deletions. No CRLF
rewrite — `tools/verify-shell.mjs` is 0 CRLF at HEAD and 0 CRLF now, and its 698 changed lines are a
~570-line insertion plus the repairs, not a 29,000-line re-ending. `TESTING.md` had 7 CRLFs at HEAD
and has 7 now.

---

## Acceptance, line by line

1. **Arrival opens on the nearest term with the far tab stored — ✅ closed, driven.**
   Harness phase A: four dated terms all ahead of today, preference parked on the fourth, a **real
   click on the class tab** (not a call to `resetRegistry()`). Printed:
   `the open term went "tm_wo254d" -> "tm_wo254a", the nav highlight "tm_wo254d" -> "tm_wo254a", the
   preference {...:"tm_wo254d"} -> {...:"tm_wo254a"}, and the strip opened on ["2026-09-03",…] under a
   band reading "WO-2.54 first opens in 14 days."`

2. **The far tab sticks, `Today` is live there, one press returns everything, one sentence names the
   term — ✅ closed, driven.** Two checks. The first asserts the tab sticks, the strip anchors on that
   term's first day and `Today` is **not disabled** with a *Back to…* tooltip — that is the reported
   defect state. The second presses it: `the open term went "tm_wo254d" -> "tm_wo254a" … and the
   screen said "Back to this week, ending Thursday, September 3, 2026 in WO-2.54 first."` The check
   also asserts the sentence does not contain `is open`, i.e. `selectTerm()`'s own announcement was
   not reached.

3. **The ordinary day is unchanged to the keystroke — ✅ closed, driven.** Today inside the selected
   term: `Today` is `disabled` with title exactly `You are on today`; paged back and pressed, the
   strip returns to the week ending today, the preference is byte-identical, and the sentence is
   exactly `Back to this week, ending today.` — no term named.

4. **WO-2.52's February line survives — ✅ closed, driven.** Today inside the later term, the finished
   one chosen by hand: tab sticks, strip anchors on its last day, the day is locked behind
   `data-attendance-edit`, WO-2.51's rollover band is up, and the preference is byte-identical across
   three repaints. Then `Today` is live and is the way out:
   `after the press the tab is "tm_wo254feb2" … and the screen said "Back to this week, ending today
   in WO-2.54 current."`

5. **The gap — ✅ closed as three driven readings, and it diverges from the line's own second
   sentence. Read this one.**
   Driven three ways: four calendar days past one term and two before the next → the **forward** side,
   band `WO-2.54 opening opens in 2 days.`; two past and four before → the **finished** side, anchored
   on the day it ended; three either way → the **forward** side wins the tie.
   **The divergence.** The Deliverables state the measurement (`after.start - today` against
   `today - before.end`, *forward wins a tie*) and a tie-break decides nothing unless nearest decides.
   This Acceptance line then illustrates the gap as *"one day past a term's end and two before the
   next's start … the forward side still wins"* while calling the forward side **the nearer one** — on
   those two numbers it is the *further* side by a day, so the line's two halves cannot both hold.
   **I implemented the measurement.** On the dates the line itself names it makes no practical
   difference: 2026-10-31 is a Saturday and 2026-11-03 a Tuesday, so the one day in that gap a teacher
   opens a register on is 11/2 — two days past the end, one before the start — where Quarter 2 *is*
   nearer and the line's first sentence is exactly what the app does. On 11/1 (a Sunday) this build
   opens Quarter 1. If the owner wants **forward always**, it is one line in `termNearest()`
   (`src/classes.js`) and the comment there says so at the point of departure. The note is also
   recorded under the Acceptance line in the work order, so the tick is not silent about it.

6. **Past the last term — ✅ closed, driven.** Every term behind today: arrival takes the last of them,
   anchors on the day it ended, locked behind its own ✏, band `WO-2.54 last ended on August 17, 2026.`

7. **A class with no dated terms is untouched — ✅ closed, driven.** Two checks: arrival moves nothing
   and the preference is byte-identical, the strip opens on today, `Today` is disabled with the
   pre-existing `You are on today`; and pressing it off a paged window moves no term and names none.

8. **`grep -rn "openTermForToday" src/ tools/ TESTING.md docs/` returns nothing — ✅ closed, run.**
   Exit 1, no output. Four sites swept (definition, import, caller, the `src/attendance.js` block
   comment) and **three prose mentions rewritten rather than left to match the grep** — the history is
   kept as *"it was named for the term that HOLDS today"*, which is the idiom WO-2.52 used for
   `editingPast`.

9. **`verify-shell.mjs` green, count recorded, `tools/README.md` reconciled, one mutation proof — ✅
   closed, run four times.** Delivered tree: `1067 checks · 1067 passed · 0 failed · 0 skipped`,
   29,932 lines, 28.1 lines per check, 368s, exit 0 (and identically at 364s on the run before a
   comment reflow). `tools/README.md` now says **1051 `check()` call sites** and the sweep asserts it.
   **Mutation:** `termNearest()` cut back to the term that *contains* today — the gap walk deleted,
   which is the build this work order replaces — reads
   `1067 checks · 1057 passed · 10 failed · 0 skipped`, exit 1. Nine of the new section's sixteen go
   red, plus the repaired reload check. The six that stay green are exactly the ones about a term that
   holds today and about a class with no dated terms, i.e. the behaviour being mutated back to.

10. **`node tools/wo-sweep.mjs` green — ✅ closed, run.**
    `25 checks · 23 passed · 0 failed · 2 to review`; both REVIEWs are the standing pair (sensitive
    field names, due-date/late on one line), unchanged by this work order.

11. **👤 iPad, portrait, one tap home, 44px under a thumb — ⬜ NOT TICKED, and I cannot tick it.**
    I have no iPad. What I *did* measure, and it closes nothing on this line: at 834×1112 with touch
    emulation on and `matchMedia('(pointer: coarse)').matches` asserted first, the grid draws one
    column, `Today` is **live** in the reported state, and the button measures **≥44×44**; one tap
    then moves the tab and the strip and says `Back to Thursday, September 3, 2026 in WO-2.54 first.`
    A device metric is not a device — force-quit from the app switcher first, `CACHE` is now
    `planbook-shell-v90`.

---

## What I ran, and what it printed

| Command | Result |
|---|---|
| `node tools/verify-shell.mjs` (run 1, new section in) | `1067 checks · 1056 passed · 11 failed`, exit 1. **None of the eleven was in the new section** — all sixteen of its checks passed first time. See *The five repairs*. |
| `node tools/verify-shell.mjs` (run 2, after the repairs) | `1067 checks · 1067 passed · 0 failed · 0 skipped`, 29,932 lines, 28.1 lines per check, 364s, exit 0 |
| `node tools/verify-shell.mjs` (run 3, mutation) | `1067 checks · 1057 passed · 10 failed · 0 skipped`, exit 1 |
| `node tools/verify-shell.mjs` (run 4, delivered tree after a comment reflow) | `1067 checks · 1067 passed · 0 failed · 0 skipped`, 29,932 lines, 28.1 lines per check, 368s, exit 0 |
| `node tools/wo-sweep.mjs` | `25 checks · 23 passed · 0 failed · 2 to review` |
| `grep -rn "openTermForToday" src/ tools/ TESTING.md docs/` | no output, exit 1 |
| `node tools/wo-gate.mjs WO-2.54` | `PASS | gates clear for WO-2.54`, status now ✅ DONE |

Every figure above is copied from a run that had exited and whose output I read. Run 4 is the tree
being delivered; runs 2 and 4 differ only by a comment reflow in `src/attendance.js`, and the fourth
run exists because a run over a tree that is not the one being delivered is a run about another tree.

---

## The five repairs — the part a verifier should look at hardest

Run 1's eleven reds were **all outside the new section and all on a correct app**. Five checks in
three sections plus one in classes & terms had the same premise — *nothing moves the selected term* —
and this work order makes that false in two places. Each was repaired against the new rule rather than
pinned to the old one, which is exactly what WO-2.52 did to the two sections it broke. **None of them
adds or deletes a call site.**

1. **Classes & terms, the reload check.** It read *"the open class and the open term survive the
   reload"*; a boot is an arrival, so on a fixture whose four terms are nowhere near today the term
   that comes back is the nearest one, not the tapped one. It asserts **the rollover at a boot** now:
   the class survives, the term is the one this file works out for itself in Node from the dates the
   fixture typed, and the preference on disk holds that same id. Three different builds go red there
   where one used to. `nodeToday` moved up the file for it — **one definition moved, not copied**,
   which is what WO-3.17 did the first time it moved; both old sites carry pointers.
2. **WO-2.50's section (six reds).** Its fixture pins the selected term to an **undated** term so the
   anchor stays on today. Re-entering the class from its home card is an arrival, and the arrival now
   moves the tab to the nearest **dated** term — so today left the screen and six checks reported
   columns that were no longer drawn. The fixture now states its premise out loud (it had been relying
   on `getSelectedTermId()`'s fallback) and restates it after that one re-entry.
3. **WO-2.51's band-precedence check (two reds, one check).** It pressed `Today` to get the rollover
   band back. `Today` **resolves** that band now by moving the tab to the term it was asking for, so
   the check asserts three states instead of two: paged → the off-anchor band; pressed → no band and
   the right term; the early tab tapped again → the rollover back, unpaged. The second red was
   collateral (the tab had already moved) and passes unchanged.
4. **WO-2.52's fixture helpers and both teardowns (two reds).** They used `pageDays('today')` as a
   paging reset *after* choosing the tab, which now walks straight out of the arrangement it was
   called to set up. The reset comes first and the tap comes after it.

If a verifier disagrees with any of these repairs, the place to look is whether the *claim* moved or
only the *route*: in every case the claim is the same and the route is the new behaviour.

---

## Decisions the work order did not settle

1. **`termNearest()` is exported, and the pager asks it rather than re-deriving.** The disabled test
   needs "is the selected term already the one this button would choose", and computing that in
   `src/attendance.js` off `termContaining` + `outOfTermGap` would be a second opinion about which
   term is nearest — a button that greys itself out on a screen it would in fact have moved. One walk,
   asked twice.
2. **The day arithmetic is a private `dayIndex()` in `src/classes.js`, not `daysUntil()`.** The
   Deliverables ask for the comparison "off the same `daysUntil()` WO-2.52 added" — that function is
   private to `src/attendance.js`, and `src/classes.js` importing from there closes the loop that
   file's header records this repo refusing four times. So: three numbers into `Date.UTC()`, never a
   parsed date string (the section header's `new Date()` rule is about parsing a string as a date, and
   the comment says so at the point of departure), never printed, never stored, used for one
   comparison. `src/calendar.js` has the same UTC walk private behind `shiftDays()`; exporting a
   `daysBetween()` there for one caller was considered and refused — that file's own note says an
   export earns itself when both callers take it.
3. **Forward wins only a tie, not the gap.** See Acceptance 5 above. This is the one place I chose
   between two readings of the work order, and it is reversible in one line.
4. **The announcement's shape.** `Back to this week, ending <date> in <term>.` on a multi-column strip
   and `Back to <date> in <term>.` on one column — one construction, the term appended only when the
   term moved, read back off `getSelectedTerm()` after the render.

---

## Left undone, and why

- **The 👤 line.** No iPad. Not ticked, in the work order or in `TESTING.md`.
- **`CHANGELOG.md`.** Draft below; the teacher decides what a change means.
- **`CLAUDE.md`'s Ship 2 status prose** still reads *"is ✅ except WO-2.54, WO-3.18 and WO-G2"*. That
  is now stale by one row. I left it: it is not `plans/` or `TESTING.md`, and it is the teacher's file.
- **Not committed.** The brief did not say to commit or push. Working tree is dirty with the seven
  files above plus the untracked dispatch files.

## Temptations declined (out of scope, noted rather than acted on)

- **A way-home button on WO-2.52's band.** Explicitly out of scope, and the pager now carries one.
- **Folding `daysUntil()` and `dayIndex()` and `src/calendar.js`'s `utcOf()` into one day-arithmetic
  home.** There are now three private walks over ISO dates in three modules, each with a comment
  saying why it is not the others. That is defensible today and would make a clean S-sized work order
  later; it is not this one, and doing it here would have touched a Phase 6 module for a Phase 2 fix.
- **A `pageDays('reset')` direction** so fixtures can put the paging back without moving the term.
  Four harness sites wanted it. Adding an app-facing direction that exists for the harness is the
  wrong direction of dependency, so the fixtures re-pin instead and say why.
- **Anything about `anchorDate()`, the term tap, or the write gate.** Untouched by design; the
  February case is re-driven precisely because that is what a careless widening would break.

## Draft `CHANGELOG.md` entry — for the teacher to accept, reword or discard

```
### Fixed
- **`Today` goes to today again, and takes the term with it.** Pressing `Today` while a term other
  than the current one was open returned you to *that* term's edge — and in the state where you most
  needed it, the button was greyed out, so nothing on the screen could get you home. `Today` now moves
  the selected term to the one that holds today, or, when no term does, to the nearest one, and says
  which term it landed in. Arriving at the register does the same, which means the register finally
  opens on the right term during the weeks before a term starts, in the gap between two terms, and
  after the last one ends. Browsing back to a finished term still sticks: a term tab moves nothing but
  the tab, and nothing moves while the screen is open.
```
