# WO-2.26 — the Student Report screen shows the hall passes · implementation result

**Route** Claude, Opus (work-order-implementer) · **Dispatch** the third against this brief, the
first to return one. **Date** 2026-08-14.

> This file **overwrites** the first cut's result wholesale, as § 1a of the brief instructs. None of
> that file's verification numbers are reused; both commands were re-run on the final tree and what
> is quoted below is what they printed.

---

## The short version

The source was complete and I did not rebuild it. **The one blocking item was the harness**, and it
was worse than "failing": `tools/verify-shell.mjs` **crashed** at line 10479 on the deleted
`[data-pass-history-student]` door, so WO-2.3 and every check under it — about 8,000 lines of the
file — had not run since the first cut landed. That is now fixed, and fixing it exposed one genuine
defect the crash had been hiding.

```
node tools/verify-shell.mjs   →  746 checks · 746 passed · 0 failed · 0 skipped
                                 19,388 lines · 26.0 lines per check · 246s · exit 0
node tools/wo-sweep.mjs       →  17 checks · 15 passed · 0 failed · 2 to review · exit 0
```

Both were run by me, to completion, on the tree as it now stands; the two REVIEWs are the standing
pair (`sensitive field names outside src/backup.js`, `due-date and late/missing on the same line`)
and are unchanged from the baseline I took before writing anything.

**Two 👤 lines are not ticked and I could not close them.** I have no iPad and no paper.

---

## What I changed, and what I deliberately did not

**Files I wrote to (4):**

- `C:\dev\planbook\tools\verify-shell.mjs` — the WO-2.26 block (lines 10414–10614) replaced
  wholesale; plus one re-pointed check at `:15661` in WO-2.6's section (see "the defect the crash
  was hiding").
- `C:\dev\planbook\tools\README.md` — the `check()` call-site count 742 → **748**, and the WO-2.26
  narrative rewritten for the re-cut.
- `C:\dev\planbook\TESTING.md` — § WO-2.26 (was 2850–2920) rewritten for the card; twelve desk lines
  ticked, three 👤 lines left open.
- `C:\dev\planbook\plans\work-orders\phase-2-attendance.md` — seven acceptance ticks, the first cut's
  italic note replaced with one recording the three decisions actually made, and the status
  parenthetical corrected from "source built, harness owed".

**Files I did not touch, and why:**

- `src/passes.js`, `src/pass-history.js`, `src/detail.js`, `src/attendance-report.js`,
  `src/detail.css`, `src/attendance.css`, `src/shell.js` — read end to end and diff by diff; the
  harness proved them right and I changed **nothing** in any of them. § 1a said change them only
  where the harness shows them actually wrong, and it never did.
- `sw.js` — **left at `planbook-shell-v55`. See the question for the owner below.**
- `CHANGELOG.md` — not mine. A draft is at the foot of this file.
- `studentCsv()` — the brief said explicitly this is not mine to decide. It is untouched.

---

## Against the Acceptance list, one by one

**1. The Student Report screen lists this student's trips inline — every trip in the open term, with
its date, its clock and its note, on the screen itself and behind no tap.** ✅ **TICKED.**

Two checks. The card drew four trip rows and one note row against a log holding four in-window trips
of which one is noted; every row is five cells, every date cell holds a digit, both clock cells are
non-empty, and every row's minutes cell equals the minutes stored on the corresponding entry. The
rows as printed by the run:

```
[["FRIAugust 14, 2026","Nurse","9:10 AM","9:10 AMdismissed","0"],
 ["FRIAugust 14, 2026","Nurse","8:59 AM","9:10 AM","10"],
 ["FRIAugust 14, 2026","Quick","9:10 AM","9:10 AM","0"],
 ["FRIAugust 14, 2026","Quick","1:02 PM","1:06 PM","4"]]
```

