# Future features

**Started 2026-09-03**, during the live-term hold on major work orders. This is where a wanted
thing goes when it is real enough to lose and not scheduled enough to book.

**A thing that is *broken* goes to [`known-bugs.md`](known-bugs.md) instead**, which is this
file's twin: a wanted feature is an argument about design, a bug is a report about behaviour, and
one list holding both is read at the speed of the slower half.

**Nothing here is booked, and nothing here is a work order.** `tools/wo-gate.mjs` cannot see this
file, `tools/wo-sweep.mjs` does not read it, and `next` will never name a row in it. A row leaves
by being cut into a work order under [`work-orders/`](work-orders/README.md) — and when it does,
strike it here with the ID it became, so the argument that produced it stays reachable from the
row that answers it.

**Write the reasoning, not just the wish.** A one-line feature request is a thing the next session
has to re-derive from scratch; the design constraints found on the way to writing it down are the
expensive half, and they are what this file is for. Items are added in the order they come up.
There is no ranking here and no promise of one — position means nothing.

---

## Assignments screen

### 1. A more verbose screen — one assignment into several classes, with its own due date in each

*Raised 2026-09-03 by the owner. Not booked. Size guess S–M, mostly in the surface rather than the
write.*

**The errand.** The same assignment goes to four sections on four different days. Today that is
about **seven dialog trips**: three passes through the copy dialog from the source row, then each of
the three copies opened in the assignment editor to change its due date. It is paid every time an
assignment is entered, weekly, across five classes — so the cost is far above what the size suggests.

**What already exists**, from [WO-3.2](work-orders/phase-3-gradebook.md#wo-32--assignments-list--editor)
(✅ 2026-08-10), which built duplicate-to-another-class for exactly this reason — the work order says
*"because the owner teaches the same content to more than one section"*:

- A **Duplicate** button on every assignment row, opening the copy dialog.
- **One target class at a time** — `copyClassId` is a single id and the button reads *"Copy into
  Period 2"*.
- Editable on the copy: **name, term, category**.
- **No date fields at all.** The dialog says so in words: *"The dates come across as they are."*

**What "more verbose" means here.** One row per target class — class · term · category · due — so
the whole fan-out is one gesture and, more importantly, **one reading**. The dialog's current
one-row-of-two-selects cannot hold it, because the per-target fields multiply with the targets: a
term id and a category id both belong to the class they were made in, so four targets is four term
choices and four category resolutions, not one of each.

**Four rulings it must not break.** These are the reason this is a design question and not a widget:

1. **Copies, never a structure several classes point at.** The tempting shape is one assignment the
   four classes reference, each with its own due date. That contradicts a ruling already made one
   level up for class copying — `ROADMAP.md`: *"a copy is a starting point a teacher then edits,
   which is why this is a copy and not a structure several classes point at."* Four independent
   rows made in one gesture keeps `scores` keyed by assignment untouched and keeps the grade math
   out of it entirely.
2. **The control shows what the proposal holds.** `src/assignments.js:1127` carries the scar: a
   `<select>` displaying a category the copy would not be filed under, because an unmatched proposal
   drew the first option. Whatever replaces that dialog inherits the invariant, and N targets is N
   chances to break it.
3. **A `categoryId` never crosses a class.** The copy matches the target's category **by name** and
   falls back to *not in a category*. WO-3.2's Traps line and the `classId` guards in
   `src/categories.js` exist because a naive copy carrying the source's id lets a category removal
   in one class delete work in another.
4. **The dates come across as they are** — and *this item is the one thing that deliberately changes
   that promise*. `confirmCopy()` argues its date behaviour at length against WO-3.17's
   create-path, and the printed note is half of why. **Change the note in the same edit as the
   field**, or the screen is contradicting itself the way the hint WO-3.17 fixed was.

**One thing to settle before building.** View or modal? `gradebook-surfaces.md` draws the line at
*a surface a teacher scans and works down* (a view in `<main>`) versus *a task she finishes and
dismisses* (a modal). A four-row table with twelve controls is on that line, and the answer decides
the shape rather than following from it.

**Also owed:** `tools/verify/assignments.mjs` and `tools/verify/copy-class.mjs` both drive this
dialog, and `TESTING.md` has 👤 lines on it (the iPad category-fallback reading around 5408–5440).

---

## Architecture

### 1. Rows in a database instead of one JSON document — a measurement, not a plan

*Raised 2026-09-03 by the owner as a v2 consideration. Not booked, and **deliberately not written
as a feature**: the recommendation on the day was to leave the shape alone and schedule the one
measurement that would change the answer.*

**The standing argument** is [`../docs/data-model.md`](../docs/data-model.md) § "Why one document
instead of rows in a database": ~600 assignments, ~15k scores, ~22k attendance marks, call it 3–6 MB,
loads in well under a second, so every query is a plain array operation and there is no query layer
to build.

**That section argues size. The stronger argument is coupling** — the single document is
load-bearing for three separate systems, and rows costs all three:

1. **Backup and restore.** The recovery path is a file the teacher holds, and it is mandatory rather
   than a nicety because of the iOS eviction hazard. `parseBackup()` validates a restored file
   against the shape `newYearDocument()` returns. With rows, the backup is an *export* that
   reassembles the document anyway — so the year is maintained in two representations forever.
2. **Sync.** [`../docs/sync.md`](../docs/sync.md) rests entirely on *Drive holds a copy of that same
   document and nothing else*: `rev`/`baseRev`, keep-both on conflict, whole-document
   last-writer-wins — correct rather than a compromise, because the teacher never edits two devices
   at once. `src/store.js`'s own header says this is not a shortcut, it **is** the sync design.
   Rows means per-entity sync and per-entity merge. **And WO-7.2 is not built**, so this lands on the
   one part of the architecture that has no code yet, turning a scoped work order into a larger
   different one.
3. **No dependencies.** If "database" means SQLite in the browser, that is a wasm blob. Beyond the
   inherited suite rule it falsifies [`../privacy.html`](../privacy.html)'s *"no third-party code of
   any kind"* — a public document about student data, which WO-7.1 went out of its way to keep true
   word for word.

**What a move would actually buy, fairly stated: one thing.** Write amplification. Every save
serializes the whole document, so during score entry that is a full serialize plus an IndexedDB
write roughly per 800ms of typing (`DEBOUNCE_MS`, `src/store.js:57`). Multi-year is not a scaling
problem — one document per year, five years is five documents — and partial loading buys nothing
against a sub-second load.

**The trigger, because this is measurable today rather than speculative:** enter a column of ~25
scores on the **real iPad**, against a full term of real data, and watch for stutter between
keystrokes.

**The threshold.** Smooth → the question is closed for this shape, and closing it is the point of
taking the reading. Still smooth at the end of Q4 with a whole year in the document → closed
permanently. Stutter → it is a real defect, and the next paragraph is the cheap answer to it before
any rewrite is considered.

**The middle option, if the threshold is ever crossed.** **IndexedDB is already a database.** Split
the *storage* — scores and attendance into their own keyed object stores — while keeping the
in-memory shape and the backup and sync shape as one document. Write cost decouples from document
size; all three couplings above stay intact. Take this before considering rows.

**The migration hazard, if rows are ever taken anyway.** This repo has already been bitten by the
exact failure mode at small scale: seeding an empty `calendar` block into `newYearDocument()` cost a
whole verify run, because `parseBackup()` then refused **every backup written by every earlier
build, by name** (WO-6.1). A storage migration is that hazard at full scale — and it is invisible on
the glass, so a version spent on it delivers nothing a teacher can see while the praise column and
the outreach flow are the product.
