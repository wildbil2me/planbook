# WO-2.50 — a date outside every term is not a date to mark · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.50-result.md` — as your last act, and return it in-band too.

**Routing decision.** Routed to **Claude, Opus tier**. The deciding signal is that this work
order's Traps are entirely judgment rather than mechanics — *the selected term is not the bound*,
*do not put this in `stateOf()`*, *the record-wins half is the half that gets dropped under time
pressure* — and it stacks two more Claude-column entries on top: new visual language (an
out-of-term column class, the `Off term` chip, accessible names) and teacher-facing prose in
`paintActions()` and `stateSummary()`. The runner-up I set aside: the containment predicate itself
(inclusive `YYYY-MM-DD` string compare) is textbook Codex arithmetic, but it is one of nine
deliverables and the Acceptance's clean run **plus** mutation proof (~8.8 min at a measured 4.4
min/run) on top of reading eight-plus files would have failed `ROUTING.md`'s budget bullet anyway.
Opus and not Sonnet because this is in the Claude column on its own merits, not by fallback.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.50 — a date outside every term is not a date to mark

**Ship** 2 · **Status** 🤖 CLAIMED — 2026-08-18 · **Size** M · **Depends on** nothing · **Blocks** WO-2.51
**Closes roadmap** Phase 2 → *(no box. The three-states box is amended rather than replaced — see the
field below. Booked 2026-08-18, owner-directed, out of her own report from the deployed app.)*
**Amends roadmap** Phase 2 → the three-states box WO-2.1 closed, which promised taken · dropped · not
taken yet as the answers a class-day can have, and now also promises that a day outside every term the
class has is none of them and cannot be marked

**Owner-reported 2026-08-18, from `https://planbook.hwgteach.com/`.** Her first term begins **Aug 28**.
On **Aug 18** the attendance grid drew today's column live — a tappable cell for every student on the
roster and the 🚫 drop control in the head — ten days before the class exists. In her words: *we need to
remove the ability to accidentally enter attendance on days that are outside a term.*

**Why it exists.** `writableDate()` is the one gate every writer on this screen passes through, and it
answers exactly one question: **is this date today or earlier**. That is the whole rule, and every day
before the term is in the past-or-today set. Meanwhile `doc.classes[].terms[]` has carried `start` and
`end` since WO-1.6 (`docs/data-model.md`), and **five surfaces already read them** — `termTotals()`,
`termHistory()`, `passesForStudentInTerm()`, the grades report's own dated check, the pass history's.
Every one of them reads term dates as **arithmetic**. **Nothing reads them as a bound on writing.** The
register is the single place in this app where a term's dates mean nothing at all.

What that costs, and none of it is cosmetic:

- **A meeting recorded outside a term is invisible to the arithmetic that would reveal it.** Every count
  this screen and both reports print is scoped `term.start … term.end` through `meetingRecords()`. A
  record dated Aug 18 is in the document, in the backup, and in the year total; it is in **no** term
  percentage. So the number a teacher can find is wrong in a place she cannot see, which is
  `plans/ROADMAP.md`'s stated fear about grade math, applied to the ledger.
- **The grid does not ask, because nothing on it has an opinion.** There is no schedule model by design
  (`plans/rotating-schedule.md`), and that decision is why a class met if and only if a record says so.
  The term dates are the **only** thing in this document that knows the year has not started. Not
  reading them is not neutrality — it is the app declining to use the one fact it has.
- **The window it is loudest in is open right now.** Aug 18 → Aug 28 is the setup fortnight: the roster
  arriving (WO-1.23), classes copied (WO-1.22), term dates typed, everything tapped once to see that it
  works. Every one of those taps is a test tap and every one lands in the **live** ledger as a real
  meeting. `gates.md`'s rehearsal rule — *in this data model a simulated day **is** a real day* — is the
  same hazard seen from the other side, and it guards a rehearsal that nobody is running today.

**The rule, decided with the owner on 2026-08-18. Four answers, all hers, and the first is the one a
later reader will want to re-argue.**

