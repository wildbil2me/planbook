# WO-2.10 — Mark cells: unconfirmed, timed, and noted · result

**Implementer** Claude (work-order-implementer, Opus tier) · **Date** 2026-08-06
**Verification** `node tools/verify-shell.mjs` → **299 of 299, 0 skipped** ·
`node tools/wo-sweep.mjs` → **11 checks, 10 passed, 0 failed, 1 to review** (the standing
sensitive-field-name line, unchanged in kind since WO-1.8)

---

## 1. Against the 14 Acceptance lines, one by one

Every line below was verified by driving the real controls in headless Edge over CDP and reading
the stored document out of IndexedDB. Where a line has a human half I say so under §4 rather than
claiming it here.

**1. Tapping one student's cell moves that cell to `P` and changes no other cell.** ✅
Check *"one tap on a cell moves that cell to P and changes no other cell on the screen — all
twenty-five stay ?"*. All 26 cells of today's column are read before the tap (`??????…`) and after
(one `P`, twenty-five `?`), which is the acceptance line's own instruction. A second check
(*"and the document says so"*) asserts the storage side: 25 entries, all `{code:'U'}`, and **no
entry at all** for the confirmed student. Proved non-vacuous: removing the `U` seed turns 12 checks
red and this column reads `PPPPPP…` again — the exact build this work order replaces.

**2. "Everyone's here" resolves every student to `P` in one tap, no `U` left.** ✅
Check *"'Everyone's here' resolves every remaining student in one tap"*, driven on a class 22/26 of
the way through: every `U` goes, the two real marks stay, `values.U` is 0 across the whole document
and the column reads 24 `P` + the two marks. Also verified in the other direction at the end of the
section (*"one tap of 'Everyone's here' comes straight back out of it"*) — and that it resolves
**only its own class**: the half-taken class beside it keeps its two `U`s.

