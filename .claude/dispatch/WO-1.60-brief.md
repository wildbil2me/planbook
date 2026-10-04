# WO-1.60 — a comment-only change to a shell file turns the sweep red · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.60-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, **Opus**, on its own merits: the change is small and the spec is complete after the owner's option-1 ruling, but it writes `TESTING.md` prose and its mutation proof means *making commits* — which has to happen somewhere other than `main`, a judgment call about where, not a mechanical step. Codex was the runner-up (one file, mechanically checkable, the sweep runs in seconds) and was set aside on those two points; ties go to Claude.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.60 — a comment-only change to a shell file turns the sweep red

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-04 · **Size** S · **Depends on** —
**Closes roadmap** *(no box. A tooling defect, owner-directed, 2026-10-04.)*

**Booked 2026-10-04**, owner-directed, out of WO-3.40's verdict. **`wo-sweep.mjs` is red on `main`
because of it, from WO-3.40's commit until the next `CACHE` bump.**

**The defect.** § 9 of `tools/wo-sweep.mjs` fails when any file in `sw.js`'s `SHELL` has changed since
the commit that introduced the current `CACHE` string. It compares file names from
`git diff --name-only`, so it cannot tell a comment edit from a code edit. WO-3.40 changed comments only
in `src/assignments.js` and `src/detail.js`, and its Acceptance line 3 forbade the bump, because a
comment changes nothing a device needs. The owner accepted the red at commit rather than bump against
the work order. Each later work order now has to know that § 9's failure is expected, and a real miss
looks exactly like it. WO-3.44 would do the same again.

**Ruled 2026-10-04, the owner: option 1, the commit trailer.** Two things follow that the options
below did not say. **The trailer is a person's word, so the mutation Acceptance line 2 asked for — a
code change *carrying the same excuse* going red — is the one thing this rule cannot catch by
construction**; that line is reworded below to prove what the trailer rule *can* hold. And **commits
already on `main` cannot gain a trailer**, so WO-3.40's and WO-3.44's red is not cleared by this work
order; it clears at the next `CACHE` bump, and the excuse governs from then on.

**Open at dispatch — the owner's call, one of three:**
1. **A recorded excuse.** A commit trailer such as `Shell-Cache: not needed — comments only`. § 9
   excuses a SHELL file only when every commit that changed it since the bump carries the trailer. The
   commit states the claim and the sweep reads it, so it is a person's word, not a measurement.
2. **A measured excuse.** § 9 strips comments from the old and new text of each offending `.js`/`.css`
   file and excuses it when the rest is byte-identical. Stripping comments from JavaScript safely
   (strings, template literals, regex literals, `//` inside a URL) is the whole cost, and no parser is
   allowed here. `index.html` and `sw.js` stay unexcusable.
3. **Strike it**, and bump `CACHE` for comment-only changes from now on. That costs every device one
   shell re-download for nothing, which is cheap. Acceptance lines that forbid the bump get reworded.

**Deliverables** — whichever Open wins, with § 9's header comment rewritten to say what is excused and
why. WO-3.40's and WO-3.44's `CACHE` lines get a pointer here.

**Acceptance**
- [ ] On a tree whose only SHELL change since the bump is comment-only and excused by the chosen rule,
      § 9 is green and names the excused file.
- [ ] Mutation-proved: a second commit to the same file **without** the trailer turns § 9 red, and so
      does the trailer on a commit touching `sw.js` or `index.html`. *(Reworded 2026-10-04 on the
      option-1 ruling: the original asked a code change carrying the excuse to go red, which only
      option 2 could do.)* Recorded in `TESTING.md` § WO-1.60, and **the mutation is reverted before anything else
      is written** (`AGENTS.md`).
- [ ] `node tools/wo-sweep.mjs` is otherwise unchanged in check names and order.

