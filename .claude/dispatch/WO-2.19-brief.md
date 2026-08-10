# WO-2.19 — the harness's own check count is checked · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.19-result.md` — as your last act, and return it in-band too.

**Routing decision.** Routed to **Claude at Opus tier, on its own merits** — the deciding signal is
that the central deliverable is a determination nobody has made yet (which `check()` call sites a run
does not reach, or whether the gap is structural), and the Trap names the exact failure a
green-run-seeking implementation produces: asserting `541 === 537` by rounding the difference away.
Secondary: it writes `tools/README.md` prose and a `TESTING.md` mutation table, both in ROUTING's
Claude column. **Runner-up set aside:** on surface this is the strongest Codex shape left on the board
— pure tooling, nothing in `src/`, no UI, no sensitive data, acceptance lines that are commands — and
had the four-site gap already been named, it would have gone to Codex. WO-2.19 has no row in the
Ship 1 pre-routing table, so there is no table disagreement to declare.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.19 — the harness's own check count is checked

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-10 · **Size** S · **Depends on** nothing — `wo-sweep.mjs` and the
count line in `tools/README.md` both exist today · **Blocks** nothing
**Closes roadmap** *(no box. Tooling, not app — the same call WO-2.14, WO-2.15 and WO-2.18 made.)*

**Not a go-live blocker, and in no ship.** Added 2026-08-10, out of WO-2.18's verification. It sits
outside the delivery plan the way WO-2.14 and WO-2.15 do: it buys a teacher nothing, it is not on
WO-G2, and no row of the Ship 2 table moves for it.

**Why it exists.** `tools/README.md` records how many checks `verify-shell.mjs` runs — **537 at
WO-2.18** — and that number is maintained by whoever lands a work order remembering to update it. The
file says so in as many words: *"Update this line when you add checks."* **It has now been missed
twice.** WO-1.5's line said 79 when the real number was 82. WO-2.18 arrived to find it saying 522
against a tree that measured 535, because WO-3.4's thirteen grade-engine checks landed without
reaching it — so the arithmetic `522 + 2` would have written 524, and read as a green run thirteen
checks smaller than it was.

**A number that is maintained by remembering is not maintained.** The file's own footnote already
argues the standard — *"a count that is nearly right is the same problem as a stale one"* — and the
remedy it prescribes is thirty seconds of care per work order, which is precisely the thing that has
failed twice. This is the general statement and it is worth more than the instance: `wo-sweep.mjs`
exists because `plans/verification-tooling.md` directs grep-shaped checks out of the browser and into
a grep, and *how many times does this file call `check()`* is grep-shaped.

**Why nobody has folded it into another work order.** WO-2.18's implementer proposed exactly this and
judged it too small to book, to be picked up by "the next work order that touches the sweep." Nothing
left on the board touches the sweep — Phase 2's remainder is WO-2.6, WO-2.7 and WO-2.9, Phase 3 is
product screens, and the gates are ship checkpoints. So *the next one that touches it* is never, which
is how the third miss happens.

**The measurement that makes this harder than it sounds, taken 2026-08-10 on `6e90e53`.** The sweep
can count call sites; the README records executed checks; **the two numbers are not the same and the
gap is unexplained.** `grep -c 'check(' tools/verify-shell.mjs` is **542**. One is the definition at
`tools/verify-shell.mjs:68`. One is an `else check(` at `:10563`, which a line-anchored pattern misses.
That leaves roughly **541 call sites against 537 executed** — four sites that a run does not reach,
presumably conditional branches, and nobody has yet said which four. Settling that is most of this
work order; a check asserting `541 === 537` written by rounding the difference away would be worse
than no check at all.

**Deliverables**
- **A check in `wo-sweep.mjs` that counts `check()` call sites in `verify-shell.mjs` and compares them
  against a number recorded in `tools/README.md`**, failing on disagreement with `file:line`, in the
  shape the sweep's other checks take. The pattern carries its own written-down allowlist, per that
  file's convention — the definition and any non-call occurrence are named there rather than
  re-derived by the next reader.
- **The four-site gap, named.** Whichever four call sites a run does not reach are identified and
  written into `tools/README.md` alongside the count, with the reason. If the gap turns out to be
  structural rather than a fixed four — a `check()` inside a loop makes call sites permanently unequal
  to executed checks — say so and record the number the sweep is actually asserting, so the paragraph
  claims what it can prove and not one word more.
- **Proved by mutation in both directions, and the proof written down.** Add a throwaway `check()` to
  `verify-shell.mjs` and the sweep must go red without the README being touched; correct the README
  and it must go green. Both reverted, in the tabulated form `TESTING.md` § WO-2.18 uses.

**Out of scope** — anything in `src/`, and anything that changes what `verify-shell.mjs` prints or how
it counts. This work order asserts the existing number; it does not redesign the reporting. If a
disagreement turns up that is a defect rather than a stale line, that is a finding and it gets its own
work order.

