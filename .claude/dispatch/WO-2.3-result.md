# WO-2.3 — Days off & pre-drops · implementation result

**Implementer** Claude (work-order-implementer, Opus)
**Date** 2026-08-07
**Branch** `phase/2-attendance` — **nothing committed or pushed**, the brief did not ask for it.

**Verification, both commands, on the shipped tree:**

```
node tools/verify-shell.mjs   →  379 checks · 379 passed · 0 failed · 0 skipped   (was 366)
node tools/wo-sweep.mjs       →  11 checks · 10 passed · 0 failed · 1 to review
```

The one `wo-sweep` review is the standing sensitive-field-name line, at **the same 172 mentions
across the same files** as before this work order — unchanged, not a new hit.

Thirteen new `verify-shell` checks: twelve at the end of the attendance section, one in the coarse
sweep. **Six mutation proofs, all reverted**, tabulated in `TESTING.md` § WO-2.3 and summarised in
`tools/README.md`.

---

## Against the Acceptance list, one by one

### 1. A `no-school` range across a week shows every class as not-meeting on every date in it — ✅ verified

**How.** The harness opens the days-off panel from the home screen's own door, fills the real form
(kind, title, from, to) and submits it. It then asks `stateOf()` for **all six active classes across
all five weekdays** in the range and requires `covered` in all thirty answers, and reads the
authored row back out of the document: one entry, `kind: "no-school"`, `date`/`endDate` spanning the
range, `classIds` empty, and the exact eight-field key set from `docs/data-model.md`
(`classIds,date,endDate,id,kind,notes,studentId,title`). **One event, not thirty** — asserted as
`events.length === 1`.

**The fixture is deliberately five weekdays of a six-weekday window**, not all six. A check whose
range covered everything on screen would go green against a build whose covering test ignored dates
entirely, so the sixth weekday is outside the range and is asserted to be untouched. Proved
non-vacuous: mutating `coversDate()` to `return true` turns this check red and nothing else.

A second check reads the same week **on the grid** — the column heads say "No school", every column
carries `attendance-col-covered`, every cell in every row is a dash and not a letter or a question
mark, and each covered head carries the 📅 rather than the 🚫.

### 2. Deleting that event restores those days to "not taken yet", no records touched — ✅ verified

**How.** The event is removed through the real **Remove** button on the panel — reached this time
through the *other* door, the 📅 in a covered column head, so both entry points are driven. Then:
`events.length === 0`, `stateOf()` answers `not-taken` for all six classes on all five dates, the
dropped day outside the range still answers `dropped`, and `doc.attendance` serialised is
**byte-identical** to what it was before the event was ever authored.

### 3. A future `dropped` event naming two classes affects only those two — ✅ verified

**How.** Authored on **today + 9 days** through the form, with two classes tapped on in the picker.
`stateOf()` on that date across all six classes returns exactly two `covered` — and they are the two
named, compared by id, not by count — and four `not-taken`. The stored entry has
`kind: "dropped"`, `endDate === date`, and `classIds` equal to the two ids in order.

**This one is asked of the predicate rather than of the screen, and that is a real limitation of the
evidence, not a shortcut.** The registry has no column after today by construction (WO-2.1's rule,
which this work order must not weaken), so a future date has no rendering to read. The *rendering*
of a `dropped`-kind covered column is therefore not covered by a check at a future date — but it is
covered at a past one by acceptance line 1's grid check, which drives the same code path with the
same state.

A second check asserts the form **refuses** a planned drop that names no class, rather than writing
it as a school-wide one — empty `classIds` genuinely *is* school-wide in the data model, which is
exactly why the form will not write one under that kind.

### 4. A retroactive snow day over recorded attendance warns and does not void the record — ✅ verified

**How, in three checks.**

- Authoring a `no-school` on **today**, where the run has already marked several periods, opens the
  confirm dialog. Asserted: the dialog is up, it names **exactly as many periods as the document
  holds taught records for today**, its lead says the attendance *stays*, and `doc.events` still
  holds no new entry — **nothing is written while the warning is on screen.**
