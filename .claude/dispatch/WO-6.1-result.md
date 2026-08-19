# WO-6.1 — Event model & authoring · implementation result

**Implementer** Claude (work-order-implementer), Opus · **Date** 2026-08-19
**Brief** `.claude/dispatch/WO-6.1-brief.md` · **Work order** `plans/work-orders/phase-6-calendar-glance.md` § WO-6.1

Status line in the tracker left as `🤖 CLAIMED — 2026-08-19`, per the dispatch instruction.

---

## 1. Files changed

New:

- `c:\dev\planbook\src\events.js` — the general authoring surface. The six kinds attendance does
  not read; it cannot write `no-school` or `dropped`.

Changed:

- `c:\dev\planbook\src\calendar.js` — six rows added to `KINDS`; `isAttendanceKind()` /
  `isGeneralKind()` / `generalKinds()`; `eventFault()`; `newEvent()` extended to nine fields and made
  to refuse; `addEvent()` made to refuse; `updateEvent()`; `clashingMeetings()`; `generalEventsIn()`;
  `seriesFault()` / `newSeries()` / `seriesIn()` / `removeSeries()`; `DEFAULT_LEAD_DAYS` /
  `leadDaysOf()` / `setLeadDays()`.
- `c:\dev\planbook\src\days-off.js` — `createFromForm()` now *calls* the model's rules instead of
  restating them; `setKind()` guard narrowed to `isAttendanceKind()`; `weekdayShortDate()` moved out
  (see § 5); header and `paintList()` comments updated. `commit()` untouched.
- `c:\dev\planbook\src\date-text.js` — `weekdayShortDate()` moved here from `src/days-off.js`,
  byte-for-byte, and the WO-3.20 format table updated to say so.
- `c:\dev\planbook\src\store.js` — a comment block recording that `calendar` is deliberately **not**
  seeded, and why. No functional change to `newYearDocument()`'s output.
- `c:\dev\planbook\src\backup.js` — `calendar` classified in `NOT_CONTENT` with its reason.
- `c:\dev\planbook\src\shell.js` — imports `events.js`; nine rows added to the hook census; the click
  block, the `submit` route, the `change` route and the `input` route; `events` on the
  `window.planbook` read seam.
- `c:\dev\planbook\src\shell.css` — `.event-*` block, `.roster-row.editing`, `.panel-title-actions`,
  and every one of them given its rule in the `@media (pointer: coarse)` block in the same pass.
- `c:\dev\planbook\index.html` — `#eventsModal`; the two home-header buttons wrapped in
  `.panel-title-actions`.
- `c:\dev\planbook\sw.js` — `./src/events.js` added to `SHELL`, `CACHE` **v84 → v85**.
  *(The brief said the current value was v83; the tree already held v84, committed by WO-3.26.)*
- `c:\dev\planbook\docs\data-model.md` — the § Events amendment (the nine-field table, the
  `seriesId` ruling, the `gradesDueLeadDays` section, the three materialization rules) and the
  sketch under `## The document` (`seriesId` on the event record, `calendar` as a top-level key).
- `c:\dev\planbook\tools\verify-shell.mjs` — one new section at the foot (13 call sites) plus two
  inside the existing coarse-pointer block; one expected value updated in the WO-2.3 block.
- `c:\dev\planbook\tools\wo-sweep.mjs` — § 16, reconciling the § Events table against `newEvent()`.
- `c:\dev\planbook\tools\README.md` — the recorded `check()` count 966 → 981, plus the WO-6.1 entry
  in the history paragraph beside it.
- `c:\dev\planbook\TESTING.md` — § Phase 6 § WO-6.1.
- `c:\dev\planbook\plans\work-orders\phase-6-calendar-glance.md` — the Acceptance boxes (§ 3 below).
- `c:\dev\planbook\plans\ROADMAP.md` — one stale sentence under the WO-2.3 box: *"`src/days-off.js`
  is the only writer of `doc.events` in the app"* is no longer true, and the narrower claim that
  survives is annotated beside it.

Not touched: `CHANGELOG.md` (draft in § 7), the work order's Status line, `src/views.js`'s `VIEWS`.

---

## 2. Commands run, with what they printed

Every line below is from output I read after the process exited.

