# WO-2.10 — Mark cells: unconfirmed, timed, and noted · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.10-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude, at the **Opus** tier, on the work order's own merits — this is not a
Codex fallback and no probe was run, because the rubric never puts this row in the Codex column. The
deciding signal is the migration: it rewrites every `marks` cell in every live document *and* in
every backup already on the teacher's disk, which puts it through WO-1.5's restore path — a sensitive
surface `ROUTING.md` says is never delegated — and it is a size `L` 🚩 go-live blocker whose Traps
section is judgment, not mechanics. The runner-up consideration I set aside: the object-cell
conversion on its own is a mechanically specified transform of the kind Codex is good at, but it
cannot be separated from the `U` state without migrating student data twice, which is the exact thing
the work order's opening paragraph folds these two changes together to prevent.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.10 — Mark cells: unconfirmed, timed, and noted

**Ship** 1 · **Status** ⬜ NOT STARTED · **Size** L · 🚩 · **Depends on** WO-2.1
**Closes roadmap** Phase 2 → amends "Marking screen, exceptions-only", closes "`U` for unconfirmed"
and "Timestamps on tardies and dismissals" *(see below)*

**This work order reshapes what a `marks` cell IS.** It carries two changes that arrived separately
and must land together, because both rewrite every reader and writer of `marks` and doing them in
sequence would mean migrating live student data twice — the second time over a real term, weeks
after go-live. They are folded deliberately, on 2026-08-06, with that reason.

**Why it exists.** The owner used the registry and found the marking model backwards for how she
stands in a room. Two specific complaints, 2026-08-06:

1. A cell starts on `?`, and the first tap jumps to `A` — so confirming a student **present** costs
   four taps round the cycle. The first tap should mean *"I see you, you're here."*
2. Tapping one student takes the whole class, so every other cell flips from `?` to `P` at once.
   You cannot tell who you have actually looked at.

Underneath both: **an unmarked student should read as absent, not present.** If the teacher is
pulled out mid-period, the honest record is "I had not accounted for these students", and the safe
default for the ones she never reached is absent rather than a silent room full of `P`.

**The design, in the owner's own construction.** A new code **`U` — unconfirmed** is written for
every student when a class is first touched, and deleted as each student is confirmed. It is a
temporary mark that sorts itself out as the real record is taken.

| Stored | Means | Drawn as |
|---|---|---|
| *(no entry)* | present | `P` |
| `U` | unconfirmed — **counts as absent** | `?` |
| `A` `E` `T` `D` | as today | their letter |

**The second change: a mark cell becomes an object, and `T` and `D` carry the time.** Roll Call!
captures the moment a mark settles on tardy or dismissed — `preTardyLog[si] = {time, dateStr}`,
flushed as `{last, first, type, time}` with a note, and surfaced as a "Tardy & Dismissal History"
section on the student report. **Planbook records only that a student was tardy, never when.** That
was never specified: `plans/` mentions "tardy" nowhere outside WO-2.1's cycle line, so no work order
could have produced it and no check could have failed it. Found by the owner, 2026-08-06.

It matters past completeness. Twenty minutes late and two minutes late are different conversations
with a guardian, and Phase 5's templates want the difference. Dismissal time is closer to a safety
record — when the student actually left the room. Phase 4 ranks by pattern, which is much weaker if
every tardy looks identical.

```jsonc
"marks": {
  "s_1": { "code": "T", "at": "2026-09-09T08:14:00-04:00", "note": "missed the bus" },
  "s_2": { "code": "A" },
  "s_3": { "code": "U" }
}
```

**Every cell is an object, including `U` and the untimed codes.** This is not decoration — it is
[`../../docs/data-model.md`](../../docs/data-model.md)'s own rule, one datatype over: *"A score cell
is always an object, never a bare number. Polymorphic cells (`87` here, `{v:87}` there) are where
grade bugs live."* A `marks` cell that is `"A"` sometimes and `{code:"T",…}` other times is exactly
that mistake. `at` and `note` are simply absent where they do not apply.

- **`P` is still never stored.** The exceptions-only rule is not repealed, it is re-pointed: the
  document holds exceptions to *present* exactly as it does now, plus `U` for students not yet
  reached. Clearing a mark still means present.
- **At rest the document is unchanged.** A finished class holds only its real exceptions, because
  every `U` has been deleted on the way. The `U` entries exist only between starting a class and
  finishing it, and they shrink as the teacher works.
- **A class left half-taken keeps its `U`s**, which is the point: that is an accurate record of an
  unfinished class rather than a fabricated complete one.

**The cycle** is `P → A → E → T → D → P`. `U` is **not a step** — it is where a cell starts, and
once tapped a cell never returns to it. From `?` the first tap gives `P`.

**Deliverables**
- `U` added to the vocabulary in [`../../src/attendance.js`](../../src/attendance.js) and to
  [`../../docs/data-model.md`](../../docs/data-model.md), described as temporary.
