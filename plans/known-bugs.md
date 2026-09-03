# Known bugs

**Started 2026-09-03**, the second day of the live term. This is where a thing that is *wrong*
goes — a screen that misbehaves, a control that does not do what it says — as against
[`future-features.md`](future-features.md), which is where a thing that is *missing* goes. The two
files are deliberately separate: a wanted feature is an argument about design, and a bug is a
report about behaviour, and mixing them means the bug list is read at the speed of the design
discussion.

**Nothing here is booked, and nothing here is a work order.** `tools/wo-gate.mjs` cannot see this
file and `next` will never name a row in it. A row leaves by being cut into a work order under
[`work-orders/`](work-orders/README.md) — and when it does, **strike it here with the ID it
became**, so the reproduction stays reachable from the row that fixes it.

**Write the reproduction, not the diagnosis.** The owner's own words are the primary record and go
down verbatim, because a report re-phrased into a theory is a report that can only be re-tested
against the theory. A suspect goes underneath, marked as a suspect, with the file and line — and
when the suspect is wrong, that is worth as much as when it is right, so **strike it rather than
deleting it.**

Items are added in the order they come up. There is no ranking and no promise of one; position
means nothing. A row that is genuinely urgent says so in its own body.

---

## 1. A digit typed into an assignment's date field takes the focus with it

