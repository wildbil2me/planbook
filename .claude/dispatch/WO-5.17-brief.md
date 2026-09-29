# WO-5.17 — No check opens a draft and then restores · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-5-outreach.md`
**Report to** `.claude/dispatch/WO-5.17-result.md` — as your last act, and return it in-band too.

**Routing (orchestrator, 2026-09-29).** Claude, at **Opus** (no model override). The deciding signal is that the checks drive backup and restore -- a sensitive surface in ROUTING.md's Claude column -- and the Acceptance asks for a `TESTING.md` section, which is teacher-facing prose. The runner-up was Codex, since the work is harness-only and mechanically checkable. I set it aside on the column rule, and also because the proof needs at least three full `verify-shell.mjs` runs (clean, mutated, restored). At the current check count that leaves no room under the 20-minute runner cap.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-5.17 — No check opens a draft and then restores

**Ship** 3 · **Status** 🤖 CLAIMED — 2026-09-29 · **Size** XS · **Depends on** WO-5.16 — the single call this pins down
**Closes roadmap** *(no box. A harness gap, found by WO-5.16's verifier.)*

**Booked 2026-09-26**, owner-directed, from WO-5.16's verdict. `afterRestore()` in `src/shell.js`
calls `outreachView.resetOutreach()` so that a restore drops an open draft and closes
`#outreachModal`. The draft is about a student in the document that was just put away. WO-7.7's
`afterDownload()` runs `afterRestore()` whole, so a Drive sync that downloads is meant to do the
same. **Nothing in the harness opens a draft and then restores or downloads.** WO-5.16's verifier
confirmed that deleting the remaining call leaves `verify-shell.mjs` green at 1538/1538. So that
run proved the deletion of the duplicate broke nothing. It did not prove the draft still closes.

The template editor already has the check this lacks: `tools/verify/templates.mjs` restores through
`restoreFromText()` and the real confirm button, then reads what is on screen. This work order
gives the outreach draft the same check, and a second one through the download path.

**Deliverables**
- **A restore check.** Open a draft through the real outreach entry point, and assert that
  `#outreachModal` is open with a non-empty body before anything else happens. Restore through
  `window.planbook.backup.restoreFromText()` and the real confirm button. Then assert that
  `#outreachModal` is hidden. It lives beside the other outreach checks in
  `tools/verify/outreach.mjs`, or in `tools/verify/backup-restore.mjs` if the draft helpers travel
  cleanly. The implementer picks one and says why.
- **A download check.** The same draft, then a sync that resolves `downloaded`, driven through the
  plumbing WO-7.7's checks already use in `tools/verify/sync-button.mjs`. Assert the modal is
  hidden afterwards.
- **Harness only.** No file under `src/` changes, so `CACHE` in `sw.js` does not move.

**Acceptance**
- [ ] With the draft open, a restore closes `#outreachModal`, and the check asserts the draft was
      open before the restore rather than assuming it.
- [ ] With the draft open, a sync that downloads closes `#outreachModal`.
- [ ] **Mutation-proved.** Delete `outreachView.resetOutreach();` from `afterRestore()`, and both
      checks go red. Put it back, and both go green. Record the round in `TESTING.md` § WO-5.17, and
      **revert the mutation before writing anything else** (`AGENTS.md`).
- [ ] The whole browser harness is green, and the check count rises by exactly the checks added.

**Traps** — **Do not test `resetOutreach()` by calling it.** A check that calls the function directly
passes with the call in `afterRestore()` deleted, and that is the gap this work order exists to
close. Drive the restore and the download, and read the modal.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/shell.js`
  - `tools/verify/backup-restore.mjs`
  - `tools/verify/outreach.mjs`
  - `tools/verify/sync-button.mjs`
  - `tools/verify/templates.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- **Traps the orchestrator adds (read before writing).**
  - **Mutation discipline.** One mutation (delete `outreachView.resetOutreach();` at `src/shell.js` ~line 1775), and it must turn **both** new checks red. Revert it with an edit, not `git checkout`, which clobbers unstaged work. Then run `grep -rn MUTATION src/ tools/` before you write TESTING.md or the result file. Every earlier dead dispatch here left one armed.
  - **The sweep counts `check()` call sites.** `tools/README.md` (~line 1226) records the harness's call-site count, and `tools/wo-sweep.mjs` goes red when that count drifts. Update the number and add a line saying WO-5.17 moved it, in the same style as the entries around it. WO-3.26 shipped a red sweep for exactly this reason.
  - **Assert the precondition.** Before the restore or download, read `#outreachModal` open with a non-empty body. A check that only reads "hidden" afterwards passes when the draft never opened.
  - **Download path.** Use the Drive/sync stubs `tools/verify/sync-button.mjs` already installs for WO-7.7's `afterDownload()` checks. Do not invent new plumbing, and do not call `afterDownload()` or `afterRestore()` directly. Drive the sync so it resolves `downloaded`.
  - **No `src/` change and no `CACHE` bump.** If a check seems to need an app change, stop and report it as a proposed follow-up.
  - **Run both tools at the end:** `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs`. Report the before and after check totals, and the arithmetic showing the rise equals exactly the checks you added.

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

## 5. Done means these 4 lines, reported against one by one

1. With the draft open, a restore closes `#outreachModal`, and the check asserts the draft was open before the restore rather than assuming it.
2. With the draft open, a sync that downloads closes `#outreachModal`.
3. **Mutation-proved.** Delete `outreachView.resetOutreach();` from `afterRestore()`, and both checks go red. Put it back, and both go green. Record the round in `TESTING.md` § WO-5.17, and **revert the mutation before writing anything else** (`AGENTS.md`).
4. The whole browser harness is green, and the check count rises by exactly the checks added.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