- **Initialization on the first attendance button pressed**, and never on merely opening the screen
  — see Traps. Two entry points, and they differ deliberately:
  - **Tapping a single cell** creates the record, writes `U` for every student in the class, and
    moves that one student to `P`. **Every other cell still reads `?`.** Nothing else on the screen
    changes.
  - **"Everyone's here"** creates the record and resolves *all* students to present at once. This
    is the one control allowed to change every row, because that is what it says it does.
- The cycle reordered to `P → A → E → T → D`, entered at `P` from `?`.
- **`U` counts as absent** wherever attendance is counted. WO-2.4 must treat it as `A` in
  `(P+T+E+D)/(P+T+A+E+D)` — in the denominator, not the numerator.
- **The home card says how many are unconfirmed** when a class holds any `U`. A half-taken class
  must be loud, not silent — see Traps.
- **Every `marks` cell is an object**, uniformly, per the shape above. One migration, run once, over
  documents that today hold bare code strings — including restored backups written before this
  work order. A restore of an old backup must come out right, not half-converted.
- **`at` is captured at the moment a cell settles on `T` or `D`**, from the device clock, stored as
  a full ISO timestamp with offset. Cycling *past* `T` on the way to something else must not leave a
  stray time behind — Roll Call!'s `_trackTardyMark()` handles exactly this case and is worth
  reading before writing it.
- **A note is editable on any mark**, reachable without leaving the row. Roll Call! offers it on
  tardies and dismissals; here it costs nothing to allow on all of them.
- **The time is visible where the mark is** — a tardy cell shows its time, or reveals it on the row,
  without needing a report to be run.
- Un-confirm is reachable: a student cycled by mistake can be returned to `?`, or the class reset,
  without leaving the screen.

**Out of scope** — hall passes (WO-2.8), compact view, the name-column width. Whether `D` leaves the
cycle once WO-2.8 lands: that is WO-2.8's call, and this work order keeps `D` where the owner put it.

**Acceptance**
- [ ] Tapping one student's cell moves that cell to `P` and **changes no other cell on the screen**.
      Verify by reading every other cell, not by looking at one.
- [ ] "Everyone's here" resolves every student to `P` in one tap, and the document holds no `U`
      afterwards.
- [ ] A class with 25 students, two of them absent, is **two entries** in the finished document —
      no `U`, no `P`. Storage at rest is unchanged from WO-2.1.
- [ ] Tapping one cell, then reloading, still shows one `P` and twenty-four `?` — the unconfirmed
      state survives, which is the whole reason it is stored.
- [ ] A class nobody has touched has **no record at all** and reads "not taken yet". It is not a
      class of 25 absences. *(The single most damaging way to get this wrong.)*
- [ ] The home card names the number of unconfirmed students on a half-taken class.
- [ ] The cycle from `?` reads `P → A → E → T → D` and returns to `P`, never to `?`.
- [ ] A student added to the roster after a class was taken does not acquire a mark for it
      retroactively.
- [ ] Marking a student tardy stores an `at` timestamp; the marking screen shows the time without
      running a report.
- [ ] Cycling `P → A → E → T → D` past `T` and landing on `D` leaves **one** time — the dismissal's
      — and no orphaned tardy time. Verify in the document.
- [ ] Cycling all the way back to `P` clears the entry entirely: no code, no `at`, no note left
      behind.
- [ ] A note typed on a mark survives a reload and appears on the same student, date and class.
- [ ] **Every cell in the document is an object.** Not one bare string anywhere, including `U`s and
      including untimed codes. Inspect the document, not the UI.
- [ ] **Restoring a backup written before this work order produces object cells**, with the codes
      intact and no `at` invented for marks that never had one. *(WO-1.5's restore path is the one
      thing standing between a teacher and a lost term — this is the acceptance line that says the
      migration did not eat it.)*

**Traps** — **Opening the screen must still write nothing.** `src/attendance.js` says so and the
reason stands: if arriving on a class wrote 25 `U`s, "not taken yet" would be unreachable the moment
a teacher browsed, and the home screen's only question would stop having an answer. Initialization
is an act, not a visit.

**A class holding `U`s is a meeting, and every `U` in it is an absence.** That is correct and it is
also dangerous: one stray tap creates a meeting with 24 absences in it. This is why the home card
must announce unconfirmed counts — the failure mode is silent, looks like data, and is only
discovered when a percentage is wrong in November. Do not ship the `U` state without the surface
that makes it visible.

And **`U` is not a sixth attendance code to a teacher.** It never appears on a button, never appears
in a total, and never reaches a report. It is scaffolding that the finished record does not contain.

