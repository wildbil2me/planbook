# Closing a quarter: record what went to the SIS, and say when it stops matching

**Design thread — [`design-threads.md`](design-threads.md). Status: talking** (started 2026-10-23)
— **waiting on the owner's answers to the open questions below**, then a drawing under
`design/mockups/` per [`PROTOCOL.md`](../design/mockups/PROTOCOL.md).

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

## Open questions

Answers are recorded here, dated, in place.

1. **What is recorded: the letter, or the letter and the percentage?** Proposed: both, but the
   **letter is what is compared**, because the letter is what the SIS holds. A percentage that moves
   inside the same letter raises no reminder.
2. **One class at a time, or all five in one dialog?** Proposed: one class at a time, since
   Blackbaud is keyed one class at a time, with a door from each class.
3. **A second recording overwrites, or appends?** Proposed: **appends, and the newest wins** — the
   log's rule. It keeps the history of grade changes (what was sent on 11/3, and what on 11/10) at
   no cost, and nothing in the app deletes it.
4. **Where the reminder shows.** Proposed: a line on that class's card on the home screen and on
   Scores while the quarter disagrees with its record, naming the count of students. Possibly a
   one-time note at the moment of the edit. Which of these, or all?
5. **What *these match Blackbaud* means.** Proposed: the record button **is** the confirmation —
   one tap that says "I have keyed these" — rather than a separate checkbox step. Or should recording
   come first, with a separate "matches the SIS" tick afterwards?
6. **Is the two-week window modelled?** Proposed: no date limit and no lock (ruling 1). The reminder
   could word itself differently after two weeks ("this may need a grade change form") — or not at
   all.
7. **When the dialog is offered.** Proposed: from the term's end date (derived, as *Closing in*
   already derives term edges), and from a door on Scores for that term. Should the grades-due event
   be the trigger instead?
8. **Unfinished work at closing.** A held column counts toward nothing, and ungraded or past-due
   blanks change nothing. Proposed: the dialog names them (*2 held columns, 5 blank past-due cells*)
   with a way to deal with them first, but does not block recording.
9. **Roster changes.** A student added after the quarter, or one who left during it: in the dialog
   or not? Proposed: everyone with a Q1 grade.
10. **The word.** *Commit* is taken — a held column's *Commit* (WO-3.52) is a different act, and two
    *Commit* buttons meaning two things is a trap. Proposed: *Record Q1 grades*, and *recorded* on
    screen.
11. **Under a projector.** The dialog is a list of names and grades. Proposed: refused in
    presentation mode, as the concern list is.

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
