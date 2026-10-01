# WO-1.58 — a section that throws still hands on print media, a time zone and blocked URLs · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.58-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, **Opus**, on its own merits. The deciding signal is the proof budget: three
planted throws, each run with and without the new restore, plus one clean run is ~7 full
`verify-shell.mjs` runs at ~4.4+ min — well past Codex's 20-minute cap — and the Traps are judgment
(`recoverPage()` never throws; put back what the section *received*, never a default; no per-file
`finally`) with `TESTING.md` prose to write. The runner-up was Codex on "widen an existing pattern to
three methods", set aside on the arithmetic. Same route as WO-1.57.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.58 — a section that throws still hands on print media, a time zone and blocked URLs

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-30 · **Size** XS · **Depends on** WO-1.57 — the record and the restore this widens
**Closes roadmap** *(no box. A harness defect with no live symptom yet.)*

**Booked 2026-09-30**, owner-directed, from WO-1.57's verdict. WO-1.57 made `recoverPage()` put back
touch emulation, device metrics and page-start scripts after a section throws, by recording them
inside the module-level `send` in `tools/verify-shell.mjs` (`noteWhatItChanges()`) and undoing them
in `putBackWhatTheSectionChanged()`. **Three more settings survive a reload the same way and are not
followed.** `TESTING.md` § WO-1.57 names two of them as out of reach:

- **`Emulation.setEmulatedMedia`**, 24 sends from eight section files, mostly print tests
  (`print-sheets`, `grade-sheet`, `grade-detail` and others). A throw while the page is held in `print` hands `print`
  to every later section.
- **`Emulation.setTimezoneOverride`**, sent twice by `history-dialog-write.mjs` (lines ~412 and
  ~627). A throw between them hands `America/New_York` on.

The verifier found the third one and the record does not list it:

- **`Network.setBlockedURLs`**, sent from six places, four in `sync-button.mjs` (~288/304,
  ~484/527) and two in `first-run.mjs` (~416/434). A throw while `*accounts.google.com*` is blocked hands the
  block on. It is the same shape as the stand-in Google library WO-1.57 removes, reached through
  the network rather than a script.

No section throws today, so this costs nothing yet. When one does, the sections after it can be
measured in the wrong media, clock zone or network with nothing to say so.

**Deliverables**
- **Record and restore all three the way WO-1.57 records touch and metrics**: the last successful
  value, run-wide; the value each section received, copied as it starts; put back after a throw
  only if it differs. "Not set" is a real baseline (`media: ''`, `timezoneId: ''`, `urls: []`), not
  an invented default.
- **Correct the two statements that say these are not put back**: the `noteWhatItChanges()` comment
  block in `tools/verify-shell.mjs` and the out-of-reach list in `TESTING.md` § WO-1.57. Add
  `TESTING.md` § WO-1.58 with the planted runs, and state there whatever is still out of reach.
- Nothing under `src/` moves, and no section file is edited except by a planted, reverted throw.

**Acceptance**
- [ ] A throw planted inside a print window (for example in `print-sheets.mjs` after
      `setEmulatedMedia { media: 'print' }`) leaves the next section reading
      `matchMedia('print').matches` the same as on a normal run. Mutation-proved: with the new
      restore removed, the same throw leaves it `true`. Recorded in `TESTING.md` § WO-1.58, and **the
      planted throw is reverted before anything else is written** (`AGENTS.md`).
- [ ] A throw planted in `history-dialog-write.mjs` between its two timezone calls leaves the next
      section reading `Intl.DateTimeFormat().resolvedOptions().timeZone` the same as on a normal
      run, mutation-proved and recorded the same way.
- [ ] A throw planted in `sync-button.mjs` while `*accounts.google.com*` is blocked leaves the next
      section with no blocked URLs, shown by a request to a matching URL that a planted probe reads
      as not blocked. Mutation-proved and recorded the same way.
- [ ] The whole harness is green on the real clock, the check list is unchanged in names and order,
      and no check changes state against HEAD.
- [ ] `node tools/wo-sweep.mjs` is green, including § 25's reading of `runSection()`'s shape.

**Traps** — **`recoverPage()` must still never throw**, and a CDP call that fails while restoring
goes in its existing `catch`, as WO-1.57's do. **Put back what the section received, never a
fixed default**: nothing sets these three before the first section today, but if the harness ever
sets one run-wide, a recovery that cleared it would break the run it is recovering. `--today` works
through the `SHIFT_PAGE_CLOCK` script, not a time zone, so it is not affected. **`Network.setBlockedURLs` only does anything while `Network.enable` is on**, and only
three sections send that. Record the URL list regardless, and do not start tracking
`Network.enable` itself unless a planted run shows it is needed. **Do not fix the files one
`finally` at a time**, for the reason WO-1.57 gives.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `tools/verify-shell.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- **The pattern you are widening**: `tools/verify-shell.mjs` — `noteWhatItChanges()` (~line 629),
  the module-level `send` that calls it (~653), `putBackWhatTheSectionChanged()` (~984) and
  `recoverPage()` (~1004), plus `runSection()` (~461) where the per-section copy is taken. Match
  WO-1.57's shape exactly; do not invent a second mechanism.
- **The record to model yours on**: `TESTING.md` § WO-1.57 (~line 2386) — how the planted runs, the
  `MUTATION WO-1.57` marker, and the closing `grep -rn` proving none is left were written down. Its
  out-of-reach list is one of the two statements you must correct.
- `.claude/dispatch/WO-1.57-result.md` — what that implementer found while building the same thing.

**Traps the work order does not spell out:**

- **Every `setEmulatedMedia` send in the tree today is `{ media: 'print' }` or `{ media: '' }`** — no
  `features`. Record the whole params object anyway, so a later send that adds `features` is put back
  rather than flattened.
- **Planted probes and throws carry a `MUTATION WO-1.58` marker** and come out before you write
  anything else (`AGENTS.md`). Before reporting, run `grep -rn "MUTATION WO-1.58" tools/ src/` and
  quote its empty output. Two dead dispatches here left live mutations under ticked boxes.
- **Acceptance 4 means a comparison, not a green total**: diff the check list (names and order) and
  each check's state against a run at HEAD (`git stash` is unsafe with concurrent edits — capture the
  HEAD run first, before you edit). Say in the result file how you compared.
- If a planted run shows `Network.enable` must be tracked too, say so with the evidence; otherwise
  do not track it.

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

## 5. Done means these 5 lines, reported against one by one

1. A throw planted inside a print window (for example in `print-sheets.mjs` after `setEmulatedMedia { media: 'print' }`) leaves the next section reading `matchMedia('print').matches` the same as on a normal run. Mutation-proved: with the new restore removed, the same throw leaves it `true`. Recorded in `TESTING.md` § WO-1.58, and **the planted throw is reverted before anything else is written** (`AGENTS.md`).
2. A throw planted in `history-dialog-write.mjs` between its two timezone calls leaves the next section reading `Intl.DateTimeFormat().resolvedOptions().timeZone` the same as on a normal run, mutation-proved and recorded the same way.
3. A throw planted in `sync-button.mjs` while `*accounts.google.com*` is blocked leaves the next section with no blocked URLs, shown by a request to a matching URL that a planted probe reads as not blocked. Mutation-proved and recorded the same way.
4. The whole harness is green on the real clock, the check list is unchanged in names and order, and no check changes state against HEAD.
5. `node tools/wo-sweep.mjs` is green, including § 25's reading of `runSection()`'s shape.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

