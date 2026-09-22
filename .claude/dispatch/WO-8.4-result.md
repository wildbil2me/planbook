# WO-8.4 — Print stylesheets · implementer's result

**Implementer:** Claude (Opus), 2026-09-21. **Not committed.** The owner's uncommitted edit to
`plans/work-orders/phase-8-packaging.md` (the 2026-09-21 correction and the seven Rulings) was kept
as the current work-order text. I added the Acceptance ticks and one paragraph under them. I reverted
nothing of the owner's.

## Final tool lines, as I read them from the output

- `node tools/verify-shell.mjs`: **`1461 checks · 1461 passed · 0 failed · 0 skipped`**,
  `46,181 lines · 31.6 lines per check · 528s`, then `EXIT=0`, which I echoed into the log myself.
  This was a full run on the delivered code, 2026-09-21, on the real clock. An earlier full run of
  the same length, before the grade-sheet first-slice change, was also 1461/1461 and exit 0. After
  the green run the only code change was a mutation in `src/scores.css`, reverted by exact string
  replacement. The only other edits were to documentation (`tools/README.md`, `TESTING.md`, the
  phase file), and the harness does not read those.
- `node tools/wo-sweep.mjs`: **`42 checks · 38 passed · 0 failed · 4 to review`**. Three of the
  REVIEW items were already there before this work. The new one is "CSS selectors added in the
  working tree with no coarse-block rule", which lists `.print-header*` and `.supports-panel`. None
  of them is a touch target: the band never appears on screen, and the belt only hides a container.
- `node tools/wo-gate.mjs --audit` ends in PASS. `node tools/wo-gate.mjs WO-8.4` reports the row as
  CLAIMED and the gates as clear. I ran neither `--start`, `--release`, `--handoff` nor `--tick`.
- `grep -rn MUTATION src index.html sw.js` finds only the comment that was already at
  `src/shell.js:921` ("A CLASS MUTATION ADDED LATER…"), which is not a mutation.

## Against the Acceptance list

1. **Each printable surface produces a clean page with a title, class, term and date: left open,
   on purpose.**
   - **What the harness shows** (`tools/verify/print-sheets.mjs`, all four sheets, presentation
     mode off and on):
     - `#printHeader` is displayed as flex, has a box and is `<body>`'s first element.
     - It shows the correct title (*Attendance record* / *Grade sheet* / *Student report* /
       *Calendar · May 2027*), the class, the term with its dates, and *Printed \<today\>*.
     - Each surface's own head has no box.
   - **PDF evidence:** `Page.printToPDF` in Edge puts the month on 1 page at 792×612 (landscape).
     A two-slice grade sheet comes out as 2 pages at 612×792 (portrait).
   - **Why it stays open:** "clean page" is something you judge by reading paper, and I have no
     printer. It is owed as the first 👤 line in `TESTING.md` § WO-8.4.
   - **Limit, by ruling 5:** on the calendar, the term line is left out when the classes on show
     don't share one term.
2. **No app chrome, navigation or button in any printout: ticked. Harness evidence.**
   - On all 8 sheets (4 surfaces × 2 modes), no `button`, field, `a[href]`, `nav` or
     role=button/tab/navigation element has a box.
   - **One named exception: the calendar's chips.** They are `<button>`s on screen. On paper each
     one is a line of text inside a hairline border, because its print rule strips the colour
     fill. Someone reading "no button appears" strictly might want to judge that on paper.
   - The rewritten grade-sheet and grade-detail snapshots also show that nothing outside the sheet
     and the band has a box.
3. **No accommodation, medical or plan data, in either mode: ticked. Harness evidence, and the
   mutation check turns red when it should.**
   - **Planted data:** accommodation, medical, behaviour plan, case manager, attendance clause, plan
     type, and a review date in the month on show. The run first proves all of them are in the year
     document.
   - **Printed sheets:** I searched the rendered text (`innerText` under print media) of all 8
     sheets for each planted value and for the review chip's *Review ·*. There was none, with the
     mode off as well as on.
   - **The belt:** with the mode off and no gate on `<body>`, the roster's support dot, the student
     editor's open support panel and the home page's review count each have a box on screen and
     none on paper.
4. **Gradebook ordered to match the SIS entry screen: ticked.**
   - The match itself is the owner's reading of 2026-08-13 against the live SIS, recorded in WO-3.9.
   - What this work order owed was not to disturb it. The harness shows rows `Abbott, Ben ·
     Okafor-Wo84, Nia · Zed, Rev` and columns in due-date order, in both modes, over a roster and an
     assignment list stored in neither order.
   - WO-3.9's own, more detailed order checks pass in the same run. `gradesRecord()` is untouched.

**👤 lines I added to `TESTING.md` and did not tick:**
- Print all four sheets on a laptop printer.
- Print the month from the iPad. Safari ignores named pages, so you turn it to landscape by hand;
  this is the limit ruling 4 accepted.
- Press Ctrl+P on the roster with the mode off. Expect no support dot and no empty band.

## Mutation round

