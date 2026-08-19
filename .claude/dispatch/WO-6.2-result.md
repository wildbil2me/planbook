# WO-6.2 — Derived events · implementation result

**Implementer** Claude (work-order-implementer), Opus · **Date** 2026-08-19
**Brief** `.claude/dispatch/WO-6.2-brief.md` · **Work order** `plans/work-orders/phase-6-calendar-glance.md` § WO-6.2

Status line in the tracker left as `🤖 CLAIMED — 2026-08-19`. Nothing committed, nothing pushed —
the brief did not ask for either.

---

## 1. Files changed

New:

- `c:\dev\planbook\src\calendar-derived.js` — the read side. One exported function per row of the
  Deliverables table (`assignmentDuesIn`, `termEdgesIn`, `meetingStatesIn`, `reviewDatesIn`), plus
  `derivedItemsIn()` which returns all four in date order, `isDerived()`, the five kind tokens, and
  a re-export of `TAKEN` / `DID_NOT_MEET` / `COVERED`. **No writer.**

Changed:

- `c:\dev\planbook\src\shell.js` — imports the new module; `calendarDerived` on the `window.planbook`
  read seam, with the reason at the entry. No hook, no click route, no census row: the module has no
  DOM and adds no control.
- `c:\dev\planbook\sw.js` — `./src/calendar-derived.js` added to `SHELL`, `CACHE` **v85 → v86**.
- `c:\dev\planbook\docs\data-model.md` — a paragraph under § Events naming
  `src/calendar-derived.js` as the one reader of the derived table, and the three rulings that are
  decisions rather than plumbing (blank weekdays, the school-wide exception, the review record's
  shape). **The table itself is unchanged and the code agrees with it** — nothing moved.
- `c:\dev\planbook\tools\verify-shell.mjs` — one new section at the foot, ten `check()` call sites.
- `c:\dev\planbook\tools\wo-sweep.mjs` — § 17, the structural half of "no writer" plus a
  reconciliation of the review record against its six allowed field names.
- `c:\dev\planbook\tools\README.md` — the recorded count 981 → 991, and the WO-6.2 entry in the
  history paragraph beside it (including the trap-8-shaped thing the new section had to route
  around; see § 4).
- `c:\dev\planbook\TESTING.md` — § Phase 6 § WO-6.2.
- `c:\dev\planbook\plans\work-orders\phase-6-calendar-glance.md` — acceptance lines 2 and 5 ticked
  with their evidence noted; a closing block recording where the code landed and why the two
  `Closes roadmap` boxes were left open.

Not touched: `CHANGELOG.md` (draft in § 8), `plans/ROADMAP.md`, `CLAUDE.md`, `AGENTS.md`,
`src/calendar.js`, `src/attendance.js`, `src/views.js`, `index.html`, any stylesheet.

---

## 2. Commands run, with what they printed

Every line below is from output I read after the process exited. Nothing here is a prediction.

| Command | Result |
|---|---|
| `node tools/verify-shell.mjs` (run 1) | **`1008 checks · 1008 passed · 0 failed · 0 skipped`** · `27,618 lines · 27.4 lines per check · 319s` · exit 0 |
| `node tools/verify-shell.mjs` (run 2, delivered tree) | **`1008 checks · 1008 passed · 0 failed · 0 skipped`** · `27,618 lines · 27.4 lines per check · 318s` · **`EXIT=0`** |
| `node tools/wo-sweep.mjs` | **`24 checks · 22 passed · 0 failed · 2 to review`**, exit 0 |
| `node tools/wo-gate.mjs WO-6.2` | `PASS \| gates clear for WO-6.2` |
| `node tools/wo-gate.mjs --audit` | `PASS \| every fragment matches exactly one roadmap box…` |
| `node tools/wo-gate.mjs --self-check` | `PASS \| 18 of 18 plants were caught.` |
| `node --check` on every changed `.js`/`.mjs` | clean |

