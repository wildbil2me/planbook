# WO-3.40 — two comments say misfiled work is invisible on the list · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.40-result.md` — as your last act, and return it in-band too.

**Routing (orchestrator, 2026-10-04): Claude Opus.** A comment-only XS change, but the second
deliverable is an explicit judgment call (read `src/shell.js`'s comment and decide whether it makes the
same false claim), and every edit is argument prose whose Trap is "do not change the copy rule". The
runner-up was Codex — the Acceptance is a mechanically checkable `git diff` — set aside on that
judgment deliverable; ties go to Claude.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.40 — two comments say misfiled work is invisible on the list

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-04 · **Size** XS · **Depends on** WO-3.36 — the comment it extended
**Closes roadmap** *(no box. Owner-directed, 2026-10-03.)*

**Booked 2026-10-03**, owner-directed, out of WO-3.36's verdict. A comment fix and nothing else, so it
rides with the next work order that has `src/assignments.js` open.

**The defect.** Two comments in `src/assignments.js` argue for the cross-class copy rule (~27, in the
file header, and ~1199, above the duplicate function). Both say an assignment carrying another
class's `categoryId` would be *"invisible on B's list"*. That is no longer true.
`renderAssignments()` gathers every assignment whose category this class lacks into the *Not in a
category* group (~620), so such an assignment would be listed there. WO-3.36 added accurate
points-mode wording to both comments and, by its brief, left the visibility claim alone.

**Deliverables**
- **Both comments say where such an assignment would appear**: under *Not in a category*, filed
  nowhere this class can name. Keep the rest of the argument. It is still sound: a category removal
  in the class it came from would still destroy it, under a dialog naming the wrong class.
- **`src/shell.js` ~4512** says a misfiled copy *"is invisible on screen because both look identical
  on the list"*. Read it and decide whether it means the same thing. Fix it only if it does.
- **`src/detail.js` ~963 stops saying the banner names the weights' total.** *Added 2026-10-03,
  owner-directed, out of WO-3.41's verdict.* The comment above the breakdown ends *"The banner above
  says what the weights come to and where to fix it."* Since WO-3.41, a class with no categories gets
  its own banner sentence, which names no total. Say the banner explains why there is no grade:
  either the weights' total, or that the class has no categories yet. Keep the rest of the comment;
  its reason for drawing no breakdown still holds.

**Acceptance**
- [ ] Neither comment in `src/assignments.js` says a misfiled assignment is invisible on the list.
- [ ] The comment above the breakdown in `src/detail.js` no longer says the banner always names the
      weights' total.
- [ ] No line outside a comment moves: `git diff` touches comment lines only, and `sw.js`'s `CACHE`
      is not bumped, because a comment changes nothing a device receives.

**Traps** — **Do not change the copy rule.** The comments argue for it, and it stands.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/assignments.js`
  - `src/detail.js`
  - `src/shell.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**Line numbers have drifted since the work order was written** (checked 2026-10-04 by grep):
- `src/assignments.js:27` (file header) and `src/assignments.js:~1224` (above the duplicate function)
  are the two "invisible on B's list" / "invisible on its list" comments.
- `src/shell.js:~4599` is the "invisible on screen" comment the second deliverable asks you to judge.
  Read what it is actually claiming before deciding — "looks identical on the list" may be a claim
  about two rows being indistinguishable, which could still be true, rather than about absence.
  State your ruling and its reason in the result file either way.
- `src/detail.js:~885` is the breakdown comment ("The banner above says what the weights come to").
  Confirm the WO-3.41 banner wording in `src/grade-engine.js` before rewording.
- Read `renderAssignments()` in `src/assignments.js` (the *Not in a category* gathering) to confirm
  the replacement wording is true before writing it.

**Traps the orchestrator adds.**
- `src/assignments.js:~924` also says something is "invisible on every term's list" — that is about a
  `termId` of `''`, a different claim, and **not in this work order's Deliverables**. Leave it. If you
  believe it is also false, say so in the result as a proposed follow-up; do not fix it.
- Acceptance 3 means **comment lines only**: no code, no `sw.js` `CACHE` bump. Check `git diff --stat`
  and the diff itself for line-ending churn before you report — a whole-file CRLF rewrite fails this
  line. Do not edit with `sed -i`; use the Edit tool.
- `verify-shell.mjs` is not needed to prove a comment change, but run `node tools/wo-sweep.mjs` and
  report its line; if you run `verify-shell.mjs`, report its count. You may tick the three Acceptance
  boxes you close and add a short `TESTING.md` § WO-3.40 note if that file carries one per work order.

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

1. Neither comment in `src/assignments.js` says a misfiled assignment is invisible on the list.
2. The comment above the breakdown in `src/detail.js` no longer says the banner always names the weights' total.
3. No line outside a comment moves: `git diff` touches comment lines only, and `sw.js`'s `CACHE` is not bumped, because a comment changes nothing a device receives.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

