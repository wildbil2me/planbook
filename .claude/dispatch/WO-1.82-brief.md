# WO-1.82 — the log's append-only check has three regexes with no backslashes · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.82-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude, at **Opus**, on its own merits: the work is a mutate-run-revert round with plants in `src/log.js` — the file whose append-only rule this check exists to protect — plus a judgment sweep across `tools/` (what counts as "the same shape", and the booking-not-fold-in call), plus `CHANGELOG.md` / `TESTING.md` prose. The runner-up was Codex, since the regex repair itself is mechanical; it was set aside because the run count does not fit regardless — one clean run plus three plants plus the final clean run is ~5 × 4.4 min ≈ 22 min against the 20-minute cap, and a SIGTERM there leaves a remover planted in production code.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.82 — the log's append-only check has three regexes with no backslashes

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-23 · **Size** XS · **Depends on** — · **Blocks** nothing
**Closes roadmap** *(no box. Tooling, not app — the same call WO-1.26 through WO-1.81 made.)*

**Booked 2026-10-23**, owner-directed, from an observation in WO-3.72's result file, confirmed the
same day by reading the file. In `tools/verify/log-entries.mjs`, the check headed *append-only is
structural rather than promised* builds three regexes that lost their backslashes **when they were
written** — `0447d51`, WO-4.4, 2026-08-24 — and were carried unchanged through the harness split
(`5aa97ec`):

- `initGuard = /if (!Array.isArray(d.log))s*d.log = [];/` — the parentheses are groups and `s*` is
  the letter s, so it never matches the guard in `src/log.js`. The check prints *the create-on-first-
  write guard is present = false* on every run, and nothing reads that.
- `/.logs*=[^=]/` and `/.logs*[[^]]*]s*=[^=]/` — meant to find a reassignment of `.log` and an
  assignment into `.log[...]`, the two removers the comment above them asks for by name. As written
  they look for the letters `logs`, so **neither can fire on the code it was written to catch**.

The check passes today on its push count and its token list, so **the half of it that guards
CLAUDE.md's append-only rule against reassignment has never worked**. Nothing is known to be wrong in
`src/log.js`; the fence is down, not the field.

**Deliverables**
- **The three regexes restored** to what their comments describe, with the backslashes they need.
- **The guard is asserted, not printed**: the check fails if `initGuard` does not match, so a guard
  regex that stops matching cannot go quiet again.
- **Two plants**, each red and then reverted before anything else is written: `d.log = d.log.filter(…)`
  and `d.log[0] = …` added to a writer in `src/log.js`.
- **A look across `tools/`** for the same shape — a regex literal with `s*`, `d+` or `w+` and no
  backslash — named in `TESTING.md` § WO-1.82 whatever it finds. A second instance is a booking, not a
  fold-in.
- **`TESTING.md` § WO-1.82** and the `CHANGELOG.md` entry.

**Acceptance**
- [ ] `node tools/verify-shell.mjs` passes, and the append-only check reports the guard as present.
- [ ] A planted reassignment of `d.log` and a planted assignment into `d.log[...]` each turn the check
      red, naming the remover. Both plants are reverted, and `TESTING.md` § WO-1.82 shows the red
      output.
- [ ] Removing the guard regex's match (a plant that renames `d.log` in the guard) turns the check red.
      The plant is reverted.
- [ ] `TESTING.md` § WO-1.82 names every other regex in `tools/` of the same shape, or says it found none.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
- [ ] `TESTING.md` § WO-1.82 carries these lines verbatim with the evidence for each.

**Traps** — **Plants go in `src/log.js` and come out before anything else is written** — this is the
file whose append-only rule the check protects, and a plant left in is a remover in production
(AGENTS.md, the WO-5.1 scar). **Stage before planting**: a `git checkout` to revert a plant reverts
unstaged work in that file too. **Nothing in `src/` moves in the end**, so no `CACHE` bump is owed.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/log.js`
  - `tools/verify-shell.mjs`
  - `tools/verify/log-entries.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**Pointers and traps the work order does not spell out** (orchestrator, read off the tree 2026-10-23):

