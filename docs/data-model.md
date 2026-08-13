# Planbook data model

Local-first. One JSON document per school year is the whole database. It lives in the browser's
own storage; Google Drive, when connected, holds a copy of that same document and nothing else.

## Why one document instead of rows in a database

The whole year is small — roughly 600 assignments, ~15k scores, ~22k attendance marks, call it
3–6 MB. It loads into memory in well under a second, which means every query the app needs is a
plain array operation and there is no query layer to build.

It also makes sync tractable. The teacher edits on the laptop or the iPad, never both at once, so
whole-document last-writer-wins is correct rather than a compromise (see [sync.md](sync.md)).

## Storage

| Layer | What | Why |
|---|---|---|
| IndexedDB | The year documents, one record per year | Survives reload, works offline, no permissions |
| `localStorage` | UI prefs only, prefix `planbook_` | Never student data — it's synchronous and size-capped |
| Drive (opt-in) | A copy of the year document, app-created | `drive.file` only; see [sync.md](sync.md) |

**The iOS eviction hazard.** Safari evicts IndexedDB after ~7 days of non-use for ordinary
websites. **Home-screen-installed PWAs are exempt.** A teacher who bookmarks Planbook instead of
installing it can lose a term of grades over a school holiday. Therefore: the install prompt is
not a nicety, it is data safety; the app must detect it isn't installed and say so plainly, and
automatic file backups are mandatory, not optional.

## Backups

Every save writes to IndexedDB. Additionally the app offers a one-click download of the year
document (plain JSON) and nags if the last download is more than a week old. A file the teacher
holds is the only recovery path that survives eviction, a wiped browser, and a dead laptop.

## The document