"Behind no tap" is asserted as `dialogs.length === 0` — the dialog the door was in is *closed* when
the card is read, so a list that had arrived in a modal would fail. The second check is the shape:
titled `.detail-card`, its own count in the title, note underneath, **last** in the right-hand
column — the run printed the column as `["Missing work","Attendance · 100%","Hall passes · 4 trips ·
14 minutes out"]`.

**2. The list is term-scoped, and says which term. A term with no dates set falls back to the whole
year in `attendanceCard()`'s existing words.** ✅ **TICKED.**

This is the line the old block could not make, and it is the one I spent the most care on. **The
harness now plants a fixture**, which nothing else in that section does: the pass class is put on a
dated term (today ±7) and **two trips are planted on the busiest student — one inside the window
carrying a note, one sixty days outside it.** Before this, every trip the run authored fell on today
and term-scoping was invisible.

Asserted four ways because each fails differently:

- the out-of-term trip's sentinel note is **not** on the card;
- the count is the term's (`Hall passes · 4 trips · 14 minutes out`) and **not** the year's
  (`Hall passes · 5 trips · 21 minutes out`);
- the card covers **one** distinct day where the log covers two;
- the note says `— WO-2.26 window only`.

**And I satisfied myself it goes red if scoping is removed**, which the brief asked for specifically.
The same check asks the app's own two readers through the seam and requires them to *disagree*:
`passesForStudentInTerm(…) === 4` against `passesForStudent(…) === 5`. If
`passesForStudentInTerm()` were ever reduced to `passesForStudent()`, those two numbers become equal
and **four separate clauses across three checks fail together** — the count clause, the day-count
clause, the sentinel clause and the reader clause. There is no version of that reduction that leaves
this green.

The fallback half is a fifth check, and it is asserted on the **same term stripped of its two
dates** and repainted, so the only thing that changed between the two readings is the window: the
card then says `Hall passes · 5 trips · 21 minutes out` over five rows, the sentinel note comes back,
and the note reads *"this term has no dates set, so this is every trip on the year"* —
`attendanceCard()`'s words, not new ones. The dates go back on before anything below is read.

**3. The attendance history dialog shows the count and no door, and the count agrees exactly.**
✅ **TICKED.**

The dialog's line and the card's title are compared **as strings**, not as tallies — a build that
agreed on the count and disagreed on the wording would still be two answers to one question. The run
printed both as `"Hall passes · 4 trips · 14 minutes out"`. `[data-pass-history-student]` is counted
across the **whole** dialog and is 0; `Every trip` appears nowhere in it; the phrase
`whole year, not just this term` appears nowhere in it. Guarded against passing for the wrong
reason: the heading is non-empty, the dialog is 728 characters, and the one door that *does* belong
there (`Grades for …`) is still there, exactly once.

**4. A student with no trips is stated as none on both surfaces.** ✅ **TICKED.**

One check reading both surfaces for the same student on one walk: the dialog says
`Hall passes · none`, the card says `Hall passes · none` and *"No hall passes are recorded for this
student in WO-2.26 window."*, with no table and no rows. Both negative controls are in the same
check — the dialog is 701 characters and the screen 1,856, so neither absence is a surface that
failed to draw. A separate check keeps the surviving WO-2.9 claim: the per-student view behind the
**class** dialog's own door still says there are none and offers the ← back.

**5. Presentation mode: the card and the count line are both suppressed, and the Student Report
screen still draws. A negative control proves suppression.** ✅ **TICKED.**

Three checks, and the first proves something the work order did not ask for but `src/shell.js` did:
**the mode is flipped with the real header control while the Student Report is already on screen**,
so this is the repaint that `flipPresentationMode()`'s standing instruction demands, not the next
navigation. With it on the card is titled `Hall passes` over 0 rows with the reason drawn, the count
string and the trip note are both absent from the whole view, and the screen still holds 1,689
characters across `["Missing work","Attendance · 100%","Hall passes"]` — a screen, not a hole.