**Why the harness ran twice, since one green run would have been enough.** Between run 1 and run 2 I
planted a defect in `src/calendar-derived.js` on purpose — a `d.events = out` and a `plan:` on the
review record — to watch `wo-sweep.mjs` § 17 go red, then restored the file from a byte copy. That
restore happened *after* run 1, so run 1 was no longer provably a run over the tree being delivered.
Run 2 is. Both are quoted rather than only the second, because "I re-ran it and it was the same" is a
claim a reader should be able to check.

**The first harness run was green on all ten new checks**, which is worth one sentence rather than a
paragraph and is a fact about the module's shape rather than about care: `src/calendar-derived.js`
has no DOM, no clock and no store in it, so none of the four CDP traps in `tools/README.md` had
anything to catch. Nothing anywhere else in the suite reddened either — the module is additive and
no existing file changed behaviour.

**The two `REVIEW` lines in the sweep are both pre-existing shapes.** `src/calendar-derived.js` joins
the first (`sensitive field names outside src/backup.js`) with **seven lines, and here they are so
the verifier does not have to grep**: `:7`, `:58`, `:59`, `:315`, `:317`, `:322`, `:323` are all
comment prose stating the prohibition the module obeys, and `:71` is
`import { supportsVisible, readSupports } from './supports.js'` — the two sanctioned readers, which
is how `src/supports.js`'s header says a module is allowed to touch this data. Nothing in the file
renders, exports, logs, prints or merges a support value, and the harness asserts that as a search
over what the whole month serialises to (§ 3, line 4).

**Negative control on the new sweep check.** Planted on the delivered tree, § 17 reddened on all
three of its arms at once:

```
FAIL | src/calendar-derived.js reads and never writes, and a review carries no neighbour
  :: src/calendar-derived.js:312 can write — the read side of the calendar reaches a document
     mutation or a store call … · the review record is [derived, kind, classId, date, studentId,
     name, plan] and a date and a student is [derived, kind, classId, date, studentId, name] —
     plan is on a record that is allowed a date and a student and nothing else ·
     src/calendar-derived.js:364 names a support field other than reviewDate inside reviewDatesIn()
```

File restored, sweep green again with the same line numbers. A fixture that cannot express the
failure is not evidence, so this is written down rather than asserted.

---

## 3. The Acceptance list, line by line

### 1. `- [ ]` Changing an assignment's due date moves it on the calendar with no other action. → WO-6.3

**Left blank, re-homed, and correctly so.** There is no calendar on this tree to move anything on.
What is delivered is the half that makes it true when WO-6.3 arrives: `assignmentDuesIn()` reads
`assignments[].due` on every call and holds nothing between calls, so there is no copy for an edit to
get out of step with. The harness proves the read is live rather than cached only indirectly — the
same month asked twice returns the same six items — and I did **not** write a check that edits a due
date and re-reads, because without a grid that check would be asserting that a pure function is pure.
WO-6.3's own line is the one that closes this.

### 2. `- [x]` `events[]` contains no derived entry, checked deterministically rather than by feel

**Ticked, with one substitution stated plainly rather than smoothed over.**

The line says *"render it, page one month forward and one back."* There is no month grid — it is
WO-6.3's — so what is paged in the harness is the **model**: `derivedItemsIn()` for March 2027, for
April, for February, for March again, and then an unbounded call. That is the sequence a Next/Back
pair puts through it. I am flagging the substitution because a verifier reading the line cold could
reasonably ask where the render was, and the answer is that it does not exist yet rather than that I
skipped it.

Everything else in the line is literal. The seed is the five things it names — an assignment due
date, a term boundary, a recorded meeting, a planned drop, and a review date — and `doc.events` is
re-read **by `id` and in order**. Printed:

```
the five reads returned [6,0,0,6,6] fixture item(s) (month, next, previous, month again,
unbounded); doc.events held 2 entr(ies) before and 2 after — the same ids in the same order;
after a reload it holds 2, the review date still reads "2027-03-24" and the due date "2027-03-11"
```

