# WO-2.53 — the rows detail panel says what the row already says · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.53-result.md` — as your last act, and return it in-band too.

**Routing decision.** Routed to **Claude Opus**: Size `L` is an outright Claude trigger, and the
Traps section is judgment rather than mechanics — a button whose destination must not depend on
state the teacher cannot see, two adjacent controls that must not make opposite ARIA promises, and a
prose invariant in `src/attendance-report.js` that no harness asserts and that this work order
deliberately falsifies. It also produces teacher-facing prose (`TESTING.md`, a drafted
`CHANGELOG.md`) and a glyph decision that only a reading on glass can settle. The runner-up I set
aside: the registry-side half is a mechanical deletion sweep with a pre-scarred comment count, which
reads Codex-shaped — but the proof budget forecloses Codex on its own (`verify-shell.mjs` is ~4.4
min a run and this Acceptance wants at least two full runs, ~8.8 min, before an `L` work order is
read or written, against a 20-minute hard cap), and Size `L` would have held it in the Claude column
regardless.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.53 — the rows detail panel says what the row already says

**Ship** 2 · **Status** 🤖 CLAIMED — 2026-08-20 · **Size** L · **Depends on** WO-2.6 · WO-2.10 · WO-3.7 · **Blocks** nothing
**Amends roadmap** Phase 2 → *"Timestamps on tardies and dismissals, and a note on any mark"* — the note
survives and its writer is untouched; **where it is typed moves**, so the box's promise is re-pointed
rather than repealed. The *(italic paren)* it owes `ROADMAP.md` is a hand edit at tick time.
**Takes from WO-3.7** the ruling it wrote about this exact row, reversed with the owner in the same
sitting — see **Why it exists** § the seventh control.

**Owner-asked 2026-08-20, reading the deployed app:** *is the attendance details button superfluous?
Most of the information is already written on the screen elsewhere except for the Year counts. I don't
need the year count at a glance. If that button instead jumped me to the "Grades for []" I could see it
there when reviewing more information about the student. Instead, that profile page is two clicks away.
I would add the year at a glance to the attendance history modal, too. Don't we want it in place BEFORE
we build a habit around what we're replacing?*

**Why it exists.** The ⋯ at the end of a name opens a panel that, **on the state every row is in at the
start of every period, contains nothing the screen does not already say.** `paintDetail()` gates the
note field on `entry && code !== UNCONFIRMED` and the un-confirm on `record && code !== UNCONFIRMED`, so
on an unconfirmed row the panel is the name (on the row), the date (the column heading), the term counts
(under the name), *Not confirmed* (the `?` in the cell), a hint, and the year counts. **One new number
and a sentence, twenty-six times, before the first student is marked.** WO-2.10 built it when the panel
was assumed to be carrying the note and the un-confirm on every row; the two gates that make it hollow
were added in the same work order and nobody read them back against the empty case.

**The year counts are already one click away and this work order adds nothing for them.** The owner
asked for the year at a glance in the history dialog and `attendance-report.js` has painted a **Whole
year** row under every term row since WO-2.6 — `totalsRow('Whole year', attendanceTotals(...))`, the
same P/T/A/E/D/Meetings/Attendance columns. Written down here so that a reader who finds no deliverable
for the owner's second sentence does not conclude it was dropped. **Verify it and leave it alone.**

**The seventh control, and why this is not overturning WO-3.7.** The reason the grade screen is two
clicks from the registry is a ruling, not an oversight: `attendance-report.js`'s own comment says the
door was put *"HERE, one step further in"* because the name was already spoken for and `historyDoor()`
*"records why it must not become a seventh control on a row whose width is budgeted in day columns."*
That argument is untouched. **This adds no control** — it re-points the existing sixth one, which
already sits inside the name cell and already costs no day column. WO-3.7 did not consider it because
in August the ⋯ was believed to be doing work. It is the option that ruling did not have.

