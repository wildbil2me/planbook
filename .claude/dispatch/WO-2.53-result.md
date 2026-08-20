# WO-2.53 — the rows detail panel says what the row already says · implementation result

**Implementer** Claude Opus 5 (work-order-implementer) · **Date** 2026-08-20
**Brief** `.claude/dispatch/WO-2.53-brief.md` · **Work order** `plans/work-orders/phase-2-attendance.md:5532`
**Status written** `✅ DONE — 2026-08-20` · **Not committed** — the brief did not say to commit.

---

## What landed, in one paragraph

The `⋯` at the end of a name is a `›` carrying `data-student-detail`, so one activation lands on that
student's grade screen. The note field and the un-confirm moved into the student's history dialog, into
one block high in it about the one day the registry accepts writes on. Both writers and both hooks are
untouched: `src/shell.js` gained **no** routing line, and its only edits are the census (one row out,
two rows re-worded) and three comments that had become false. The registry side is a deletion —
`detailFor`, `toggleDetail()`, `paintDetail()`, its call, its four resets, `detailButton()`'s toggle
half, every `.attendance-detail*` rule including the coarse-block entries — and the view-state comment
says **six**, counted off the declarations under it.

---

## Against the Acceptance list, item by item

Everything below was run by me on this machine; the commands and the exact lines they printed are
quoted. Two 👤 lines are **not** ticked and are named at the end.

**1. One activation of the row's door lands on the grade screen, no dialog on the way — ✅ verified.**
New harness check, driven with one `clickSel` on the door in a row for a student nobody has confirmed:
`PASS | one activation of the row's door lands on the grade screen for that student, with the
breadcrumb naming them, and no dialog opens on the way :: from the registry (true) to the detail
screen (true) in one activation; dialogs open on arrival = [], heading "Ula Waiting", switcher
["Attendance","Assignments","Scores","Calendar","Ula Waiting (name)"]`. A second check beside it:
`PASS | the door is one per row, it is not a toggle, and it does not promise a dialog … doors per row =
[1,1,1], glyph "›", aria-pressed/aria-haspopup = null/null, label "Grade detail for Ula Waiting"`.

**2. The name still opens the history dialog, which still carries *Grades for \<name\>* and the *Whole
year* row — ✅ verified, nothing built.** The dialog is opened by clicking the name in eleven places in
the new block and in the re-pointed WO-2.10 checks; the *Whole year* row is read by label in the new
block's fixture check and in the un-confirm check (`["Whole year","1","0","0","0","1","2","100%"] ->
["Whole year","1","0","1","0","0","2","50%"]`). `attendance-report.js`'s `totalsRow('Whole year',
attendanceTotals(...))` is unchanged, and so is the `Grades for …` door — I only appended a paragraph
to its comment, because that comment said the door from attendance is *HERE* and there are two now.

**3. A note typed in the dialog lands on the same mark, survives close/reopen and a reload, and the
caret is not taken — ✅ verified.** `PASS | a note typed in the dialog lands on that day's mark and
comes back on it — and the field it was typed into is never replaced :: the entry is now
{"code":"D","at":"2026-08-20T08:14:00-04:00","note":"walked in with a late pass"}; the same element
survived the keystroke = true, still focused = true; reopened, the field reads "walked in with a late
pass"`. The caret claim is asserted as **element identity plus `document.activeElement`** — a property
is set on the input by hand before the keystroke and read back after — rather than as the value coming
back, which a repaint would also satisfy. The reload half is the re-pointed WO-2.10 check: `PASS | a
note typed on a mark survives a reload, on the same student, date and class`.

**4. Un-confirm from the dialog: five surfaces in one paint — ✅ verified, and mutation-proved.**
`PASS | un-confirm from inside the dialog moves all five surfaces in one paint … rate "100%" -> "50%"
:: term [… "1","0","0","0","1","2","100%"] -> [… "1","0","1","0","0","2","50%"] :: year [same pair]
:: today's row ["THUAugust 20, 2026","Dismissed","2 of 2 · 100%"] -> [… "Absent","1 of 2 · 50%"] ::
the cell behind it reads "?" and the entry is {"code":"U"}`. **Mutation run** with the repaint call
deleted from the listener: `1051 checks · 1049 passed · 2 failed · 0 skipped`, exit 1 — exactly two,
both in the new section, and the printed detail is the defect itself (`rate "100%" -> "100%"`, all four
dialog figures unmoved while the grid behind reads `?` and the document holds `{code:"U"}`). Reverted
immediately; `grep -n MUTATION src/attendance-report.js` returns nothing.