Three things make this stronger than the line asks for:

- **The re-read happens across a `Page.reload`**, so a write that was only sitting in memory is
  caught as well as one that persisted.
- **`doc.assignments`, `doc.attendance` and the student's own `supports.reviewDate` are asserted
  unchanged too**, not only `doc.events`. The line names one array; a read side that quietly repaired
  a student record would satisfy it and still be a writer. (This is why `readSupports()` is used and
  `supportsOf()` is not — the latter repairs the block in place.)
- **`wo-sweep.mjs` § 17 makes the claim structurally**, which the harness cannot: no store call, no
  document mutation and none of eleven writer names anywhere in the file, over five read-only
  imports. The harness proves what today's code paths wrote on today's fixture; the grep proves there
  is nothing in the file that could write on any input. The failure that matters is a cache somebody
  adds later "just for the month being drawn" — it would pass the fixture and fail the premise.

### 3. `- [ ]` Tapping a derived due date opens the assignment, not an event editor. → WO-6.3

**Left blank, re-homed.** Nothing is tappable on this tree. What is delivered is the identity a tap
needs and nothing more: an `assignment-due` item carries `assignmentId`, `classId` and `termId` — the
three ids `src/assignments.js` needs to open the right screen at the right place — and no score, no
points and no category, because an item on a month cell is a door and a door does not need to know
what is behind it. Asserted in the harness (`the due date carries termId "tm_wo62"`).

### 4. `- [ ]` A review date reaches the calendar as a date and a student and nothing else … and is gone entirely in presentation mode. → WO-6.3

**Left `- [ ]` with its `→ WO-6.3` pointer intact, as the brief instructs.** But this is the line the
brief says a plausible implementation fails, so what *is* proven here is worth setting out — the
model half is closed even though the box is not:

```
the record holds ["derived","kind","classId","date","studentId","name"], reading
"Wo62Given Wo62Surname" on 2027-03-24; a search of the 1099-character month for
["Wo62MedicalPhrase","Wo62BehaviorPhrase","Wo62AccommodationPhrase","Wo62CaseManagerPhrase",
 "IEP","extended-time"] found []
```

The fixture student carries a real value in every field `reviewDate` shares a record with — an `IEP`
plan, a case manager, an `extended-time` accommodation with detail text, medical text and
behavior-plan text — each seeded with a phrase that appears nowhere else in this repository, so the
claim is a **search over what the whole month serialises to** rather than an inspection of the field
names somebody remembered to look for. And with the projector on:

```
with the mode on: 0 review row(s), "review-date" present false, the surname present false,
the date present false, 5 other fixture item(s) still drawn; with it off again: 1 review row(s),
and the preference was left reading false
```

Gone, not redacted: no row, no token, no name, no date, and the other five items untouched. The gate
is `supportsVisible()` from `src/supports.js` — the one function, asked at the point the datum is
**produced** rather than at the point it is drawn, so WO-6.3 inherits the suppression whether or not
its author has heard of it. There is no second copy of that test in the file; the sweep's existing
check confirms it (`defined in src/supports.js, asked by 4 other file(s): … src/calendar-derived.js …`).

`wo-sweep.mjs` § 17 asserts the same six field names against the object literal in the file, and that
`reviewDatesIn()`'s body names no other support field. Neither anchor alone catches a field renamed
in both the code and the harness; together they do — § 16's argument applied to the record in this
phase with the most to lose.

**What is still owed to WO-6.3, and it is real:** what a cell *draws*. A record that carries only a
date and a name can still be rendered next to a plan-type badge somebody resolves separately, and
that is the line's own `👤` on WO-6.3 — read on the device, across a room.

### 5. `- [x]` A future weekday shows no per-class meeting state at all

**Ticked.** Kept out **structurally** rather than by a filter, which is the difference the Traps
block is about:

