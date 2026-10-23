# Closing a quarter: record what went to the SIS, and say when it stops matching

**Design thread — [`design-threads.md`](design-threads.md). Status: drawn** (2026-10-23, in
[`design/mockups/closing-a-quarter.html`](../design/mockups/closing-a-quarter.html)) — **five of the
drawing's seven questions answered 2026-10-23; two recommendations await a nod, and question 6 is
open.** Started 2026-10-23; the thread's first
thirteen questions were answered the same day. **A soft clock**
(the owner, 2026-10-23): useful for Q1 if it lands within about two weeks of 2026-10-31, but not a
deadline.

**Why now.** Quarter 1 ends 2026-10-31 and Quarter 2 starts 2026-11-01. Grades are re-keyed into
Blackbaud by hand, and the **letter** is the figure that leaves Planbook (`future-features.md` § 3).
Nothing in the app knows a quarter has been keyed, so after that point any of these quietly changes
Planbook's Q1 grade while Blackbaud keeps the old one: editing or excusing a Q1 score, a category
weight, the letter scale, a *drop lowest* count (WO-3.69 — the setting is per class and covers every
term), or a due date moved into Q1. Two grades for one student, and nothing on screen to say so.

## Ruled by the owner, 2026-10-23

1. **Grade changes after a quarter ends are allowed.** They happen for about two weeks after it
   ends, and later only in very rare cases. **No lock** — a closed quarter stays editable.
2. **A closing dialog carries over the quarter's grades and writes them to a new entry in the
   document.** That entry is what was sent to the SIS.
3. **Changing a grade afterwards brings a reminder** that this class and quarter need their grades
   recorded again.
4. **There may be a confirmation that the grades match what is in the SIS.**
5. **Grading settings stay per class, not per term, for now.** Not changing weights, the scale or a
   drop count after a quarter is keyed is the teacher's own practice. Per-term settings may come
   later; this thread does not build them.

## The direction

The recorded grade is **a fact the teacher did**, like a contact log entry, so storing it is
consistent with *everything the teacher did not type is computed at render, never stored* — the
live grade stays computed, and the record is what the teacher confirmed. **Whether the two still
agree is derived at read time**, the way concern state is (CLAUDE.md, WO-4.3): no "changed since"
bit is written by an edit, so no edit path can forget to set it.

```
Quarter ends ─▶ Close Q1 for English III (dialog)
                   each student · live % · letter
                   [ These match Blackbaud — record them ]
                         │
                         ▼
                record written (class, term, per student: letter, %), stamped
                         │
     later: a Q1 score, weight, scale or drop changes
                         │
                         ▼
         live letter ≠ recorded letter for 2 students
         ─▶ "Q1 for English III no longer matches what you recorded —
             2 students. Update Blackbaud, then record again."
```

## The eleven questions, answered 2026-10-23

Each keeps its proposal; the owner's answer follows it.

1. **What is recorded: the letter, or the letter and the percentage?** Proposed: both, but the
   **letter is what is compared**, because the letter is what the SIS holds. A percentage that moves
   inside the same letter raises no reminder.
   **Answered: both, the letter and the percentage.** Blackbaud also holds a GPA, reached through a
   conversion loop to be talked about later (`future-features.md` § 3); the percentage and the letter
   are the starting point.
2. **One class at a time, or all five in one dialog?** Proposed: one class at a time, since
   Blackbaud is keyed one class at a time, with a door from each class.
   **Answered: one at a time.**
3. **A second recording overwrites, or appends?** Proposed: **appends, and the newest wins** — the
   log's rule. It keeps the history of grade changes (what was sent on 11/3, and what on 11/10) at
   no cost, and nothing in the app deletes it.
   **Answered: appends, like the contact log.**
4. **Where the reminder shows.** Proposed: a line on that class's card on the home screen and on
   Scores while the quarter disagrees with its record, naming the count of students. Possibly a
   one-time note at the moment of the edit. Which of these, or all?
   **Answered: a notice when the app moves to the next quarter** — *This quarter's grades have
   changed* — naming exactly who changed and how, in the manner of the grading-mode confirmation
   (WO-3.31, `previewModeChange()`), whose figures are the engine's. See § The trigger below.
5. **What *these match Blackbaud* means.** Proposed: the record button **is** the confirmation —
   one tap that says "I have keyed these" — rather than a separate checkbox step. Or should recording
   come first, with a separate "matches the SIS" tick afterwards?
   **Answered: one tap.** The record button is the confirmation.
6. **Is the two-week window modelled?** Proposed: no date limit and no lock (ruling 1). The reminder
   could word itself differently after two weeks ("this may need a grade change form") — or not at
   all.
   **Answered: no.** The two weeks were context, not a rule. No lock, no date limit, no change of
   wording.
7. **When the dialog is offered.** Proposed: from the term's end date (derived, as *Closing in*
   already derives term edges), and from a door on Scores for that term. Should the grades-due event
   be the trigger instead?
   **Answered: when the quarter changes after the quarter has closed, and the owner is open to a
   recommendation — perhaps a nag bar like the backup's.** Recommendation in § The trigger below.
8. **Unfinished work at closing.** A held column counts toward nothing, and ungraded or past-due
   blanks change nothing. Proposed: the dialog names them (*2 held columns, 5 blank past-due cells*)
   with a way to deal with them first, but does not block recording.
   **Answered: one flag, *there are empty boxes*,** for any cell that is not scored and not marked —
   not `X`, not `M`, not dropped, and not in a held column awaiting *Commit*. It does not block
   recording. (Two edges are in § Still open.)
9. **Roster changes.** A student added after the quarter, or one who left during it: in the dialog
   or not? Proposed: everyone with a Q1 grade.
   **Answered: the dialog lists the students being recorded or changed.** The first recording lists
   everyone with a grade. After that, a student whose grade matches their last record does not
   appear.