1. **ANY term of the class bounds it — never the selected one.** A date is markable if it falls inside
   any term that class has. The term tab decides what is **counted**; it has never decided what is
   **writable**, and this work order does not make it start. The case that settles it is a term boundary
   mid-week: Q1 ends Friday, Q2 starts Monday, and the six-day window spans both. Under a
   selected-term rule half that grid locks according to which tab is up, and the teacher who has not
   switched tabs yet cannot mark today at all — a screen held at the classroom door refusing the day it
   is being held up for. The cost of this answer is real and is accepted: **a gap left between two terms
   locks the days in it.** That is the honest reading of the dates she typed, it is visible on the
   screen, and it is fixable in one place.
2. **The record wins.** A day that already carries attendance stays fully editable. This is
   `coveredDay()`'s rule verbatim — *what it refuses is CREATING a meeting* — never editing marks that
   exist, and it is what keeps the owner's own stray Aug-18 taps reachable from the screen that made
   them. A lock that strands a record leaves a wrong number in the year total with no way to reach it
   from inside the app.
3. **A class with no dated terms is unbounded**, exactly as today. A teacher part-way through typing her
   terms must not find the year sealed shut behind her.
4. **The home screen is in scope.** Otherwise the amber alarm simply relocates: five cards reading
   *Not taken yet* on a day school is not in session for her, which is the same false job the grid was
   inventing, moved one screen back.

**IT IS A MODIFIER, NOT A FIFTH STATE, and `paintActions()` already wrote the test:** *if `stateOf()`
would still answer the same word, it is a modifier.* It would. The class genuinely has no record and no
covering event, so the state is `NOT_TAKEN` and stays `NOT_TAKEN`. Out-of-term is carried **alongside**
the state the way `future` is — one extra argument, one extra column class, one different chip word —
and `stateOf()` learns nothing about terms. That is not tidiness: `stateOf()`'s four-line precedence is
the structural protection for history (a record is answered before the calendar is consulted), and a
fifth branch inside it is a fifth way for a term-date edit to change what a recorded day means.

**Deliverables**

- **One predicate, in the module that owns terms.** `src/classes.js` holds `terms[]` and
  `getSelectedTerm()`; the answer to *which of this class's terms contains this date* belongs there and
  is exported from there. **Do not add a date predicate to `src/attendance.js`** — it already has a
  private `termHasDates()`, and `src/date-text.js`'s header is a thousand words about what five copies
  of one date function cost this project. Decide deliberately whether that private one composes with
  the new export or stays as it is, and write which in a comment at the point of departure.
  - **`start` and `end` are inclusive at both ends**, and the comparison is a string compare on
    `YYYY-MM-DD`, which is what `meetingRecords()` and every other range read here already does. **No
    `new Date()` anywhere near it** — `parseISO()` and `src/date-text.js` both carry the long version of
    that scar, and a bound that is a day out is a bound that locks the first day of the term.
  - **A term carrying only one of the two dates is not a bound.** Half-typed dates are a state a teacher
    passes through, and a term with a `start` and no `end` must not seal the rest of the year.
- **The third gate, beside the two that exist.** `writableDate()` answers the clock and `coveredDay()`
  answers the calendar; this one answers the terms, and it is written the way `coveredDay()` is written
  — `!recordFor(...) && !inAnyTerm(...)` — because it is the same rule protecting the same history.
  Every writer that takes a date passes it. **Enumerate them out of the file rather than trusting a list
  written here**; at booking they are the six guarding on `writableDate(on)`, plus `editPastDay()`.
- **The column says it is out of term, and says which way it is out.** Carried alongside the state, not
  instead of it, so a day off in July is still `covered` and still reads as one — the same precedence
  `future` has, for the identical reason stated at `stateChip()`: *what the calendar says about a day
  is more useful than the fact that the day is ahead.* The chip word is **`Off term`**, inside the two
  or three syllables 72px holds. The **reason** goes where a covered day's reason goes — the head's
  `title` and accessible name, and the state line above the grid — and it names the side: before the
  first term, after the last, or between two terms that it names.