- `meetingStatesIn()` asks about a `{ classId, date }` pair **only** where an attendance record
  exists for it, or where an authored `no-school` / `dropped` event **names** that class on that
  date. Nothing in the module enumerates weekdays and nothing iterates classes against a date, so
  there is no loop in the file that a schedule could be the missing input to.
- `NOT_TAKEN` is discarded on the way out as well — belt and braces, the posture
  `src/calendar.js`'s `addEvent()` takes toward a record `newEvent()` could not have built. The guard
  cannot fire given how pairs are chosen, which is exactly why it earns its line.

Measured:

```
2027-03-10 yields 0 meeting state(s) and 0 derived item(s) of any kind, for any class; the month
answers ["2027-03-05:taken","2027-03-18:covered"]; the string "not-taken" is present in the year:
false (2 fixture meeting state(s) in the year)
```

The bare Wednesday is empty **for every class, not only the fixture's** — that half of the check is
deliberately unfiltered, because an absence cannot be manufactured by another section's leftovers and
a foreign row on that date is a thing the check should say out loud rather than look past.

Nothing is stored, derived, cached or inferred about which classes were expected to meet. The module
holds no state at all between calls; there is no memo, no `Map`, no module-level variable.

---

## 4. What I could not verify

- **Anything needing a real iPad.** One `👤` line is written into `TESTING.md` § WO-6.2 and it is
  blank: after a cold launch on **v86** (a `SHELL` change — force-quit from the app switcher), the
  app still starts **offline**. I have no device and have ticked no `👤` line. That line exists
  because this work order's shape is the one whose only failure mode is invisible at a desk: it adds
  a file to the precache list that nothing on screen depends on yet, and a `SHELL` entry that 404s
  takes the whole shell down on the next offline launch. `verify-shell.mjs` has never seen a service
  worker, so nothing in this report speaks to it.
- **Whether any of this reads right.** Nothing draws a derived item, so there is no palette, no
  spacing and no legibility question I could have answered even with a device. All of it is WO-6.3's.
- **The three re-homed acceptance lines**, for the reason each of them gives above.
- **`verify-shell.mjs` drives a page, not an installed app.** The `CACHE` bump to v86 is asserted by
  the sweep as a *disk* fact and by nothing else here.

**One thing the run surfaced that a verifier should see rather than take from me.** The month check
prints `(out of 9 item(s) in the month altogether)` against the six the fixture seeded. Three derived
items in March 2027 come from **earlier sections of the harness leaving dated terms behind** — a
month grid reads every class's terms, so a section that creates a class with a 2027 term contributes
to any month inside it. That is why every exact count in the new section is taken over its own
fixture (`classId === c_wo62 || studentId === s_wo62`) with the unfiltered total printed beside it: an
exact-equality check over the whole month would have gone red about the harness's own history on a
correct build, which is trap 8's shape and the reading that gets a sensitive assertion deleted next
time round. The **absence** claims are unfiltered on purpose. This is written up in `tools/README.md`
beside the count entry so the next person adding a month-shaped check does not rediscover it.

---

## 5. Decisions the work order did not settle, and which way I went

1. **A new module, `src/calendar-derived.js`, rather than more of `src/calendar.js`.** The brief said
   the read side "belongs beside that model" and I read that as *beside* rather than *inside*, for a
   mechanical reason that settles it: the derived half reads the attendance ledger, `src/attendance.js`
   imports `src/calendar.js`, and a model importing it back closes the import loop this repo has
   refused six times — the same reason WO-6.1 gave for leaving the ledger read with the caller of
   `clashingMeetings()`. `src/calendar.js` is untouched by this work order.

2. **The meeting half delegates to `stateOf()` rather than re-implementing the precedence.** That
   couples this module to the *open* document, because `stateOf()` resolves against `getDoc()`. I
   took the coupling deliberately and stated it in the header in the shape `src/signals.js`'s
   `evaluate()` states it: "what happened to this class on this date" is `src/attendance.js`'s answer
   and has been since WO-2.1, and a second copy of that four-rung chain in here would agree with
   itself perfectly and disagree with the marking screen the first time a day off was authored. The
   document handed in is expected to be the open one. **The alternative — a self-contained doc-taking
   reimplementation — would have been more elegant and is the wrong answer**, and I want that on the
   record because it will look tempting to whoever reads this next.

