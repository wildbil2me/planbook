# WO-1.59 — a section that throws while offline hands an offline network on · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.59-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, at **Opus** (no model override). It sits in the Claude column on its own merits, exactly as WO-1.57 and WO-1.58 did: its Traps are judgment (`recoverPage()` never throws; restore what the section *received*, never a fixed default; no `finally`) and it writes `TESTING.md` prose. The runner-up was Codex — XS, mechanically checkable — set aside because it needs at least three full `verify-shell.mjs` runs (planted throw with the restore, planted throw with the restore removed, clean) at ~4.4 min each, most of the 20-minute cap before any reading, and its method is mutate · run · revert, which is the shape a SIGTERM leaves armed.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.59 — a section that throws while offline hands an offline network on

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-05 · **Size** XS · **Depends on** WO-1.58 — the record and the restore this widens
**Closes roadmap** *(no box. A harness defect with no live symptom yet.)*

**Booked 2026-10-01**, owner-directed, from WO-1.58's verdict. WO-1.58 widened `recoverPage()`'s
record-and-restore in `tools/verify-shell.mjs` to print media, the time zone and blocked URLs, and
its own `TESTING.md` § WO-1.58 names one more setting that survives a reload the same way and is
not followed:

- **`Network.emulateNetworkConditions`**, sent twice, both in `tools/verify/sync-button.mjs`:
  `OFFLINE` at ~515 and back to `ONLINE` at ~526, inside a `Network.enable` window. A throw between
  them hands an offline network to every later section, exactly as a throw inside a blocked-URL
  window handed the block on before WO-1.58.

The verifier confirmed the gap on reading and the record says no planted run was taken against it.
No section throws today, so this costs nothing yet. When one does, the sections after it are
measured with the network refused and nothing says so; on the evidence of WO-1.58's time-zone run,
whether a check goes red on it is luck.

**Deliverables**
- **Record and restore it the way WO-1.58 records the other three**: the last successful params,
  kept whole, run-wide; the value each section received, copied into `sectionStart` as it starts;
  put back after a throw only if it differs. CDP has no clear call for this one, so "not set" is
  the params a fresh target behaves as — `{ offline: false, latency: 0, downloadThroughput: -1,
  uploadThroughput: -1 }`, the same as `sync-button.mjs`'s own `ONLINE` — and the work order states
  where that was confirmed rather than assuming it.
- **Correct the statements that say it is not put back**: the `noteWhatItChanges()` comment block in
  `tools/verify-shell.mjs` (including `sectionStart`'s "a copy of all five", which becomes six) and
  the out-of-reach list in `TESTING.md` § WO-1.58. Add `TESTING.md` § WO-1.59 with the planted runs,
  and state there whatever is still out of reach.
- Nothing under `src/` moves, and no section file is edited except by a planted, reverted throw.

**Acceptance**
- [ ] A throw planted in `sync-button.mjs` between the `OFFLINE` and `ONLINE` sends leaves the next
      section reading `navigator.onLine` as `true` and reaching the server with a probe request, as
      on a normal run. Mutation-proved: with the new restore removed, the same throw leaves it
      `false` and the probe refused. Recorded in `TESTING.md` § WO-1.59, and **the planted throw is
      reverted before anything else is written** (`AGENTS.md`).
- [ ] The whole harness is green on the real clock, the check list is unchanged in names and order,
      and no check changes state against HEAD.
- [ ] `node tools/wo-sweep.mjs` is green, including § 25's reading of `runSection()`'s shape.

**Traps** — **`recoverPage()` must still never throw**, and a CDP call that fails while restoring
goes in its existing `catch`, as WO-1.57's and WO-1.58's do. **Put back what the section received,
never a fixed default** — the "not set" params are the starting record, not what recovery sends
regardless. **The setting may only bite while `Network.enable` is on**: record it regardless, and do
not start tracking `Network.enable` itself unless a planted run shows it is needed — WO-1.58's
planted run found an enabled domain harmless once its list was cleared. **The plant must change
something a normal run would notice**: the section's own `OFFLINE` is already different from a
normal run's network, so unlike WO-1.58's time-zone plant no second edit is needed, but say so in
the record. **Do not fix the file with a `finally`**, for the reason WO-1.57 gives.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `tools/verify-shell.mjs`
  - `tools/verify/sync-button.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `.claude/dispatch/WO-1.58-brief.md` and `.claude/dispatch/WO-1.58-result.md` — the immediate precedent. Match its record shape (run-wide last-good record, per-section copy in `sectionStart`, restore-only-if-differs, inside the existing `catch`) and its planted-run method and lettering in `TESTING.md` § WO-1.58.
- `TESTING.md` § WO-1.57 and § WO-1.58 — the out-of-reach list you are correcting, and the voice § WO-1.59 should be written in.

**Traps the work order does not spell out, from this pipeline's record:**
- **The "probe request" in Acceptance 1 is evidence for the planted runs, not a new check.** Acceptance 2 forbids any change to the check list's names or order, and the Deliverables forbid editing any section file except by the planted throw. So whatever reads `navigator.onLine` and makes the probe fetch in the section after `sync-button` must be temporary instrumentation taken in the planted runs and reverted with the throw, or read out of a check that already exists — say which in the record. Find out first which section runs next after `sync-button` in the run order; do not assume.
- **"States where that was confirmed"**: the "not set" params are to be confirmed, not asserted — from the CDP protocol definition or from an observed fresh target — and the comment in `verify-shell.mjs` and § WO-1.59 name the source.
- **Revert every plant and every mutation before writing anything else** (`AGENTS.md`), and finish with `grep -rn MUTATION tools/` (and over any file you planted in) returning nothing. Five dead dispatches in this repo left live mutations under ticked boxes.
- **`git checkout` to revert a mutation also reverts your own unstaged edits in that file.** Stage (`git add`) your real `verify-shell.mjs` change before you mutate it, or revert by hand.
- **Line endings**: do not rewrite a file's line endings with sed or a script; check `git diff --stat` before reporting and explain any deletion you did not mean.
- The sweep's § 25 reads `runSection()`'s shape, and `tools/README.md` records a count of `check()` call sites — if anything you touch moves a recorded count, the sweep goes red on work being done; keep the record in step.
- Nothing under `src/` moves, so no `CACHE` bump in `sw.js`.

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

1. A throw planted in `sync-button.mjs` between the `OFFLINE` and `ONLINE` sends leaves the next section reading `navigator.onLine` as `true` and reaching the server with a probe request, as on a normal run. Mutation-proved: with the new restore removed, the same throw leaves it `false` and the probe refused. Recorded in `TESTING.md` § WO-1.59, and **the planted throw is reverted before anything else is written** (`AGENTS.md`).
2. The whole harness is green on the real clock, the check list is unchanged in names and order, and no check changes state against HEAD.
3. `node tools/wo-sweep.mjs` is green, including § 25's reading of `runSection()`'s shape.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

