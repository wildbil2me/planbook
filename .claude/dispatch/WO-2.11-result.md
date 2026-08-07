# WO-2.11 — The pass banner, and cancelling a pass issued by mistake · implementation report

**Route** Claude (work-order-implementer), Opus tier
**Date** 2026-08-07
**Verification** `node tools/verify-shell.mjs` → **344 of 344, 0 failed, 0 skipped** (330 before
this work order). `node tools/wo-sweep.mjs` → **11 checks, 10 passed, 0 failed, 1 to review** — the
standing sensitive-field-name line, at the same **172 mentions across the same files** as before
this work order, so nothing here added one.

---

## Against the Acceptance list, one by one

### 1. Issuing a pass and cancelling it leaves `passes` **byte-identical**, and `openPasses` back to its prior length. Verified in the document, not the UI. — ✅ met

`verify-shell.mjs`: *"cancelling from the card leaves `passes` BYTE-IDENTICAL and takes the open
pass with it"*. The log is captured as `JSON.stringify(doc.passes)` immediately before the tap and
compared as a string afterwards — not as a count, because a count is exactly what a
cancel-as-zero-minute-return would keep honest. `openPasses` is asserted one shorter and not to
contain that student. Reported: *"the log is byte-identical at 2 entr(ies), 1 pass(es) still open"*.

**Mutation proof:** implementing cancel as `closePass(…, BY_RETURN)` — the Traps line's own defect —
turns **4 checks red**, this one reading *"the log is DIFFERENT at 3 entr(ies)"*.

### 2. A cancelled pass frees its slot against the per-class cap of three immediately. — ✅ met