3. **A school-wide `no-school` produces no per-class row.** The work order does not settle this and
   the implementation had to. `classIds: []` means school-wide, so `stateOf()` answers `covered` for
   every class on that date — but expanding it here would mean this module reading the class list to
   decide what a date implies about five classes, which is a hair's breadth from the model
   `plans/rotating-schedule.md` removed, and it would bury a week's break under twenty-five identical
   chips. The event is **authored**: it is in `doc.events` and the grid draws it as the entry the
   teacher typed, so the derived layer stays quiet rather than saying it twice. A `dropped` event
   always names its classes (`eventFault()` refuses one that does not), so the only case given up is
   the school-wide half of `no-school`. Asserted both ways in the harness — no derived rows across
   the closure, `stateOf()` still says `covered`, and the authored event still on the calendar.

4. **Archived classes are off the calendar.** Their due dates, term edges and meeting states are all
   suppressed; the review date is not, because it belongs to a student rather than to a class. The
   argument is `getActiveClasses()`'s own: an archived class is one the teacher has put away, and a
   chip that taps through to a screen not on the tab bar is a door to nowhere. This is a decision
   nobody asked for and it has its own check, so it can be reversed by deleting one predicate.

5. **Term edges are read one at a time and `termIsDated()` is deliberately not used.** That function
   answers "is there a *range* to read", which is right for a report that has to be scoped to one.
   Two boundary dates are a different question, and a term with a start typed and an end not yet
   typed still has a first day worth seeing. Stated at the function so it does not read as an
   oversight.

6. **Both `Closes roadmap` boxes left `- [ ]`, departing from WO-6.1's precedent.** *"Derived events
   computed at render"* and *"IEP/504 review dates **surfaced** ahead of time"* are claims about what
   a teacher sees, and nothing on this tree draws either. WO-6.3 ticks them in the pass that puts the
   grid on screen. WO-6.1 ticked its box for the grades-due lead time while re-homing the warning to
   WO-6.4, so there is a precedent going the other way — I went the conservative way and wrote the
   reasoning into the work order rather than leaving an unticked box looking like an omission.
   **If the owner reads that as over-caution, the fix is two characters.**

7. **`'Untitled assignment'` is duplicated rather than shared.** It is `src/assignments.js:354`'s own
   fallback and now appears in a fourth place. The alternative was importing a screen module into the
   read side or exporting a naming helper from it; neither is worth it for one string, and the
   comment says that if it ever earns a shared helper the way `termName()` has, both call sites take
   it.

8. **`fullName()` for the review name**, not `rosterName()`. `"Ada Probe"` rather than
   `"Probe, Ada"` — `src/roster.js`'s own comment says the second reads as a filing cabinet, and a
   calendar chip is closer to a sentence than to a roster row. Its fallback for a student with no
   name typed at all is `"this student"`, which reads oddly on a chip; I left it rather than growing
   a second opinion about what an unnamed student is called. **Worth WO-6.3 noticing.**

9. **`shiftDays()` is eight lines duplicated from `src/calendar.js` rather than exported from it.**
   The header says so at the point of departure, with the UTC argument restated, and says that a
   third caller is the moment it earns an export and both take it. I chose the copy over widening
   `src/calendar.js`'s surface for one caller in a work order whose whole discipline is not touching
   that file.

---

## 6. Out of scope: temptations declined, written down rather than acted on

Each of these is a note, not something I did.

1. **A lead-time window on review dates.** `leadDaysOf()` exists and "surfaced ahead of time" reads
   like an invitation. I did not build one: on a month grid the date appears on its own cell, which
   *is* ahead of time, and "coming up" is a glance-page shape — WO-6.4's, whose fifth box already
   rules that the glance page shows a **count** and no name.
