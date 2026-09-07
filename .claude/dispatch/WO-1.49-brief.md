# WO-1.49 — a comment counts three document-level listeners and there are twelve · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.49-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude Opus, on this work order's own merits — `ROUTING.md` § "Route to
Claude": its Traps section is judgment rather than mechanics. The deciding signal is that the
deliverable is a **ruling** — answer 1 or answer 2, with which one and why written at the line — and
the row refuses `type 11` in as many words, so the edit is the smaller half of the job. Runner-up
set aside: Codex, because one comment edit plus three tool runs at Size S reads fully specified; a
runner that is good at matching an established pattern is the wrong one to hand a choice between
two.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.49 — a comment counts three document-level listeners and there are twelve

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-06 · **Size** S · **Depends on** nothing · **Blocks** nothing
**Closes roadmap** Phase 1 → *(no box. A comment repair in a delivered file — the same call WO-1.26
through WO-1.48 made. Booked 2026-09-06, owner-directed, on WO-1.47's implementer's own proposal:
it found the defect mid-correction-round, declined to fix it there, and said in as many words that
it would rather the count were booked than smuggled.)*

**Why it exists.** `src/shell.js`'s delegation preamble says **"Three other document-level listeners
live further down"** and names `submit`, `input` and `keydown`. There are **twelve**
`document.addEventListener` calls in the file — `click` at :1655 which the paragraph above it is
about, and eleven below it: `submit` :2727, `keydown` :2825, `beforeinput` :2937, `input` :2948,
`change` :3091, `focusin` :3205, `focusout` :3246, `dragover` :3269, `dragleave` :3276, `drop` :3277
and `DOMContentLoaded` :3297. So the sentence names three of eleven.