**5. The four conditional cases, driven not reasoned — ✅ verified.** Four checks, all PASS: a
confirmed mark gets the field (on today's date) and the un-confirm in one block headed *Today ·
Thursday, August 20, 2026* over *Dismissed at 8:14 AM*; a confirmed present student gets the
un-confirm and *"Present is stored as no mark at all…"* and no field; a student nobody has confirmed
gets *"Nobody has confirmed this student yet…"* and **neither** control (asserted twice — once on a
student planted that way, once on the one the un-confirm just made); a dropped day draws **no block**
(`block(s) = 0`) with the rest of the dialog still drawn.

**6. `editDate()` answering `''` draws no write block — ✅ verified, but read narrower than written.**
`PASS | with the strip standing on a past day that has not been unlocked, the dialog draws no write
block … the selected term ended 2026-07-21; dialog up = true, block(s) = 0, field = false,
un-confirm(s) = 0`. **The parenthetical in the work order is wrong about one of its two examples and I
did not implement to it:** *paging the window back does not make `editDate()` answer `''`.* The anchor
does not move when the window does (`editDate()` = `editingDay || (anchor >= today ? anchor : '')`), so
on a paged-away window the day that accepts writes is still today and the block **is** drawn — naming
the day it writes on. The state the line is about is WO-2.52's February case, which is what I drove: a
selected term that has ended anchors the strip on a past day, that day is locked, `editDate()` is `''`.
Recorded in the work order's own tick and in `TESTING.md`. See § Decisions below for why I let the
paged-away case draw the block instead of gating it on the column being on screen.

**7. `grep -rn "attendance-detail\|detailFor\|toggleDetail\|paintDetail" src/ tools/ index.html
TESTING.md` returns nothing — ✅ verified, empty output.** That cost prose edits in three files the
work order did not name: `tools/README.md`'s WO-2.18 paragraph, `tools/wo-sweep.mjs` § 11's allowlist
example (it quoted `paintDetail(totals)` as an example of a call name in harness prose — replaced with
`paintRenderedTotals()`, which the harness does quote), and three historical entries in `TESTING.md`
(the WO-2.18 section, its mutation table, and WO-1.23's run log, whose first row quoted the dead hook
inside a real error message). **The historical entries are re-worded rather than re-written:** they
still say what happened, describing the panel and its hook rather than naming the identifiers, each
with the reason. My own new `TESTING.md` section broke this grep twice on the first draft — in the same
sentence that warns about it — and the pattern is deliberately not written out there.

**8. The view-state comment says six, `grep -n "Seven values" src/attendance.js` returns nothing —
✅ verified, empty output.** Counted, not decremented: `editingDay`, `pageDaysBack`, `searchText`,
`filterCode`, `sortBy`, `selectedId`. `resetRegistry()`'s own "six other things" sentence was already
loose against seven assignments and now says *the six values* with the same count.

**9. `node tools/wo-sweep.mjs` green — ✅ verified.** `25 checks · 23 passed · 0 failed · 2 to review`,
both REVIEWs the standing pair, the same line the tree printed before this work order. The hook census
line reads `167 delegated attribute(s) … all of them findable in the 196-attribute census` (168/197
before), so the attribute left both sides in one edit. The coarse-block line reads `9 new selector(s),
all covered — 86 added line(s) in tracked src/*.css`.

**10. `node tools/verify-shell.mjs` green, count recorded, `tools/README.md` reconciled — ✅ verified.**
Delivered tree: `1051 checks · 1051 passed · 0 failed · 0 skipped`, 29,300 lines, 27.9 lines per check,
352s, exit 0. Call sites 1022 → **1034**, written into `tools/README.md`'s sentence in the same edit as
a WO-2.53 entry in the count history, with the executed number (1051) and the site/result gap (18 → 17,
the one being the new fixture-guard failure arm) taken **from the run** rather than by arithmetic.

**11. 👤 iPad: 44px under a thumb, and whether `›` reads as "go to this student" — NOT TICKED.** I have
no iPad and the glyph reading is the owner's to take. What I can say from the desk: the door wears
`.attendance-student-door`, which carries `min-height/min-width: 44px` in the `@media (pointer: coarse)`
block — the ⋯'s own floor, moved with the rename — and the harness's coarse sweep passes over it. That
is a stylesheet measurement, not a thumb.

**12. 👤 Mid-period rehearsal on the iPad — NOT TICKED.** This is the trade the work order spends (the
panel opened in the row; a dialog opens over it) and no emulator can report whether you lose your place
in the list.

---

## Files changed

- `C:\dev\planbook\src\attendance.js` — `detailFor`, `toggleDetail()`, `paintDetail()` and its call
  gone; `detailButton()` → `studentDoor()` (`›`, `data-student-detail`, no `aria-pressed`, no
  `aria-haspopup`), drawn on every row; new exported reader `editableMark(studentId)`; six comments
  rewritten (view state, rotation, `unconfirmStudent`, `setNote`, `selectableRows`, the keyboard block,
  `paintRenderedTotals`, `resetRegistry`).
- `C:\dev\planbook\src\attendance-report.js` — header's read-only promise rewritten at the point of
  departure; `openHistory()` split into `openHistory()` + `paintHistory()`; new `writeBlock()`; a
  `window`-level click listener that repaints the dialog after an un-confirm made inside it; `wordFor()`
  now words `U`; a paragraph added to the WO-3.7 door's comment because there are two doors now.
- `C:\dev\planbook\src\attendance.css` — `.attendance-detail*` gone (base and coarse);
  `.attendance-student-door` with the ⋯'s 44px floor; new `.attendance-report-write*` family with its
  own coarse entries; three historical comments re-pointed.
- `C:\dev\planbook\src\shell.js` — census: `data-attendance-detail` row deleted, the un-confirm and
  note rows re-worded, the `data-student-detail` row now names three elements; the `toggleDetail`
  branch deleted; the "ten taps" paragraph is nine; the `const detail` TDZ scar re-anchored (its local
  was the one being deleted).
- `C:\dev\planbook\index.html` — the registry's hint paragraph points at the name and the `›`; the
  keys legend says "while a dialog is open over the grid"; the history modal's *"THERE IS NOTHING TO
  EDIT IN IT"* comment rewritten — **that one is not in the work order and it was flatly false after
  this change.**
- `C:\dev\planbook\sw.js` — `CACHE` `planbook-shell-v88` → `v89`.
- `C:\dev\planbook\tools\verify-shell.mjs` — new section (13 call sites); the panel reads in the
  attendance READ block re-pointed at the dialog; the WO-2.10 note/un-confirm checks driven through the
  dialog; the note-spill loop measured against the modal panel instead of the grid wrap; the WO-2.13
  pair re-pointed at the row line; the two "third surface" checks retired with the reason written where
  they were.
- `C:\dev\planbook\tools\wo-sweep.mjs` — one allowlist example (comment only).
- `C:\dev\planbook\tools\README.md` — count 1022 → 1034 plus the WO-2.53 history entry; the WO-2.18
  paragraph put into the past tense.
- `C:\dev\planbook\TESTING.md` — new § WO-2.53 with ten ticked lines, two 👤 lines left open, a
  five-run table including the mutation; three historical entries de-tokenised.
- `C:\dev\planbook\plans\work-orders\phase-2-attendance.md` — status `✅ DONE — 2026-08-20`, ten
  Acceptance boxes ticked, the `editDate()` line annotated.
- `C:\dev\planbook\plans\ROADMAP.md` — the *(italic paren)* the work order owes its Phase 2 box. No
  dashboard change: no box changed state, and `node tools/wo-gate.mjs --audit` passes.

`node tools/wo-gate.mjs next` now answers **WO-2.54**. `--self-check` passes 18/18.

---

## Decisions the work order did not settle

1. **The dialog's repaint listens on `window`, and the writers are not imported.** The deliverable says
   `src/attendance-report.js` "gains its first writers … **imported** from the module that owns the
   ledger", and it also says the routing does not move (`data-attendance-unconfirm` answered by the one
   delegated click listener, which chains `afterAttendanceChange()`). Those cannot both hold: importing
   and calling the writers means either a duplicate write or a bypass of the home-screen redraw. I kept
   the routing and did **not** import them, so every routing sentence in the work order stays literally
   true, and rewrote the header to say exactly that — two writers, named, reached through the two hooks
   this file now paints, neither imported nor called here. The repaint then has to run *after* the
   document-level writer: a `document` listener registered from this module would run **before** it
   (module-scope listeners register in import order, and `src/shell.js` imports this module), so it
   would redraw from the pre-write document. `window` is the last object in a bubbling event's
   propagation path, so it always runs last regardless of registration order. Written out at the
   listener. The one import I did add is a **reader**, `editableMark()`, so the gate stays in the module
   with the writers in it rather than becoming a second opinion held by a file that cannot see the
   ledger.