Flipping back off restores the same title over the same four rows. The dialog gets the same pair:
suppressed with the reason on a dialog still 858 characters, restored to the same line. Both flips
are made with no dialog on screen, because the header is behind the scrim.

**6. `src/attendance-report.js` still imports nothing from `src/supports.js` and has no path to
`student.supports`.** ✅ **Was ticked, stays ticked, and I re-ran the grep rather than assuming.**
`grep -E "^import .*supports" src/attendance-report.js` → no matches. Every occurrence of either
string in that file is prose in its header, arguing why.

**7. `src/detail.js` holds the same line — no import, no path, and WO-3.7's eighth acceptance line
still true of the printed page and the CSV in both modes.** ✅ **TICKED.**

The grep half is mine and empty: `src/detail.js`'s thirteen imports are listed in the run's own
evidence and none is `./supports.js`; every `student.supports` occurrence is header prose. The
**printed page and CSV half** is closed by WO-3.7's own two checks, which now run against a tree
that has the card on that screen — and which had **not** run since the first cut, because the crash
was 5,000 lines above them:

```
PASS | neither the screen, the printed page nor the CSV carries accommodation, medical or plan data
       — with support data VISIBLE everywhere else in the app
       :: supportsVisible() = true; sentinels found = [], the word IEP found = false;
          the three measured 3103, 716 and 1322 characters, so none of them was empty
PASS | … — with support data SUPPRESSED by presentation mode
       :: supportsVisible() = false; sentinels found = [], the word IEP found = false;
          the three measured 2927, 716 and 1322 characters
```

The 3103 → 2927 difference between modes is the hall-pass card itself: the card is on the measured
screen, and the sentinels are still absent in both modes.

**8. The trips print or do not print as decided, and the printed page matches the decision. 👤**
❌ **NOT TICKED — and I will not tick it.** It needs paper.

The **decision** is made and written where the gate is (`src/detail.js` § PRINTING A VIEW, four
reasons): the trips print with the grade. What I could measure, I did — a new check borrows WO-3.7's
apparatus, stubs `window.print()`, clicks the real 🖨 control under emulated print media and takes
the snapshot at the one instant the gate is a fact:

```
window.print() calls from one tap = 1, gate on at the snapshot = true; the card measured 239px
over a 138px table of 5 row(s), beside a 63px hero
```

with the in-term note on the sheet and the out-of-term note absent. **That is a headless window at
1280px, not a sheet of Letter**, and this repository already has the scar for exactly that
confusion: `src/detail.css`'s print block records a two-column bug that "could not be seen in the
harness either, which emulates print MEDIA at a 1280px window — a width band no printer has." So the
👤 line stands, and I have written it into `TESTING.md` as three specific things to look for.

**9. The card reads at arm's length beside a guardian, and the screen still reads as one page. 👤**
❌ **NOT TICKED.** Human eyes. Nothing in a harness can answer it.

---

## The blocking item, in detail

**The harness crashed; it did not fail.** My baseline run before touching anything reproduced it
exactly:

```
FAIL | the student attendance report carries this student's hall-pass count, …
Error: nothing to click for #attendanceHistoryBody [data-pass-history-student="s_2i62382t37"] [0]
    at clickSel (file:///C:/dev/planbook/tools/verify-shell.mjs:280:19)
    at async file:///C:/dev/planbook/tools/verify-shell.mjs:10479:3
```

Per-check disposition, as § 1a set out — all eight followed:

| first cut's check | disposition |
|---|---|
| count-agrees | **rewritten** for term scope and no door; now compares two rendered strings |
| door opens the same view | **deleted** |
| report still open underneath / stacking | **deleted** |
| no trips is told so | **kept**, lost "and no door", gained the card half |
| the view behind strands nobody | **survives unchanged** |
| presentation mode ×2 | **kept**, door halves dropped, negative controls kept and strengthened |
| 44px `.attendance-report-door` rule | **re-aimed** (below) |

