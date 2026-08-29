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

**The nag only fires on a document that holds something a teacher typed** — a fresh year has a
letter scale and nothing else, and a warning on day one is wallpaper by October. Which collections
count is `hasSomethingToLose()` in `src/backup.js`, and every top-level key of the sketch below is
either counted there or listed with the reason it is not. **Adding a collection to that sketch and
nowhere else turns `tools/wo-sweep.mjs` red** (§ 14) until it is classified, because the last two
collections added — WO-2.8's `openPasses` and `passes` — reached the document and never reached the
nag, and nothing noticed until a verifier read the line for another reason.

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
    // Copy (WO-1.22, src/classes.js's copyClass()): terms and categories come across, each with a
    // fresh id; name gets a "(copy)" suffix; archived, letterScale and roster do not come across —
    // a copy is a new class in every other respect, roster: [] always.
  }],

  "letterScale": [            // document-wide default, editable in Settings
    { "letter": "A",  "min": 93 }, { "letter": "A-", "min": 90 },
    { "letter": "B+", "min": 87 }, { "letter": "B",  "min": 83 }
    /* … down to F at 0 */
  ],

  "students": [{
    "id": "s_…", "first": "", "last": "", "nickname": "", "gradYear": "",
    // Two numbers, on the student and on the guardian both (WO-1.23). One export writes both
    // columns, so one splitting rule reads them: a cell holding "(508) 234-5678 (M), (508)
    // 345-6789 (H)" is one person's two numbers, and a third in the same cell is appended to
    // `phone2` rather than dropped. The (M)/(H) markers are stored verbatim — nothing in this app
    // branches on a phone number, and they are what the teacher reads at a glance.
    "email": "", "phone": "", "phone2": "",
    "guardians": [{ "name": "", "relation": "", "email": "", "phone": "", "phone2": "",
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
      "behaviorPlan": "",
      // What the plan says about ATTENDANCE, free text, added 2026-08-24 (WO-4.4). Absent in every
      // document written before that build and read as empty, the same tolerance every field in
      // this block already has — no migration and no schemaVersion bump, because it is nested
      // inside `students[]` and parseBackup() validates the TOP-LEVEL keys of newYearDocument().
      // See the shape decision under this sketch for why it is a field and not a 13th accommodation
      // kind.
      "attendanceClause": ""
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
            "subject": "", "body": "",
            "ruleId": "" }],   // `contact` only — which signal prompted it. See § log below.

  /* Hall passes, in two collections — state and history. See the shape decision below.
     `note` is optional on both and absent where unused, the same rule as a mark cell's. */
  "openPasses": [{ "id": "p_…", "studentId": "s_…", "classId": "c_…",
                   "type": "bathroom|nurse|quick",
                   "out": "2026-09-09T09:12:00-04:00",
                   "alerted": 1,                    // 1 or 2, absent until an overdue alert fires
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
               "studentId": "", "notes": "",
               "seriesId": "" }],     // "" unless this was materialized by a repeat — see Events

  "templates": [{ "id": "t_…", "name": "", "audience": "guardian",
                  "tone": "concern|praise", "subject": "", "body": "" }],

  "signals": { /* thresholds, both directions — see below */ },

  /* The calendar's own settings. The BLOCK and the key are both absent until a teacher tunes the
     lead time — absent IS the default, the same rule `signals` follows above, and `newYearDocument()`
     deliberately does not seed this one. See § Events. */
  "calendar": { "gradesDueLeadDays": 3 }
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
  `{v:87}` there) are where grade bugs live. **`v` carries at most two decimal places**, and the
  score cell takes nothing else — an optional leading `-`, digits, at most one `.`, at most two
  digits after it. *(Added 2026-08-17, WO-3.25.)* Two decimals because **the SIS carries two and
  this number is re-keyed into it by hand**, and because `toFixed(2)` is already how every
  percentage in this app is printed. **It is a rule about NOTATION and never about a value**: a
  score above the assignment's points is extra credit and is stored unchanged, `-5` is a penalty the
  teacher meant and is stored as `-5`, and nothing here clamps or rounds. What it refuses is the set
  of strings `Number()` reads and a gradebook does not — until that work order `1e3` stored `1000`,
  `0x1f` stored `31` and `+7` stored `7`, all measured rather than supposed. **Cells written before
  it are not migrated**: a `12.3456789` already in a document stays, renders as typed, and can be
  edited down but not extended, because retro-rounding a number a teacher already typed is the
  silent wrong number this rule exists to prevent, wearing a fix's clothes.
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
  `name + time` proved fragile. Same reasoning, same answer. **There is no correction mechanism and
  that is a ruling rather than a gap** *(the owner, 2026-08-20, after a round trip; built at
  WO-4.4)*: a correction is **an ordinary later entry that says so** — no `correctsId`, no
  strikethrough, no delete, and no rule about which of two entries a reader should believe. The
  ruling first arrived as *"you can just delete and re-enter"*, which would have reversed this line,
  WO-4.4's Append-only deliverable and its acceptance line in one move; it was put back the same day
  and settled the other way. **Nothing in the log is deletable.** `src/log.js` is the only writer and
  the only thing it does to the document is `push`.
- **Three kinds share `log[]`, and the `kind` filter is the whole of the firewall between them.**
  `behavior` and `note` are written by WO-4.4's sheet off a roster row; `contact` is Phase 5's record
  of outreach that actually left the building, which the cooldown reads and `{{behavior.recent}}`
  renders into an email. A behavior note is one missing filter away from going home in a message, so
  every reader in `src/log.js` names the kinds it wants and **there is no exported reader that hands
  back the whole array**. The second half of that firewall is `audience`: an entry written by the
  teacher for herself carries `audience: ""` — it went to nobody, which is the truth — rather than a
  value the cooldown could count as outreach.
- **`ruleId` is on a `contact` entry and on nothing else, and it is what makes the cooldown
  possible** *(named WO-4.5, 2026-08-27; written by WO-5.3)*. It carries `src/signals.js`'s own
  `hit.ruleId` unchanged — `grade-fell`, `absence-run`, `grade-rose` — so the two vocabularies are
  one and nothing has to map between them. **The cooldown keys on `studentId + ruleId`**, which is
  that work order's stated trap: keyed on the student alone it hides a NEW problem because you
  emailed about an OLD one, so a student written home about for a grade fall on Monday is still on
  Tuesday's list for four missing assignments.

  **Nothing in this build writes one.** `newLogEntry()` writes the seven fields above for the two
  kinds this app authors, and a `ruleId: ""` on every behavior note would be an eighth field that
  never means anything, paid for by every document, for a kind Phase 5 owns. So **the reader
  tolerates its absence and a contact without one silences nothing** — it is about no signal anybody
  can name. That under-fires rather than over-claims, which is the same posture the turnaround rule
  takes: a duplicate email costs a teacher a minute, and a contact of unknown subject silencing
  every signal is this work order's trap arriving through a missing field.

  **The cooldown is therefore class-blind, because the record is** (see the bullet below). An email
  about a grade fall silences that student's grade-fall row in every section she is in, since
  `log[]` cannot say which one it was about. WO-5.3 may decide otherwise when it writes the first
  one; what it must not do is infer a class from whichever roster the send was started on.
- **A log entry carries no `classId`, and that is the shape rather than an omission.** It is a
  record about a child, so "two behavior notes in the last 30 days" counts across every class she is
  in, and the concern rule fires in both sections of a student the teacher has twice. Inferring a
  class from whichever roster the entry was written on would be a join on something the document
  does not store.
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
  **An OPEN pass may also carry `alerted`** *(added 2026-08-13, WO-2.9)*, `1` or `2`: the highest
  overdue alert this trip has already produced, at five and ten minutes out. It is absent until the
  first one fires and it exists so that "each alert fires once" survives a repaint, a reload and a
  force-quit — the same reason the pass itself is a record rather than a module variable, since the
  screen that decides to alert re-renders every second. **It is the one pass field that does not
  cross into history**: `closePass()` builds its entry field by field and this is not one of them,
  so a finished trip records how long it took and not what the app said about it while it was
  happening. Nothing resets it, because nothing has to — the record it lives on is gone the moment
  the student is back, and a student sent out again gets a new pass with no `alerted` on it. The
  **elapsed** time a card shows is not stored anywhere at all: it is `now` minus `out`, computed at
  every paint, because iOS suspends timers in a backgrounded PWA and a stored count would come back
  wrong without saying so.
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
these paths rather than rendering them.** It is `src/merge-fields.js` since WO-5.1, and *how* it
refuses is the part worth carrying: it holds a **whitelist** of the sixteen names § Outreach
templates tabulates and matches a token against it by exact string, so a path into this block is
refused because it is not on a list rather than because it is on one. A blacklist of forbidden
paths would fail open the day a field is added to this block; a whitelist fails closed. `{{signals.list}}`
and `{{behavior.recent}}` are argued field by field in that section, including the one limit the
code cannot close.

**3. Surfaced where the work happens.** Creating a test prompts *"3 students have extended time,
2 need a separate setting."* Marking a student absent for the fourth time shows their plan has an
attendance clause. A list nobody opens protects nobody.

**4. It raises the stakes on backups.** The downloadable JSON now contains IEP and medical data. It
is the teacher's file on the teacher's disk — which is the correct posture, and the same one a
paper folder has — but the backup UI must say what's in it, and `docs/FERPA.md` must address this
directly rather than only discussing grades.

`reviewDate` earns its place by feeding the calendar: an annual review or a triennial re-evaluation
is a date teachers are expected to prepare for and routinely learn about a week out.

### The attendance clause — the field WO-4.4 had to shape *(2026-08-24)*

`supports.attendanceClause` is free text holding what the plan says about a student's **attendance**:
excused absences, a late arrival the plan allows, a re-entry routine. It is the second half of rule 3
above — *"marking a student absent for the fourth time shows their plan has an attendance clause"* —
which WO-3.8 built the assignment-editor half of and could not build this half of, because there was
no field to read.

**It is a field beside `medical` and `behaviorPlan`, and not a thirteenth accommodation kind.** That
was the alternative and it is the wrong shape twice over. An accommodation row is scoped by
`appliesTo`, which names **kinds of work** — tests, quizzes, homework — and attendance is not one, so
the field would be meaningless on the row; worse, its documented default (*empty means everything*)
would make every such row fire the assignment editor's accommodation prompt on every assignment in
the year. Stopping that would take a rule about one kind, living in a second file, asked by a prompt
that has nothing to do with attendance. The plainer reading is the true one: an attendance clause is
a clause of a plan, like a behavior plan, not an adjustment to a piece of work.

The name is `attendanceClause` rather than `attendance` because this app already has attendance —
a ledger, a dozen readers — and `supports.attendance` in a grep for that word is a name that will be
misread; and rather than `attendancePlan`, which reads as a separate document that does not exist.

**Where it surfaces, and nowhere else.** Marking a student absent on the registry when that trips the
`absence-window` signal rule — *N absences within the last N meetings*, the teacher's own numbers,
**with no new threshold key** (the owner, 2026-08-20) — raises the prompt, and the clause itself is
behind one deliberate tap. Rules 1, 2 and 4 above cover it unchanged: absent from the DOM in
presentation mode, in no merge field, on no printout or export, and in the backup, which
[`FERPA.md`](FERPA.md) and [`../privacy.html`](../privacy.html) name it in.

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

**The turnaround is derived, and nothing in the document remembers who was on a list** (WO-4.3).
"Came off the concern list" is answered by running the same evaluator over the same document with
`through` set back to the far edge of the window — a *prior evaluation*, not a stored bit. A bit
would go stale the moment a threshold moved, and it would be a second truth about who was flagged,
sitting beside the rules that decide it. **There is no `wasFlagged` field, and there must never be
one.** Two consequences follow and both are honest limits rather than defects. The rule is asked
**once**, at the edge of the window, not once per day inside it: walking the window costs twenty-one
full passes per student per class, so a student flagged ten days ago and clear since is not caught.
And only the rules whose facts are **dated** can differ across the gap — the attendance ledger and
the log are dated, a score is not, and no window here is taken by due date (§ Grade math, and
`src/assignments.js`'s refusal to sort by one). **A grade recovery on its own therefore produces no
turnaround**; it produces "rose N points across the last N assignments", which is the better
sentence for it. The reasoning is at `src/signals.js`'s `turnaround`.

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

**It is derived at read time and there is no suppression store** *(WO-4.5)*. `src/signals.js`'s
`applyCooldown()` reads `log[]` and `cooldownDays` and returns two arrays — what the column draws,
and what it took out — and it writes nothing. `newYearDocument()` gained no field, the document is
byte-identical either side of a pass, and **restoring a backup restores the cooldowns** because the
log that produced them is in the backup. A `suppressedUntil` on a hit would be a second truth about
who is on the list, sitting beside the log that decides it, going stale the first time a threshold
moved — the same argument `wasFlagged` loses under § Praise above.

**The window is inclusive and counted off the day being asked about**, exactly as the behavior
window is: `cooldownDays` of 14 covers the day the contact went out and the thirteen after it, and
the student is back on the fourteenth. A suppressed row on the list **names the contact that
silenced it and the date it comes back** — "3 suppressed" with no names is indistinguishable from a
list that has quietly lost three students — and carries *Write anyway*, because the cooldown
suggests and does not hold the door shut *(the owner, 2026-08-20)*.

### The quiet middle

Students who are **neither flagged, nor praised, nor contacted this term**, listed per class and
ranked by **how long it has been** since anything was written down, said, or sent about them.
`src/signals.js`'s `quietMiddle()` is the one answer: it is the list the signals screen's third
panel draws and the count WO-6.4's `The quiet middle · N` opens onto, so the two cannot be a
student apart.

Three rulings in it are decisions rather than plumbing:

- **A note to self is not an exclusion, it is the clock.** "Flagged, praised, or contacted" is the
  whole of what takes a student off this list; a teacher who wrote *ask about the science fair* has
  not been in touch with anybody. What the note does is move her down the ranking, which is the
  right place for her rather than off the page.
- **It is a third list and not a third column.** The concern and praise columns share a ranking —
  how much changed — and this one does not. Drawing it beside them would say it shares theirs.
- **It costs one grade per quiet student and nothing else.** The sentence names the grade because
  that is the fact that answers *why did I lose track of her*; it does not say "and steady", or
  "no missing work, no absences", because each of those is a rule the engine already has, run a
  second time outside the pass that owns it, to report that it did not fire.

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

**`src/merge-fields.js` is the one resolver** *(WO-5.1)*, and **that table is its whitelist** — a
flat list of exactly those sixteen names, each with the function that answers it, matched by exact
string and by nothing else. There is no path expression anywhere in the file and no walk from the
document root, which is the difference this phase turns on: a blacklist of forbidden paths fails
open the moment a field is added to this document, and a whitelist fails closed. `tools/wo-sweep.mjs`
§ 20 reconciles the table above against that list name for name and in both directions, and asserts
separately that no support identifier appears in the module's code at all — only inside string
literals and prose — and, since WO-1.32, that there is no dynamic property read in it either: no
bracket subscript whose key is not an integer literal, no split, no fold, no `eval`, no
`new Function`, no `Reflect.get`. The two are the name and the shape, and the second was added
because a path expression names nothing the first is looking for. **Change a row of that table and
change the module in the same sitting**; the sweep says which way it went.

Five rulings inside it are decisions rather than plumbing:

- **A refused path, an unknown name and an unresolvable field are three outcomes**, named
  `refused-field`, `unknown-field` and `unresolved-field`. All three block, and **all three leave
  the token on the page exactly as the teacher typed it** — including the refused one, which is the
  safe reading of *"it does not render"*: a literal `{{supports.medical}}` in a body carries no
  student's data and cannot be mistaken for a finished sentence, where a dropped or blanked token
  produces a draft that reads clean and could be sent.
- **The empty string is not an answer.** A resolver hands back a string or `null`, and a blank is
  rounded to `null` at one choke point rather than in sixteen places. That is the rule above made
  structural.
- **A count resolves at zero and a list does not.** `{{missing.count}}` answers `0`, which is a true
  sentence; `{{missing.list}}` with nothing in it is *"he is missing: "* going home.
- **`{{signals.list}}` is safe by construction and is not re-filtered.** A signal rule is handed its
  own measured numbers and a small object of names, so an explanation is arithmetic and two names —
  see § Signal thresholds and `src/signals.js`'s own header. A substring filter over it here would
  go green forever while teaching the next reader that the engine is untrusted. If a rule is ever
  found putting a string it was handed into a sentence, that is a defect in `src/signals.js`.
- **`{{behavior.recent}}` carries a date and a `subject`, three entries, newest first — never a
  `body`, and only the `behavior` kind.** The body is the long free-text half and the place a plan
  reference would actually be written; the kind is asked for by name, so a note to self and a
  `contact` cannot arrive through a widened default. **The limit this cannot close is stated rather
  than glossed:** a subject is still free text, and a teacher who types a plan reference into one
  will see it in her draft. That is the same open edge § Accommodations records for a note under a
  projector. **Presentation mode is deliberately not asked** — it is the *screen's* suppression and
  an email to a guardian is not a projector, so the obligation lands on the live preview
  (WO-5.2), which asks `src/supports.js` before it draws a resolved body.

### Where a template is written, and where the eight come from

**`src/templates.js` owns the record and `src/templates-view.js` is the screen over it** *(WO-5.2)*.
The model holds what a record is, the two vocabularies it is filed under, three writers, and the
question the send flow asks — `templatesFor(doc, tone, audience)`, filtered on **both**, which is
what makes "a concern template and a praise template for the same audience are offered separately"
a property of the collection rather than of a screen. The editor is reached from the **fourth icon
in the header**, not from the class switcher: a template is about no class at all, and
`{{class.name}}` resolves per draft at send time.

Four rulings there are decisions rather than plumbing:

- **The eight starter templates are shipped TEXT, not document rows.** Both tones for each of the
  four audiences, written out in full, offered in the list — and **written into `templates[]` only
  by a Save**. `newYearDocument()` gains nothing, so no backup written by an earlier build is
  refused, and a teacher who deletes all eight does not get them back on the next restore. The
  editor opens **empty**; auto-loading one would put identical sentences one keystroke away from a
  hundred guardians (the owner, 2026-08-28).
- **Every `{{token}}` in those eight is on the whitelist**, and it is reconciled against
  `mergeFieldNames()` by `tools/verify/templates.mjs` rather than against a second list. They are
  the app's own prose going into a teacher's document, so a starter naming a support field would be
  *this app* suggesting the disclosure — a red run, not a draft that merely refuses to send.
- **The preview asks `presentationMode()` and suppresses ONE COLUMN.** This is the obligation the
  bullet above lands on WO-5.2, discharged. It is narrower than `src/signals-view.js`'s refusal on
  purpose: the list, the editor and the palette are the teacher's own writing and name nobody, while
  a resolved draft names a child. Nothing is resolved at all while the mode is on, and the student
  picker is emptied rather than merely hidden.
- **The block strip is permanent** — green when nothing is wrong, amber when something is — because
  a strip that appears only on failure is read as an error banner and one that is always there is a
  report. WO-5.3 reads the same `blocked` flag off the same call to decide whether its send button
  is live.

### Where a draft is sent from, and what leaves the app

**`src/outreach.js` owns who a draft can go to and `src/outreach-view.js` is the modal over it**
*(WO-5.3)*. The flow is reached from the signal card and from the student record, resolves one
template against one student through `src/merge-fields.js`, and ends at an
`<a href="mailto:…">` — **the app sends nothing, ever, in any form**. That is CLAUDE.md's
architecture rather than this screen's preference: a mail scope reads "Send email as you" on the
consent screen, and the teacher's own sent-mail record only stays intact if the message leaves from
her own client.

**It writes nothing to this document.** No collection is touched, `newYearDocument()` gained
nothing, and `rev` is unchanged across a whole draft. The `contact` entry in `log[]` — with the
`ruleId` the cooldown keys on — is WO-5.4's and is the only thing this flow will ever write.

Five rulings there are decisions rather than plumbing:

- **A RECIPIENT is a person with an address; an AUDIENCE is the drawer a template is filed under.**
  `students[].guardians[]` is an array and the picker offers one chip per guardian, by POSITION —
  *Guardian 1*, *Guardian 2* — plus the counselor, the administrator from `teacher.adminEmail`, and
  the student herself. All of them map onto the four `AUDIENCES` values, both guardians onto
  `guardian`, and **that enum is not widened**: what makes a message personal is
  `{{guardian.name}}`, which resolves to the guardian the teacher picked rather than to the
  preferred one.
- **`students[].counselor` is a roster contact and `supports.caseManager` is not.** They are two
  different people in this schema and one of them is behind the fence in § Accommodations. Nothing
  in the send flow reads a support block, and there is no path from the picker to one.
- **A recipient with no email address is offered and blocks.** Left off the list he reads as a
  missing feature; on it with a named reason he reads as a missing address. The app never opens a
  mail window with an empty To field.
- **The draft is resolved once and is the teacher's from the first keystroke.** Editable before
  sending, always. After the resolve, what blocks the handoff is any `{{…}}` still in the boxes —
  the resolver's own sentence, *"until it is corrected or removed"*, answered at the end that can
  see the correction. Nothing re-resolves her edits: that would either overwrite what she typed or
  call a literal `{{grade.percent}}` resolved on its way out.
- **`mailto:` has a practical ceiling of about 2,000 characters** of assembled, percent-encoded URL,
  and the binding constraint is the Windows desktop — `ShellExecute` caps at 2,083 and Outlook's
  handler cuts at ~2,048, where macOS and iOS Mail carry several thousand. **Planbook truncates
  nothing**: it warns before the fact and hands the whole URL over. `src/outreach.js`'s
  `MAILTO_CEILING` carries the number and the working.

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

**`src/calendar-derived.js` is the one reader of that table** *(WO-6.2)*, and it has no writer in
it: one exported function per row, plus `derivedItemsIn()` which returns all four in date order.
It is a third module rather than more of `src/calendar.js` for a mechanical reason — it reads the
attendance ledger through `src/attendance.js`, which imports `src/calendar.js`, so the derived half
living in the model would close an import loop. Three of its rulings are decisions rather than
plumbing and are stated here because a later reader will otherwise re-derive them:

- **A weekday with no attendance record and no authored exception over it yields nothing at all** —
  not `NOT_TAKEN`, which is `stateOf()`'s *did-I-forget* answer and is a fact about the ledger
  rather than about the class. Nothing in that module enumerates weekdays or asks which classes were
  expected to meet; `plans/rotating-schedule.md` is why.
- **A school-wide `no-school` produces no per-class row either.** It names no class, and expanding it
  into one row per class would be the calendar deciding what a shut school implies about five of
  them. The event is authored, so the calendar already draws it in its own right.
- **A review date reaches the calendar as `{ date, studentId, name }` and nothing else**, and as
  nothing at all while presentation mode is on — suppressed rather than redacted, because an
  unlabelled marker still says *this student has something on file* to a projected room. That is
  rule 1 of § Accommodations, asked through `supportsVisible()` at the point the datum is produced
  rather than at the point it is drawn.

**`src/calendar-view.js` is the screen over that table** *(WO-6.3)* — the month and the week, and
the sixth view in `<main>`. It computes no row of its own and holds no cache: what it decides is
which of those rows a given screen SHOWS, and three of those decisions are rulings rather than
plumbing:

- **A per-class meeting state is drawn on a week, or on a month filtered to one class, and not
  otherwise.** Five classes across twenty weekdays is a hundred `Taken` chips — the wall of amber
  the bullet above refuses, in the reassuring colour. With every class showing, a month says what is
  *on* the calendar; picking a class is one tap. The screen says so in words under the grid, because
  an absence and a bug look identical.
- **A review date follows its student through the class filter** — shown for a class that student is
  on the roster of, and not for one they are not. This is the question `src/calendar-derived.js`
  deliberately declined to answer on the screen's behalf. It is a plain roster read and touches
  nothing in `supports`.
- **No printout of a calendar emits a review date, whatever presentation mode says.** The mode is
  the *screen's* suppression and a teacher can legitimately have it off; a sheet that has left the
  building cannot be taken back. `src/calendar-view.css` removes the chip under the print gate and
  again in one deliberately ungated rule — the only rule in that file outside a gate, because it can
  only ever subtract, and rounding an unanswerable question toward hiding is `src/supports.js`'s own
  rule for exactly this data.

### The record, field for field

Nine fields, and **`newEvent()` in `src/calendar.js` writes every one of them on every event** —
including the ones the surface that authored it had nothing to put in. One shape means the calendar
never has to ask which build, or which of the two authoring screens, wrote a row.

| Field | | |
|---|---|---|
| `id` | `e_…` | opaque, like every id here |
| `date` | `2026-11-26` | ISO, and compared as a string everywhere |
| `endDate` | `2026-11-28` | always written; equals `date` on a one-day event |
| `kind` | one of the eight above | |
| `title` | `Thanksgiving break` | may be empty — see below |
| `classIds` | `[]` | empty = school-wide; named = just those classes |
| `studentId` | `""` | optional; the student a conference or a reminder is about |
| `notes` | `""` | optional; the teacher's own line |
| `seriesId` | `""` | `es_…` on every instance of one materialized repeat, `""` otherwise |

**The `seriesId` is a label, not a rule.** It stores nothing about the recurrence — not the
interval, not the end date, not which instance this is — and nothing is ever recomputed from it.
It exists so that *delete the whole series* can find the rows, and the alternative it replaces is
matching on title and kind, which also deletes the second *Faculty meeting* the teacher typed by
hand. See the materialization rule at the foot of this section.

### The grades-due lead time

`calendar.gradesDueLeadDays` — a whole-document setting, **not** a field on an event. How many days
before a `grades-due` date the deadline starts appearing on the glance page's *Deadlines closing
in* (WO-6.4). Default **3**, which is the shortest warning that always covers a weekend.

It lives in the document rather than under `planbook_` for the reason § Signal thresholds gives:
it is the teacher's setting, not this browser's, so it has to survive a device change and travel
with the year. And **an absent key IS the default** — the same rule as a signal threshold, and for
the same reason. Every document written before WO-6.1 is missing it, a reader has to answer for
that anyway, and a stored copy of today's number would pin a teacher who never opened the field to
a default that can never be re-tuned. Read it through `leadDaysOf()`, never off `doc.calendar`.

One warning surface, not two: the lead time is *stored and validated* by the event model and
*shown* by the glance page. A banner of the authoring screen's own would be a second answer to one
question.

### The two details settled when the first two kinds shipped

*(WO-2.3, 2026-08-07 — `src/calendar.js` owns the model and `src/days-off.js` is the only writer of
the two kinds attendance reads; since WO-6.1 `src/events.js` writes the other six, and the rules
protecting the array are the model's rather than either screen's.)*

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
without reasoning about exceptions to a rule. *RRULE is V2, if ever.*

Three things follow, all of them settled by WO-6.1 in `src/calendar.js`'s `newSeries()`:

- **The instances are independent from the moment they are written.** Each carries its own `id`,
  its own dates and its own everything else. Moving the third one moves the third one; there is no
  rule for it to become an exception to.
- **They share a `seriesId`, and that is the whole of what "the series" means afterwards.** Delete
  it and every instance goes; nothing recomputes, because nothing was stored to recompute from.
- **A repeat skips nothing** — not weekends, not holidays, and above all not "the days that class
  doesn't meet". The last of those would need to know which classes are expected to meet on a date,
  which is the cycle model [`../plans/rotating-schedule.md`](../plans/rotating-schedule.md) removed
  on the day it was designed. Every seventh day gets an entry and the teacher deletes the one she
  doesn't want. There is a ceiling of 60 instances so that a mistyped year cannot fill a document.

## Importing from Roll Call!

One-time, zero permissions: the teacher exports a class spreadsheet from Drive as `.csv`/`.xlsx`
and drops it on a file input. The importer reads the `Raw Input` roster (Full Name, Nickname,
Student Email, Guardian 1/2 Name & Email, Counselor Name & Email, Graduation Year, Notes) and the
term tabs (students from row 6, dates from row 5, marks from column L). See Roll Call!'s
`CLAUDE.md` for the exact layout.

This is an import, not an integration — nothing stays coupled afterward.

## Importing the SIS contact list

**How this differs from the one above:** that one is a **one-time migration** off the predecessor
app, still `⏳ DEFERRED` (WO-2.7), and it carries a whole year — roster *and* attendance marks. This
one is **live and per class**, run whenever the section's contacts change, and it carries contacts
only. Two importers, two files, two shapes; they share nothing but a file input.

The school system exports one `.csv` per section, eight comma-delimited columns with RFC-4180
quoting and no reliable header row: **Student Name · Student Email · Student Phone · Advisor ·
Advisor Email · Parents · Parent Phone · Parent Email**. A student's second guardian is on a
*continuation row* underneath them with the first five columns empty, so **column 1 is the grouping
key** — a row with a name starts a student, a row without one adds a guardian to the student above,
and the all-empty spacer row means nothing. `src/roster-import.js` reads it; the preview shows every
student before anything is written.

The mapping, which is the owner's and not the importer's to revisit:

| Column | Lands on | Note |
|---|---|---|
| Student Name | `first`, `last`, `nickname`, `gradYear` | `Last, First (Nickname) 'YY`; `'28` stores as `"2028"`, a string |
| Student Email / Phone | `email`, `phone`, `phone2` | a cell with two numbers splits |
| Advisor / Advisor Email | `counselor.name`, `counselor.email` | the SIS's word for the same person; `Smith, Mike` is stored **flipped**, as `Mike Smith`, because that string renders into an outreach sentence |
| Parents / Parent Phone / Parent Email | one `guardians[]` entry | `relation` is left **empty** — `Mr.`/`Mrs.` is a title, not a relationship, and `{{guardian.relation}}` reaches an email |

Two writing rules make a re-import safe: **a non-empty imported value wins**, because the SIS is the
official record; **an empty cell never clears anything**, so a column the export omitted cannot
delete a number the teacher typed. A student already in the year is *linked* into the class rather
than copied, a guardian is matched on email and then on name rather than stacked, and **nobody is
ever removed** by an import.

**Nothing under `supports` is reachable from this file.** Accommodations, plans, medical needs and
case managers are not in the export and never will be — they arrive per student through a different
channel — so a contacts CSV in iCloud Drive is not a disclosure, which is the position § Accommodations
takes about what may leave the app. A future column called `Notes` or `Alerts` does not change that:
mapping one there is a new work order and an owner decision.