**Acceptance**
- [ ] `node tools/wo-sweep.mjs` fails when `verify-shell.mjs` gains or loses a check and
      `tools/README.md` is not updated to match — run, not reasoned, with the output quoted both ways.
- [ ] The number the sweep asserts is the number `tools/README.md` states it is, and the paragraph
      says which quantity it is counting — call sites or executed checks — rather than leaving a
      reader to assume they are the same.
- [ ] The four call sites a run does not reach are named in `tools/README.md` with their reason, or
      the paragraph records why a fixed number cannot be stated.
- [ ] `node tools/wo-sweep.mjs` otherwise prints the line it printed before — no new REVIEW, and the
      standing sensitive-field-name REVIEW unchanged.
- [ ] `node tools/verify-shell.mjs` passes whole and `src/` is byte-identical to HEAD.

**Traps** — **Do not make the sweep run or import the harness.** Its own header is explicit: it opens
no browser and drives nothing, and a sweep that shells out to a 160-second browser run stops being the
cheap command a verifier runs first. **Do not settle the gap by loosening the assertion** — a check
that passes when the numbers are "close" restates the problem it was written to solve, and a `REVIEW`
that prints on every clean run is noise a verifier learns to scroll past. If the honest answer is that
the two counts cannot be made equal, the check asserts the one it can count and the README names the
other. **And do not update the count as part of this work order's own landing** without the check
proving it: correcting the line by hand one more time is the ritual that has failed twice.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `plans/verification-tooling.md`
  - `tools/README.md`
  - `tools/verify-shell.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Also open, and each for a stated reason:

- **`tools/README.md` around lines 440–490** — the count line itself (`**537 at WO-2.18**`), the
  WO-2.17 line above it (`**522 at WO-2.17**`) that shows the house form these paragraphs take, and
  the footnote at :487 (*"Update this line when you add checks…"*) whose failure is the reason this
  work order exists. Your new paragraph lives in that voice, not a new one.
- **`TESTING.md` § "WO-2.18 — The term-switch checks cover every surface the repaint paints"
  (line 1877)** — the Deliverables call for the mutation proof "in the tabulated form `TESTING.md`
  § WO-2.18 uses." Copy that table's structure rather than inventing a layout.
- **`tools/wo-sweep.mjs`, an existing check with its allowlist comment** — the Deliverables require
  your pattern to carry "its own written-down allowlist, per that file's convention." The file's own
  header states the convention at lines 19–22 (WO-1.2's `prefers-color-scheme` allowlist is the
  worked example). Match an existing check's shape; do not invent a reporting style.

**One measurement correction you must not skip.** The work order's numbers — `grep -c 'check('` =
**542**, ~**541** call sites, **537** executed — were taken on **`6e90e53`**. This dispatch is on
**`1f5217c`**, and the same grep now returns **561**. The tree has moved: the "four-site gap" is a
dated observation, not a specification, and the figure `four` may no longer be four. **Re-derive every
number yourself on the tree in front of you** and report the numbers you measured alongside the ones
the work order quotes. Carrying `541`/`537`/`four` forward unexamined is the precise mistake the
work order was written to stop — it would be the third miss, committed by the check meant to prevent
it.

Note also that `tools/README.md` currently states **537 at WO-2.18** while the harness on this tree is
plainly larger. If that line is stale, that is a finding to report and the Trap governs how you may
touch it: not corrected by hand as a landing ritual, but only with your new check proving the number.

Two scope boundaries worth restating, because both are easy to cross while doing this well. The
sweep's summary line will change simply because it now runs one more check — Acceptance line 4's
"prints the line it printed before" is about **no new REVIEW and the standing sensitive-field-name
REVIEW unchanged**, not about the total staying frozen; say which reading you applied. And if the
harness's executed count turns out to disagree with the README for a reason that is a **defect** in
`verify-shell.mjs` rather than a stale line, the Out of scope line makes that a finding for a
follow-up work order — report it, do not fix it here.

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
  exceptions: **never tick a 👤 line** — it needs a real iPad and you do not have one — and leave the
  `CHANGELOG.md` entry to the teacher, who decides what a change means. Anything you do tick must be
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

1. `node tools/wo-sweep.mjs` fails when `verify-shell.mjs` gains or loses a check and `tools/README.md` is not updated to match — run, not reasoned, with the output quoted both ways.
2. The number the sweep asserts is the number `tools/README.md` states it is, and the paragraph says which quantity it is counting — call sites or executed checks — rather than leaving a reader to assume they are the same.
3. The four call sites a run does not reach are named in `tools/README.md` with their reason, or the paragraph records why a fixed number cannot be stated.
4. `node tools/wo-sweep.mjs` otherwise prints the line it printed before — no new REVIEW, and the standing sensitive-field-name REVIEW unchanged.
5. `node tools/verify-shell.mjs` passes whole and `src/` is byte-identical to HEAD.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