```jsonc
{
  "schemaVersion": 1,
  "docId": "…",              // stable across the year; identifies this doc to sync
  "year": "2026-2027",
  "rev": 41,                  // increments on every save — the sync ordering key
  "deviceId": "…",
  "updatedAt": "2026-08-03T19:40:00Z",

  "teacher": { "name": "", "school": "", "email": "",
               "adminEmail": "", "defaultCc": true },

  /* No schedule object, by design — see plans/rotating-schedule.md */

  "classes": [{
    "id": "c_…",
    "name": "Period 3 — Biology",
    "archived": false,        // true = keeps everything, leaves the class tab bar
    // The term id is OPAQUE — `tm_…`, never "Q1". The label is the only place a quarter is
    // named, and a teacher edits it. See the shape decisions under this sketch; these two lines
    // read "Q1" until WO-1.6 shipped and the sketch was caught contradicting the code it
    // documents. A sketch that disagrees with the code undoes the rule in good faith.
    "terms": [{ "id": "tm_…", "label": "Quarter 1", "start": "…", "end": "…" }],
    "categories": [{ "id": "k_…", "name": "Tests", "weight": 40 }],
    "letterScale": null,      // null = use the document default below
    "roster": ["s_…"]
  }],

  "letterScale": [            // document-wide default, editable in Settings
    { "letter": "A",  "min": 93 }, { "letter": "A-", "min": 90 },
    { "letter": "B+", "min": 87 }, { "letter": "B",  "min": 83 }
    /* … down to F at 0 */
  ],

  "students": [{
    "id": "s_…", "first": "", "last": "", "nickname": "", "gradYear": "",
    "email": "",
    "guardians": [{ "name": "", "relation": "", "email": "", "phone": "",
                    "language": "en", "preferred": true }],
    "counselor": { "name": "", "email": "" },
    "notes": "",

    "supports": {                       // sensitive — see Accommodations below
      "plan": "IEP|504|ELL|none",
      "caseManager": { "name": "", "email": "" },
      "reviewDate": "2027-02-11",
      "accommodations": [{
        "kind": "extended-time|separate-setting|read-aloud|calculator|reference-sheet|
                 preferential-seating|breaks|scribe|large-print|chunked|check-ins|other",
                 // "" = not yet chosen; a fresh card is never seeded to a real value
        "detail": "1.5× on tests and quizzes",
        "appliesTo": ["tests","quizzes"]  // empty = everything
      }],
      "medical": "",                     // allergy, seizure protocol, diabetes …
      "behaviorPlan": ""
    }
  }],

  "assignments": [{
    "id": "a_…", "classId": "c_…", "termId": "tm_…", "categoryId": "k_…",
    "name": "", "points": 100, "assigned": "2026-09-02", "due": "2026-09-09"
  }],

  "scores": {
    "a_…": {
      "s_…": { "v": 87 },                    // scored
      "s_…": { "v": 78, "flag": "late" },     // scored, turned in late
      "s_…": { "v": null, "flag": "missing" },// not turned in → counts as zero
      "s_…": { "v": null, "flag": "excused" } // leaves the denominator
      /* no key at all = not graded yet, no effect on anything */
    }
  },

  "attendance": [
    { "classId": "c_…", "date": "2026-09-09",
      "marks": { "s_1": { "code": "T", "at": "2026-09-09T08:14:00-04:00", "note": "missed the bus" },
                 "s_2": { "code": "A" },
                 "s_3": { "code": "U" } } },
    { "classId": "c_…", "date": "2026-09-09", "exception": "dropped" }
    /* exception absent = the class met. No record at all = not taken yet. */
  ],

  "log": [{ "id": "l_…", "studentId": "s_…", "at": "…",
            "kind": "behavior|contact|note",
            "audience": "guardian|counselor|admin|student",
            "subject": "", "body": "" }],

  /* Hall passes, in two collections — state and history. See the shape decision below.
     `note` is optional on both and absent where unused, the same rule as a mark cell's. */
  "openPasses": [{ "id": "p_…", "studentId": "s_…", "classId": "c_…",
                   "type": "bathroom|nurse|quick",
                   "out": "2026-09-09T09:12:00-04:00",
                   "note": "went on to the counsellor" }],
  "passes": [{ "id": "p_…", "studentId": "s_…", "classId": "c_…",
               "type": "bathroom|nurse|quick",
               "out": "2026-09-09T09:12:00-04:00",
               "back": "2026-09-09T09:20:00-04:00",
               "minutes": 8,
               "endedBy": "return|dismissed",
               "note": "went on to the counsellor" }],

  "events": [{ "id": "e_…", "date": "2026-11-26", "endDate": "2026-11-28",
               "kind": "no-school|dropped|early-release|grades-due|conference|meeting|trip|reminder",
               "title": "Thanksgiving break",
               "classIds": [],        // empty = school-wide; named = just those classes
               "studentId": "", "notes": "" }],

  "templates": [{ "id": "t_…", "name": "", "audience": "guardian",
                  "tone": "concern|praise", "subject": "", "body": "" }],

  "signals": { /* thresholds, both directions — see below */ }
}
```

Seven shape decisions that matter:

- **Term ids are opaque.** `tm_…`, generated, unique, and never derived from a label — the same
  rule as `c_`, `s_`, `a_` and `k_`. No code anywhere compares a term id to a literal, switches on
  one, or parses meaning out of one, and `"Q1"` appears nowhere in `src/`; a check sweeps for it.
  A term's **label** is the only place a quarter is named, it is seeded as a whole word a teacher
  edits ("Quarter 1"), and renaming it changes nothing but the word. This matters because a
  hardcoded `Q1`–`Q4` is unsellable to a teacher on semesters or trimesters, and because an id that
  means something is an id someone eventually parses.
- **`archived` keeps a class and hides it.** An archived class keeps every attendance record,
  assignment and score and only leaves the tab bar. It is not deletion and it is not a soft delete
  pending cleanup — nothing ever collects it. Deletion is a separate, explicit operation offered
  only on an archived class, which is what keeps "get this out of my way" one cheap tap and
  "destroy a term of attendance" a dialog that counts what goes.
- **`scores` is keyed by assignment, then student**, so adding an assignment touches one key and
  entering a column of grades is one object.