`verify-shell.mjs`: *"a cancelled pass frees its slot against the cap of three immediately — the
next student goes out with no reload"*. Driven as a sequence with nothing between the steps: taken
to three (reason line up, every other row's buttons off), cancelled from the card, read (two out,
reason line down, every remaining row's buttons live), and then a **fourth student is issued a pass
that lands** — so the slot is real rather than merely redrawn.

### 3. Cancel and Return cannot be confused at speed on glass. 👤 — **NOT ticked. Owed to the owner on her own iPad.**

I cannot close this and did not tick it, in the work order or in `TESTING.md`. What I did do is
build the difference three ways and measure that the three are really there:

- the glyph — `✓ Return` against `✕ Cancel`;
- the word;
- **the shape** — Return is a filled green button, Cancel is a white outline in danger red. This is
  Roll Call!'s own pairing (`.pass-card-back` filled, `.pass-card-cancel` bordered), and a
  difference in *fill* is what survives being seen out of the corner of an eye.

A new check measures the computed fill, text colour and border of both buttons and requires all
three to differ, with the pointer parked first (tools/README.md trap 7). It is named in the harness
as *"the desk half of a 👤 line"* and it does not close the line: whether that survives a thumb
moving at the speed a class walks in is a judgement about glass, and I do not have the glass.
Mutation proof: giving Cancel Return's filled-green rule turns it red.

### 4. Cancelling creates no attendance record and changes no attendance mark. — ✅ met

`verify-shell.mjs`: *"and cancelling wrote no attendance either: no record, no mark moved, nobody
made absent by a mis-tap"*. Asserted the way WO-2.8's line 6 is — against a **loud fixture**: a
class of 26 that is genuinely taken, with the record count and the whole-document mark tally read
before and after (`11 attendance record(s)`, `{"T":2,"U":27}`, unchanged), plus the cancelled
student's own row still reading `P`. Structurally, `cancelPass()` in `src/attendance.js` calls
`paintPasses()` and nothing else, and `src/shell.js`'s hook deliberately does not chain
`afterAttendanceChange()` — the same omission the two WO-2.8 hooks make, for the same reason.

### 5. A pass returned normally still writes exactly one entry. Cancel does not weaken Return. — ✅ met

`verify-shell.mjs`: two checks. *"a note typed on the card survives the Return…"* asserts the log
grows by **exactly one** (`refilled.passLog.length + 1`) after a Return driven from the **row**, and
*"and a pass with no note carries no `note` key at all"* asserts the same for a second Return driven
from the **card**. Both counts are taken against a log this section has held byte-identical through
four cancels, so "cancel did not weaken Return" is measured rather than assumed.

### 6. A note typed on the card survives the Return and is on the entry in `passes`. A pass with no note carries no `note` key at all. — ✅ met

Three checks. The note is typed into the card's own field with a real `input` event, read back off
the **open** pass (`keys = classId,id,note,out,studentId,type`), and then found on the log entry
after the Return (`keys = back,classId,endedBy,id,minutes,note,out,studentId,type`). The
no-note case asserts `note === undefined` **and** the exact key set, so a stored `""` fails. The
shape rule is written once, in `notePass()`: set when the trimmed string has something in it,
`delete` otherwise — `src/attendance.js`'s `setNote()` rule, not a variant of it. Whitespace alone
is asserted to leave no key.

**Mutation proofs:** `closePass()` dropping the note → 2 red. `notePass()` storing `""` → 1 red.

### 7. A note on a **cancelled** pass goes wherever the pass goes — nowhere. — ✅ met

`verify-shell.mjs`: *"a note on a cancelled pass goes where the pass goes — nowhere in the document
at all"*. The phrase is searched for in the **whole serialised year document**, not in the two pass
arrays a check might think to look in, and asserted present before the cancel and absent after —
so the check cannot pass vacuously on a note that was never written.

### 8. The banner shows one card per open pass in the class on screen, disappears entirely when that class has none — including when another class still does. Card ↔ cell both ways. — ✅ met

Five checks cover the clauses, which fail separately:

- *"the banner draws one card per open pass in this class"* — two cards for two open passes, each
  carrying the name the row carries, a type chip (`🚽 Bathroom`, `⚡ Quick`), `out 12:12 PM`, a
  Return carrying the **same hook the row's Return carries**, a Cancel, and an empty note field.
- *"the banner is scoped to the class on screen"* — opened next door with two passes still open
  here: banner hidden, zero cards, `aria-label` cleared, while the document still says two.
- *"and it is drawn again on the class the passes belong to"*.
- *"cancelling from the card…"* asserts the **row's** cell goes back to three issue buttons
  (card → cell), and the two Return checks assert the **card** disappears when the row's Return is
  tapped (cell → card). This is structural rather than incidental: both surfaces are painted by
  `paintPasses()`, so neither has its own repaint to forget.
- *"the banner disappears entirely when the class on screen has nobody out"*.

**Mutation proof:** drawing the banner from `openPassesIn()` instead of `openPassesFor()` turns the
scoping check red and nothing else — which is the point of it existing.

### 9. The banner costs the registry no day columns — above the grid, not beside it. — ✅ met

`verify-shell.mjs`: *"and it costs the registry no day columns — it is above the grid, not inside it
and not beside it"*. Measured three ways: the day-column count with two cards up is compared against
the count read at the start of the section when no pass existed at all (6 = 6); `wrap.contains(box)`
must be false and `banner.bottom <= gridWrap.top` must be true; and the grid's own overflow valve
and the page width must both be at zero. The markup places the `<div>` above the toolbar, in the
panel body, and the CSS makes it a wrapping flex row.

**Mutation proof:** moving the banner inside `#attendanceGridWrap` turns it red on both halves.

---

## What I could not verify

- **Acceptance line 3 (👤).** Named above. Not ticked anywhere.
- **The four 👤 lines I added to `TESTING.md` § WO-2.11** — all left unticked: the confusability
  call, the card's controls under a real thumb with two cards side by side on the owner's 834pt 11″,
  typing a note while a class walks in (does the software keyboard cover the card?), and what
  VoiceOver actually reads. The harness measures ≥44px and reads `aria-label` text; it has no thumb
  and no screen reader.
- **The card on a real iPad at all.** Every visual claim I make is a computed style or a bounding
  rect read in headless Edge. I have not seen this rendered.
- **Whether the amber palette is right.** I chose the caution wash the Passes column's `out` pill
  and the cap note already use, because "a student is out of the room" is the unfinished-and-waiting
  state this app paints amber everywhere else. Roll Call!'s banner is a dark strip and there is no
  dark surface in this suite for it to belong to, so what carried over is the shape, not the colour.
  That is a taste call on the owner's screen.

## What I left undone, and why

- **No presentation-mode handling on the card.** Out of scope by the recorded owner decision. I did
  not add it and I did not touch the paragraph explaining why it is absent.
- **No elapsed clock, no overdue alerts, no history view.** WO-2.9's, and left there.
- **No `CHANGELOG.md` entry.** A draft is at the foot of this report; the teacher decides what a
  change means.
- **No migration.** None is needed: `note` absent is a legal value on both collections, and the
  `2 → 3` rung already seeds both arrays. I did not write one, and `src/store.js` is untouched.
- **No third harness.** Everything new is in `verify-shell.mjs`. Nothing came up that neither tool
  could check.

## Files changed

```
src/passes.js                             the model: cancelPass(), notePass(), note through
                                          closePass() and back through reopenPass()
src/attendance.js                         cancelPass()/setPassNote() writers, passCard(),
                                          paintPassBanner(), and the header that argues them
src/attendance.css                        the card, its palette, and its (pointer: coarse) block
index.html                                #attendancePassBanner, above the grid
src/shell.js                              [data-pass-cancel] and [data-pass-note] hooks + catalogue
sw.js                                     CACHE v22 → v23
docs/data-model.md                        `note` on both collections; the cancel rule, stated as
                                          NOT a second exception to append-only
tools/verify-shell.mjs                    reader fields + 14 checks (330 → 344)
tools/README.md                           the check-count line
TESTING.md                                § WO-2.11: 9 desk lines ticked, 4 👤 lines left open,
                                          the seven mutation proofs
plans/work-orders/phase-2-attendance.md   status ✅ DONE, 8 of 9 acceptance boxes (not line 3)
plans/work-orders/README.md               phase count 3 → 4, total 16 → 17 (via wo-gate --tick)
plans/ROADMAP.md                          the Phase 2 pass-banner line, ticked with its note
```

## Decisions the work order did not settle

1. **Where exactly "above the grid" is.** I put the banner between the cap note and the toolbar,
   not between the pager and the grid. Reasoning: the state line, the action row and the cap note
   are all *what is true right now*; the toolbar, pager and grid are the *working surface*. The two
   pass surfaces now sit together. Acceptance line 9 is satisfied either way; this is the reading
   order choice inside it.

2. **`reopenPass()` now carries the note back.** Not asked for. A pass with a note that is closed by
   a `D` and then un-dismissed would otherwise come back with the note deleted — the app silently
   destroying something the teacher typed, inside a retraction whose whole job is to put things back
   as they were. One line, guarded by the same absent-stays-absent rule. Say so if it should not be
   there.

3. **`notePass()` is a model function rather than a direct write.** It could have been three lines
   inside `src/attendance.js`. It is in `src/passes.js` because the shape rule (`delete` on empty)
   is a fact about the record, and this repo keeps facts about the record in the model — which is
   also what let the mutation proof for it be a one-line change in one file.

4. **The chip keeps its word under `(pointer: coarse)`**, unlike the row's three issue buttons,
   which lose theirs to buy the 160px column its 44px targets. The card is a line across the panel
   and has the room; a bare `🏥` beside a child's name would also be the one thing on the card
   nobody could say out loud.

## Notes I was told not to act on

- **`docs/data-model.md` says "Seven shape decisions that matter:" over what are now twelve
  bullets.** The drift is pre-existing (eleven before me); my new bullet makes it twelve. I did not
  fix the number — it is a word this work order was not sent to change — but it is worth one edit by
  whoever next touches that file.
- **WO-2.9's deliverable list still says "The elapsed clock on WO-2.11's card"**, which is right, and
  its history view is specified to render the note, which now exists and is stored. No edit needed;
  noting it so the next session does not re-derive the field.
- **The temptation I declined:** a `Cancel all` on the banner, and an undo for a cancel. Both are one
  more control on the surface this work order exists to keep sparse, and neither is in scope. The
  second is also a trap — an undo for cancel would have to re-create an open pass with its original
  `out`, which is inventing a time about a trip that did not happen.
- **`plans/work-orders/README.md`'s dashboard rows carry no per-row status marker**, so the
  WO-2.11 row (15) reads the same as before; the counts table above it is what `wo-gate --tick`
  moved. That is how WO-2.8 and WO-2.10 were left too.

## Draft CHANGELOG entry — the teacher writes the real one

> **Cancel a pass you issued by mistake.** A band above the registry now shows who is out of the
> room you are standing in: their name, which pass, when they left, and two buttons — Return, which
> writes the trip, and Cancel, which writes nothing at all. A thumb that lands on 🚽 aiming at the
> row below no longer costs a student a phantom bathroom trip in a log that cannot be edited. There
> is a note field on the card too, typed while they are out and kept with the trip when they come
> back. Cancel can only ever take back a pass that is still open; a trip that happened stays in the
> record, which is what makes the record worth reading.