- The check is `tools/verify/log-entries.mjs` ~L367–391 (`/* ══ append-only ══ */`). The comment above `initGuard` explains why the guard is lifted out *before* the remover search — keep that reasoning; it is a ruling, not clutter.
- **The guard appears TWICE in `src/log.js`** — L187 (`writeEntry`) and L337 (`writeContact`). Today `bodyOnly.replace(initGuard, '')` is non-global. The moment the reassignment regex actually works, a non-global strip leaves the second guard in `searchable` and `\.log\s*=[^=]` fires on correct code — the exact false positive that comment records. Strip every occurrence. Consider asserting the guard count equals the writer count (2, matching the pinned push count) rather than merely `>= 1`; your call, but say which in the code comment and why.
- **`/g` regexes carry `lastIndex` into `.test()`.** If you make `initGuard` global for the strip, do not reuse the same object for a `.test()` — use `match()`/a count, or a separate literal.
- The guard regex must still match `d.log` written exactly as in the source, and the "rename `d.log` in the guard" plant (Acceptance 3) must make it NOT match — so it should be specific to `d.log`, not a `\w+\.log` wildcard.
- The failure message must **name the remover** (Acceptance 2) — the existing `found` list already carries `'reassignment of .log'` / `'assignment into .log[...]'`; make sure the red output shows it, and paste that red output into `TESTING.md`.
- The guard is "asserted, not printed": fold `guarded` into the pass condition (or a separate `check()`), and make the detail line say which half failed.
- **No section filter exists on `verify-shell.mjs`**; each plant costs a full run (~4.4 min). Budget accordingly and do not invent a filter flag (that is widening the work order). Run it in the background with a log and read the log's own exit line.
- **Stage before planting** (`git add` your harness edit) so reverting a plant with `git checkout -- src/log.js` cannot eat it. Grep for any `MUTATION` marker over `src/log.js` before you write your result file, and `git diff --stat src/` must be empty at the end.
- The `tools/` look: search regex literals for `s*`, `d+`, `w+`, `S*`, `.` -meant-as-dot etc. without the backslash. Distinguish genuine bugs from strings/prose that merely contain the letters. A real second instance is **named in TESTING.md as a proposed booking**, not fixed here.
- `tools/README.md` records a `check()` count; if you add a `check()` call, the sweep's count line goes red until you update it (the WO-3.26 last-mile scar).

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
- Write `TESTING.md` § <your work order>, every time: its Acceptance lines copied verbatim and the
  evidence for each. **It is a deliverable, not a permission** — the brief's § 5 names the heading,
  docs-only and process work owe one too (only a gate, whose boxes live in `gates.md`, does not), and
  `wo-gate.mjs --tick` refuses ✅ DONE without it.
- You may tick the boxes your own run closed, and update `plans/` and the rest of `TESTING.md` as
  you go. Two
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

## 5. Done means these 6 lines, reported against one by one

1. `node tools/verify-shell.mjs` passes, and the append-only check reports the guard as present.
2. A planted reassignment of `d.log` and a planted assignment into `d.log[...]` each turn the check red, naming the remover. Both plants are reverted, and `TESTING.md` § WO-1.82 shows the red output.
3. Removing the guard regex's match (a plant that renames `d.log` in the guard) turns the check red. The plant is reverted.
4. `TESTING.md` § WO-1.82 names every other regex in `tools/` of the same shape, or says it found none.
5. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
6. `TESTING.md` § WO-1.82 carries these lines verbatim with the evidence for each.

**Write `TESTING.md` § WO-1.82 — it is a deliverable, not a permission.** Add `### WO-1.82 — the log's append-only check has three regexes with no backslashes` under `## Phase 1 — Shell, store, roster`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-1.82` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