| Command | Result |
|---|---|
| `node tools/verify-shell.mjs` | **`998 checks · 998 passed · 0 failed · 0 skipped`** · `27,204 lines · 27.3 lines per check · 326s` · **exit 0** |
| `node tools/wo-sweep.mjs` | **`23 checks · 21 passed · 0 failed · 2 to review`** |
| `node tools/wo-gate.mjs WO-6.1` | `PASS \| gates clear for WO-6.1` |
| `node tools/wo-gate.mjs --audit` | `PASS \| every fragment matches exactly one roadmap box…` |
| `node tools/wo-gate.mjs --self-check` | `PASS \| 18 of 18 plants were caught.` |
| `node --check` on every edited `.js`/`.mjs` | clean |

**The first `verify-shell.mjs` run was 8 red, and none of the reds were in the new section.** That
matters more than the green one, so it is written out rather than summarised away:

- **Seven in the backup block.** `newYearDocument()` had been given a `calendar: {}` settings block,
  and `parseBackup()` validates a restored file against the shape that function returns — so every
  backup written by every earlier build was refused by name: *"is missing calendar, so Planbook
  cannot treat it as a whole school year."* Fixed by **not seeding the block**: its one key defaults
  when absent, which is the rule it was designed under, so there is nothing to hold until a teacher
  tunes it. `setLeadDays()` creates the block on first write. A `SCHEMA_VERSION` bump plus a
  migration was the other answer and I refused it — a schema bump whose entire content is an empty
  object, in exchange for making this build's documents unreadable to the previous one. The
  reasoning is written into `src/store.js` at the point of the absence.
- **One in the WO-2.3 block.** `madeEvent.keys` asserted the eight-field record; the record is nine
  fields now. That is the no-regression line doing its job rather than a defect, so the expected
  string was updated from eight names to nine with a comment saying why — and it is asserted from
  the **days-off** panel on purpose, so a build where only the new surface wrote the full record
  would still go red there.

The second run, on the delivered tree, is the 998/998 above.

**The two `REVIEW` lines in the sweep are both pre-existing shapes.** `src/events.js` joins the
first of them (`sensitive field names outside src/backup.js`) with exactly three lines, all of them
comments stating the prohibition the module obeys: `src/events.js:53`, `:55`, `:221`. Nothing in
that module reads, renders, exports, logs or prints a `supports` value; the harness also asserts
that the string `supports|accommodation|medical|behaviorPlan` appears nowhere in what the twelve
authored events serialise to.

---

## 3. The Acceptance list, line by line

### 1. `- [ ]` Every event kind can be created, edited, and deleted, with and without a range.

**Left blank deliberately, and this is the one line I did not close.**

What is verified: **six of the eight kinds meet all three verbs, with and without a range.**
`verify-shell.mjs` drives the real panel and writes twelve entries across `early-release`,
`grades-due`, `conference`, `meeting`, `trip` and `reminder` — one single-day and one ranged each —
then edits one in place and deletes all twelve. Printed:
`12 event(s) written across 6 kind(s) […]; the panel drew 12 row(s)`, then
`the row now reads {…"date":"2027-05-10"…} and the other 11 event(s) are byte-identical`, then
`0 event(s) left in the document (wanted 0), 0 row(s) on the panel`.

