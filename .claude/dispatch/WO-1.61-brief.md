# WO-1.61 — the sweep's cache check has never watched index.html · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.61-result.md` — as your last act, and return it in-band too.

**Routing.** Claude Opus. The change is small and mechanical, but its Traps are judgment: the fix makes the sweep *stricter* and so can turn `main` red, and it must live in § 9's reading of `SHELL`, never in `SHELL` itself; plus a `TESTING.md` § WO-1.61 entry in prose. Codex (small, fast harness) was the runner-up and was set aside on ties-to-Claude; no probe was run.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.61 — the sweep's cache check has never watched index.html

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-04 · **Size** S · **Depends on** —
**Closes roadmap** *(no box. A tooling defect, owner-directed, 2026-10-04.)*

**Booked 2026-10-04**, owner-directed, out of WO-1.60's verdict.

**The defect.** § 9 of `tools/wo-sweep.mjs` reads `sw.js`'s `SHELL` array and builds its set of
watched files with `if (p && !p.endsWith('/')) shellFiles.add(p)` — the comment beside it reads
*"'./' is the index, not a file on disk"*. So `'./'`, entry one of `SHELL`, is dropped, and
`index.html` is **never** in the set. An `index.html` edit committed with no `CACHE` bump leaves § 9
green. CLAUDE.md says the opposite in as many words — *"`./` is entry one, so an `index.html` edit
counts"* — and so does WO-1.60's own rewritten § 9 header ("index.html … is entry one of SHELL").
`sw.js` itself is not in `SHELL` either, but a `sw.js` change *is* the bump, so that one is not a gap.

**WO-1.60 made it visible rather than causing it.** Its trailer rule names `index.html` in
`NEVER_EXCUSED`, so a trailer on an `index.html` commit goes red — while the same commit with no
trailer stays green. The stricter path is the one a person can take on purpose. The verifier also
found `!NEVER_EXCUSED.includes(f)` in the offender loop unreachable for `index.html` for the same
reason, and for `sw.js` because it is not in `SHELL`; it does no harm.

**Deliverables** — § 9 treats `'./'` as `index.html` (the file Cloudflare Pages serves at `/`) and
watches it like every other SHELL file. The comment beside the parse says why. If the
`NEVER_EXCUSED` guard in the offender loop is still dead afterwards, take it out or say why it stays.

**Acceptance**
- [ ] An `index.html` change committed since the bump, with no `CACHE` bump, turns § 9 red and names
      `index.html`. Mutation-proved in a throwaway clone, never on `main`, and recorded in
      `TESTING.md` § WO-1.61. **The mutation is reverted before anything else is written**
      (`AGENTS.md`).
- [ ] An `index.html` change committed together with a `CACHE` bump leaves § 9 green.
- [ ] `node tools/wo-sweep.mjs` is otherwise unchanged in check names and order, and on the real tree
      § 9 reports the same offenders as before, plus `index.html` only if it has changed since the
      current bump.

**Traps** — **This makes the sweep stricter**, so it can turn `main` red on a commit that was green
yesterday. Check `git diff --name-only <bump>..HEAD -- index.html` on the real tree before claiming
what § 9 will say. **Do not add `./index.html` to `SHELL`** to make the check see it — `sw.js`'s header
explains why that breaks the app on the first navigation. The fix is in the sweep's reading of
`SHELL`, never in `SHELL`.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `sw.js` header — why `./index.html` must not be added to `SHELL`. Read it; do not edit `sw.js`.
- `tools/wo-sweep.mjs` § 9, roughly lines 480–560: the parse at ~491 (`if (p && !p.endsWith('/'))`), `NEVER_EXCUSED` at ~507 and its uses at ~547 and ~551. The ~551 `!NEVER_EXCUSED.includes(f)` becomes reachable for `index.html` once `./` maps to it — decide whether it is still dead for `sw.js` and either remove it or say in a comment why it stays.
- `.claude/dispatch/WO-1.60-result.md` and `TESTING.md` § WO-1.60 — the trailer rule this sits beside, and the shape of the throwaway-clone mutation record to follow.
- **Orchestrator pre-check, re-run it yourself:** the current `CACHE` bump is `3f3369b`, and `git diff --name-only 3f3369b..HEAD -- index.html` is empty on this tree, so § 9 should stay green after the fix. If you see otherwise, stop and report rather than bumping `CACHE` to make it green.
- **Mutations happen in a throwaway clone under the scratchpad, never on `main` or this working tree.** Nothing here needs `verify-shell.mjs` — no `src/` or `index.html` file changes. `wo-sweep.mjs` is the harness. Check § 9's check-name/order output before and after (Acceptance line 3).

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

1. An `index.html` change committed since the bump, with no `CACHE` bump, turns § 9 red and names `index.html`. Mutation-proved in a throwaway clone, never on `main`, and recorded in `TESTING.md` § WO-1.61. **The mutation is reverted before anything else is written** (`AGENTS.md`).
2. An `index.html` change committed together with a `CACHE` bump leaves § 9 green.
3. `node tools/wo-sweep.mjs` is otherwise unchanged in check names and order, and on the real tree § 9 reports the same offenders as before, plus `index.html` only if it has changed since the current bump.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

