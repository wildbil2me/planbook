# WO-2.55 — a tardy caught late has no way to say when it happened · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.55-result.md` — as your last act, and return it in-band too.

**Routing.** Claude **Opus**, on the work order's own merits: it produces teacher-facing prose (the pass-owns-this-time sentence, `TESTING.md`, `CHANGELOG.md`, a `docs/data-model.md` rewording) and its central trap is a judgment one — the offset must be the *mark's date's*, which no mechanical reading of `stampNow()` gives you. Runner-up was Codex (size S, a checkable writer); the prose puts it in the Claude column and ties go to Claude.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.55 — a tardy caught late has no way to say when it happened

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-28 · **Size** S · **Depends on** WO-2.10 — the `at` this edits; WO-2.53 — the history dialog's write block it goes in; WO-2.8 — the pass a `D` can carry
**Closes roadmap** *(no box. A gap in WO-2.10's timed marks, found by the owner on 2026-09-28.)*

**Booked 2026-09-28**, owner-directed, from a question about what a past-day tardy writes. *"Sometimes
you just can't catch the tardy in the moment, so some method of editing it will be necessary."*

**What is missing.** `at` is written in exactly one place, `setMark()` in `src/attendance.js`
(~2196), and only when the column is today. So a `T` or `D` entered on a past day is
`{ "code": "T" }` with no time (`docs/data-model.md` § Attendance), and a tardy caught ten minutes
late today carries the moment of the tap, not the moment the student walked in. **Nothing in the app
can change `at` afterwards.** The history dialog's write block (`writeBlock()`,
`src/attendance-report.js` ~467) shows the time as part of the mark's label and offers only a note
field. The one workaround is cycling off `T` and back on today's column, which re-stamps to *now*.

**The rulings, taken with the owner 2026-09-28.**
1. **Not a dialog on the tap.** The cycle stays one tap per student with a class walking in. The time
   is corrected afterwards, in the history dialog, beside the note. That is where a mark's details
   already live, and `editableMark()` already gates which days can be written.
2. **No flag for a typed time.** A typed time is written to `at` in the same shape as a stamped one.
   No new field, no schema change, and every existing backup restores unchanged.
3. **`T` and `D` both get the field. A `D` that carries a `passId` shows its time read-only.** The
   pass log closed on that same stamp (`setMark()` ~2203), and two clocks for one dismissal would
   disagree. The field is replaced by a sentence saying the pass owns that time.

**Deliverables**
- **A writer, `setMarkTime(studentId, text, date)`, in `src/attendance.js`** beside `setNote()`, with
  the same gates (`writableDate()`, `offTermDay()`, a record, a mark on that student) plus: the code is
  `T` or `D`, and the cell has no `passId`. It writes `at` as a local ISO timestamp with offset, as
  `stampNow()` does, built for **the mark's own date** at the typed hour and minute, so a past day gets
  that day's offset rather than today's. An emptied field deletes `at`. It does not repaint, for
  `setNote()`'s reason.
- **`editableMark()` hands over `canTime`** (`T` or `D`, no `passId`) and whether a `passId` locked
  it. The dialog decides nothing about writability, per WO-2.53's rule.
- **The history dialog's write block gains a time input** (`type="time"`) for `T` and `D`. It is
  pre-filled with the stored time when there is one and empty on a past day that has none. It carries
  its date on the element exactly as the note field does (`data-attendance-time-date`), is wired
  through `src/shell.js` beside the note listener, and meets the 44px coarse floor. A pass-linked `D`
  shows the time as text and one sentence instead.
- **`docs/data-model.md` § Attendance** rewords *"`at` is written only on today's column"*. What is
  true now is that the tap stamps only on today's column, and the teacher may type a time on any
  writable day.
- **Harness checks in `tools/verify/history-dialog-write.mjs`**: a typed time on a past-day `T` lands
  in the document with that date's offset; a typed time on today's `T` replaces the stamp; an emptied
  field deletes `at`; a pass-linked `D` draws no input; `A`, `E` and `U` draw no input.
- **`TESTING.md` § WO-2.55, the `CHANGELOG.md` entry, and bump `CACHE` in `sw.js`.**

**Acceptance**
- [ ] On an unlocked past day, mark a student `T`, tap the name, type 8:20: the document holds
      `{ "code": "T", "at": "<that date>T08:20:00<that date's offset>" }` and the cell shows the time.
      Verify in the document.
- [ ] On today's column, a typed time replaces the tap's stamp, and cycling the cell off `T` and back
      still re-stamps it (the cell is rewritten whole, as before).