- **No control in an out-of-term column head.** The 🚫 creates a record and the ✏ opens a day whose every
  write the new gate would refuse. `dayHead()`'s own argument about a future column is the argument here
  word for word — *a control that looks live, takes a tap, and does nothing* — so the head returns with
  no button, and `COVERED` stays exempt exactly as it is for `future`.
- **The cells go inert and quiet.** A `<span>`, the `·` glyph, and the neutral future tone rather than
  the untaken amber: `?` means *you have a hole to fill*, and last June is not a hole. The accessible
  name says out of term in words, because a screen-reader user gets none of the wash.
- **`paintActions()` answers it in the shape it already answers `DID_NOT_MEET` and `COVERED`** — state
  line, a note saying **why** and **where the fix lives**, and one door. The door is the **term editor**
  (`data-term-manage`), which is `daysOffDoor()`'s pattern aimed at the screen that owns the dates.
  *An app that greys a screen out without saying what would un-grey it is an app she has to guess at
  with a class walking in* — dayHead()'s complaint, and it binds harder here, because the teacher most
  likely to meet this screen is the one who has not typed her term dates yet.
- **The home card.** `stateSummary()` decides the words for the card and the grid both, and that is the
  one place this answer is written. Its own quiet palette in `src/home.css`, never the untaken amber.
- **A stylesheet class of its own**, its values **copied** from the future column's rather than shared —
  same neutral to the eye, its own name, so the two can diverge later without a hunt. Colours inline,
  per `CLAUDE.md` § Conventions.
- **Bump `CACHE` in `sw.js`.** Every file this touches is in `SHELL`; without the bump no device sees any
  of it.
- **`TESTING.md` lines and the `CHANGELOG.md` entry**, per the maintenance protocol.

**Acceptance**
- [ ] With terms typed as Aug 28 – Oct 31, the Aug 18 column draws **no tappable cell and no button**,
      reads `Off term`, and the state line above the grid names the term it is before and offers the
      term editor. Driven, not reasoned about.
- [ ] **Aug 28 and Oct 31 are themselves markable** — the bound is inclusive at both ends, proved at
      both ends rather than at one.
- [ ] **Nov 1**, between a term ending Oct 31 and one starting Nov 3, is locked and its reason names
      **both** terms.
- [ ] A date carrying marks **written before this landed** stays fully editable on an out-of-term day:
      a mark can be changed and a drop can be undone. This is decision 2, and it is the line most likely
      to be lost in implementation.
- [ ] Every writer **refuses** an out-of-term date handed to it directly — not merely lacks a button for
      it. Driven through WO-2.5's keyboard path and through a hook fired at a stale DOM, which is the
      pair `writableDate()`'s own comment says these gates exist for.
- [ ] A class with **no** term dates, and a class with a `start` and no `end`, both behave exactly as
      they do today — nothing locks. **Both cases**, because they fail differently.
- [ ] A `no-school` event on a day that is also outside every term still reads as **covered**, with its
      own title — the calendar outranks this the way it outranks `Ahead`.
- [ ] The home card for an out-of-term day says so and is **not** amber; `stateSummary()` is the only
      place those words are decided, shown by the card and the grid agreeing.
- [ ] `node tools/verify-shell.mjs` green, its count recorded, with **at least one mutation proof**:
      deleting the new gate turns it red and names it.
- [ ] 👤 On the iPad, **force-quit from the app switcher first** (`CLAUDE.md`): portrait on a day before
      the term shows one column, greyed, with nothing to tap and the reason readable without hunting.

**Traps** — **the selected term is not the bound**, and a reader who reaches for `getSelectedTerm()`
here has quietly rebuilt the thing decision 1 refused; that tab decides what is counted. **Do not put
this in `stateOf()`** — the modifier test is quoted above, and the four-line precedence it would join is
the structural protection for history. **Inclusive at both ends, string compare only.** **A term with
one date typed is not a bound**, and the teacher is mid-keystroke when it happens. **The record-wins
half is the half that gets dropped under time pressure**; drop it and the owner's own Aug-18 taps become
unreachable from the app while still sitting in every year total. **Do not limit paging back to the
first term's start** — the window is what is DRAWN and the gate is what is WRITTEN, kept apart since
WO-2.1 precisely so a change to one could not become a change to the other; a locked column you can
*see* is the feature. **And check the diffstat before committing** (`plans/dispatch-retro.md`,
WO-2.49): a phase file silently rewritten to CRLF blinds `--tick` to every box above.