**And the habit argument is the reason this is next rather than deferred.** The first instinct was
`⏳ DEFERRED` — do not rewire the critical-path screen thirteen days before teaching with it. The owner
reversed it and the reversal is right: after Sep 2 there is a term of muscle memory invested in a button
that is being removed, and the change gets more expensive every week rather than less. **Rewiring costs
least while there is no habit to unlearn.**

**Deliverables**

- **The ⋯ becomes a door to that student's grade detail, and it costs no new hook.**
  `data-student-detail` is already delegated in `src/shell.js` — the dialog's own door carries it — and
  `showStudentDetail(studentId, opener)` already handles an opener that is **not** inside a modal
  (`opener.closest('.modal-overlay')` answers null and nothing is closed). So the registry gains a
  second element carrying an existing hook and `src/shell.js` gains **no routing line at all**.
  - **It stops being a toggle.** `aria-pressed` comes off — there is no pressed state once there is no
    panel — and `aria-haspopup="dialog"` must **not** go on: this navigates to a screen, not a dialog,
    and the name beside it is the one that opens a dialog. The pair would then be lying in opposite
    directions.
  - **`⋯` goes.** It promises *more of this, here*, and this button now leaves the screen. The
    deliverable's proposal is **`›`**; the reading on the glass settles it (👤 below). Rejected without
    a reading: a **word** — `attendance.css`'s cap block has the arithmetic, the name cell is `nowrap`
    and its min-content is a floor the browser widens the *table* to honour, so a label here is paid
    for in day columns. Also rejected: **the student's grade as the button** — a percentage per student
    on the screen most likely to be projected is a disclosure to the room, and this work order is not
    the place to decide that.
  - **The class rename follows the meaning**: `.attendance-detail-btn` → `.attendance-student-door`,
    and the 44px floor under `@media (pointer: coarse)` moves with it unchanged. The coarse block's own
    comment names the ⋯ as *"the only tappable thing"* in `.attendance-student-cell` and *"takes its
    44px from `.attendance-detail-btn` below"* — both halves stay true of the new name and the sentence
    is rewritten to say it.
- **The note and the un-confirm move into the history dialog, and the writers do not move.**
  `setNote()` and `unconfirmStudent()` in `src/attendance.js` are unchanged, and so is their routing:
  `data-attendance-note` + `data-attendance-note-date` are answered by the `input` listener and
  `data-attendance-unconfirm` by the click listener, both delegated at the document. **Only where the
  elements are painted changes.** No second writer, no second hook, no third gate.
- **`src/attendance-report.js` gains its first writers, and its header says so at the point of
  departure.** That file promises *"Read-only, all of it: there is no writer in src/attendance.js that
  this file imports, and there is no path through here that changes a mark."* That sentence becomes
  false and must be **rewritten rather than left standing**: exactly two writers, named, imported from
  the module that owns the ledger, and no reader in this file recomputing what they wrote. `wo-sweep.mjs`
  makes no structural assertion about this file — checked — so the invariant is prose, which is why
  falsifying it silently is the likeliest damage here.
- **One block, high in the dialog, about the day that accepts writes.** It carries the same four cases
  `paintDetail()` carries and **no new capability**: the mark in words with its time; the note field
  when there is an entry and it is confirmed; the un-confirm when there is a record and it is confirmed;
  and the two existing hint sentences otherwise. Its date is `editDate()`, which is the only day the
  registry has ever let a note be typed on — a past note still wants its ✏️ first, exactly as today.
  When `editDate()` answers `''` the block is not drawn.
  - **It sits above *Term by term*, under the pass summary**, because
    `attendance-report.js` already argues this placement in its own words for the two things beside it:
    *"a teacher who opened this dialog to talk about one child should not have to scroll a term of dates
    to find either."* A note on today's mark is the third thing that sentence is about.
- **An un-confirm from inside the dialog repaints the dialog as well as the grid.** `afterAttendanceChange()`
  already redraws the registry behind it. What is new is that **four things in the open dialog go stale
  on that write** — the percentage in the head, the open term's row, the *Whole year* row, and the
  day-by-day table — and they are the ones a dispatch will forget, because the screen underneath
  visibly updates and looks like the whole answer. The note field must **not** trigger a repaint: the
  `setNote()` seam already documents why (re-rendering takes the caret out of the field being typed
  into) and that reasoning survives the move intact.