**New coverage:** the card on the Student Report screen; the card and the dialog line as one string;
the out-of-term trip; the no-dates fallback on the same term; the printed sheet; the mode flip on the
screen already open; the card's control census; and a teardown check.

**The 44px re-aim** is now two claims in one check, and the first is a measurement rather than a
rule: the card is asked for `button, a, input, select, textarea, [tabindex], [role="button"],
[data-pass-history-student]` and must return **none** — which is the only honest reason a new block
on a touch screen owes no floor, and it is `src/detail.css`'s own sentence measured rather than read.
The second half keeps the rule for the two controls that *do* wear `.attendance-report-door`
(WO-3.7's *Grades for …*, WO-2.9's *← All students*), so deleting the third door cannot take the rule
with it. Run: `the card drew 0 control(s) []; the coarse rules naming that class are
[{"sel":".attendance-report-door","h":"44px","w":"44px"}]`.

**Crash-proofing.** Every door this block walks through is asked for with `has()` before it is
clicked. If the fixture does not land, one check FAILS and the rest are announced by name as
SKIPPED — the WO-3.5 pattern, whose own comment says why: *"A missing fixture is a failed check in
this file and never a crash."*

**The hand-off is restored and asserted, not assumed.** The block ends by removing both planted trips
**by id** (not by restoring a snapshot of `passes`, which would take the trips the section writes
next with it), putting the class's own terms back from a copy parked on `window`, closing both
dialogs, walking back through the switcher and re-opening the class card. A final check asserts zero
planted trips remain, the open class is the pass class, and the registry is up. The two passes that
this section is required to leave open are issued after that, untouched by me.

---

## The defect the crash was hiding

Once the run got past line 10479 for the first time, **one check went red 5,000 lines later** —
WO-2.6's *"the print rules exist and every one of them is gated"* at `verify-shell.mjs:15661`:

```
32 print rule(s) touching the record surface, 24 gated on data-attendance-print, 8 ungated
["body[data-detail-print] .attendance-report-table", …]
```

This is real and it belongs to WO-2.26. The first cut put eight `body[data-detail-print]` rules for
the trip table into `src/attendance.css` — **correctly**, because that is where those class names
live and one sheet does not style another sheet's classes — and that check, written when
`attendance.css` had exactly one print surface, demanded `data-attendance-print` on every print rule
touching `.attendance-report-*`.

I fixed the check rather than the CSS, because the CSS is right and the owner has already read it.
The check now sorts rules by **which surface's attribute gates them**: `data-attendance-print`
(gated), `data-detail-print` (borrowed), neither (**ungated, still a failure**). It additionally
requires `borrowed > 0`, so a build that lost WO-2.26's print rules goes red here too rather than
reading as a tidier stylesheet. The reasoning is written at the check.

**This is the strongest argument I can make for why the crash mattered more than the failing check
above it:** a red line in a report is a red line; a `clickSel` on a hook that has gone is a defect in
one work order concealing a defect in another.

---

## Decisions I made that the work order did not settle

**1. The walk to the Student Report screen goes through the *Grades for …* door in the attendance
history dialog, not through `#scoresBody [data-student-detail="…"]`.** § 1a names the `#scoresBody`
selector, and I departed from it on a fact I checked in the source: `renderScores()` returns early
into an empty state whenever the open class has no term **or no assignment in it**
(`src/scores.js`, the `emptyText` ladder), and the pass class has neither — so `#scoresBody
[data-student-detail]` does not exist on that class and clicking it would have been a second crash of
exactly the kind I was sent to fix. The alternative was to plant a category and an assignment on the
pass class purely to make a grid draw. I judged that a worse trade after two environment kills: more
planted state, more teardown to get wrong, and a gradebook fixture inside a hall-pass section. The
door I used is a real control a teacher taps, it is on the surface this section is standing on, and
it is the exact seam the work order exists to close ("the record is two dialogs away"). The
`#scoresBody` route to that screen is already exercised by WO-3.7's own section at `:15740`, and
that section now draws the card too (its run output lists `"Hall passes · none"` among the card
titles). **If the verifier wants the `#scoresBody` route specifically, it is a one-assignment
fixture away and I will add it.**