What is **not** verified: `no-school` and `dropped` have **create and delete but no edit**. They
did not have one when WO-2.3 shipped and I did not add one. Three reasons, in order of weight: the
Deliverables protect that screen by name (*"Do not delete the days-off screen and do not fold it
into your new authoring surface"*); acceptance line 7 asks that those two behave exactly as WO-2.3
established; and an edit there has to route back through `openConfirm()`, because moving a day off
over a week that was really taught is the same hazard as creating one there — a second dialog flow
on a surface I was told to leave alone. Adding it is § 6's first follow-up.

The line as written says *every* kind, so the box is blank. The note under it in the work order says
exactly what is and is not true, so the verifier is not left to re-derive it.

### 2. `- [x]` A weekly recurrence produces N independent entries; moving one moves only that one.

Verified in the browser, through the real form. `verify-shell.mjs` printed:
`5 entr(ies) on ["2027-05-03","2027-05-10","2027-05-17","2027-05-24","2027-05-31"] under 1 label(s)
["es_0f1l2q0p5z"]; each row holds the keys ["id","date","endDate","kind","title","classIds",
"studentId","notes","seriesId"]` — five distinct ids, five dates seven days apart, one `seriesId`,
and no tenth key on any instance, which is what a stored rule would need. Then the third instance was
moved through the edit path: `the third instance moved from 2027-05-17 to 2027-05-18; the other four
are byte-identical`.

No recurrence rule is stored anywhere. `newSeries()` returns N whole records and `addEvent()` is
called once per record; nothing recomputes a date from a label.

### 3. `- [x]` Deleting a materialized series is possible without deleting each instance by hand.

Verified. One control, drawn only on a row that has siblings, and it names the count before it is
pressed: `the button said "Remove all 5" and the document holds 0 event(s) afterwards (wanted 0)`.
`removeSeries()` matches on the label and never on title-and-kind, which is the case the work order
names — a hand-typed second *Faculty meeting* is not in the label and is not taken.

### 4. `- [x]` The four rules refuse from the model rather than from a form.

Verified through the seam, against **a bare object literal as the document** — `{ events: [] }`,
constructed three lines earlier in the harness — so `src/events.js` and `src/days-off.js` are not
merely uninvolved, they are unreachable from the call. Printed:

```
newEvent() returned [null,null,null,null], eventFault() codes
{"drop":"drop-names-nobody","ends":"ends-first","bad":"no-start","fine":null,"dropWithClass":null},
addEvent() returned null and left 0 row(s) in the scratch document
```

The four rules and where each now lives:

1. *the date must parse* — `eventFault()`, code `no-start`.
2. *an end date may not precede its start* — `eventFault()`, code `ends-first`.
3. *a `dropped` event naming no class is refused* — `eventFault()`, code `drop-names-nobody`.
4. *a range covering recorded meetings routes through the confirm rather than committing* —
   **half moved, and the split is stated at the code.** The rule (*which* recorded meetings this
   event covers) is `clashingMeetings(event, meetings)` in `src/calendar.js` and both callers use it.
   The **ledger read** stays with the caller: `src/attendance.js` imports `src/calendar.js`, so a
   model that imported it back would close the import loop this repo has refused six times. That is
   the same posture WO-4.1 gives a signal rule — handed its own measured numbers and never the
   document. `src/days-off.js` reads `meetingsBetween()` and hands the result in.

`newEvent()` returns `null` on a fault rather than a plausible record, and `addEvent()` refuses one
too. The refusal has to be on the *inputs*: `newEvent()` coerces, so by the time there is a record
to inspect, two of the three faults have already been tidied into something valid — a validator that
ran on the record would pass every time and mean nothing. That is written into the file.

`src/days-off.js` no longer holds any of the four; it shows `fault.message` and focuses
`fault.field`. The days-off refusal check in the WO-2.3 block still passes, still on
`/which classes/i`.

### 5. `- [x]` `docs/data-model.md` § Events names the lead-time field and the series identifier, and the record it documents is field-for-field the record `newEvent()` writes.

Verified twice, and the two are not redundant.

- In the browser, against the running app:
  `it wrote ["id","date","endDate","kind","title","classIds","studentId","notes","seriesId"]; the
  document says ["id","date","endDate","kind","title","classIds","studentId","notes","seriesId"]`.
- As a grep, `tools/wo-sweep.mjs` § 16 — new — parses the `### The record, field for field` table
  out of § Events and the returned object literal out of `newEvent()`, and compares them name for
  name **and in order**: `9 documented field(s) — id, date, endDate, kind, title, classIds,
  studentId, notes, seriesId — matching newEvent() at src/calendar.js:233 name for name and in
  order, with gradesDueLeadDays and seriesId both named in § Events`. It also asserts § Events names
  `gradesDueLeadDays` and `seriesId` by string, which is the acceptance line's own wording.

Neither one alone catches a field renamed in both the code and the harness; together they do. Both
anchors FAIL loudly if reworded rather than going quiet, per § 11's convention in that file.

The lead-time field is documented as a **document-level setting** and not as a row of the event
table, because that is what it is: `calendar.gradesDueLeadDays`, default 3, absent until tuned.

### 6. `- [ ]` A grades-due event warns at its configured lead time. → WO-6.4

**Left `- [ ]` with its `→ WO-6.4 …` pointer intact, as instructed.** The lead time is stored and
validated here and there is no banner, chip or toast for it anywhere in this change. What I *did*
verify is the storage half, which is this work order's deliverable:

```
it read 3 before anything was typed and 7 after a reload; the document holds
{"gradesDueLeadDays":7}; a document with no block reads 3 and one holding "soon" reads 3;
localStorage keys mentioning a lead: []
```

An absent or unreadable key reads as the shipped default rather than as zero, with no repair and no
write-back — `src/signals.js`'s `thresholdOf()` posture applied to a second setting.

### 7. `- [x]` `no-school` and `dropped` behave exactly as WO-2.3 established — no regression.

The whole WO-2.3 block in `verify-shell.mjs` is green on the delivered tree, inside a 998/998 run:
the covering rule, the precedence between two events on one date, the retroactive-snow-day confirm
and its cancel, the class-less-drop refusal, the future pre-drop, the "not one attendance record was
created, changed or destroyed" line, the date-field reset and the whole 2026-08-08 punch list.

**One expected value in it changed and no behaviour did**, and I would rather the verifier hear it
from me: `madeEvent.keys` asserted `classIds,date,endDate,id,kind,notes,studentId,title` and now
asserts `classIds,date,endDate,id,kind,notes,seriesId,studentId,title`. A day off written on the
days-off panel carries the empty `seriesId` it will never use, exactly as it has always carried the
empty `studentId` and `notes` — that is the *point* of one record shape, and the assertion is made
from the days-off panel precisely so that a build where only the new surface wrote the full record
goes red. The change to the record is mandated by this work order's own Deliverables.

Also verified, as the complementary-lists claim: with twelve of this work order's events in the
document, `the days-off list drew 0 row(s)`.

---

## 4. What I could not verify

- **Anything needing a real iPad.** Five 👤 lines are written into `TESTING.md` § WO-6.1 and all
  five are blank. I have not ticked a 👤 line and I have no device. They are: the two header buttons
  wrapping rather than spilling at 390px in portrait; whether an eight-control form in one modal is
  workable with a thumb; the three date pickers against iPadOS's retained-selection quirk (this is
  the **fifth** surface to answer it and the first with three date fields on it); the student
  `<select>` against a real ~140-name roster; and a cold launch on v85 with a force-quit.
