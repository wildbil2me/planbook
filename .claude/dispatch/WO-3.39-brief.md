# WO-3.39 — the score grid's help explains weights to a points class first · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.39-result.md` — as your last act, and return it in-band too.

**Routing.** Claude Opus, on its own merits: the deliverable is teacher-facing help prose in `index.html` whose split point and points-half wording are judgment (ROUTING § "Route to Claude" — teacher-facing prose; a judgment Trap, *do not reword*), and the trap below means one sentence must be re-worded while its neighbours must not. Runner-up set aside: Codex — the branch on `gradingModeOf()` and the harness edit are mechanical, and three harness runs (~13 min) fit the cap — but ties go to Claude and the prose decision is the work.

**Owner's ruling, 2026-10-03: option (a)** — a class draws only its own mode's half. Option (b) is not on the table; do not strike the row.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.39 — the score grid's help explains weights to a points class first

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-03 · **Size** S · **Depends on** WO-3.36 — the points-mode score grid this paragraph sits under
**Closes roadmap** *(no box. Owner-directed, 2026-10-03.)*

**Booked 2026-10-03**, owner-directed, out of WO-3.36's verdict. **Unreachable today**, because
nothing writes `gradingMode` until [WO-3.31](#wo-331--the-categories-editor-offers-total-points).
**WO-3.31 does not depend on this row**: the paragraph is true in both modes, so a points class that
reads it is told nothing false. This row is about which half it reads first.

**What is there.** The score grid's second help paragraph (`index.html`, ~1346, *"The grade beside
each name is live"*) is static and shared. It spends most of its length on the weighted rule:
*"In a class graded by weighted categories…"*, the empty-category redistribution, and *"until the
weights total 100% there is no grade at all"*. Its last sentence then covers a points class. WO-3.34
wrote it that way, and WO-3.36's harness skips it on purpose, because its Traps said to branch rather
than reword shared text. So a points class has no weight wording on the grid except in its own help.

**Open — the owner's ruling, at dispatch.**
- **(a)** A class draws only its own mode's half. The paragraph is split into two blocks and the
  screen shows one, from `gradingMode`, so WO-3.36's measurement can stop skipping it.
- **(b)** Leave it. The paragraph explains both modes, and a teacher deciding between them is
  better served by reading both. If so, this row is 🚫 STRUCK with that ruling as its note.

**Deliverables** *(for (a))*
- **The paragraph is split** so the weighted sentences and the points sentence can be shown apart.
  The sentences before the split (*live*, *can go over 100%*, *extra credit*) stay shared.
- **The screen shows the block for the class's mode** whenever the grid is drawn, including after a
  class switch.
- **WO-3.36's points measurement stops skipping the help** in `tools/verify/points-grade.mjs`.

**Acceptance** *(for (a))*
- [ ] In a points class the score grid's help has no weight wording. **Measured**, by the existing
      WO-3.36 check with its skip removed. **Mutation-proved**: drawing both blocks goes red.
- [ ] A weighted class's help reads word for word as today.
- [ ] Switching from a points class to a weighted one and back draws the right block each time.

**Traps** — **Do not reword the weighted sentences.** They are moved, not rewritten. **Do not
compute anything for the help text.** It reads the mode and nothing else.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `tools/verify/points-grade.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `index.html` ~1346 — the paragraph itself (`<p class="scores-hint">`, the third of three).
- `src/scores.js` — `gradingModeOf()` is already imported (~118) and used at ~463 and ~746. **Ask the mode through `gradingModeOf(cls)`, never `cls.gradingMode`** (the file's own comment at ~115 says why). Find where the grid is painted per class so the block choice re-runs on every draw, including a class switch.
- `src/scores.css` ~576 — `.scores-hint` styling; the split blocks must look exactly as the paragraph does now.
- `sw.js` — **bump `CACHE`**: `index.html` is `SHELL` entry one.

**Traps this brief adds — read before you write.**
1. **The points sentence itself contains weight wording.** Today's last sentence reads *"In a class graded on total points there are no weights to balance: …"*. Acceptance line 1 is measured by the WO-3.36 check (`WEIGHTISH = /weight/i`, `tools/verify/points-grade.mjs` ~269) with the `.scores-hint` exclusion removed — so if the points block keeps "no weights to balance", that check goes red on the correct build. The work order's Trap forbids rewording the **weighted** sentences only; the points sentence is the one you may (and must) re-word so a points class reads no "weight" at all. Keep its meaning — every point earned over every point possible, work in no category included, from the first score entered — and say in your report exactly what the old and new wording are, so the owner can read it.
2. **"Word for word as today" for a weighted class** means the weighted class sees the shared opening sentences + the weighted sentences, and **not** the points sentence (that is what "draws only its own half" means). Measure that by text comparison against the current string, not by eye — whitespace-normalised textContent equality is fine.
3. **Only the third paragraph is split.** The first two `.scores-hint` paragraphs are not mode-specific. The WO-3.36 check currently strips *all* `.scores-hint` from `words` and reads them separately via `hintWeights`; removing "the skip" means the help is part of `words` again (or equivalently, measured against `WEIGHTISH` directly). The now-obsolete "read separately" sentence check (~285–292) should go or be replaced, not left asserting a carve-out that no longer exists. Update the comment at ~158–162 to match.
4. **Hidden must mean not drawn for the check.** If you hide the other block with `.hidden`, `textContent` still reads it — the measurement must ignore hidden blocks (or you remove/insert rather than hide). Whatever you pick, the mutation "draw both blocks" must turn line 1 red; actually run it, then revert it before you write anything else (AGENTS.md — `grep -rn MUTATION` is the first move on any dead dispatch, so mark any mutation you insert with that word).
5. **Line 3 (switch points → weighted → points)** wants a harness check in `points-grade.mjs`, not a reasoned claim. The existing fixture plants a points class; find or plant a weighted one beside it and switch through the class tabs.
6. **Do not touch `src/grade-engine.js`** and compute nothing for the help (work order's Trap).

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

## 5. Done means these 3 lines, reported against one by one

1. In a points class the score grid's help has no weight wording. **Measured**, by the existing WO-3.36 check with its skip removed. **Mutation-proved**: drawing both blocks goes red.
2. A weighted class's help reads word for word as today.
3. Switching from a points class to a weighted one and back draws the right block each time.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