2. **The door is drawn on every row, unconditionally.** The ⋯ was drawn only while some column accepted
   edits, because it opened a panel about that day. The grade screen has nothing to do with which day
   the strip is on, and a door that appears and disappears is one a teacher cannot learn — which is the
   Traps line's own argument one step further out. Noted at the call site.
3. **On a window paged off the edit date the block is still drawn.** Given (2), the only thing left
   gating the block is `editableMark()`, which asks about the *day*, not about the *window*. The old
   panel refused that case because it lived on the grid and would have acted on a date behind the
   teacher; the dialog is not on the grid and its block names the day it writes on. Gating it on the
   column being visible would have meant importing the window into the model. Reported rather than
   assumed — if the owner wants the block suppressed there, it is one predicate in `editableMark()`.
4. **`.attendance-report-write-note`, not `.attendance-report-note`.** The obvious name is already the
   grey footnote paragraph at the bottom of both report dialogs — and has a rule in the `@media print`
   block. A field wearing it would have come out 11px grey with a print rule on it. Named at the rule.
5. **The two "third surface" checks were retired rather than moved.** The deliverable says the
   detail-panel checks *move* rather than being deleted, and it names three: the note round trip, the
   un-confirm, and the conditional cases. All three moved. The two that did not are WO-2.18's and
   WO-2.51's assertions about `paintRenderedTotals()`'s **third painted surface** — which was the panel.
   Its remaining surfaces (the class line, the row lines, WO-2.51's band) are each asserted, so the
   license WO-2.18 was withdrawing is not open again; the history dialog is not a fourth surface,
   because no term tap reaches it, and re-pointing the check at it would have asserted a repaint that
   does not happen. WO-2.51's check kept its walk and now asserts the class line and the row line across
   the same anchor-moving term change. The reasoning is written where each check was.
6. **`data-attendance-write` is a new `data-` attribute and is deliberately absent from the census.**
   It is an intra-module marker `src/attendance-report.js` paints and reads back, never routed by the
   one delegated listener — the same case `wo-sweep.mjs` § 12 makes for `data-attendance-row` in as
   many words. The sweep's diff runs delegated→census only, and it stays green.

## Out of scope — noted, not done

- The grade screen, `historyDoor()`, and what the name opens: untouched. The only edit near them is a
  paragraph appended to the WO-3.7 door's comment, because that comment claimed the door from
  attendance is *HERE* and there are two now. Deleting the dialog's door was not considered — Acceptance
  line 2 requires it.
- Editing a note on a past mark without unlocking its column: not added. `editableMark()` returns
  `editDate()`'s day and nothing else, and the block says which day that is.
- A grade or a signal on the registry row: not added.
- Presentation mode: nothing new to suppress. The write block carries a mark, a time and the teacher's
  own note — no support, medical or plan field, and `src/attendance-report.js` still does not import
  `src/supports.js`.
- **`CLAUDE.md` and `AGENTS.md`: not touched, and one line in `CLAUDE.md` is now stale but not mine.**
  Nothing here adds a command or a convention a cold reader needs. But the status paragraph says
  *"Ship 2 — first grades — one row left to build"*, and with WO-2.54 booked on 2026-08-20 that was
  already off by one before I started; it is prose about the sprint and the teacher's to write.

## Follow-ups I would book (not done here)

- **A check that the history dialog's figures survive a term change while it is open.** They do not —
  the dialog is built at open and nothing repaints it on a term tap. That was true before this work
  order too (it is why the retired third-surface check could not be re-pointed at it), and it is now
  reachable one tap sooner: a teacher can be looking at a dialog while the nav behind it moves. Small,
  and out of scope here.
- **The mutation this section cannot make.** `verify-shell.mjs` can prove the repaint happens; it
  cannot prove the *ordering* argument behind the `window` listener, because a `document` listener that
  ran too early would be indistinguishable from no listener at all in a green run. The mutation above
  covers the "no repaint" half; the "repaints from the stale document" half is only reachable by editing
  the listener to use `document`, which I did not run. Worth one line in a later work order if anybody
  moves that listener.

## What I could not verify

Both 👤 lines: the 44px reading under a thumb and the glyph's meaning, and the mid-period rehearsal.
No iPad, and the glyph decision is explicitly the owner's. `sw.js`'s `CACHE` is `v89`, so a **force-quit
from the app switcher** is what puts this build on the glass.

## Drafted `CHANGELOG.md` entry — for the teacher to write or discard

```
### Changed
- The ⋯ at the end of a name on the attendance registry is now a `›` that goes straight to that
  student's grade detail. The panel it used to open repeated the row: on the state every row is in
  at the start of a period, both of its controls were hidden and what was left was the name, the
  date and the counts already on screen.
- A note on a mark and the un-confirm for one student are now in that student's attendance history,
  in a block at the top about the day the registry is accepting writes on. Nothing about what they
  write changed, and a note on a past mark still needs that column's ✏ first.
```