- **The lead-time warning.** No surface reads it yet. WO-6.4's.
- **`verify-shell.mjs` drives a page, not an installed app**, and has never seen a service worker.
  The `CACHE` bump to v85 is asserted by the sweep's § 9 as a *disk* fact and by nothing else here.
- **Judgement calls a headless browser cannot make**: whether the `.event-kind` badge palette (one
  neutral wash for all six) reads better than six colours; whether "📌 Events" beside "📅 Days off"
  reads as two doors or as clutter.

---

## 5. Decisions the work order did not settle, and which way I went

1. **The general panel authors six kinds, not eight.** *"Authoring UI for all kinds"* against
   *"`commit()` in `src/days-off.js` stays the one place a day off is written"*. I read the second as
   binding: `src/events.js` cannot write `no-school` or `dropped`, and the app has authoring UI for
   all eight kinds **across the two surfaces**. The events panel's own copy points at Days off in as
   many words. `src/days-off.js`'s `setKind()` guard was narrowed from `kindInfo(kind)` to
   `isAttendanceKind(kind)` — it always meant "a kind this form knows", and those two sentences
   stopped being the same one the moment the table grew to eight rows.
2. **The lead time lives in a new top-level `calendar` block**, not in `doc.signals`. The work order
   says *"beside the rest of her settings, on the reasoning `docs/data-model.md` § Signal thresholds
   gives"* — and that reasoning is *in the document, not `localStorage`*, which a `calendar` block
   satisfies. Putting it inside `signals` would have made a calendar setting a signal threshold, and
   `CLAUDE.md` forbids reading `doc.signals` directly for exactly the reason a foreign key in there
   invites. Consequence handled: a new top-level key must be classified in `src/backup.js`, which
   `tools/wo-sweep.mjs` § 14 enforces — it is in `NOT_CONTENT` with its reason.
3. **The block is not seeded in `newYearDocument()`.** Forced by the first harness run (§ 2). It is
   the one departure from that function's "every collection present and empty" rule and the
   departure is documented at the point of departure, as `CLAUDE.md` asks.
4. **`weekdayShortDate()` moved into `src/date-text.js`.** WO-3.20's table said it lived in
   `src/days-off.js`; that was one screen's format while there was one list of dated rows. The
   events list is the second, one modal away, and the alternative was copy two of a composition whose
   whole point is that there is one of it. Moved byte-for-byte, so nothing on the days-off list
   renders differently; the table row and a paragraph explaining the move are in that file's header.
5. **Weekly only, capped at 60 instances.** *"Repeat weekly until 2026-12-19"* is the phrase the work
   order names. No interval control, because nothing is stored about the repeat, so adding one later
   changes no byte in any document. The cap exists so a mistyped year cannot materialize four
   thousand rows; 60 weekly is fourteen months, longer than any school year this app holds, so it can
   only be hit by a wrong `until`.
6. **The repeat skips nothing.** Every seventh day gets an entry, holidays included. Skipping "the
   weeks that class doesn't meet" is `plans/rotating-schedule.md`'s cycle model arriving from the
   convenience side; it is refused in `src/calendar.js`'s header, in `src/events.js`'s header and in
   `docs/data-model.md` § Events, because it will look new next time.
