# WO-5.16 — a restore closes the outreach draft twice · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-5-outreach.md`
**Report to** `.claude/dispatch/WO-5.16-result.md` — as your last act, and return it in-band too.

**Routing: Claude, Opus tier (no model override).** The deciding signal is the sensitive surface:
`afterRestore()` is the restore path, and backup/restore is on ROUTING.md's never-delegated list;
Phase 5 is also Claude-only by the rubric's own "at a glance" line. The runner-up — this is an XS
one-line deletion with a mechanical Acceptance and a single ~4.4 min harness run that would fit
Codex's 20-minute cap — was set aside because the column above decides first.

**Scope, stated narrowly.** Three edits: delete one `outreachView.resetOutreach()` call and merge the
two comments above it into one; bump `CACHE` in `sw.js` (currently `planbook-shell-v136`); tick your
own Acceptance lines when the evidence is yours. No mutation round is asked for and none is needed —
if you do run one anyway, revert it before writing anything else and `grep -rn MUTATION` before you
report. Do not touch `afterDownload()` or its comment block (it says "takes the restore's chain whole,
and in particular its resetOutreach()", which stays true with one call). Do not touch the two other
`resetTemplates()` sites (~921, ~1500).

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-5.16 — a restore closes the outreach draft twice

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-26 · **Size** XS · **Depends on** WO-5.3 — the commit that added the second call
**Closes roadmap** *(no box. A duplicate line, found by WO-7.7's implementer and confirmed by its verifier.)*

**Booked 2026-09-26**, owner-directed, from WO-7.7's verdict. `afterRestore()` in `src/shell.js`
calls `outreachView.resetOutreach()` twice (~1751 and ~1754), each under its own comment. Both came
from `46e0fcf` (*Land WO-5.3, and give the template editor a way out*). The first comment extends the
template editor's reason to "an open draft", and the second restates that reason in full, so this
looks like one edit landed twice rather than a second call someone meant. WO-7.7's `afterDownload()`
runs `afterRestore()` whole, so a download inherits the double call too.

**It does no harm today.** Resetting an already-reset draft is a no-op, so nothing on screen shows it.
It is booked because the next person to change what a restore resets will read two calls and wonder
which one is load-bearing.

**Deliverables**
- **One `resetOutreach()` call in `afterRestore()`**, under one comment that keeps both halves of
  what the two said: the draft is about a student in the document that was just put away, and its
  modal closes with it.
- **Nothing else in `afterRestore()` moves**, and neither does `afterDownload()`, which reaches the
  single call through it.
- `CACHE` in `sw.js` bumped, because `src/shell.js` is in `SHELL`.

**Acceptance**
- [ ] `afterRestore()` contains exactly one `resetOutreach()` call, and no comment in it describes a
      second one.
- [ ] The whole browser harness is green, including the restore and WO-7.7's download checks, which
      both reach this function.

**Traps** — **Do not also reorder the chain.** `resetTemplates()` and `resetOutreach()` run before
`afterClassChange()` so the screen repaints with no stale draft behind it, and that order is the
reason the calls are where they are.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/shell.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `sw.js` — `CACHE` near line 38.
- `TESTING.md` — if it carries a § for this work order's neighbours (WO-7.7), a one-line § WO-5.16
  entry recording the harness run is appropriate; nothing more.
- Check `git diff --stat` before you finish: this repo's files have CRLF/LF mixes that edits rewrite
  silently. The diff should be a few lines in two files (plus `plans/`/`TESTING.md` bookkeeping).

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

## 5. Done means these 2 lines, reported against one by one

1. `afterRestore()` contains exactly one `resetOutreach()` call, and no comment in it describes a second one.
2. The whole browser harness is green, including the restore and WO-7.7's download checks, which both reach this function.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

