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
- **There is no schedule model.** A class met if it has an attendance record without an
  `exception`. Three distinct states — *met* · *dropped* · *not taken yet* — and the third is not
  the second. See [`../plans/rotating-schedule.md`](../plans/rotating-schedule.md).
- **`log` is append-only.** Roll Call! made hall passes append-only after matching rows by
  `name + time` proved fragile. Same reasoning, same answer.

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

`late` carries no penalty. If a penalty is ever wanted it becomes a per-category setting, and it
must be visible in the cell — a score that silently isn't what you typed is the worst thing a
gradebook can do.

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