- **Cancel** writes nothing at all: no event, no record, `doc.attendance` byte-identical.
- **Confirm** adds the event, and then: every class that was taught today still answers `taken`
  (compared by id set, not by count), every class that dropped today from its own record still
  answers `dropped`, only the classes with nothing recorded answer `covered`, and `doc.attendance`
  is still byte-identical — so **every mark is still there afterward**, which is the line's own
  wording.

The protection is structural rather than careful: `stateOf()` answers the record before it consults
the calendar. Proved by mutation — inverting that order turns this check red with four taught
periods reading `covered`.

**Worth recording**: this check was first written over two groups (taught / not) and went **red
against a correct build**, because a class that had dropped today from its own record stays
`dropped` and does not become `covered`. The check was wrong, not the app; it is arithmetic over
three groups now, and that is the precedence rule in full.

### 5. No attendance record is ever created by authoring an event — ✅ verified

**How.** `doc.attendance` is serialised **byte for byte** and compared against a baseline taken
before the first event, and that comparison is a clause in **every one of the twelve checks** in the
block — after the range is authored, after it is deleted, after the pre-drop, after the refusal,
while the warning is up, after cancelling, after confirming, and after everything is removed. A
count would pass a build that rewrote a record in place; a field-by-field read would pass one that
added a field this file forgot to look for.

**Proved non-vacuous by the Traps mutation itself.** Making `commit()` also copy the event onto
attendance records — the exact implementation the work order forbids — turns **ten of the twelve
checks red**. Nothing *visible* changes under that mutation: the columns still go grey, the cards
still say "No school". The only thing that gives it away is the array being compared to itself.
That is the largest single mutation result in this harness so far.

---

## What I could **not** verify

Three things, all in `TESTING.md` § WO-2.3 as 👤 lines, **none of them an acceptance line**:

- **The fourth column palette read across a room.** A covered column and a dropped column are two
  quiet greys. The harness measures that they are *different* (different word, different fill,
  solid against dashed, and it goes red if they are collapsed) — it cannot judge whether the
  difference is enough at classroom distance. That needs eyes.
- **The two date fields under a thumb, and the iPadOS date-picker trap.** `src/classes.js` paid for
  this at WO-1.6: the date popover keeps its own selection separate from the input's value, so a
  field cleared in code cannot be re-picked. I built around it — the form clears the *title* after
  an add and deliberately leaves the dates — but *that the workaround works* needs the hardware.
  The 44px measurement is done (13 controls, all ≥44, on an emulated coarse pointer); the
  interaction is not.
- **Adding a real break from the real school calendar** and finding the week reads right in
  November. That is the owner's judgement, not a measurement.

I have not ticked any of those three.

---

## Files changed

**New**

- `c:\dev\planbook\src\calendar.js` — the events model. No DOM, no clock, never calls the store —
  the same posture as `src/passes.js`, and for the same reason. Owns the two kinds, the covering
  rule, and the eight-field shape.
- `c:\dev\planbook\src\days-off.js` — the authoring surface, and **the only writer of `doc.events`
  in the app**. Never touches `doc.attendance` and never imports an attendance writer.

**Modified**

- `c:\dev\planbook\src\attendance.js` — `stateOf()` reads the calendar (the one place), a fourth
  state `COVERED`, `coverOf()`/`meetingsBetween()` exported, a second writer gate `coveredDay()`,
  the column head / cells / action row / detail panel, and the header block rewritten from three
  states to four.
- `c:\dev\planbook\src\attendance.css` — the fourth palette for the state line, the cell and the
  column, plus its coarse-pointer rules.
- `c:\dev\planbook\src\home.css` — `.class-card-state.covered`.
- `c:\dev\planbook\src\home.js` — the load-bearing "stateOf() still has exactly three answers"
  comment corrected (the brief named this one; it was true until this work order made it false).
- `c:\dev\planbook\src\shell.js` — imports, the seven `data-dayoff-*` hooks, the form submit,
  `afterCalendarChange()`, `calendar` on the read seam, and the hook table at the head of the file.
- `c:\dev\planbook\src\shell.css` — the days-off panel's four new components + coarse rules.
- `c:\dev\planbook\index.html` — `#daysOffModal`, `#daysOffConfirmModal`, and the **Days off** door
  on the home panel header.
