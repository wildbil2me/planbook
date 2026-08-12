# WO-1.15 — the restore compare cannot see what it is about to delete · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.15-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude at **Opus**, on this work order's own merits and not by fallback — no
Codex probe was run, because `ROUTING.md` names backup and restore as a sensitive surface that is
never delegated, and this one also produces teacher-facing prose (the confirm sentence that has to
name what would be lost) plus an Acceptance line about accommodation data staying out of the panel in
either presentation mode. The runner-up consideration set aside: it is Size **S** with a
mechanically checkable core — count things, show two columns — which is normally the Codex shape, and
`verify-shell.mjs` can prove the counts. That was not enough to move it, because the deliverable that
actually matters here is a sentence a teacher reads in the two seconds before she destroys a term,
and the failure mode is silent.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.15 — the restore compare cannot see what it is about to delete

**Ship** 2 · **Status** 🤖 CLAIMED — 2026-08-12 · **Size** S · **Depends on** —
**Closes roadmap** Phase 1 → *(no box. A defect in code Phase 1 shipped, found on 2026-08-12 while
reading `gates.md`'s iPad rules against `src/backup.js`. The same call as WO-1.14.)*

**Why it exists.** `gates.md` § *The iPad stays in the rotation* carries a rule in bold — **restore
only ever flows laptop → iPad, never the reverse** — and calls it "the one that can destroy a term".
Restore is a wholesale replace, not a merge (`restoreDocument()`, `src/store.js:651`), so a backup
taken off the test device and opened on the teaching one replaces the real ledger with test data,
**silently, and reporting success.**

**Nothing in the app enforces that rule, and worse, the screen that exists to catch it cannot.** The
confirm modal builds a side-by-side compare from `describe()` (`src/backup.js:116`), and that function
returns exactly six things: `year`, `classes`, `students`, `saved`, `rev`, `schemaVersion`. **It counts
the roster and never the record.** Two documents with the same five classes and the same twenty-five
students produce an identical panel whether one holds a term of marks and scores and the other holds
none — which is precisely the pair of documents this rule exists to keep apart. The button then reads
*"Replace 2026-2027"*, and a teacher reading carefully still has nothing to read.

**The year label is the only real guard**, and it is doing more work than anyone wrote down: restore
is keyed by year, so an iPad living in `2030-2031` cannot replace `2026-2027` at all. That is why
WO-1.16 matters as much as this does, and why this work order is defence in depth rather than the
primary fix. **The danger is confined to the case where both devices hold the same year label** —
which is exactly the case today.

**Deliverables**
- **The compare panel counts the record, not just the roster.** Recorded meetings, marks, assignments
  and scores on both sides, in whatever wording matches the panel it joins.
- **When the stored side holds materially more than the file does, the confirm surface says so in
  words** rather than leaving it to be inferred from two columns of numbers. A reader should not have
  to subtract.
- No new screen and no new flow: the same modal, the same button, the same one line in
  `confirmRestore()` that touches disk.

**Out of scope** — blocking or refusing the restore; guessing which device a file came from (nothing
in the format records it, and inventing a field is a schema change this does not need); anything about
sync, which is Phase 7's.

**Acceptance**
- [ ] A backup holding zero marks, restored over a year holding a term of them, shows both counts
      **before** the button is pressed, and the counts differ on screen.
- [ ] The confirm text names what would be lost, not only what would be gained.
- [ ] A restore of a *different* year is unaffected — it is a normal, safe act and must not acquire a
      warning it does not deserve.
- [ ] No accommodation, medical or plan data appears in the panel, in either presentation mode.
- [ ] 👤 On the iPad the panel still fits and the confirm button keeps its 44px.
- [ ] `verify-shell.mjs` gains checks for the new counts, proved against a fixture where the roster
      matches and the record does not.

**Traps** — **Do not infer direction from the device.** There is no device field and there must not
be one; the fix is to make the difference *visible*, not to make the app clever. **Do not treat every
replace as dangerous** — replacing a year from its own backup is the whole point of backups, and a
warning on the safe case trains the teacher to click through the unsafe one.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/backup.js`
  - `src/store.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**Also open these, and the reason for each:**

- **`plans/work-orders/gates.md` § "The iPad stays in the rotation"** — the rule this work order is
  defence for, in the words it was written in. Read all three bullets; the second one (the iPad lives
  in a year that cannot be mistaken for the term) is WO-1.16 and is the primary fix. Yours is the one
  that works when both devices hold the same label, which is the case today.
- **`docs/data-model.md` § "The document"** (from line 35) — the exact shape of everything you are
  about to count. Read it before you write a counter, not after.
- **`docs/data-model.md` § "Accommodations — the most sensitive data in the app"** (line 322) and
  **`src/presentation.js`** — for Acceptance line 4.
- **`src/backup.js:935` `hasSomethingToLose()`** — the nearest existing convention. It already
  enumerates "does this year hold a record" for the backup nag, and whatever you write should read as
  a sibling of it rather than a second dialect. **Note what it does and does not include** — see the
  fourth trap below.
- **`tools/verify-shell.mjs:1055`** — the existing `backup & restore` section, and `:5455`
  (`acceptance 5: the backup names what it holds, and holds it`). Your new checks belong with these
  and should follow their fixture pattern. Do not start a new section elsewhere in the file.

**Four traps specific to this change, found while routing it. None is in the work order text.**

1. **`count()` (`src/backup.js:98`) is `Array.isArray(list) ? list.length : 0`, and `scores` is not an
   array.** It is an object keyed by assignment, then by student (`docs/data-model.md:100`). So
   `count(doc.scores)` returns **0** on a full gradebook — a counter that reads zero on a term of
   marks and reports success, which is the *exact* class of defect this work order exists to remove.
   Reproducing it inside the fix would be the worst available outcome.
2. **`count(doc.attendance)` counts records, not meetings.** A record carrying `exception: 'dropped'`
   is a class that did not meet (`docs/data-model.md:115`), and `CLAUDE.md` is emphatic that
   everything counts **recorded meetings**. A record with no `exception` met; no record at all is
   *not taken yet*. Three states, not two. WO-2.4 already settled this arithmetic — find where it
   lives and reuse it rather than writing a second definition of "meeting" in `backup.js`.
   **Marks** are nested inside `attendance[].marks`, so they are a third number, not the same one.
3. **Do not count supports, plans, medical notes, or accommodations — not even as a bare number.**
   "3 students with IEPs" on the compare panel is an accommodation disclosure the moment the screen is
   projected, and Acceptance line 4 is what fails. Counting *the record* means meetings, marks,
   assignments and scores, exactly as the Deliverables list says, and the list is exhaustive on
   purpose.
4. **`hasSomethingToLose()` omits `scores` from its enumeration** — it sums `classes`, `students`,
   `assignments`, `attendance`, `log`, `events` and `templates`, and `scores` is absent (as are
   `passes` / `openPasses`). Check this yourself rather than taking my word for it. That looks like a
   companion defect and it may well be one — a year holding only scores arguably should nag for a
   backup. **Do not fix it here.** Write it up in your result file as a proposed follow-up work order
   with the one-line reasoning, per the standing "never widen a work order" rule, and leave the
   function alone.

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

## 5. Done means these 6 lines, reported against one by one

1. A backup holding zero marks, restored over a year holding a term of them, shows both counts **before** the button is pressed, and the counts differ on screen.
2. The confirm text names what would be lost, not only what would be gained.
3. A restore of a *different* year is unaffected — it is a normal, safe act and must not acquire a warning it does not deserve.
4. No accommodation, medical or plan data appears in the panel, in either presentation mode.
5. 👤 On the iPad the panel still fits and the confirm button keeps its 44px.
6. `verify-shell.mjs` gains checks for the new counts, proved against a fixture where the roster matches and the record does not.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