- **A score cell is always an object**, never a bare number. Polymorphic cells (`87` here,
  `{v:87}` there) are where grade bugs live.
- **Attendance stores only exceptions.** Present is the absence of a mark. A class of 25 with two
  absences is two entries, not 25 — which is also why marking attendance is fast.
- **`U` means unconfirmed, and it is temporary.** Writing the first mark in a class also writes `U`
  for every student in it; confirming a student present deletes their entry. So a class you are
  part-way through holds a `U` for everyone you have not reached, and a class you have finished
  holds none — the rule above still describes the document at rest. **A `U` counts as an absence**
  wherever attendance is counted. *(Added 2026-08-06, WO-2.10. The owner's reasoning: an unmarked
  student should read as absent rather than present, so that a class interrupted mid-period records
  "I had not accounted for these students" instead of a silent room full of `P`. `U` never appears
  on a button, in a total, or in a report — it is scaffolding the finished record does not contain.)*
- **A class with no record at all is not a class of absences.** It is *not taken yet*, and it counts
  toward nothing. The `U`-is-absent rule applies only inside a class someone has started taking.
- **A mark cell is always an object**, never a bare code string — the same rule as a score cell, and
  for the same reason. `T` and `D` carry `at`, the moment the mark settled, from the device clock;
  any mark may carry a `note`. Both are simply absent where they do not apply. *(Added 2026-08-06,
  WO-2.10. Planbook recorded that a student was tardy and never when — never specified, so nothing
  could have caught it. Twenty minutes late and two minutes late are different conversations with a
  guardian, and Phase 5's templates want the difference.)* **The time lives in the cell and nowhere
  else** — a mirrored `log` entry would make one event into two records.
  Three details that follow, all settled in `src/attendance.js`:
  **`at` is a local ISO timestamp with its offset** (`2026-09-09T08:14:00-04:00`, never a `Z`), so
  the hour read back is the hour the teacher's clock showed.
  **`at` is written only on today's column**: the device clock is not evidence about a class two
  weeks ago, and a wrong arrival time beside a student's name is worse than none — a mark entered on
  a past day is `{ "code": "T" }` and no more.
  **A `U` carries nothing but its code.** No time, no note; it means nobody has looked at that
  student yet, and its whole entry is deleted the moment somebody does.
  **And a `D` may carry one field more — `passId`** *(added 2026-08-06, WO-2.8)*, the hall pass that
  dismissal closed, present only when there was one to close and never on any other code. It is on
  the cell because the link has to die at exactly the moment the `D` does, and the cell is the only
  record in the document whose lifetime is exactly the dismissal's; finding the pass by matching
  student and time instead would be the `name + time` join that made Roll Call!'s rows fragile.
  **The link is live only on today's column, in both directions** *(corrected 2026-08-07)*: a `D`
  typed onto a past day closes nothing, and editing a past-dated `D` reopens nothing. Yesterday's
  cell still carries yesterday's `passId`, and a past column is unlockable — so an ungated reopen
  would push a finished pass back into `openPasses` with yesterday's time out and delete a real
  dismissal out of the append-only history. A past-dated edit drops the field with the cell instead:
  the pass stays in `passes` as the honest record of a trip that did happen, and stops being
  undoable, which is the same accepted loss as the two class-level resets that wipe `marks`.
- **There is no schedule model.** A class met if it has an attendance record without an
  `exception`. Three distinct states — *met* · *dropped* · *not taken yet* — and the third is not
  the second. See [`../plans/rotating-schedule.md`](../plans/rotating-schedule.md).
- **`log` is append-only.** Roll Call! made hall passes append-only after matching rows by
  `name + time` proved fragile. Same reasoning, same answer.
- **Hall passes are two collections, and neither of them is `log`.** *(Added 2026-08-06, WO-2.8.)*
  `openPasses` is **state** — who is out of the room right now — and `passes` is **history**, one
  entry appended per pass that ended and never edited afterward. An open pass is in the document
  rather than in a module variable because that is the entire point of that work order: Roll Call!
  keeps `activePasses` in memory, and on an iPad PWA that iOS suspends and force-quits, that means
  losing track of a child who is physically out of the building. `passes` is not folded into `log`
  under a fourth `kind`, even though `log`'s append-only rule above cites hall passes as its
  precedent: `log` is the **outreach** record that Phase 4's cooldown reads and Phase 5's
  `{{behavior.recent}}` renders into an email, the two record shapes share no fields, and a pass in
  there is one missing `kind` filter away from a bathroom trip going home in a message. A pass is
  keyed by `studentId` and `classId` and holds no name, so renaming a student neither orphans nor
  re-attaches their passes. `minutes` is computed on return from the two stamps and stored, because
  it is the number a history view reads and it must not change if a clock does. The **local date**
  of a pass is the first ten characters of `out` and is deliberately not a second field.
  **A pass never touches attendance.** The one coupling runs one way: a `D` on today's column closes
  the student's open pass and records `endedBy: "dismissed"`, and taking that `D` back retracts that
  one entry by its id and puts the pass out again. That retraction is the only removal from
  `passes` there is, and it exists so that a mis-tap does not leave a trip in the history that never
  happened. The id it retracts by is on the `D` mark cell — see the cell rule above.
  **A pass may carry a `note`**, optional and absent where unused, exactly like a mark cell's
  *(added 2026-08-07, WO-2.11)*. It is typed on the banner card while the student is out, so it
  lives on the `openPasses` entry, and `closePass()` copies it onto the `passes` entry on the way
  past — a note that died on the return would be a note nothing could ever render. An empty or
  whitespace-only field deletes the key rather than storing `""`.
- **Cancelling a pass removes it from `openPasses` and writes nothing at all.** *(Added 2026-08-07,
  WO-2.11.)* A pass issued by mis-tap is not a trip: the student never left the room, so there is no
  history to append and `passes` is not read, written, or reached by `cancelPass()` — which is
  addressed by class and student and can only ever find an OPEN pass. **This is not a second
  exception to the rule above.** The retraction of a dismissal remains the only removal from
  `passes` there is. The alternative — cancelling as a return with `minutes: 0` — was rejected
  explicitly: it is the smaller change and it writes the phantom trip that cancelling exists to
  prevent, permanently, into the record Phase 4 reads as a signal. A note typed on a cancelled pass
  goes where the pass goes, which is nowhere.

## Grade math — weighted categories

Per category, `earned / possible` over that category's graded work. The final grade is the
weighted average of those, **with the weights of empty categories redistributed** — otherwise
every grade is wrong until each category has an assignment.

What each cell does to the math:

| Cell | Earned | Possible |
|---|---|---|
| `{ v: 87 }` | 87 | full points |
| `{ v: 78, flag: "late" }` | 78 | full points — **`late` is a record, not a penalty** |
| `{ v: null, flag: "missing" }` | 0 | full points |
| `{ v: null, flag: "excused" }` | — | — (drops out entirely) |
| no key | — | — (ungraded; invisible to the math) |

**Missing is marked, never inferred.** An earlier draft computed it from the due date — blank plus
past-due equalled zero. Explicit marking is better and it's what the owner asked for: the grade
never changes because a date rolled over, and a teacher who hasn't finished grading isn't
accidentally failing half the class. The due date is still useful, but only as a *prompt*: "6
blanks are past due — mark them missing?" A suggestion the teacher accepts, not arithmetic that
happens to them.

*(Built at WO-3.6, 2026-08-13, and the paragraph above is its specification word for word.* `src/past-due.js`
*owns it: a banner above the score grid and the assignment list, a review of the exact cells it means, and
one write of* `{ "v": null, "flag": "missing" }` *to those cells and no others. Three things it decided that
this paragraph did not say. **The set is narrower than "the cell is empty"**: a cell carrying no key at all,
or neither value nor flag — so an* `excused` *student is never swept (that would turn a decision into a
zero) and neither is a* `late` *with no score yet (that flag records that the work arrived). **A due date
that is today has not gone by**, and an empty one can never be past due. And **the dismissal is not in this
document**: it is* `planbook_pastDueDismissed` *in* `localStorage` — *an assignment id and* `true`, *nothing
from inside a year — because this file would otherwise have to carry a field, and a restore would resurrect
or destroy a UI nudge along with the grades.)*

`late` carries no penalty. If a penalty is ever wanted it becomes a per-category setting, and it
must be visible in the cell — a score that silently isn't what you typed is the worst thing a
gradebook can do.

**Category weights do not have to total 100 while a class is being set up, and nothing is blocked
while they don't.** A class halfway through totals 85; a class the teacher has not opened yet has no
categories at all. Neither is an error state and neither is refused — the editor says what the
weights come to and lets her carry on, because the alternative is an app that blocks setup until it
is perfect. Scores can still be entered the whole time. Weights are stored exactly as typed —
decimals included, and `0` is a real weight, which is how a teacher stops a category counting
without destroying the work filed under it.

**But there is no grade at all until they total 100.** *(Owner's decision, 2026-08-09.)* Not a
provisional figure, not a figure with a label on it, not a best guess — **no number.** Screens that
show a grade show its absence and the reason: *the weights come to 95%, so there is no grade yet.*
A class with no categories is the same case for the same reason.

This **replaces** the paragraph WO-3.1 added here on the morning of the same day, which said the
engine should divide by the actual total so "a class at 85 still produces a sensible weighted average
and only the label changes." That was written by the work order that shipped the categories editor,
which flagged it in its own result file as the thing to cut if it had legislated into WO-3.4's
territory. It had, and the legislation was wrong. **The scar worth keeping:** a weighted average over
weights that do not add up is arithmetic nobody asked for, dressed as an answer — and a teacher
mid-setup would have been shown a number, told it was provisional, and had no way to tell how far off
it was. Refusing to print one is both simpler and truer, and it deletes the whole question of what to
divide by.

`src/categories.js` owns the determination: `weightTotal(cls)` and `isProvisional(cls)`, both pure
functions of a class. **`isProvisional()` now means "this class has no grade", not "this grade is
provisional".** Its name and its copy are owed a correction — see the note in WO-3.1.

### Extra credit

**A zero-point assignment is the extra-credit mechanism.** *(Owner's decision, 2026-08-09.)* It
follows from `earned / possible` being summed over the category rather than averaged across
assignments: an assignment worth 0 points scored `5` adds 5 to that category's `earned` and 0 to its
`possible`. A student at 13/20 in Quizzes who earns 5 points of extra credit is at 18/20 — 90% — and
nothing special happened in the arithmetic.

Three consequences:

- **A category can exceed 100%, and so can the overall grade.** Nothing caps either. A cap would
  silently discard points the teacher deliberately awarded, which is the same failure as a score
  that isn't what you typed.
- **A category whose `possible` sums to zero has no percentage** — it is `n/0`, not `100%` and not
  `0%`. This happens when a category holds nothing but zero-point assignments. Treat it exactly like
  an empty category: its weight redistributes. **This is the one edge case that will crash a naive
  engine**, and it is reachable by a teacher who makes an "Extra credit" category and puts only
  extra credit in it.
- **No separate extra-credit flag, field, or category type exists**, and none should be added. The
  feature is the absence of a special case.

## Accommodations — the most sensitive data in the app

`supports` holds IEP and 504 accommodations, medical needs, and behavior plans. A teacher is
legally obligated to implement accommodations, which is exactly why "always prepared" means the
app has to surface them *at the moment of use* rather than filing them somewhere.

It also means this is the data that carries real consequences if it leaks. Four rules:

**1. Never visible by default on a screen that might be projected.** Teachers project attendance
and gradebooks onto classroom walls. IEP status on that wall is a disclosure to thirty students.
So: a discreet indicator only (a dot beside the name), details on deliberate tap, and a global
**presentation mode** that suppresses every sensitive field at once. The default state of any list
view is *not showing it*.

**2. Never in an outreach draft.** No merge field resolves accommodation, medical, or plan data —
not `{{signals.list}}`, not `{{behavior.recent}}`, nothing. An email to an administrator that
happens to quote a 504 plan is a disclosure incident, and a template system makes that a
one-keystroke mistake unless it's impossible by construction. **The merge-field resolver refuses
these paths rather than rendering them.**

**3. Surfaced where the work happens.** Creating a test prompts *"3 students have extended time,
2 need a separate setting."* Marking a student absent for the fourth time shows their plan has an
attendance clause. A list nobody opens protects nobody.

**4. It raises the stakes on backups.** The downloadable JSON now contains IEP and medical data. It
is the teacher's file on the teacher's disk — which is the correct posture, and the same one a
paper folder has — but the backup UI must say what's in it, and `docs/FERPA.md` must address this
directly rather than only discussing grades.

`reviewDate` earns its place by feeding the calendar: an annual review or a triennial re-evaluation
is a date teachers are expected to prepare for and routinely learn about a week out.

## Letter grades

`letterScale` is an ordered list of bands, document-wide with an optional per-class override. The
teacher defines the boundaries; the app never hardcodes 90/80/70. A percentage maps to the first
band whose `min` it meets.

This subsumes rounding: if 89.5 should be an A, the boundary is 89.5. There is no separate
rounding rule to disagree with the SIS about.

**A band has no id, and its upper bound is derived.** *(Written down at WO-3.2, which built the
editor and had to decide what "a gap" could mean for this shape.)* A band runs from its own `min` up
to — but not including — the lowest `min` above it in the list, so the bands are contiguous by
construction and **an interior gap is not expressible**: there is no second number to disagree with
the next band's. Two failures are, and `src/letter-scale.js` checks exactly those two, in the editor:

- **A band nothing can reach.** "First band whose `min` it meets" makes a band reachable only if its
  `min` is strictly below every `min` above it. An A at 89.5 sitting above an A− at 90 silently skips
  the A−. This is the "overlap" case, and it is why nothing sorts the list — sorting would repair a
  scale the teacher can see is wrong and hand her a letter she did not define.
- **A gap at the bottom.** The lowest reachable `min` above 0 leaves every percentage below it with no
  letter at all, which is why the seed puts F at 0. `letterFor()` answers "no letter" there rather
  than falling back to one.

The band is `{ letter, min }` with no id because nothing references a band — a category needs one
because assignments are filed under it; a band is only ever read positionally by the mapping.

## Signal thresholds

All configurable, stored in the document (not `localStorage` — they are the teacher's settings and
must survive a device change). One evaluator produces both lists; a student can appear on both at
once, and that is information rather than a bug.

### Concern

| Rule | Default |
|---|---|
| Current weighted grade below | 65% |
| Fell N points across the last N assignments | 10 pts / 4 |
| N consecutive scores under N% | 3 / 60% |
| N missing assignments | 3 |
| Attendance below N% | 90% |
| N absences within the last N **meetings** | 4 / 20 |
| N consecutive absences | 3 |
| N tardies | 5 |
| N behavior log entries within N days | 2 / 30 |

### Praise

| Rule | Default |
|---|---|
| Rose N points across the last N assignments | 8 pts / 4 |
| N consecutive scores at or above N% | 3 / 90% |
| Came off the concern list (turnaround) | within 21 days |
| No missing work across the last N assignments | 8 |
| Attendance at or above N% over the last N meetings | 100% / 20 |

**Praise ranks by delta, not by level.** "Top of the class" surfaces the same four students every
week and is worth nothing; "up 14 points since October" surfaces a different student each time and
is the message that actually lands at home. A rule that can only ever fire for high achievers is
the wrong rule.

**Windows count meetings, not days.** A class may go a week without meeting; "4 absences in the
last 20 days" would be nonsense. A meeting is an attendance record without an `exception`.

**Attendance % matches Roll Call!'s formula:** `(P+T+E+D) / (P+T+A+E+D)`. Excused absences and
dismissals sit in the numerator, so an excused absence doesn't damage a student's rate. The owner
reads both apps' numbers this year and they have to agree. See
[`../plans/rotating-schedule.md`](../plans/rotating-schedule.md).

### Cooldown

Every signal carries a cooldown read from the outreach `log`: a student contacted about the same
signal within N days (default 14) is suppressed. Without it the list is identical every week, the
teacher stops reading it, and the feature is dead — quietly, and without anyone deciding to kill it.

## Outreach templates

A template is subject + body with **merge fields**, resolved against one student at send time.

| Field | Resolves to |
|---|---|
| `{{student.first}}` `{{student.last}}` `{{student.nickname}}` | Name parts |
| `{{guardian.name}}` | The recipient guardian |
| `{{class.name}}` `{{teacher.name}}` | Context |
| `{{grade.percent}}` `{{grade.letter}}` | Current weighted grade |
| `{{grade.delta}}` | Change over the signal's window — the praise workhorse |
| `{{missing.count}}` `{{missing.list}}` | Missing work |
| `{{attendance.percent}}` `{{attendance.absences}}` `{{attendance.tardies}}` | Term totals |
| `{{signals.list}}` | Why this student surfaced, in plain sentences |
| `{{behavior.recent}}` | Recent behavior log entries |

**An unresolved field must never render blank.** "Dear ," going home is worse than sending
nothing. Unresolved fields render visibly (`{{guardian.name}}` intact) and block the send with a
named error. Every draft is editable before it goes, always.

## Events: only what can't be derived

`events` holds what the teacher types in — conferences, meetings, grades-due deadlines, breaks,
field trips. Everything else on the calendar is **computed at render** from data that already
exists:

| Shown on the calendar | Read from |
|---|---|
| Assignment due dates | `assignments[].due` |
| Term start and end | `classes[].terms[]` |
| Which classes met, and which were dropped | `attendance[]` |
| IEP/504 review dates | `students[].supports.reviewDate` |

Holidays and planned drops go the other way: they are **authored** as `no-school` / `dropped`
events and **read** by the attendance layer, never copied into attendance records. Delete the
holiday and every class follows. Precedence and the one rule protecting recorded history are in
[`../plans/rotating-schedule.md`](../plans/rotating-schedule.md).

Two details settled when those two kinds shipped *(WO-2.3, 2026-08-07 — `src/calendar.js` owns the
model and `src/days-off.js` is the only writer)*:

- **`endDate` is always written, and equals `date` on a one-day event.** A break is one entry with a
  range, never one entry per day — but the covering test is then `date <= on && on <= endDate` for
  every event, rather than a comparison that has to decide what an absent field meant. A reader
  still tolerates a missing `endDate` and treats it as a single day, which is the only thing it
  could honestly mean in a hand-edited or restored document.
- **`title` may be empty, and the screens say the kind's own word where it is.** It is the *reason*
  a covered column shows a teacher — "No school · Thanksgiving break" — so a required field with a
  default would print "No school · No school" for everybody who skipped it.

**Never copy a derived event into `events`.** Move an assignment's due date and the calendar has
to follow by itself; a stored copy creates two truths, and the one the teacher isn't looking at is
the one that's wrong.

Recurring events **materialize** into individual entries ("repeat weekly until 2026-12-19")
rather than storing a recurrence rule. Flat, hand-editable, and a single instance can be moved
without reasoning about exceptions to a rule.

## Importing from Roll Call!

One-time, zero permissions: the teacher exports a class spreadsheet from Drive as `.csv`/`.xlsx`
and drops it on a file input. The importer reads the `Raw Input` roster (Full Name, Nickname,
Student Email, Guardian 1/2 Name & Email, Counselor Name & Email, Graduation Year, Notes) and the
term tabs (students from row 6, dates from row 5, marks from column L). See Roll Call!'s
`CLAUDE.md` for the exact layout.

This is an import, not an integration — nothing stays coupled afterward.