- `c:\dev\planbook\sw.js` — both new modules in `SHELL`, `CACHE` bumped v28 → v29.
- `c:\dev\planbook\tools\verify-shell.mjs` — 13 checks, `events` and `attJson` on the page-side
  reader, the two new modals added to `closeAll()`.
- `c:\dev\planbook\tools\README.md` — the check-count line, 366 → 379, with what the thirteen are.
- `c:\dev\planbook\TESTING.md` — § WO-2.3: ten desk lines ticked, the mutation table, the design
  consequence, and three 👤 lines.
- `c:\dev\planbook\plans\work-orders\phase-2-attendance.md` — status ⬜ → 🔨, build note, all five
  acceptance boxes ticked.
- `c:\dev\planbook\plans\ROADMAP.md` — Phase 2 "Days off and pre-drops, set ahead" ticked with its
  divergence paren.
- `c:\dev\planbook\docs\data-model.md` — two settled details under § Events (see below).

**Not touched:** `CHANGELOG.md` (the teacher's), and `plans/work-orders/README.md`'s dashboard —
its Phase 2 count is `11 / 5 done` and stays correct, because WO-2.3 is 🔨 rather than ✅ while the
👤 sitting is owed.

---

## Decisions the work order did not settle, and which way I went

**1. Two modules rather than one.** The work order says "stored as `events[]` entries"; it does not
say where the code lives. I split it the way `src/passes.js` and `src/attendance.js` already are —
model with no DOM, screen with no second opinion — because that split is what lets the registry ask
"what covers this date" without being able to write one.

**2. The fourth state's name, word and palette.** The brief says explicitly that this slot is
reserved and empty and that choosing is mine.
- **Value** `covered` (it is a CSS class, worn by the column, the cells and the card). Not `off`,
  which reads as a toggle; not `no-school`, which names one of the two kinds as if it were both.
- **Word on screen** is the *event's*, not the state's: **"No school"** for a `no-school` and
  **"Planned drop"** for a `dropped`. Two words rather than one because the two have different
  undos, and the undo is what a teacher reads that chip to find. The teacher's own title is the
  *reason* and sits beside the word wherever there is room (the state line, the card, the accessible
  name); the 72px column head gets the word and carries the title on its tooltip.
- **Palette**: the dropped column's quiet grey made **solid** instead of dashed, one shade deeper
  (`#f5f7fa` / `#d0d8e4` / `#6b7a8d`, and `#e8edf4` under a coarse pointer). **No new hue** — a
  holiday is not an alarm, and the amber next to it already means "you have not done this yet".
  What differs between the two states is not the mood but where the undo lives, so the difference is
  carried by the *word* first and the fill second.

**3. Roll Call! has no author-ahead surface, and I am saying so plainly** as the brief asked. Its
`markNoSchoolToday()` (`dashboard.html:3831`) is a same-day 🚫 that writes an exception into today's
sheet column, with a `confirm()` and an undo on the banner — no date picker, no range, no future
dates, no per-class scope. So there was no counterpart to lift for the panel. **What I did lift is
the column treatment**, which does exist: `.day-th.no-school` is a filled, greyed, italic head
(`dashboard.html:573-574`) against nothing dashed anywhere. Planbook already spends *dashed grey* on
the same-day drop, so **the point of departure is the italic**: Roll Call! italicises its no-school
head, and here that already belongs to the drop. The comment in `src/attendance.css` names the
departure and the local rule that beats it, as `CLAUDE.md` requires. Everything else in the panel is
a component this app already owns — `.pill`, `.class-input`, `.term-date`, `.toggle-btn`,
`.roster-list`, `.class-action-btn` — rather than a fifth grammar.

**4. Where the panel's door lives.** On the **home screen's panel header**, not in either header
strip. Both strips are at their measured limit at 390px (`index.html` says so twice and
`verify-shell` measures it every run), and the bottom row's three controls are all about the class
that is *open*, which a day off is not. The second door is the 📅 in a covered column head — two
doors, one route, the grammar `data-class-manage` already has three of.

**5. A covered column's head button is a door, not an undo.** Removing a holiday affects every class
on every date of its range. That is not a decision to take from inside one class's column head with
a 12px glyph, so the 📅 opens the panel where the range and the scope are on screen beside the
Remove.

**6. The warning is a confirm dialog, and only when there is something to protect.** "Warn, and leave
the record alone" — leaving alone is structural (`stateOf()` answers the record first), so the
warning can afford to be a warning rather than a refusal. A refusal would be worse: the Monday and
Wednesday of a snow week are still legitimately closed. The dialog borrows `classDeleteModal`'s
shape in the **positive** wash, because that one counts what a tap destroys and this one counts what
it cannot. It is not raised when the range holds no recorded meetings — a dialog that appears every
time is a dialog that gets tapped through.

**7. A covered day is read-only.** Its cells are inert and it offers no "Everyone's here", matching
a dropped day. **The cost, stated rather than hidden: a class that genuinely met on a school-wide
day off cannot be recorded from the registry** — the escape hatch is the calendar (narrow the range,
or use a drop that names classes). Chosen over leaving the cells live, which would let one mis-tap
invent a meeting on Thanksgiving. Recorded in the work order, `TESTING.md` and the roadmap paren.
See the proposed follow-up below.

**8. `endDate` is always written, equal to `date` on a one-day event**, and `title` may be empty.
Both are now in `docs/data-model.md` § Events. The first makes the covering test one comparison for
every event rather than one that has to decide what an absent field meant; the second is because a
required title with a default would print "No school · No school" for everyone who skipped it.

**9. Two events covering one date.** `no-school` wins over `dropped` whichever order they sit in
(pre-dropping Thursday and *then* closing the school for snow is an ordinary sequence, and "No
school" is the truer sentence). Between two of the same kind the first in document order wins — the
rule `recordFor()` already applies to a duplicate record. Argued at `coveringEvent()`.

**10. The form does not clear its date fields after a successful add.** This looks like an
omission and is the opposite: it is `src/classes.js`'s iPadOS date-picker scar, applied ahead of
being bitten by it. Named in the module header and at the line.

---

## Things I did **not** do, and why

- **The month view over this data** and **the other five event kinds** are out of scope (WO-6.3,
  WO-6.1) and are untouched. `src/calendar.js` is deliberately incurious about the other kinds:
  they sit in the same array, `coveringEvent()` ignores them, and nothing here filters them out of
  the document or offers a Remove beside one.
- **No `CHANGELOG.md` entry.** A draft, if it is useful: *"Days off and pre-drops, set ahead. Type
  a holiday, a break or a planned drop in once and every class follows it — and nothing is written
  into your attendance, so removing one puts those days straight back to 'not taken yet'. A day you
  have already taken attendance on keeps it: Planbook says so before it adds anything, and the
  marks stay exactly where they are."*
- **No third harness.** Everything is in `verify-shell.mjs`.
- **No commit, no push.**

## Proposed follow-up work orders — noted, not done

1. **"This class met after all" on a covered day.** Decision 7's cost. The honest shape is probably
   a per-class opt-out on the event (`exceptFor: []`) or a one-tap "record this class anyway" that
   writes an ordinary attendance record, which precedence already lets win. Both are new UI and new
   schema, and neither is in this work order's Deliverables. Worth booking before the term rather
   than after.
2. **The days-off panel wants the school year's bounds.** Nothing stops a teacher typing a date in
   2019. `classes[].terms[]` already carries dates, and a soft warning ("that is outside every term
   you have") would be cheap. Deliberately not added — it edges toward the calendar validation
   `plans/rotating-schedule.md` warns about, and it wants the teacher's opinion first.
3. **The backup UI does not yet mention events by name.** It says the file holds everything, which
   is true; when WO-6.1 adds conferences and meetings to `events`, that sentence is worth
   re-reading.

## One temptation declined, recorded here because it belongs in the dispatch folder rather than a transcript

The obvious "improvement" while I was in `stateOf()` was to have the covered branch also carry a
count, so WO-2.4's denominator could skip covered days without asking twice. It would have been four
lines and it would have quietly put the *first half of WO-2.4's arithmetic* inside this work order,
where nothing verifies it. `stateOf()` returns a word; WO-2.4 counts meetings. Left alone.