**3. A class with two absences is two entries in the finished document.** ✅
Same check. `Object.keys(marks).length === 2`, `keys === 'classId,date,marks'`, no `U`, no `P`, on a
class of **26** (the run's roster is 26, not 25 — the arithmetic is identical). Storage at rest is
unchanged from WO-2.1.

**4. Tapping one cell, then reloading, still shows one `P` and twenty-four `?`.** ✅
Check *"one tap, then a reload, still shows one P and twenty-five ?"* — twenty-**five**, because the
class is 26. Full `Page.reload` with a flush first, re-read out of IndexedDB, the card behind it
reading "25 unconfirmed" and the column head reading "25 to go".

**5. A class nobody has touched has no record at all.** ✅
Held in three places: the opening check (*"a day nobody has marked is six untaken classes"*, 0
records today), the *"opening it writes nothing"* check (records and `rev` unchanged after arriving
on the screen), and the full-day tally, where `ids[5]` ends the run with **no record**, reading "Not
taken yet". Initialization is an act — a `U` is written only by a cell tap or by "Everyone's here",
both of which are the two named entry points and nothing else.

**6. The home card names the number of unconfirmed students.** ✅
Two checks. The card reads `"25 unconfirmed"` after one tap and `"22 unconfirmed · 1 absent, 1
tardy"` with marks on it; and at the end, *"the half-taken class names its unconfirmed count on the
card, in the caution palette"* asserts both the text and that the card carries the `unconfirmed`
class while a finished class does not. The count is also on the column head ("N to go") and in the
state line above the grid, with a sentence under it saying the `U`s count as absent.

**7. The cycle from `?` reads `P → A → E → T → D` and returns to `P`, never to `?`.** ✅
Six taps on a cell that started on `?` walk exactly `PAETDP`, and the sixth leaves **nothing** on
the record. A companion check confirms those six taps still moved no other cell.

**8. A student added after a class was taken acquires no mark retroactively.** ✅
Check *"a student added to the roster after a class was taken does not acquire a mark for it
retroactively"* — a fourth student is added through the real roster form to a class already holding
2 `U`s; the record still holds exactly 2 entries, the new student has none, their cell reads `P`
(present is the absence of a mark), and the head still says "2 to go". The `U` seed runs on record
**creation** only.

**9. Marking tardy stores an `at`; the screen shows the time without a report.** ✅
Both halves in one check: the cell holds a full ISO timestamp matching
`^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$` (offset, never `Z`), and the grid draws
`8:14a` under the glyph — read off `.attendance-cell-time` in the DOM — with the hour agreeing
between the two, the full time on the cell's `aria-label`, and exactly one of 26 cells carrying a
time.

**10. Cycling past `T` onto `D` leaves one time — the dismissal's.** ✅
Read at three points: `E` carries no `at`, `T` stamps one, `D` carries exactly `{code, at}` with
`at >= ` the tardy's. The cell is rewritten whole on every code change, so there is nothing to
orphan. **Caveat worth stating**: in this cycle order a `T` can only be left for `D` (which
re-stamps) or `P` (which deletes), so the only path by which a stale time can reach a cell that
should not have one is un-confirm — and that is what the stale-carry mutation turned red (one
check). I did not manufacture an extra path to make the number bigger.

**11. Cycling back to `P` clears the entry entirely.** ✅
A note is typed onto the mark first, so the claim is not vacuous, then the last tap: the entry is
gone, the record is unchanged otherwise, the cell reads `P`, its time caption is empty, no `P` is
stored, and `rev` moved.

**12. A note typed on a mark survives a reload, same student, date and class.** ✅
Written through the row's own ⋯ panel with a real `input` event, flushed, full reload, class
reopened, panel reopened: the field comes back filled, the cell holds `{code:'D', at, note}`, the
cell's `aria-label` carries it, and exactly **one** record in the document contains that string.
The panel's bound date is asserted too.

**13. Every cell in the document is an object.** ✅
Asked of the whole document at the end of the run: 0 bare strings, 0 cells of any other shape, ≥30
object cells (the guard against a vacuous zero), and the complete set of field names in use across
every cell is exactly `at,code` with `code` present on all of them. I also converted the one harness
fixture that wrote bare strings by hand (the class-manager delete fixture) — it was the only place
in the run a stored string could come from, and leaving it would have made this check go red about
the harness rather than about the app.

**14. Restoring a pre-WO-2.10 backup produces object cells.** ✅
Check *"restoring a backup written before WO-2.10 produces object cells, codes intact and no
invented time"*, driven end to end through the real path: a schemaVersion-1 file with bare-string
cells goes into `restoreFromText()`, through the real confirm dialog (which says "Brought up to date
from an older version (1→2)"), through the real button. Read back **off disk**: every cell an
object, codes intact (`A`, `T`, `E`), no `at` invented, the empty-string cell dropped, the dropped
record untouched, and the document stamped at schema 2 so the conversion cannot run twice. The
migration ladder is also exercised two steps deep by the store section (a test hook 0→1 plus the
real 1→2), with the converted cell asserted on disk as well as in memory.

---

## 2. What I could not verify — owed to a human

Nothing below was ticked. All of it is in `TESTING.md` § WO-2.10 as 👤 lines.

- **The fifteen-second line has to be re-run.** The cycle got one tap *longer* for an absence
  (`?` → `P` → `A`) and one *shorter* for a present student. WO-2.1's timed acceptance was measured
  on the old cycle and I have not re-measured it; on a class of 25 with 2 absences the new model is
  25 taps rather than 2, which is the owner's explicit design choice but is a different clock.
  **This is the largest open question in this work order.**
- **The time caption's appearance.** `.attendance-cell-time` is positioned out of flow so it cannot
  make rows taller — I verified the grid still fits with no horizontal overflow at 800px, 1024px,
  768px and 390px, and the 44px cells still measure 44px. Whether a 9px/10px caption sitting in the
  cell's bottom padding *looks* right, or crowds the row rule, needs eyes on glass.
- **The ⋯ button beside a name** takes a thumb without catching the cell next to it — measured at
  44×44 under an emulated coarse pointer, never touched by a thumb.
- **The note field keeping focus with the software keyboard up.** `setNote()` deliberately triggers
  no repaint for exactly this reason, and the harness drives a synthetic `input` event; a real iPad
  keyboard is a different thing.
- **Whether a `?` inside a taken column and a `?` in a wholly untaken column read apart across a
  room.** They differ by the column wash and the head ("Taken"/"N to go" vs "Not taken"), and both
  are asserted in the DOM — legibility at distance is eyes.
- **VoiceOver** on a `?` cell and on a timed, noted cell.
- **Restoring the owner's own pre-WO-2.10 backup file.** The harness proves the path with a file it
  wrote itself. Her real file is the one that matters, and it is a five-minute check.
- **The owner's verdict on the first tap meaning "present"** — the complaint this work order came
  from, which no harness can ask.

One thing I fixed but did **not** get under an automated check: `deletionCounts()` in
`src/roster.js` counted a `U` as an attendance mark in the student-delete confirm ("41 attendance
marks"), which violates the Traps line's "never appears in a total". It now excludes `U`. Driving it
would need a student who is unconfirmed *and* orphaned from every class, and building that fixture
costs more than the four-line filter is worth; the change is syntax-checked and the existing
delete-confirm check still passes. Flagging it here rather than claiming coverage.

---

## 3. Decisions the work order did not settle, and which way I went

**`at` is stamped only on today's column.** The work order says `at` comes "from the device clock at
the moment a cell settles on `T` or `D`" and does not say what happens when the teacher marks a
tardy on a column two weeks back. I made a past-column mark record `{code:'T'}` with **no** `at`:
the device clock on a Thursday says nothing true about when a student walked in a fortnight ago, and
a wrong arrival time printed beside a student's name in a conversation with a guardian is worse than
no time. It is the same reasoning as the migration's refusal to invent an `at`, it is stated in
`src/attendance.js`'s header and in `docs/data-model.md`, and it is asserted by a check.

**`at` is a local ISO string with its offset, built from calendar fields** — never
`toISOString()`. Same trap as `todayISO()` one datatype over: the same instant printed in another
zone is a different hour, and the hour is the whole point. The displayed time is read straight out
of the string rather than through `new Date()`, for the same reason.

**A `U` carries nothing but its code.** Found by the harness, not reasoned out: my first pass
carried a note across every code change, so un-confirming a student left
`{code:'U', note:'left for the nurse'}` — a note about a mark that no longer exists, in an entry
that is deleted the moment somebody confirms that student. The note now carries across every code
change **except** to `U`. A note is still dropped entirely when a cell cycles to present, which is
acceptance line 11's own wording.

**A note is offered on a mark, not on a present student.** "A note is editable on any mark" — a
present student has no entry, and creating one to hold a note would be the stored-`P` trap arriving
through a text field. The panel says so instead of showing a field that would silently discard what
was typed into it.

**The action row's five states.** The un-take (which removes the record) is now offered whenever the
record holds no *real* mark — `U`s do not count, because a class nobody has confirmed anything on
has nothing to lose and an accidental first tap has to be undoable. Where there *are* marks, the
reset is "Un-confirm everyone" instead, which keeps the record and states in its own title how many
marks it will clear — the same "make the loss loud rather than prevent it" call `dropClass()`
already makes. Never more than three controls in the row.

**A fourth column-head word, not a fourth state.** A column being taken says "12 to go" rather than
"Taken", and the state line and card lead with the count and take the caution palette. `stateOf()`
still has exactly three answers; `unconfirmed` is a modifier on top of `taken`. The alternative —
green "Taken" over twelve students nobody has looked at — is precisely the silent failure the Traps
section describes.

**The `⋯` button lives in the name cell.** Two deliverables need a per-row control (a note reachable
without leaving the row, and per-student un-confirm), and the name cell is the only place on the row
that is not a day column. It is drawn on every row whenever the edit column accepts edits, rather
than only on rows that have something in them, so it cannot move the target under a thumb. This does
widen the name column by ~44px on a coarse pointer; the work order puts "the name-column width" out
of scope and I read that as "do not go re-tuning the 170px min-width", not "never add a control to
the row" — but it is the judgement most worth a second opinion.

**`countsFor()` reports `U` separately from `A`.** The work order says `U` counts as absent
*wherever attendance is counted*; WO-2.4 owes the arithmetic
(`(P+T+E+D)/(P+T+A+E+D)` with `U` in the denominator). Folding them here would have made the card
say "26 absent" about a class the teacher is half way through, so the two numbers are separate at
this layer and summed at that one. A comment in `countsFor()` says so and names WO-2.4.

---

## 4. Out of scope — noted and not done

- **Hall passes (WO-2.8), compact view, the name-column width.** Untouched. `D` stays in the cycle
  where the owner put it.
- **WO-2.4's percentage.** Not implemented. `countsFor()` now exposes the `U` count so it can be,
  and WO-2.4's own text already carries the obligation.
- **A proposed follow-up for WO-2.4:** its deliverable list does not yet mention `U`. WO-2.10's body
  does, in as many words, so nothing is lost — but a line in WO-2.4's own deliverables would be
  cheaper to notice than a line in a neighbouring work order.
- **A second temptation I declined:** the filter pills have no `?` pill. `U` "never appears on a
  button", and a "show me who I haven't reached" pill is genuinely useful — but it is a button
  carrying `U`, and the count on the head and the state line answers the same question without one.
  If the owner asks for it, that is a decision to reopen deliberately, not a gap to fill quietly.

---

## 5. Files changed

**App**
- `c:\dev\planbook\src\attendance.js` — the bulk of it. `U` in the vocabulary; cell-object helpers
  (`codeOf` / `timeOf` / `noteOf`), `stampNow()`, `clockTime()`, `compactTime()`, `nextCode()`,
  `readingOf()`; seeding on record creation; `setMark()` rewritten around the object cell;
  `takeClass()` resolves `U`s; new `unconfirmAll()`, `unconfirmStudent()`, `setNote()`,
  `toggleDetail()`; the row detail panel and its painter; the time caption; the column-head count;
  `stateSummary()` returning `unconfirmed`. Every one of the four in-file assertions that `P` is
  never stored was re-pointed rather than deleted, and each reads true.
- `c:\dev\planbook\src\store.js` — `SCHEMA_VERSION` 1 → 2 and the first real `MIGRATIONS` entry
  (1 → 2). **One entry in the existing object; the walk, the write-back and the refusals are
  untouched**, exactly as that code's own comment asks.
- `c:\dev\planbook\src\home.js` — the card's state line carries the unconfirmed count and palette.
- `c:\dev\planbook\src\shell.js` — four new hooks routed (`detail`, `unconfirm`, `unconfirm-all`,
  `note` on `input`); the hook table and the `P`-is-not-stored line re-pointed.
- `c:\dev\planbook\src\roster.js` — `U` excluded from the delete confirm's mark count.
- `c:\dev\planbook\src\backup.js` — the comment asserting `MIGRATIONS` is empty was false; rewritten
  to say the decision it describes is now being exercised.
- `c:\dev\planbook\src\attendance.css` — the ⋯, the detail panel, the time caption, the "N to go"
  chip colour, the unconfirmed state wash. Every new control has its 44px rule in the
  `@media (pointer: coarse)` block, added in the same pass.
- `c:\dev\planbook\src\home.css` — `.class-card-state.unconfirmed`.
- `c:\dev\planbook\index.html` — the hint under the grid rewritten; the Present pill's title; the
  comment above the class view.
- `c:\dev\planbook\sw.js` — cache bumped v19 → v20.

**Docs and plans**
- `c:\dev\planbook\docs\data-model.md` — three clauses added to the mark-cell rule (offset, today
  only, `U` carries nothing else). The `U` and object-cell sections were already written when the
  work order was opened.
- `c:\dev\planbook\plans\ROADMAP.md` — "exceptions-only" amended with the re-pointing; the two `U`
  and timestamp boxes ticked; dashboard row 0/15 → 7/15.
- `c:\dev\planbook\plans\work-orders\phase-2-attendance.md` — status ✅ DONE, all 14 acceptance
  boxes ticked.
- `c:\dev\planbook\plans\work-orders\README.md` — counts, via `tools/wo-gate.mjs --tick`.
- `c:\dev\planbook\TESTING.md` — a WO-2.10 section: the 14 lines, the desk-pass note, the mutation
  table, and eight 👤 lines left blank.
- `c:\dev\planbook\tools\README.md` — the check count and what the seventeen new checks are.

**Harness**
- `c:\dev\planbook\tools\verify-shell.mjs` — extended, not replaced. 282 → 299 checks. The reader
  now counts codes rather than values, reports cell shape, reads glyphs off `.attendance-cell`
  (a `<td>` can hold the time caption now), and exposes the detail panel. `SCHEMA_NOW` replaces four
  hardcoded `=== 1` assertions. One fixture that wrote bare-string cells was converted to objects.

**No `CHANGELOG.md` entry written** — that is the teacher's prose. A draft, if it is wanted:
*"Marking a class now starts every student on `?` and the first tap means present, so an unmarked
student reads as absent rather than as a silent room full of Ps; tapping one student no longer moves
anybody else. Tardies and dismissals keep the time they were marked, any mark takes a note, and both
are on the row rather than in a report. Every attendance cell in the document became an object;
older documents and older backup files convert on the way in."*

---

## 6. Mutation proofs

Four mutations, applied to the shipped tree, run, and reverted. Absence claims that have not been
seen to go red are not evidence.

| Mutation | Result |
|---|---|
| `setMark()` stops seeding `U` (one tap resolves the class, the old way) | **12 red** |
| a cell is stored as its bare code string again | **11 red** |
| the `1 → 2` migration converts nothing | **4 red**, including acceptance 14's restore |
| a stale `at` carried across a code change | **1 red** — the un-confirm; see acceptance 10 above |

The final run on the reverted tree is 299/299, 0 skipped.