2. **Resolving which classes a review-date student is in**, so the class filter could apply to it.
   That is WO-6.3's decision and it is a roster read this module deliberately does not make on its
   behalf. The item carries `classId: ''` with a comment saying so.
3. **An `off-term` modifier read off the term bounds.** The Traps block names it as the *allowed*
   answer if a distinction is wanted for days the school is not in session — but it says "if", and
   nothing is drawing anything yet. `termEdgesIn()` supplies the dates it would need. WO-6.3's call.
4. **A `week` or `day` convenience over `derivedItemsIn()`.** WO-6.3 owns week view; a bounded range
   is already the whole API and a second entry point would be a guess at its shape.
5. **Anything with a DOM, a CSS class, or a `@media (pointer: coarse)` rule.** This work order adds
   no control, so there was no 44px pass to make. WO-6.3 adds every one of them.
6. **`src/views.js` untouched.** No `calendar` entry in `VIEWS`; WO-6.3 owns the sixth view.
7. **No third harness.** Ten checks inside `verify-shell.mjs`, one section inside `wo-sweep.mjs`.
   Nothing new was written that runs.
8. **The one check I would have liked and did not write:** an assertion that `derivedItemsIn()` is
   *pure* in the strong sense — that calling it a thousand times allocates no growing structure.
   `verify-shell.mjs` cannot express "there is no cache" as a measurement; § 17's grep is the closest
   thing and it is a text search. Proposed follow-up only if a cache is ever added on purpose.

---

## 7. Where the code and the docs stand relative to each other

`docs/data-model.md` § Events' four-row table and this work order's Deliverables table are the same
four rows, and the code matches both. **I moved neither.** What I added to that section is a
paragraph naming `src/calendar-derived.js` as the one reader of the table and stating the three
rulings above (blank weekdays, the school-wide exception, the review record's shape) — because a
later reader will otherwise re-derive them, and one of the three is a disclosure rule.

`wo-sweep.mjs` § 16 — the check that reconciles § Events against `newEvent()` — is green and
untouched. Its own comment predicted that WO-6.2 might add a field to the event record; it did not.
Nothing about `doc.events` changed.

---

## 8. Draft `CHANGELOG.md` entry — for the teacher to accept, reword or discard

> ### The calendar starts reading what is already there (WO-6.2)
>
> Nothing on screen changes yet. Under it, the calendar learned to answer four questions out of
> things you have already typed somewhere else: what is due, when a term starts and ends, which
> classes met and which were dropped, and whose IEP or 504 review is coming up.
>
> **None of it is copied.** Change an assignment's due date and the calendar has nothing to go and
> fix, because it never kept a second copy to get out of step. That is the whole reason this landed
> as its own step rather than inside the month view.
>
> **A day you did not write anything down about stays empty.** Not amber, not "not taken yet" —
> blank. Planbook still has no idea which classes are *supposed* to meet on a Tuesday, and it is not
> going to learn: the schedule rotates and then changes on the morning announcements, and a second
> opinion about it would only ever be wrong in a way you had to go and correct.
>
> **A review date is a date and a name.** No plan type, no accommodation, nothing medical, nothing
> from a behavior plan — and with presentation mode on it is not there at all, rather than blanked
> out or shown as a nameless dot. A dot on a Tuesday still tells a room that somebody has something
> on file.
>
> The month view that draws all of this is next.

---

## 9. One thing the verifier should re-run rather than take from me

`node tools/verify-shell.mjs` takes ~5.5 minutes and needs Edge. It ran here twice and both runs
printed `1008 checks · 1008 passed · 0 failed · 0 skipped`, the second on the exact tree being
delivered, exit 0. But it drives a page and not an installed app, and no green run in it closes the
one `👤` line now sitting blank in `TESTING.md` § WO-6.2 — which is the offline cold launch on v86,
and is the only way anyone finds out whether a new `SHELL` entry actually precached.