Each mutation was marked `MUTATION`, run on a subset of the harness (this section plus the one that
sets up the page's test hooks), then reverted by exact replacement. I grepped afterwards each time
and found 0 left behind.

| Mutation | Check that turned red |
|---|---|
| Emptied the belt's selector list in `src/shell.css` | The belt check (the support dot was 22px on paper) |
| Re-showed the attendance record's own head under its gate | Ruling 1 (`record` 89px in both modes) |
| Removed both calendar review-chip rules and the chip's `data-support-indicator` | Acceptance 3 (`calendar-off … LEAKS ["Review ·"]`) |
| Removed the first grade slice's `break-before: auto` | The PDF check (the grade sheet came back at 3 pages) |

The first three ran together: `49 checks · 46 passed · 3 failed`. The fourth ran alone:
`49 · 48 · 1`.

## Decisions the work order didn't settle, and which way I went

1. **Where the header is filled.** I put it in `src/print-gate.js`'s `syncAll()`, at `beforeprint`,
   using a third `headOf` argument to `registerPrintGate()`.
   - Why: four surfaces share one element. If each surface wrote it when opened, its words would
     stay behind after that surface closed.
   - The answer to "which surface is printing" already lives in that function, at the moment the
     page is serialised. So the gate and the band are answered together.
   - Each surface hands over words only. The dialogs take theirs from the record they drew; the
     calendar builds its words at print time.
2. **Ruling 4 departure.** I set `page: calendar` on `<body>` under the calendar gate, not on the
   view as the ruling words it.
   - Why: `#printHeader` is a sibling of `<main>`. When the page name changes between siblings, the
     browser forces a page break, so the band would print alone on a portrait page.
   - Evidence: the PDF shows 1 landscape page.
   - The reasoning is written at the rule in `src/calendar-view.css`.
3. **Grade sheet's first slice: outside what the rulings asked for.** It no longer breaks before
   itself.
   - Why: every slice used to break, the first included, so page 1 held only the head and a label.
     The drawing shows the grade sheet as "sheet 1 of 1".
   - Evidence: 3 pages → 2 pages on a two-slice fixture.
   - The continuation line is now only on slices 2 and later.
   - This changes WO-3.9's page breaks, not its order. It is written at the rule in
     `src/scores.css`. **The owner may want to see this on paper.**
4. **Ruling 6: how far the belt reaches.**
   - It covers `.support-dot` and `.supports-panel`, which both accommodation prompts also wear.
   - It also covers a new valueless marker, `data-support-indicator`, which I put on the calendar's
     review chip and on the home page's review count. The review count is hidden under presentation
     mode, and a stylesheet here may not name another sheet's class.
   - The per-screen rules in `src/assignments.css` and `src/calendar-view.css` stay as defence in
     depth. The comment at the belt records this choice.
5. **Stamps deleted, not hidden.** `#calendarPrintStamp` and `.detail-print-stamp` existed only for
   print, and ruling 1 hides each surface's own head. Leaving them hidden would have meant elements
   whose comments say they print, under rules that stop them. The student report's hero line was
   split into two spans so its class-and-term part (`.detail-hero-where`) can be hidden on paper.
   The text on screen is the same.
6. **Calendar class slot wording.**
   - One class shows its own name.
   - Two classes read **"Both classes"**. "All two classes" isn't English, so this is my own wording
     beyond the ruling.
   - Three to twelve are counted in words ("All eight classes" in the full run); above twelve, in
     digits.
   - The term line appears only if every class on show has exactly one dated term overlapping the
     window, and they all share the same label, start and end.

## Could not verify / not done

- Anything on paper, and anything on the iPad (the 👤 lines above).
- The harness measured the two-slice grade sheet's page count after the change. It measured the
  one-slice case only before the change (2 pages). The one-slice case follows from the same rule
  but was not measured again.
- **Temptations declined (out of scope, noted rather than acted on):**
  - The student report's hall-pass card still prints according to the mode: trips when it is off, a
    sentence when it is on. WO-2.26 ruled that it prints, and pass data is not support data. So that
    sheet is not identical across modes, whatever the drawing's "decided" caption says.
  - A Ctrl+P of the home page or the concern list with the mode off still prints names. Ruling 6
    limited the belt to support indicators.
  - Both are written up in `TESTING.md` for the owner to decide.

## Files changed

- **Code:** `index.html` (adds `#printHeader`, removes `#calendarPrintStamp`), `sw.js` (`CACHE`
  v127 → v128), `src/print-gate.js`, `src/shell.css`, `src/attendance-report.js`,
  `src/attendance.css`, `src/grades-report.js`, `src/scores.css`, `src/detail.js`,
  `src/detail.css`, `src/calendar-view.js`, `src/calendar-view.css`, `src/glance.js`.
- **Harness:** new `tools/verify/print-sheets.mjs`; `tools/verify-shell.mjs` (import plus one
  row). Rewritten to the new shape, not relaxed: `tools/verify/grade-sheet.mjs`,
  `tools/verify/grade-detail.mjs`, `tools/verify/calendar-drawn.mjs`.
- **Docs:** `design/mockups/proposed-phase8.css` (§ PRINT HEADER banner marked as lifted),
  `tools/README.md` (call sites 1437 → 1450, a paragraph for WO-8.4, "seventy files"), `TESTING.md`
  (new § WO-8.4), `plans/work-orders/phase-8-packaging.md` (ticks on lines 2–4 and the departures
  paragraph).

## Conventions I set

- `headOf` returns `{ title, subject, lines, brief, printed }` as the one way a surface tells the
  band what to say.
- `data-support-indicator` is the marker any future support indicator should wear so the belt
  covers it.

## Draft CHANGELOG entry (for the owner to decide on)

> **Every printout now says what it is.** The attendance record, the grade sheet, a student's report
> and the calendar print under one header: what the sheet is, the class, the term and the day it was
> printed. The grade sheet's header carries the letter scale, and a page the app starts on purpose
> says whose it is. The month prints landscape on a laptop (on the iPad, turn it in the print
> preview). A grade sheet no longer wastes its first page. And no support detail reaches paper from
> any screen, whether presentation mode is on or not.