**Traps** — **The default stays red.** An unexcused SHELL change must still fail, because the check
exists for WO-2.4 and WO-2.13, which were real misses. **Never excuse `sw.js` or `index.html`.** The
first is the version and the second is entry one of `SHELL`.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/assignments.js`
  - `src/detail.js`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `tools/wo-sweep.mjs` § 9 (around line 425) is the whole of the code change. Read its header comment first — you are rewriting it to say what is excused and why.
- `plans/work-orders/phase-3-gradebook.md` — WO-3.40's Acceptance line about `CACHE` (~line 3251) and WO-3.44's Traps (~line 3467). The Deliverables want a pointer to WO-1.60 at each; one short clause, not a rewrite.
- `sw.js`'s header — the "bump CACHE" rule § 9 enforces.
- `tools/README.md` § on `wo-sweep.mjs` — if it documents § 9's behaviour, it gets the excuse rule too.

**Traps this brief adds — read before you write.**

1. **The uncommitted diff in `plans/work-orders/phase-1-shell-store-roster.md` is the owner's ruling, not a draft.** It records option 1 and rewords Acceptance line 2. Build on it. Do not revert, stash, or `git checkout` that file — and remember a `git checkout` used to revert a mutation reverts *every* unstaged edit in that file, including your own.
2. **Make the proof's commits in a throwaway clone, never on `main`.** `git clone c:/dev/planbook <scratch>` (or a `git worktree` on a temp branch you delete after), copy your modified `tools/wo-sweep.mjs` in, and make the fixture commits there: a comment-only edit to a SHELL file *with* the trailer (green, names the file); a second commit to it *without* (red); the trailer on a commit touching `sw.js` and on one touching `index.html` (red each). `REPO` in the sweep is resolved from the script's own path, so running the copy inside the clone points it at the clone. **Do not commit, push, or create branches in `c:/dev/planbook`** — a push to `main` is a production deploy. Record each run's § 9 line in `TESTING.md` § WO-1.60.
3. **The working tree has no commit and therefore no trailer.** An uncommitted change to a SHELL file must stay unexcusable — red — exactly as today. Only committed changes, every one of which since the bump carries the trailer, are excused.
4. **Trailer parsing: use git, not a regex over the message.** `git log --format=%(trailers:key=Shell-Cache,valueonly)` (or `git interpret-trailers --parse`) per commit touching the file since the bump. A trailer is the last paragraph of the message; the word appearing mid-body is not a trailer. Pick and document the exact key and accepted value(s); the work order's example is `Shell-Cache: not needed — comments only`. Decide whether any value excuses or only that one, and say which in the header comment.
5. **Check name and order must not change** (Acceptance 3). Keep the single `check('every SHELL file change is paired with a CACHE bump', …)` string byte-identical. **Do not add `check()` call sites** without updating the count `tools/README.md` records — the sweep reads that count and goes red on it (the WO-3.26 scar). Prefer naming excused files in the existing pass/fail detail text.
6. **`main` stays red after you finish, and that is correct.** WO-3.40's and WO-3.44's commits carry no trailer and cannot gain one. Do not bump `CACHE` to make your final sweep green — that is outside the Deliverables. Report § 9's red on the real tree as expected, naming those two commits, and prove green only in the clone.
7. **Commit-message convention needs one written home.** Wherever this repo tells a committer to bump `CACHE` (sw.js header, `tools/README.md`, `AGENTS.md`/`CLAUDE.md` "bump CACHE" lines) — grep for it. Adding the trailer to the place a committer reads is in scope only if it is one line pointing at § 9; if `CLAUDE.md`/`AGENTS.md` need it, change both in the same sitting (they are a watched pair, `wo-sweep.mjs` § 21) or name it as a proposed follow-up instead.
8. **Revert every mutation before writing anything else** (`AGENTS.md`). Since the mutations here live in a scratch clone, the real tree should never hold one — `grep -rn MUTATION tools/` clean before you report.

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

1. On a tree whose only SHELL change since the bump is comment-only and excused by the chosen rule, § 9 is green and names the excused file.
2. Mutation-proved: a second commit to the same file **without** the trailer turns § 9 red, and so does the trailer on a commit touching `sw.js` or `index.html`. *(Reworded 2026-10-04 on the option-1 ruling: the original asked a code change carrying the excuse to go red, which only option 2 could do.)* Recorded in `TESTING.md` § WO-1.60, and **the mutation is reverted before anything else is written** (`AGENTS.md`).
3. `node tools/wo-sweep.mjs` is otherwise unchanged in check names and order.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