**The migration is the dangerous half of this work order, not the cell shape.** Every document in
existence holds bare strings, and so does every backup file already on the teacher's disk. A
migration that runs twice, runs halfway, or runs on read without being written back is how a term of
attendance turns into `{"code": {"code": "A"}}` or vanishes. Convert on load, write back once,
and make a restored pre-WO-2.10 backup an acceptance line rather than an assumption — it is one of
the three things `CLAUDE.md` says must be right before students walk in.

**Do not put the time anywhere but the cell.** A `log` entry mirroring each tardy would reuse
machinery that already exists and would immediately create two records of one event, which is the
second-source-of-truth pattern this project has refused four times. The cell is the record.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `docs/data-model.md`
  - `src/attendance.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Also open these, and know why each one is on the list:

- **`src/store.js` § migration — this is where the dangerous half of the work order goes.** The
  ladder already exists and is empty on purpose: `SCHEMA_VERSION = 1`, `MIGRATIONS` keyed by the
  version a step upgrades *from*, walked by `migrateDocument()`, and written back **once** at
  `src/store.js:477–487` rather than on every open. The Traps section's failure modes — runs twice,
  runs halfway, runs on read without being written back — are the three things that code was written
  to prevent. Its own comment says the first real migration should be *one entry in that object
  rather than a refactor of the load path*. Take it at its word; if you find yourself changing the
  walk, stop and say why in your report.
- **`src/backup.js`** — it imports `migrateDocument` and `SCHEMA_VERSION` directly (line 37–38) and
  restores through the same ladder, which is what makes Acceptance line 14 reachable without a second
  code path. Read the comment at `src/backup.js:317–325` about what taking a backup must not do
  before you touch anything there.
- **`src/attendance.js`** in full, but especially the four places that assert the rule you are
  re-pointing: the two-writers warning near line 71, the cycle comment near line 91, the `PRESENT`
  constant near line 214 (named rather than written as `'P'` at each use — keep that), and the
  exceptions-only guard near lines 497 and 529. `src/shell.js:64` states it a fifth time and
  `plans/ROADMAP.md:192` a sixth. **`P` is still never stored** — the rule is re-pointed, not
  repealed, and every one of those comments needs to end up true rather than deleted.
- **`src/home.js`** — `stateSummary(cls.id, todayISO())` at line 202 is the single decider for
  taken / dropped / not-taken-yet, and the unconfirmed count belongs in what it returns rather than
  in a second computation at the card. Read the comment above it about a card that only speaks up
  when it has something to say.
- **`tools/verify-shell.mjs`** — it has 57 references to `marks` and is the harness that will need to
  express the new cell shape. Extend it; do not write a second harness.
- **Roll Call!'s `_trackTardyMark()`**, in
  `C:\Users\WildB\OneDrive\Documents\Coding Projects\Attendance App\src\dashboard.html`. The work
  order names it because it already solves the orphaned-time case in Acceptance line 10. Read it
  before writing yours. Take the handling; do not take `preTardyLog` as a second store — the cell is
  the record, per the last Trap.
- **`docs/data-model.md`** — both the `marks` section you are amending and the score-cell rule the
  work order quotes ("always an object, never a bare number"). The new shape is that rule applied one
  datatype over, so describe it in the same voice.

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

## 5. Done means these 14 lines, reported against one by one

1. Tapping one student's cell moves that cell to `P` and **changes no other cell on the screen**. Verify by reading every other cell, not by looking at one.
2. "Everyone's here" resolves every student to `P` in one tap, and the document holds no `U` afterwards.
3. A class with 25 students, two of them absent, is **two entries** in the finished document — no `U`, no `P`. Storage at rest is unchanged from WO-2.1.
4. Tapping one cell, then reloading, still shows one `P` and twenty-four `?` — the unconfirmed state survives, which is the whole reason it is stored.
5. A class nobody has touched has **no record at all** and reads "not taken yet". It is not a class of 25 absences. *(The single most damaging way to get this wrong.)*
6. The home card names the number of unconfirmed students on a half-taken class.
7. The cycle from `?` reads `P → A → E → T → D` and returns to `P`, never to `?`.
8. A student added to the roster after a class was taken does not acquire a mark for it retroactively.
9. Marking a student tardy stores an `at` timestamp; the marking screen shows the time without running a report.
10. Cycling `P → A → E → T → D` past `T` and landing on `D` leaves **one** time — the dismissal's — and no orphaned tardy time. Verify in the document.
11. Cycling all the way back to `P` clears the entry entirely: no code, no `at`, no note left behind.
12. A note typed on a mark survives a reload and appears on the same student, date and class.
13. **Every cell in the document is an object.** Not one bare string anywhere, including `U`s and including untimed codes. Inspect the document, not the UI.
14. **Restoring a backup written before this work order produces object cells**, with the codes intact and no `at` invented for marks that never had one. *(WO-1.5's restore path is the one thing standing between a teacher and a lost term — this is the acceptance line that says the migration did not eat it.)*

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