**Out of scope.** The end-of-term switch prompt — that is **WO-2.51**, and it depends on this one's
predicate. Assignment and due dates outside a term, which is a gradebook question with its own answer.
Any limit on how far the pager walks. And **nothing migrates**: records already sitting outside a term
stay exactly where they are, editable, uncounted by any term, and that is decision 2 working rather
than a gap.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `docs/data-model.md`
  - `plans/ROADMAP.md`
  - `plans/dispatch-retro.md`
  - `plans/rotating-schedule.md`
  - `src/attendance.js`
  - `src/classes.js`
  - `src/date-text.js`
  - `src/home.css`
  - `tools/verify-shell.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

### The surface map, so you spend your reading where the judgment is

Enumerated out of the files on 2026-08-18, at dispatch. **The work order tells you to enumerate the
writers yourself rather than trust a list — do that.** This is a starting point to check against,
not a substitute, and any drift you find is worth a line in your result file.

**The two gates that exist, and the third you are adding beside them** — `src/attendance.js`:

- `writableDate(date)` at **:1572** — the clock. Its header comment is the one that names the
  arrivals these gates exist for (*a hook fired from a stale DOM, a keyboard path added in WO-2.5,
  a restored document with a bad date*), and Acceptance line 5 drives exactly that pair.
- `coveredDay(classId, date)` at **:1594** — the calendar, written `!recordFor(...) && !coverOf(...)`.
  Read its comment in full before you write the new one: it states *what it refuses is CREATING a
  meeting*, which **is** decision 2, and it explains why it is deliberately not the mirror of
  `stateOf()`'s `COVERED` branch. Your gate is the same rule protecting the same history, so it
  should read as a sibling of this function, not as a new invention.

**The writers guarding on `writableDate(on)` — seven, plus `editPastDay()`.** The work order says
"the six" at booking time; there are seven on disk today, which is precisely why it told you to
count them yourself. Say in your result which number you found and where the eighth sits:

| Line | Function |
|---|---|
| :1674 | `setMark(studentId, code, date)` |
| :1832 | `takeClass(date)` |
| :1872 | `unconfirmAll(date)` |
| :1923 | `setNote(studentId, text, date)` |
| :1949 | `untakeClass(date)` |
| :1974 | `dropClass(date)` |
| :2007 | `undropClass(date)` |
| :2153 | `editPastDay(date)` — guards on `writableDate(date)`, not `(on)` |

Note which of these already call `coveredDay()` and which do not, and let that asymmetry tell you
something rather than flattening it: `undropClass()` at :2010 and `untakeClass()` at :1952 are the
undo paths, and **decision 2 says they must keep working on an out-of-term day that carries a
record** — that is Acceptance line 4, named in the Traps as the line most likely to be lost.

**The painting side** — `src/attendance.js`:

- `stateOf(classId, date)` at **:1101** — four-line precedence. **Do not touch it.** Its own file
  header at :36 and :54 explains why the record is answered before the calendar.
- `stateSummary(classId, date)` at **:1453** — the one place the words are decided, consumed by the
  home card at `src/home.js:211` and by the grid. Acceptance line 8 is proved by those two agreeing.
- `stateChip(state, unconfirmed, cover, future)` at **:1494** — where `future`'s precedence argument
  is written down verbatim, and the shape your `Off term` chip copies. Note :1499's comment: it is
  already the worked example of *a modifier carried alongside a state that stays `NOT_TAKEN`*.
- `dayHead(date, state, today, editing, unconfirmed, cover)` at **:3146** — the head, and its own
  argument about *a control that looks live, takes a tap, and does nothing*.
- `paintColumn(date)` at **:3234** — the cells.
- `paintActions()` region **:3344–:3470**, and `daysOffDoor()` at **:3470** — the door pattern you
  are copying. Read :3364's comment, which is the case where the door is the *only* control on the
  day: that is your out-of-term case almost exactly.

**The door you aim at:** `data-term-manage`, dispatched at `src/shell.js:1023` into
`classes.openTermEditor(classId, opener)` (`src/classes.js:1292`). `src/shell.js:65` documents the
attribute's contract — **empty value means the open class** — and :1203 notes what `data-view-home`
and `data-term-manage` both take. An empty attribute is likely what you want; confirm against the
handler rather than assuming.

**Where the predicate goes:** `src/classes.js`, which already owns `getTerms(classId)` at **:150**,
`getSelectedTerm()` at **:194**, and the whole term editor (`openTermEditor` :1292, `addTerm` :1301,
`removeTerm` :1319, `applyPreset` :1352, `editTermField` :1381, `termDateCommitted` :1244). The
private `termHasDates(term)` you are told to decide about is `src/attendance.js:1348`, one line, used
at :1416 by the totals path — **decide deliberately and write the decision in a comment**, per the
Deliverables. `src/date-text.js`'s header is the thousand words on what five copies of one date
function cost this project; read it before you add a sixth.

**`getSelectedTerm()` is the trap.** It is imported into `src/attendance.js` at :373 and used at
:1415. A reader who reaches for it in your new gate has rebuilt the thing decision 1 refused. The
term tab decides what is **counted** (:1415–:1417 is that code); it does not decide what is
**writable**.

**The stylesheet:** `src/attendance.css` (1510 lines) holds the future column's neutral. **Copy its
values into a class of your own name rather than sharing or extending it** — the work order is
explicit that the two must be able to diverge later without a hunt. `src/home.css` (204 lines) holds
the card palette; the out-of-term card gets its own quiet tone there and never the untaken amber.

**Cache:** `CACHE` in `sw.js` — every file above is in `SHELL`.

### Two things to check before you commit

- **The diffstat.** `plans/dispatch-retro.md` (WO-2.49): a dispatch can silently rewrite a file to
  CRLF, and a phase file rewritten that way blinds `--tick` to every box above it. A 4,000-line diff
  for a 150-line edit is the tell. `git diff --stat` before the commit, every time.
- **The mutation proof.** Acceptance line 9 wants *at least one*: delete the new gate, run
  `node tools/verify-shell.mjs`, and record that it turns red **and names the gate**. A mutation
  reasoned about is not a mutation proved — and put the gate back before you commit.

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

## 5. Done means these 10 lines, reported against one by one

1. With terms typed as Aug 28 – Oct 31, the Aug 18 column draws **no tappable cell and no button**, reads `Off term`, and the state line above the grid names the term it is before and offers the term editor. Driven, not reasoned about.
2. **Aug 28 and Oct 31 are themselves markable** — the bound is inclusive at both ends, proved at both ends rather than at one.
3. **Nov 1**, between a term ending Oct 31 and one starting Nov 3, is locked and its reason names **both** terms.
4. A date carrying marks **written before this landed** stays fully editable on an out-of-term day: a mark can be changed and a drop can be undone. This is decision 2, and it is the line most likely to be lost in implementation.
5. Every writer **refuses** an out-of-term date handed to it directly — not merely lacks a button for it. Driven through WO-2.5's keyboard path and through a hook fired at a stale DOM, which is the pair `writableDate()`'s own comment says these gates exist for.
6. A class with **no** term dates, and a class with a `start` and no `end`, both behave exactly as they do today — nothing locks. **Both cases**, because they fail differently.
7. A `no-school` event on a day that is also outside every term still reads as **covered**, with its own title — the calendar outranks this the way it outranks `Ahead`.
8. The home card for an out-of-term day says so and is **not** amber; `stateSummary()` is the only place those words are decided, shown by the card and the grid agreeing.
9. `node tools/verify-shell.mjs` green, its count recorded, with **at least one mutation proof**: deleting the new gate turns it red and names it.
10. 👤 On the iPad, **force-quit from the app switcher first** (`CLAUDE.md`): portrait on a day before the term shows one column, greyed, with nothing to tap and the reason readable without hunting.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