7. **The date arithmetic is the one `Date` in `src/calendar.js`**, whose header says no `Date`
   appears in it. It never leaves UTC — `Date.UTC(y, m-1, d)`, add whole days, read back with
   `getUTC*` — so there is no DST seam and no local-clock reinterpretation. The departure is stated
   at the function.
8. **New `.event-*` selectors rather than reusing `.dayoff-*`.** Sharing would have saved eight lines
   and cost `.dayoff-kinds` sitting on a row of pills that says "Conference". Two names, two screens,
   and a change to one cannot reach the other — the same call the two caution strips in that sheet
   already make. Every one of them has its coarse-block rule in the same pass.
9. **`.panel-title-actions` wraps the two home-header buttons.** The comment on that row records a
   390px measurement and that a fifth control in either header strip overflows; two non-shrinking
   buttons beside a title block is the same arithmetic. The wrapper stacks them rather than pushing
   the page into horizontal overflow. Measured green in the coarse block —
   `"📅 Days off" 97x44 … "📌 Events" 86x44 … content over its box by 0px` — but whether two stacked
   buttons *read* right is a 👤 line and it is blank.

---

## 6. Out of scope: temptations declined, written down rather than acted on

Each of these is a proposed follow-up, not something I did.

1. **An edit path for `no-school` and `dropped`** — the only thing standing between this tree and a
   ticked acceptance line 1. It wants the `openConfirm()` route as well as the form, because moving a
   day off over a taught week is the same hazard as creating one there. Small work order, all of it
   on a surface this one was told not to disturb.
2. **`withinLead(event, today, leadDays)`** — WO-6.4 will want it and it is one line. I did not write
   it, because unused code is a claim nobody checks, and the work order re-homed that surface.
3. **A `data-calendar-print` gate** — WO-6.3 owns it. The events panel is a modal and prints as the
   ordinary page today, exactly as the days-off panel does.
4. **A presentation-mode gate on the events list.** A `conference` row can name a student, and this
   panel has no `supports.*` anywhere near it — but a projected screen showing *"Conference · Thu, Nov
   12 · Maria Ortiz"* is a judgement about names rather than about plan data, and WO-6.2's ruling
   (*the name stays on the calendar, presentation-gated, because this is a surface a teacher opened
   on purpose*) is about review dates specifically. **Worth an explicit owner decision before
   WO-6.3**, and I did not make it here.
5. **A repeat interval other than weekly**, and a "repeat until end of term" that reads the term
   bounds. Both are additive and neither changes a stored byte.
6. **`src/views.js` untouched.** No `calendar` entry in `VIEWS`; WO-6.3 owns the sixth view.
7. **No third harness.** Everything is in `verify-shell.mjs` and `wo-sweep.mjs`. § 16 of the sweep is
   a new check inside the existing tool, not a new tool.

---

## 7. Draft `CHANGELOG.md` entry — for the teacher to accept, reword or discard

> ### Calendar events (WO-6.1)
>
> **Events** joins **Days off** on the home screen: the dates you already know about and would
> rather not carry in your head — when grades have to be in, the conferences, the meetings, the
> trips, the early releases, and anything else worth seeing coming. One day or a range, about the
> whole year or about named classes, and about a student if it is about a student.
>
> **A repeat writes real entries, not a rule.** "Repeat weekly until December 19" puts eleven
> separate lines on the calendar. Move one and only that one moves; delete one and the rest stay.
> When you want the lot gone, one button takes them all and says how many before you press it.
>
> **Days off and drops keep their own screen, and nothing here can close a class.** The two are
> deliberately apart: a holiday changes what your attendance says and a faculty meeting does not.
>
> Grades-due dates carry a lead time — how many days ahead you want to start seeing them. It is
> stored with the year rather than with the browser, so it follows you to the iPad. Where it shows
> up is the glance page, which is still being built.
>
> Under the surface: the rules that refuse an impossible event — a drop naming no class, an end date
> before its start, a date that does not read as a date — moved out of the days-off screen and into
> the calendar itself, so both screens refuse the same things in the same words.

---

## 8. One thing the verifier should re-run rather than take from me

`node tools/verify-shell.mjs` takes ~5.5 minutes and needs Edge. It ran here, twice, and the second
run is the 998/998 quoted above — but it drives a page and not an installed app, and no green run in
it closes any of the five 👤 lines now sitting blank in `TESTING.md` § WO-6.1.