- [ ] A `D` carrying a `passId` draws no time input, and nothing writes its `at` except the tap.
- [ ] `A`, `E`, `P` and `U` draw no time input, and `setMarkTime()` refuses them.
- [ ] Mutation-proved: build the timestamp with today's offset instead of the mark's date, and the
      past-day check goes red across a daylight-saving change. **The mutation is reverted before
      anything else is written** (`AGENTS.md`).
- [ ] `node tools/verify-shell.mjs` green with its check count recorded and `tools/README.md`
      reconciled; `node tools/wo-sweep.mjs` green.
- [ ] 👤 **iPad, force-quit first** (`CLAUDE.md`): tap a tardy student's name, set the time with the
      iOS time wheel, close the dialog; the cell shows the new time.

**Traps** — **Do not open a dialog from the cell tap.** That is ruling 1, and the attendance flow is
on the critical path. **Do not route the time through `setMark()`**: that writer rewrites the cell
whole and would drop the note, and it is the one that owns the pass. **The offset is the mark's
date's, not the device's today**: a tardy typed in November for a day in October is an EDT time, and
`new Date(y, m, d, hh, mm)` gives that for free where re-using `stampNow()`'s offset would not.
**Do not add a field to the cell** (ruling 2). **Do not write on a locked day**: the gate is
`editableMark()`'s, so the dialog never offers a field the writer would refuse.

**Out of scope.** Editing a pass's own times, or a pass-linked `D`'s time (ruling 3). Any change to
the cycle, to what a tap writes, or to `U`.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `docs/data-model.md`
  - `src/attendance-report.js`
  - `src/attendance.js`
  - `src/shell.js`
  - `tools/README.md`
  - `tools/verify-shell.mjs`
  - `tools/verify/history-dialog-write.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**Anchors (verified 2026-09-28, line numbers drift):** `stampNow()` `src/attendance.js:533` · `setMark()` :2118 · `setNote()` :2382 — match its gates, its no-repaint rule and its comment style · `editableMark()` :2424 · `writeBlock()` `src/attendance-report.js:467` — the note field at ~488 is the pattern for the time field's `data-*` attributes · the note listener `src/shell.js:3722`, and the attribute catalogue in the comment at `src/shell.js:~296` gains the new attribute. `CACHE` in `sw.js` is `planbook-shell-v145` today.

**Traps worth naming beyond the work order's own.**
- **Which event writes.** The note field writes on an input event; a `type="time"` on iOS fires as the wheel moves. Pick the event deliberately and say why at the listener — a half-spun wheel must not leave a wrong `at` that the dialog then closes over.
- **The cell label.** `writeBlock()` shows the time inside the mark's label; after a typed time the label and the grid cell must both read the new value when the dialog closes (Acceptance 1 and the 👤).
- **DST mutation needs a date that crosses one.** The harness clock is `--today=YYYY-MM-DD` (`CLAUDE.md` § Commands); a past-day mark in EDT read from an EST today (or the reverse) is what makes the mutation bite. Run it under `--today` if the real date does not straddle a change, and record which.
- **Mutation discipline** (`AGENTS.md`): put `MUTATION` in the mutated line, revert it before writing anything else, and `grep -rn MUTATION src tools` clean before your result file.
- **Session budget is tight.** The rolling window read 28.5M proxy units at claim, past the median death point. Write your result file early and update it, so a quota kill leaves a record; tick boxes only as each is proven.

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
  exceptions: **never tick a 👤 or 📆 line** — one needs a real iPad you do not have, the other a date
  that has not arrived — and leave the `CHANGELOG.md` entry to the teacher, who decides what a change
  means. Anything you do tick must be
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

## 5. Done means these 7 lines, reported against one by one

1. On an unlocked past day, mark a student `T`, tap the name, type 8:20: the document holds `{ "code": "T", "at": "<that date>T08:20:00<that date's offset>" }` and the cell shows the time. Verify in the document.
2. On today's column, a typed time replaces the tap's stamp, and cycling the cell off `T` and back still re-stamps it (the cell is rewritten whole, as before).
3. A `D` carrying a `passId` draws no time input, and nothing writes its `at` except the tap.
4. `A`, `E`, `P` and `U` draw no time input, and `setMarkTime()` refuses them.
5. Mutation-proved: build the timestamp with today's offset instead of the mark's date, and the past-day check goes red across a daylight-saving change. **The mutation is reverted before anything else is written** (`AGENTS.md`).
6. `node tools/verify-shell.mjs` green with its check count recorded and `tools/README.md` reconciled; `node tools/wo-sweep.mjs` green.
7. 👤 **iPad, force-quit first** (`CLAUDE.md`): tap a tardy student's name, set the time with the iOS time wheel, close the dialog; the cell shows the new time.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