**Booked 2026-09-03 as** [WO-1.47](work-orders/phase-1-shell-store-roster.md#wo-147--a-zero-typed-into-a-date-field-clears-the-date-and-takes-the-field-with-it)
**and** [WO-1.48](work-orders/phase-1-shell-store-roster.md#wo-148--a-date-field-cannot-tell-mid-typing-from-cleared-and-the-app-infers-it-anyway)
— *the guard and the fix, split so the data loss stops inside a teaching week and the new control
waits for one that is not. This row stays here unstruck in body because both work orders point back
at it for the measurement rather than repeating it; it is closed when WO-1.48 ticks.*

*Reported 2026-09-03 by the owner, narrowed by the owner the same day to* **the zero key
specifically**, *and* **reproduced and confirmed that narrowing** *(see the measurement below). It
writes as well as breaks focus — read the second half before scheduling it behind anything.*

**The report, verbatim:** *"On the assignment screen, mm/dd/yyyy dialogue when you tab into the
dialogue, pressing any number on the keypad or top row causes the dialogue to lose focus."* And
then: *"it happens specifically when you hit the zero keys."*

**What that names.** The assignment editor's **Assigned** and **Due** fields — real
`<input type="date">`, built by `dateField()` at [assignments.js:695](../src/assignments.js#L695).

**The mechanism, measured 2026-09-03 in headed Edge 152.** `0` is not a valid month or a valid
day on its own. Digits 1-9 commit the instant they are pressed — `1` makes the month `01` and the
date stays complete — but `0` cannot, so Chromium **blanks the segment and waits for a second
digit**, and for that one keystroke the whole control reports `value === ''`. It fires `input` AND
`change` on the way through. Typing `0` into a field holding `2026-09-03`:

```
input  =""            <- the segment is pending; the date is momentarily incomplete
change =""            <- and `change` fires on it too
input  ="2026-01-03"  <- Chromium then commits the month
change ="2026-01-03"
```

Typing `1` or `5` into the same field produces no empty read at all and never leaves a complete
value. So the trigger is the digit, exactly as reported.

**What the app does with that empty `change`.** `assignmentDateCommitted()` at
[assignments.js:947](../src/assignments.js#L947), wired to `change` at
[shell.js:3106](../src/shell.js#L3106), tests `if (input.value) return;` — which an empty read
walks straight past — and then runs, unconditionally:

```js
if (wrap) wrap.replaceWith(dateField(assignment, field));
```

That is the app throwing away the element under the caret. Driving the app's exact wiring on a
bare page: one `0`, one rebuild, `document.activeElement` on `BODY`. That is the reported
symptom, and the guard the function was built on is not the fence it was taken for. Its own
comment states the assumption it got wrong:

> ON `change`, NEVER ON `input`: a desktop date field reports `''` several times while a date is
> being typed, and rebuilding on those would replace the element under the caret.

The move to `change` was right about the failure and wrong about the fence. **Chromium fires
`change` on those intermediate empty reads too.**

**It is not only focus — the date is wiped.** The `input` listener has already stored `''` by the
time `change` runs, so the field `dateField()` rebuilds is built from a cleared value and comes
back blank. The teacher types a due date, the first keystroke silently empties the field she is
typing into, and every digit after it goes nowhere. Typing `09032026` end to end leaves the
assignment with **no due date at all** and no error anywhere.

**Which segments it fires in, measured rather than reasoned** *(corrected 2026-09-03 by the owner —
this paragraph first said "every month from September to December leads with `0`", which is exactly
backwards: **January through September** lead with `0`, and October, November and December lead with
`1`)*:

| Typed | What happens |
|---|---|
| Month `10` — `1` then `0` | `1` commits as `01`, `0` takes it straight to `10`. **No empty read, safe.** |
| Day `03` — `0` then `3` | `change` fires with `''` on the `0`. **Rebuild, focus gone, date wiped.** |
| Day `15` | Safe. |
| Year `2027` | `0002` → `0020` → `0202` → `2027`, every one of them a complete date. **The year segment is immune** — a leading zero there still yields a valid year. |

So the trigger is precise: **`0` as the first digit of the month or the day segment**, and nowhere
else.

**Which is why this is a live-term problem rather than a tidy one.** That is **all of September** on
the month segment, and **the 1st through the 9th of every month, permanently**, on the day. A due
date entered this week starts with the one key that triggers it, and roughly three dates in ten will
go on doing so after September ends.

**It is five fields, not one.** The rebuild-on-empty-commit pattern was copied to every date field
in the app, each pointing at the others rather than repeating the reasoning. All five carry the
same `if (!input.value)` shape, so all five are suspect on the same keystroke; only the assignment
editor has been *reported*, because it is the one a teacher types into weekly.

| Field | Rebuild |
|---|---|
| Assignment *Assigned* / *Due* | [assignments.js:973](../src/assignments.js#L973) |
| Term start / end | [classes.js:1587](../src/classes.js#L1587) |
| A student's IEP/504 review date | [roster.js:1139](../src/roster.js#L1139) |
| Days off *from* / *to* | [days-off.js:278](../src/days-off.js#L278) |
| An event's *from* / *to* / *until* | [events.js:273](../src/events.js#L273) |

**Ruled out.** Neither keyboard handler in the app can see a digit here. `src/shell.js`'s `keydown`
listener returns on `anyModalOpen()` before anything else and the editor is a modal;
`src/modal.js`'s focus trap reads only `Tab` and `Escape`. The per-keystroke repaint is not it
either — `editAssignmentField()` redraws the list *behind* the dialog and deliberately never
touches the field.

**The fix shape, decided 2026-09-03 by the owner: an explicit Clear control, and no rebuild on
`change` at all** — booked as WO-1.48, behind WO-1.47's guard.

**The root cause is an ambiguity, not a missing guard.** A native date input reports `''` for two
completely different states — *mid-typing, not yet a complete date* and *deliberately emptied* —
and hands the page nothing to tell them apart. Every repair that keeps inferring "she cleared it"
from an empty `change` is arguing with that ambiguity rather than removing it, so `0` is one
instance of the defect and not the whole of it. **Two such repairs were written down here first, and
neither is the answer** — but they are not equally wrong, and the difference is what the split into
two work orders is built on:

- **Move the rebuild to `focusout`.** It cannot eat the caret by construction, and it still resets
  the picker for a teacher who clears a date and *leaves* the field. What it stops covering is
  *tapping the same day again after clearing*, which happens **without leaving the field** — so a
  blur-time reset arrives after the tap that needed it. **Struck as the answer and adopted as the
  guard**: this is WO-1.47, which trades a data-loss defect on the laptop for a stale-highlight
  defect on the iPad, knowingly and in writing.
- ~~Skip the rebuild while `document.activeElement` is the input.~~ **Struck outright.** It is a
  narrower ask of the same wrong question, and on the iPad the field *is* focused while the popover
  is open — so it would kill the rebuild in precisely the case the rebuild exists for, while
  claiming to preserve it.

**So clearing becomes a thing the teacher does on purpose, to a control that says so.** A *Clear*
beside each date field, the rebuild hung off that button — where focus is on the button and there
is no caret to take — and `assignmentDateCommitted()` stops reading emptiness off `change`
entirely. It is the more common answer to this in the wild, it is strictly better than a blur-time
reset on the iPad rather than merely equal (the reset lands at the moment of clearing, so the next
tap on the same day is on a fresh element), and it removes the ambiguity instead of routing around
it.

**It is also a real gain on the hardware, which is the half that pays for the pixels.** The native
popover on iPadOS gives a teacher no obvious way to empty a date at all — clearing means finding
the segments and backspacing them. So the control is not only the fix's plumbing; it is the first
time this app has offered the gesture.

**There is nothing to lift, and that is worth stating rather than discovered.** Roll Call! has the
same kind of field — term start and end, and the report print date, all `config-date` — and it has
**no clear affordance and no rebuild of any kind**: it sets a value and lives with whatever the
picker remembers. So `CLAUDE.md` § *Lift the design with the function* has no counterpart to offer
here and the control is new design in this repo. **That absence is also evidence**: Roll Call! is
in daily classroom use with the same native fields and does not have this bug, because it never
replaces the element. The native input is not what is broken.

**What the work order still has to settle**, none of which is answered by the ruling above: where
the Clear sits relative to the field and whether it is one per field or one per pair; what it says
and whether it is present at all when the field is already empty; and the 44px floor under
`@media (pointer: coarse)`, which a small ✕ beside a date field will want to argue with and does
not get to (`src/calendar-view.css`'s 28px chip is the owner's single ruled departure and is not a
precedent — `CLAUDE.md` § Conventions).

**And it applies to all five fields in one sitting**, or the four unfixed ones become four more
reports of the same bug.

**A harness note, and it corrects what this entry said first.** The original claim here — that CDP
cannot drive `<input type="date">` and so `verify-shell.mjs` could never hold this bug — is **half
wrong, and the wrong half is the useful one.** A *blank* field is genuinely not drivable: synthetic
digits into one produced the value `0033-11-22` on a bare page in headed Edge and no events at all
under `--headless=new`. But a **prefilled** field is faithful, and the prefilled field is where the
whole bug lives — everything measured above came out of `Input.dispatchKeyEvent`. So a regression
check is buildable: seed a date, press `0`, assert the element is still there and the value is
still complete; then press the new Clear and assert the field is empty and a live element is still
in the panel. **A fix here does not need a 👤 line**, and a work order that books one is booking a
wait it does not have to pay. What it *does* still want a thumb for is the iPadOS half the Clear
exists to serve — clear, then tap the same day again — which is a reading and not a check.