10. **The word.** *Commit* is taken — a held column's *Commit* (WO-3.52) is a different act, and two
    *Commit* buttons meaning two things is a trap. Proposed: *Record Q1 grades*, and *recorded* on
    screen.
    **Answered: *Record Q1 grades*.**
11. **Under a projector.** The dialog is a list of names and grades. Proposed: refused in
    presentation mode, as the concern list is.
    **Answered: refused.**

## The trigger — recommended 2026-10-23, for the owner's ruling

**The app moves to the next quarter by itself.** Since WO-2.52 a class screen opens on the term
holding today's date, so on 2026-11-01 every class opens on Q2 and nobody taps a quarter change.
A notice tied only to a tap would therefore never fire for the teacher who does nothing, who is
the one who most needs it. So the recommendation is **one condition, shown in two places**:

- **The condition:** an ended quarter of this class is **unrecorded**, or **its live letters or
  percentages no longer match its newest record**. Derived at read time, never stored.
- **A bar, like the backup nag**, on that class's screens while the condition holds: *Q1 grades
  for English III have changed since you recorded them — 2 students* (or *Q1 has ended and is not
  recorded*). Tapping it opens *Record Q1 grades*. It goes away when a recording matches.
- **The notice when you move between quarters** — the automatic move on the first open after the
  quarter ends, and any tap from Q1 to Q2 while the condition holds — is the bar's first appearance,
  carrying the who-and-how list (*Maya Ortiz: B+ 88.4% → A− 90.1%*).

The bar is the one that survives a dismissed notice, which is why it is recommended over a notice
alone.

## Follow-ups, answered 2026-10-23

1. **What counts as "changed"?** **Answered: a change to the percentage counts, not only a change to
   the letter.** The notice, the bar and the dialog's list all treat a student whose percentage moved
   as changed, even inside the same letter. This also settles answer 1's proposal the other way:
   both figures are compared, not only the letter.
2. **The empty-boxes flag.** **Answered: *d* meant dropped**, which a cell always reaches holding a
   score, so it never counts as empty. **A late mark with no score (`L` alone) counts as an empty
   box.** The owner's practice, for context: work is marked `M` until it is submitted, then scored,
   and `L` rides on a scored cell as a visual cue that it came in late, which lets him see how often
   work is late. So *empty* is: no score, and not `X` or `M`, in a column not held awaiting *Commit*.

## The drawing's questions — drawn 2026-10-23

Each is marked in amber where it is drawn. Answers are recorded here, dated, in place.

1. **When the bar first appears.** Drawn: the day after the quarter's end date. Earlier, from a
   grades-due date, would ask for a recording while grades are still going in.
   **Answered: from the end date itself**, worded for the day — *Quarter 1 ends today. Record its
   grades for English III (B) once they are keyed into Blackbaud.* From the next day, as drawn.
2. **The empty-boxes line** — a count only (drawn), or the assignments named, or a door to the
   past-due sweep (WO-3.6)?
   **Answered: the count and the categories** — *There are 7 empty boxes in Q1, across Exams and
   Projects.* No assignment names, no door.
3. **The dialog's width** — a stock 480px confirm (drawn), or wider. **Answered: 480px.**
4. **When the notice opens by itself.** Drawn: the first time a class screen opens after a recorded
   quarter stops matching, once per change, and whenever that quarter is tapped. Or never by itself,
   leaving it to the bar.
   **The owner asked for a recommendation. Recommended 2026-10-23, awaiting a nod:** it opens **when
   the teacher leaves a closed quarter that no longer matches its record** — tapping the next
   quarter, another class, or All classes. Never while working in the quarter, so three corrections
   are not three interruptions. A change made without visiting the quarter (a weight changed from
   Q2, a sync) opens it once, the next time the class is opened. Never under a projector; dismissed,
   the bar stays.
5. **Does the notice say what caused a change** (*Act 2 quiz 4 → 9*)? Drawn: figures only. A score
   has a history (WO-3.33); a weight, scale or drop change has no per-student cause.
   **The owner asked for a recommendation. Recommended 2026-10-23, awaiting a nod:** show the cause
   when it is a score — every cell written since the recording's `at`, from the cell's own `at` and
   `was` — because that is what a grade-change form asks for. When no score changed, one line says a
   class setting did (weights, letter scale, drop lowest), since those keep no history. **Booked as its
   own S work order after the rest**, so the notice does not wait on it.
6. **The home screen** — one bar naming the classes (drawn), a line on each class card, or nothing.
   **Still open** — not answered 2026-10-23.
7. **The record history** — every recording is kept; shown anywhere (student detail), later, or
   never?
   **Answered: kept, not shown.** Every recording stays in the document so a reversal loses
   nothing; no screen reads the history. **Revisit at the end of the year** — at booking this moves
   to [`future-features.md`](future-features.md) with a pointer back, per the thread rule.

## What any build owes

- **The new block is created by its first write, never seeded** (CLAUDE.md, WO-6.1), so every
  existing backup still restores and no `SCHEMA_VERSION` bump is needed.
- **The comparison asks the engine** — `classGrade()` and `letterFromPercentage()` — and never
  re-computes a grade beside it.
- **`docs/data-model.md`** gains the block, and **`docs/FERPA.md` / `privacy.html`** are checked:
  this is grade data already in the backup, but in a new place.
- **Cut M/S** at booking. Roughly: the record and its writer; the dialog; the disagreement reader and
  its reminder.

## Timing

To help with Q1 it has to land within about two weeks of 2026-10-31, while Q1 changes are still
happening. Until then: once Q1 is keyed, changing a class's weights, scale or drop counts moves
Planbook's Q1 numbers, with nothing to say so.
