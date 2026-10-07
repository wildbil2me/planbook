# WO-3.51 — no check presses the copy dialog's source-line Clears · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.51-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, **Opus** (no model override): harness-only and XS, but its Traps are judgment —
a red check on the delivered tree is an app defect to *stop and report*, never a check to bend — and
it owes `TESTING.md` § WO-3.51 prose plus a mutation round. Runner-up Codex (spec complete, mechanically
checkable, `clearOn()` is the convention to copy) set aside on ties-to-Claude and the WO-1.59 / WO-1.61
precedent. No Codex probe was run, because this is not a Codex route.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.51 — no check presses the copy dialog's source-line Clears

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-06 · **Size** XS · **Depends on** WO-3.49
**Closes roadmap** *(no box. A harness gap, owner-directed, 2026-10-06.)*

**Booked 2026-10-06**, owner-directed, out of a reading of WO-3.49's Clears after it closed.

**The gap.** WO-3.49 put two date fields and two Clears on the copy dialog's source line. The Clears
are drawn by `copyDateCell()` in `src/assignments.js` and routed by `clearDateField()` in
`src/shell.js` to `copyFieldCleared()`, whose `sourceField` branch hands the fresh input to
`setCopySource()`. **No check ever presses them.** `tools/verify/copy-class.mjs` presses only P7's due
and assigned Clears on a ticked line, and it measures the source line's Clears for fit at 1280, 920
and 919px without pressing them. So nothing tests that clearing a source date is a held edit like
every other source edit, that untouched lines follow it, or that Cancel undoes it.
`tools/verify/date-clear.mjs`'s census counts its ten Clears with the dialogs shut, on purpose, and
is not the place for this.

**Why now.** [WO-3.50](#wo-350--the-due-date-picks-an-assignments-term-in-the-editor-too)'s sixth
ruling has the source line's term follow its due date, with a blank due date falling back to the
assigned date. Pressing the source's due Clear is the quickest way to reach that fallback, so the
path should be fenced before WO-3.50 changes what is behind it.

**Deliverables** — checks in `tools/verify/copy-class.mjs` that press the source line's two Clears
through the button, the way `clearOn()` presses P7's, and read the result.

**Acceptance**
- [ ] Pressing the source's due Clear empties the source's due field and only that field, and every
      ticked line the teacher has not touched follows it to blank. A touched line keeps its own
      date. The same holds for the assigned Clear.
- [ ] Neither press writes: `rev` is unmoved after a `flush()`, and the source in the document is
      byte-identical.
- [ ] After both Clears, Cancel leaves the document byte-identical to before the dialog opened, and
      reopening the dialog shows the source's stored dates.
- [ ] After a source Clear, the confirm saves the source with that date empty, in the same single
      `update()` as the copies, and the confirm label reads *Save … and copy into N classes*.
- [ ] Mutation-proved: with the `sourceField` branch in `copyFieldCleared()` removed, at least one of
      these checks goes red. Recorded in `TESTING.md` § WO-3.51. **The mutation is reverted before
      anything else is written** (`AGENTS.md`).

**Traps** — **If a check fails on the delivered tree, that is an app defect, not a check to adjust.**
Stop and report it with the failing output rather than fixing `src/` inside this work order.
**Press the button**, never set `.value = ''` and dispatch an event: an emptied field fired as an event
is the exact path WO-1.47 and WO-1.48 ruled out. Harness only; nothing in `src/` moves and there is
no `CACHE` bump.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/assignments.js`
  - `src/shell.js`
  - `tools/verify/copy-class.mjs`
  - `tools/verify/date-clear.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `AGENTS.md` § "If you were dispatched with a work order": **revert the mutation before you write
  anything else**, and run `grep -rn MUTATION src/ tools/` before you report.
- `TESTING.md` § WO-3.49 (around line 10540) is the shape § WO-3.51 should follow, and it sits directly
  above where § WO-3.51 goes.

**Where things are, so you can skip the search.**
- `copyFieldCleared()` is at `src/assignments.js` ~1912. The mutation is deleting the one line
  `if (sourceField) { setCopySource(fresh); return; }`. Find out what the fall-through to
  `setCopyDate(fresh)` actually does with a source input — whether it throws, does nothing, or writes
  somewhere wrong — and say which in the TESTING record. A mutation that only "goes red" because the
  whole section threw is weaker evidence than a named check failing; if that is what happens, report it
  plainly.
- In `tools/verify/copy-class.mjs`: `clearOn()` is ~657 and is scoped to `#assignmentCopyList`;
  `flush` ~502; the source-line state reader ~601; the existing WO-3.49 source-edit checks ~763–975,
  including a held-edit check (~775), a single-`update()` confirm check (~891) and a dismissals check
  (~970). **Copy those checks' shapes** — same `DOC349` snapshot style, same `rev` arithmetic — rather
  than inventing new readers. Put the new checks in the WO-3.49 block's neighbourhood, labelled
  `WO-3.51:`.

**Traps the work order does not spell out.**
- **The press is a click on `[data-date-clear]` inside the source line's `[data-date-field]`** — the
  same selector shape `clearOn()` builds. A helper that sets `.value = ''` and fires an event is the
  ruled-out path and fails the work order even if every check goes green.
- **Line 1 needs a touched line and an untouched one at the same time.** Tick at least two classes;
  give one its own date through the existing `pick()` before pressing the source Clear, and read both.
- **Line 4 — a blank source date at confirm.** If the confirm refuses, mis-saves, or writes the copies
  without the source, **that is the work order's Trap firing: stop and report it with the failing
  output.** Do not adjust the expectation and do not touch `src/`. The same goes for the label.
- **WO-3.50 is not built.** Do not assert anything about which term a blank-due source falls back to;
  this work order fences the path, it does not rule on what is behind it.
- The `--today` clock: if you need a shifted date, note WO-1.62 (booked today) says a Quarter 2
  `--today` run is red before anyone touches it. Run on the real clock.
- Nothing in `src/`, `index.html` or `sw.js` moves; no `CACHE` bump. Your diff should be
  `tools/verify/copy-class.mjs`, `TESTING.md`, and the phase file's ticks.

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

1. Pressing the source's due Clear empties the source's due field and only that field, and every ticked line the teacher has not touched follows it to blank. A touched line keeps its own date. The same holds for the assigned Clear.
2. Neither press writes: `rev` is unmoved after a `flush()`, and the source in the document is byte-identical.
3. After both Clears, Cancel leaves the document byte-identical to before the dialog opened, and reopening the dialog shows the source's stored dates.
4. After a source Clear, the confirm saves the source with that date empty, in the same single `update()` as the copies, and the confirm label reads *Save … and copy into N classes*.
5. Mutation-proved: with the `sourceField` branch in `copyFieldCleared()` removed, at least one of these checks goes red. Recorded in `TESTING.md` § WO-3.51. **The mutation is reverted before anything else is written** (`AGENTS.md`).

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