*(**Those numbers are a measurement dated 2026-09-06, not a fact about the file this row will be
built against, and they are left exactly as they were for the reason `known-bugs.md` § 1 leaves
WO-1.47's:** they are the evidence, and a measurement quietly re-taken is a measurement that can only
be checked against itself.* **What is expected to move them, and it is booked ahead of this row:**
[WO-1.48](#wo-148--a-date-field-cannot-tell-mid-typing-from-cleared-and-the-app-infers-it-anyway)
*takes the `focusout` rebuild back out, and the listener at :3246* **exists for nothing else** *— its
whole body routes the five `*DateBlurred()` calls and it writes nothing — so it goes with the rebuild,
`twelve` becomes* **eleven**, *`three of eleven` becomes* **three of ten**, *and every line number
below :3246 shifts.* **Re-derive the count from the tree before writing a word of the repair**; do not
quote the enumeration above, and do not assume WO-1.48 landed — read the file. *If this row is somehow
taken first, the numbers above are the live ones and WO-1.48 will invalidate the repair within the
sitting, which is the ordering argument and a further argument for* **answer 1**: *a paragraph holding
no figure is correct on both sides of WO-1.48, and is the only version of this repair that is.)*

**It was already wrong before WO-1.47, and that is the argument for a row rather than a footnote.**
`beforeinput`, `change`, `focusin` and the three drag listeners all postdate the sentence; WO-1.47
then added `focusout` and made it one worse. Nothing in the repository noticed across all of them,
which is the WO-1.40 / WO-1.42 / WO-1.45 shape for the fourth time: **a hand-typed number in prose
that nothing checks, drifting quietly while every tracker stays green.**

**Why it was not fixed in WO-1.47.** That work order had just **failed verification for a stale
comment**, and rewriting an unrelated paragraph into an accurate census inside its correction round
would have widened it at exactly the wrong moment. The correction round added one parenthetical —
*"There are more document-level listeners further down than that sentence counts … this paragraph is
deliberately not being turned into one here"* — and left the number alone. **That parenthetical is
the current state and it is a holding position, not the answer**: it makes the sentence honest about
being incomplete without making it true.

**The ruling this row has to make, and it is not "type 11".** Two answers, and the lean is stated:

1. **Take the number out.** Name the three listeners the paragraph actually wants to talk about, drop
   the count, and let the parenthetical's own point stand — the census is the listeners themselves.
   **This is the lean.** It closes the class rather than the instance: there is no figure left to
   rot, and the paragraph goes on doing the one job it was written for.
2. **Repair the count and fence it.** Only worth doing if the fence asserts at **runtime against the
   file** the way WO-1.42's does against `results.length` — a sweep check that counts
   `document.addEventListener` in `src/shell.js` and compares it to the number in the comment.

**Do not take answer 2's first half without its second.** Writing `Eleven` into the comment and
stopping is this work order's own defect, re-armed with a fresh number and a later expiry date.

**Out of scope** — every other listener comment in the file, § 18's delegated-attribute inventory
(which is green and was green through WO-1.47's failure, because it diffs hooks against the census
for **presence** and has no opinion about a prose count), and any change to a listener itself. This
row moves words, or words plus one check. It moves no behaviour.

**Traps**

- **`DOMContentLoaded` is the reason "eleven" and "ten" are both defensible.** It is a boot hook and
  not an interaction listener, so a reader counting *listeners that carry a gesture* gets ten. If
  answer 2 is taken, **the check and the comment must agree about it in as many words**, or the
  fence fails on the first honest disagreement and teaches its next reader to disbelieve it.
- **"Other" is doing real work in that sentence.** It means *other than the `click` delegation the
  preceding paragraph is about*, so the total is twelve and the sentence's denominator is eleven.
  A repair that reads as three-of-twelve is a new wrong number.
- **This work order's own heading says "there are twelve", and it does not get corrected.** The
  heading is the anchor
  `#wo-149--a-comment-counts-three-document-level-listeners-and-there-are-twelve`, which
  `plans/work-orders/README.md` row 53 links to and `--audit` reads; renaming it to match a
  post-WO-1.48 count breaks the link and buys nothing. **It is the title of a defect report and
  records what was true when the defect was found** — the same reason `known-bugs.md` § 1 keeps
  its pre-WO-1.47 line numbers. Repair the comment in `src/shell.js`; leave the heading alone.
- **The parenthetical comes out if the count does.** Answer 1 makes it redundant; leaving both is a
  paragraph apologising for a number it no longer contains.
- **This is prose in a file that has failed once for prose.** WO-1.47's Acceptance line 4 went red on
  four census entries that named an event and no function, and the grep that was supposed to catch
  them searched function names. Whatever check this row states, run it against the **pre-repair**
  file and confirm it returns the thing it claims to catch — the discipline WO-1.47's correction
  round used, and the reason its re-tick was accepted.

**Acceptance**
- [ ] `src/shell.js`'s delegation preamble no longer states a count that disagrees with the file —
      by answer 1 or by answer 2, with **which answer was taken and why written at the line**.
- [ ] If answer 2: the count is asserted by `wo-sweep.mjs` against the file at runtime, never by a
      second hand-typed number, and the check is proved against the pre-repair comment.
- [ ] If answer 1: no count remains in the paragraph, and the holding parenthetical WO-1.47 added is
      removed rather than left standing beside its own resolution.
- [ ] `node tools/verify-shell.mjs` is green, `node tools/wo-sweep.mjs` is green, and
      `node tools/wo-gate.mjs --audit` is green on a clean tree — with `tools/README.md`'s check
      count moved to match if answer 2 added one.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `plans/work-orders/README.md`
  - `src/shell.js`
  - `tools/README.md`
  - `tools/verify-shell.mjs`
  - `tools/wo-gate.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**Four pointers, and the first is the one that changes the work.**

- **WO-1.48 has landed** (commit `a78abf9`, 2026-09-06). The work order's enumeration of twelve
  listeners and its line numbers are a dated measurement, deliberately left stale, and it tells you
  to re-derive from the tree before writing a word. Do that. Its own prediction about what WO-1.48
  would move is a prediction, not a reading.
- **The paragraph is `src/shell.js` around :598, and WO-1.47's holding parenthetical is a few lines
  under it.** Read both together before choosing — answer 1 takes the second out, and Acceptance
  line 3 fails on a resolution left standing beside its own apology.
- **If you take answer 2**, the fence to model is the one WO-1.42 built in `tools/wo-sweep.mjs`: it
  asserts at runtime against the file rather than against a second hand-typed number. `tools/README.md`
  carries a check count that must move with it — the last dead dispatch here turned the sweep red on
  exactly that line, by doing the work and not paying the count.
- **`verify-shell.mjs` often cannot run under a sandboxed agent.** If it will not run, report the
  environment as an environment and leave the box open; a "could not run" reported as a pass is the
  failure `CLAUDE.md` § Commands names. Do not write a fourth harness for anything here.

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

1. `src/shell.js`'s delegation preamble no longer states a count that disagrees with the file — by answer 1 or by answer 2, with **which answer was taken and why written at the line**.
2. If answer 2: the count is asserted by `wo-sweep.mjs` against the file at runtime, never by a second hand-typed number, and the check is proved against the pre-repair comment.
3. If answer 1: no count remains in the paragraph, and the holding parenthetical WO-1.47 added is removed rather than left standing beside its own resolution.
4. `node tools/verify-shell.mjs` is green, `node tools/wo-sweep.mjs` is green, and `node tools/wo-gate.mjs --audit` is green on a clean tree — with `tools/README.md`'s check count moved to match if answer 2 added one.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