- **The registry side is a deletion, and the count comment is part of it.** Out go `detailFor`,
  `toggleDetail()`, `paintDetail()`, the `paintDetail(totals)` call in `renderRows()` and the shared
  totals threaded into it, the four resets of `detailFor`, `detailButton()`'s toggle half, the
  `data-attendance-detail` row in `src/shell.js`'s census, and every `.attendance-detail*` rule in
  `src/attendance.css` including its coarse-block entries. **The view-state header says "Seven values"
  and becomes six** — that comment already carries the scar for exactly this (*"it is a number in a
  comment, which is the kind that goes stale silently. Counted, not guessed"*), so leaving it at seven
  is the one failure this file has pre-written.
- **Two comments describe machinery that will no longer exist.** `selectableRows()`'s *"The detail
  panel's own `<tr>` carries no `data-attendance-row`, so it is never a stop"* stops being about
  anything, and the keyboard block's list of what no key does — *"pages the window or opens a row's
  detail"* — loses its last clause. Both are load-bearing documentation of a delegation seam and both
  go red on a reading rather than on a run.
- **`tools/verify-shell.mjs`**: the detail-panel checks move to the dialog rather than being deleted —
  the note round-trip, the un-confirm, and the conditional cases. Add one that the registry row's door
  reaches the grade screen in **one** activation. **Record the new check count and reconcile
  `tools/README.md`** — a stale `check()` count there is what turned the sweep red in WO-3.26.
- **`TESTING.md` lines and the `CHANGELOG.md` entry**, per the maintenance protocol, and **bump `CACHE`
  in `sw.js`**.

**Acceptance**
- [ ] On an unconfirmed row, **one activation of the row's door lands on the grade screen** for that
      student, with the breadcrumb naming them. No dialog opens on the way.
- [ ] The name beside it still opens the history dialog, and that dialog still carries **Grades for
      \<name\>** and the **Whole year** row. Nothing the owner asked for in her second sentence was
      built, because both were already there.
- [ ] **A note typed in the dialog lands on the same mark the panel wrote to**: type it, close the
      dialog, reopen it, and it is there; read it out of the document and it is on `editDate()`'s entry.
      The caret is **not** taken out of the field while typing.
- [ ] **Un-confirm from the dialog** puts that student back to `?`, and **all five surfaces agree in one
      paint** — the dialog's head percentage, its open-term row, its *Whole year* row, its day-by-day
      table, and the grid behind it.
- [ ] The four conditional cases are proved in the dialog, not reasoned about: a confirmed `A` gets the
      note field and the un-confirm; a confirmed present gets the un-confirm and the *present is stored
      as no mark at all* sentence; an unconfirmed student gets the *tap their question mark* sentence
      and neither control; a day with no meeting draws no block.
- [ ] With `editDate()` answering `''` — paged back off the edit date, or a past day still locked — the
      dialog draws **no** write block, and there is no path through it that changes a mark.
- [ ] `grep -rn "attendance-detail\|detailFor\|toggleDetail\|paintDetail" src/ tools/ index.html TESTING.md`
      returns nothing. The panel swept rather than shadowed.
- [ ] `src/attendance.js`'s view-state comment says **six**, and `grep -n "Seven values" src/attendance.js`
      returns nothing.
- [ ] `node tools/wo-sweep.mjs` green — the hook census loses `data-attendance-detail` on both sides in
      the same edit, so the one-way diff stays empty.
- [ ] `node tools/verify-shell.mjs` green with its check count recorded and `tools/README.md` reconciled
      to it.
- [ ] 👤 On the iPad, **force-quit from the app switcher first** (`CLAUDE.md`): the door clears 44px
      under a thumb, and **the glyph reads as "go to this student" rather than as "more here"** — this
      is the reading that settles `›`, and a different glyph coming off the glass is the answer, not a
      divergence.
- [ ] 👤 Mid-period rehearsal on the iPad: mark a student tardy, add a note through the dialog, and get
      back to the grid — **without losing your place in the list**. This is the trade the panel used to
      buy (it opened in the row, never over it) and it is the one thing this work order spends.

**Traps** — **the tempting wrong answer is a button that does two things**: keep the panel on marked
rows and go to grades on unconfirmed ones. It reads as thrift and it is a control whose destination
depends on state the teacher cannot see before she taps, on the screen with the least time to spare.
One button, one destination. **Do not put `aria-haspopup="dialog"` on the door** — the name next to it
has it correctly, and two adjacent controls making opposite promises is worse than either being wrong
alone. **Do not add a routing line to `src/shell.js`**: `data-student-detail` is already delegated and a
second branch answering the same attribute is the kind of duplicate this repo's census exists to catch.
**The dialog's read-only promise must be rewritten, not left standing** — no harness asserts it, so a
false header here survives every green run. **The four stale numbers in the open dialog are the forgotten
half of un-confirm**, because the grid behind it repaints and looks like the whole answer. **`setNote()`
must still not repaint.** **The view-state count is pre-scarred** — six, counted. **And check the
diffstat before committing** (WO-2.49): this touches `tools/verify-shell.mjs`, the file a CRLF rewrite
hides best.

**Out of scope.** Editing a note on a **past** mark without unlocking its column first — that is a
capability the registry has never had and adding it here would hide a new feature inside a relocation.
The student's grade, or any signal about it, drawn on the registry row: a number per student on the
screen most likely to be projected is a disclosure decision, and Phase 4 owns what "needs attention"
means. Any change to the grade screen itself — it is the destination and it is not touched. Any change
to `historyDoor()` or to what the name opens. Presentation mode, which has nothing to suppress on this
row: the avatar carries initials and a colour derived from the id, and the door carries a name that is
already on screen.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/attendance-report.js`
  - `src/attendance.css`
  - `src/attendance.js`
  - `src/shell.js`
  - `tools/README.md`
  - `tools/verify-shell.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**Read these before writing, and read them in this order.** This work order is mostly a *reading*
job: almost every trap in it is a comment or a header sentence that becomes false, and none of them
go red on a run.

1. **`src/attendance-report.js` in full, header comment first.** Its opening promise — *"Read-only,
   all of it: there is no writer in `src/attendance.js` that this file imports, and there is no path
   through here that changes a mark"* — is the sentence this work order makes false. Rewrite it to
   say what is now true: exactly two writers, named, imported from the module that owns the ledger,
   and no reader in this file recomputing what they wrote. Do not delete the sentence and do not
   leave it standing. Also read `historyDoor()`'s own comment about the seventh control before you
   touch the registry — the brief's **Why it exists** explains why re-pointing the sixth control is
   not overturning that ruling, and your edit must not read as if it were.
2. **`src/attendance.js` — `paintDetail()`, `detailButton()`, `toggleDetail()`, `renderRows()`,
   `selectableRows()`, the keyboard block, and the view-state header comment.** The four conditional
   cases you must reproduce in the dialog are all in `paintDetail()`; read them out of the code
   rather than out of this brief, because the brief's summary of them is a summary. The view-state
   header says **"Seven values"** and becomes **six** — count them, do not decrement blindly, and
   note the comment already carries the scar for exactly this failure.
3. **`src/attendance.css`** — every `.attendance-detail*` rule goes, including the coarse-block
   entries. The coarse block's comment names the ⋯ as *"the only tappable thing"* in
   `.attendance-student-cell` and says it *"takes its 44px from `.attendance-detail-btn` below"*.
   Both halves stay true under the new class name `.attendance-student-door`; rewrite the sentence to
   say so rather than leaving it naming a class that no longer exists.
4. **`src/shell.js`** — read the `data-student-detail` delegation and `showStudentDetail(studentId,
   opener)` and satisfy yourself that an opener outside a modal already works
   (`opener.closest('.modal-overlay')` answers null, nothing is closed). Then **add no routing
   line**. The only `src/shell.js` change is removing `data-attendance-detail` from the hook census.
   A second branch answering `data-student-detail` is precisely the duplicate the census exists to
   catch.
5. **`tools/wo-sweep.mjs` § the hook census**, so you understand why the census entry and the markup
   must lose the attribute in the same edit for the one-way diff to stay empty.
6. **`tools/verify-shell.mjs`** — move the detail-panel checks to the dialog rather than deleting
   them, and add the one-activation door check. `tools/README.md` records the `check()` count and
   **must be reconciled in the same edit**: a stale count there is the single sweep line that goes
   red on work being *done* rather than wrong, and it is what a dead dispatch left behind in WO-3.26.

**Two mechanical things that have cost this project real time.** Bump `CACHE` in `sw.js` — `./` is
entry one in `SHELL`, so an `index.html` edit counts. And **check the diffstat before you commit**
(WO-2.49): `tools/verify-shell.mjs` is the file a CRLF rewrite hides best, and a four-figure diff for
a two-figure edit is the tell.

**Two things not to do.** Do not widen this into the grade screen, `historyDoor()`, or note-editing
on past marks — the **Out of scope** paragraph names each by hand. And do not tick the two 👤 lines;
you have no iPad, and the glyph reading is the owner's to take.

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
  exceptions: **never tick a 👤 line** — it needs a real iPad and you do not have one — and leave the
  `CHANGELOG.md` entry to the teacher, who decides what a change means. Anything you do tick must be
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

## 5. Done means these 12 lines, reported against one by one

1. On an unconfirmed row, **one activation of the row's door lands on the grade screen** for that student, with the breadcrumb naming them. No dialog opens on the way.
2. The name beside it still opens the history dialog, and that dialog still carries **Grades for \<name\>** and the **Whole year** row. Nothing the owner asked for in her second sentence was built, because both were already there.
3. **A note typed in the dialog lands on the same mark the panel wrote to**: type it, close the dialog, reopen it, and it is there; read it out of the document and it is on `editDate()`'s entry. The caret is **not** taken out of the field while typing.
4. **Un-confirm from the dialog** puts that student back to `?`, and **all five surfaces agree in one paint** — the dialog's head percentage, its open-term row, its *Whole year* row, its day-by-day table, and the grid behind it.
5. The four conditional cases are proved in the dialog, not reasoned about: a confirmed `A` gets the note field and the un-confirm; a confirmed present gets the un-confirm and the *present is stored as no mark at all* sentence; an unconfirmed student gets the *tap their question mark* sentence and neither control; a day with no meeting draws no block.
6. With `editDate()` answering `''` — paged back off the edit date, or a past day still locked — the dialog draws **no** write block, and there is no path through it that changes a mark.
7. `grep -rn "attendance-detail\|detailFor\|toggleDetail\|paintDetail" src/ tools/ index.html TESTING.md` returns nothing. The panel swept rather than shadowed.
8. `src/attendance.js`'s view-state comment says **six**, and `grep -n "Seven values" src/attendance.js` returns nothing.
9. `node tools/wo-sweep.mjs` green — the hook census loses `data-attendance-detail` on both sides in the same edit, so the one-way diff stays empty.
10. `node tools/verify-shell.mjs` green with its check count recorded and `tools/README.md` reconciled to it.
11. 👤 On the iPad, **force-quit from the app switcher first** (`CLAUDE.md`): the door clears 44px under a thumb, and **the glyph reads as "go to this student" rather than as "more here"** — this is the reading that settles `›`, and a different glyph coming off the glass is the answer, not a divergence.
12. 👤 Mid-period rehearsal on the iPad: mark a student tardy, add a note through the dialog, and get back to the grid — **without losing your place in the list**. This is the trade the panel used to buy (it opened in the row, never over it) and it is the one thing this work order spends.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