**2. The fixture is planted through the store, not through the UI.** No control in this app sends a
student out last June. This is the same door the section already opens to wind a stamp backwards
("the fixture for the minutes is real: that student's time out was wound back seven minutes"), and it
is said out loud at the plant.

**3. Fourteen call sites, not eight.** The number is up six net (742 → 748) and the executed count is
746. `tools/README.md` records the whole arc — 734 → 742 → 748 in one day — because the middle figure
is the one worth reading.

**4. The owner's "the ticks above are deliberately mostly empty" note is left exactly as written**,
per the brief, even though seven of them are now ticked. I did not edit the owner's paragraph; I
added mine underneath, which opens by saying so and dates the closure. **If that reads as a
contradiction to the verifier, the resolution is the date, not an edit I was told not to make.**

---

## A question for the owner — `sw.js`, and it is not mine

`sw.js` is at `planbook-shell-v55`, the first cut's bump from v54, still uncommitted. **Six source
files changed after that bump** (`src/passes.js`, `src/pass-history.js`, `src/detail.js`,
`src/attendance-report.js`, `src/detail.css`, `src/attendance.css`), and the dev server was up on the
LAN during that window, so **a client may be holding a v55 that is not this v55**. Whether that is a
`v56` is your call; it was flagged and deliberately not taken by three dispatches now, and I have not
taken it either. `wo-sweep.mjs`'s bump check is green either way (`planbook-shell-v55 is not in any
commit yet — the bump is uncommitted, which is the rule being followed`), so nothing forces the
decision.

*My reading, offered and not acted on:* if any device fetched from the LAN server between 06:05 and
07:52 today, it holds a stale shell under a name this deploy will not replace, and a v56 costs
nothing. If nothing did, v55 is honest.

---

## Proposed follow-ups (noted, not done)

1. **`studentCsv()` and the trips.** The work order says nothing about the file and I wrote nothing
   into it. There is a case both ways — the card is on the printed sheet and the CSV is the same
   conversation in a spreadsheet; against it, the CSV's column shape is a contract with whatever a
   teacher pastes it into. **A work order, not a line.**
2. **The `#scoresBody` route to the hall-pass card** (see decision 1). XS, and it would need one
   planted assignment on the pass class.
3. **The coarse sweep still does not open the attendance history dialog or the Student Report
   screen.** The 44px half of my check is a rule plus a control census, not a thumb measurement,
   because no sweep in this harness has a roster on screen by the time it runs. That gap predates
   this work order and is worth a work order of its own.
4. **`TESTING.md`'s third new 👤 line** is a genuine new question rather than a re-run: the trip
   table's coarse sizes were tuned inside a dialog and have never been read inside a card.

---

## What I could not verify

- **Anything needing the iPad or paper.** Both 👤 acceptance lines and all three 👤 lines in
  `TESTING.md`. I have neither device nor printer, and the harness "drives a page, not an installed
  app."
- **How the card reads to a person.** The line about arm's length and about the screen reading as one
  page is a judgment nobody in this conversation can make.
- **The service worker's behaviour at v55 against a real client** — the question above is a question
  precisely because I cannot answer it from here.

---

## Draft `CHANGELOG.md` entry — yours to accept, reword or bin

> **The hall passes are on the student's page now.** Open a student from the score grid or from
> *Grades for …* on their attendance, and the trips they took this term are on the page with the
> grade and the attendance — the day, the time out, the time back, the minutes and whatever you
> typed on the pass. It prints with the sheet. The attendance history dialog still says how many
> trips and how many minutes, and that number is the same number, because it is the same count over
> the same term. Presentation mode takes both of them off the screen.
