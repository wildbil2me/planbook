# WO-1.36 — two fixtures in one table cannot prove a per-section shelf · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.36-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, at **Opus** (no model override). The deciding signal is that the first deliverable is a *ruling* — per-section versus global keying of `rideAlongReport()`'s shelf — in the pipeline's own gate tool, which is judgment about what the spec should be, not a spec to match. The runner-up was Codex for the plant-and-mutation half, which is mechanical; set aside because the plant cannot be written until the ruling is made, and the Acceptance asks for mutation proof the reader of this tool must trust.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.36 — two fixtures in one table cannot prove a per-section shelf

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-01 · **Size** S · **Depends on** WO-1.35 ✅ · **Blocks** nothing
**Closes roadmap** Phase 1 → *(no box. Tooling, not app — the same call WO-1.26 through WO-1.35 made.
Booked 2026-08-28 by WO-1.35's own verifier, which **proved** this rather than suspecting it.)*

**Why it exists.** `rideAlongReport()` counts the open rows above a 🎒 row **per section** —
`openAbove` is a `Map` keyed by `row.section` — and the comment above it says in as many words that
*§ Ship 3 and § After Ship 3 are different shelves*. **Nothing proves that.** WO-1.35's 🎒 plants
write both fixture rows into the **same** table: step 2b splices `WO-9.9` and `WO-9.8` in adjacent,
above every real row in the first section, and the pair that separates *empty shelf* from *shelf* —
`NOTE` on one, `ok` on the other — is therefore two adjacent rows of one section. **Collapse
`openAbove` to a single global counter and `--self-check` still reports 27 of 27.** WO-1.35's
verifier established that by mutation, not by reading.

**The tree cannot tell the two apart either, and that is the half that makes this a work order rather
than a plant.** WO-8.13 is row 10 of § After Ship 3 and it is the first `⬜` **both** in that section
and in the whole document — everything above it is ✅, 🔒 or 🔨. So the NOTE `--audit` prints today is
the same NOTE under either keying, and stays that way until a `⬜` row sits above a 🎒 row **from an
earlier section**. There is no live symptom to work from, which is exactly the condition under which
a claim nobody can check goes on being believed.

*(**Re-placed 2026-08-29, and the symptom moved further away rather than closer.** WO-8.13 is row
**42** now — the foot of § After Ship 3, where its own paragraph had claimed it already sat — so no
🎒 row is the first `⬜` in any section and `--audit` prints no NOTE at all. The two keyings agreed
by printing the same NOTE; they now agree by printing nothing. **Nothing in the paragraph above
changes**: both fixture rows are still adjacent in one table, `openAbove` still collapses to a global
counter with `--self-check` green at 27 of 27, and there is still nothing in the tree that tells the
keyings apart. What is gone is the one live reading that could have been mistaken for a check.)*

**It is WO-1.33's defect in a second instrument.** There the fixture student was *narrow, not
vacuous* and the harness could not see the filter it claimed to watch; here the fixture rows are
*adjacent, not absent*, and the harness cannot see the keying it claims to watch. Both are an
instrument whose fixtures agree with each other, which is the shape to go looking for next.

**Rule the keying before proving it, because the two readings disagree about a sentence that is
already printed.** They are:

- **Per-section, what the code does today.** A section is its own running order — a ride-along parked
  in § After Ship 3 is a plan to fold an hour into an *After Ship 3* sitting, and Ship 3's rows are a
  different body of work. The NOTE names the section it measured, so it is section-local by
  construction.
- **Global, what `next` does.** `next` walks document order and stops at the first `⬜` **anywhere**,
  ignoring headings entirely; the mark's whole bite lives there. Under this reading a 🎒 row's shelf
  is every `⬜` above it in the file.

**The NOTE's own words are the evidence, and they cut toward global**: *"there is nothing left to
fold it into"* is a claim about work that will actually be done, and under per-section keying it can
be printed while five open rows sit above it in an earlier section — each of them a sitting that
could host the fold. WO-8.13 rides with `index.html`, and a Ship 3 row that opens `index.html` hosts
it exactly as well as an After-Ship-3 one. **That is an argument and not the ruling.** Whichever
reading wins, the loser is named where the code makes the choice, and the sentence that survives is
one a plant pays for.

**Out of scope.** What `next` does. It reads document order and ignores headings, and nothing here
touches that — this work order is about `--audit`'s NOTE and the count behind it. Also out of scope:
tightening the NOTE to a `BAD`. `rideAlongReport()` argues that at its own definition and two plants
assert `--audit` exits 0 over it.

**Traps**

- **A plant may not borrow a real section.** The sandbox copies the real `plans/`, so a later
  section's `⬜` content is whatever the trackers happen to carry that week — the scar `rideSection()`
  already names, one step further in. A plant that needs a second shelf **plants its own heading and
  its own rows** rather than reaching into § Ship 2.
- **Step 2b's guarantee has to survive.** Four existing plants depend on the fixture being the first
  row `next` reads. `reset()` rewrites every pristine file, so a relocation inside one plant is undone
  before the next — but a plant that inherits a previous plant's placement instead of doing its own
  breaks all four for a reason that is not a defect.
- **The new plant must fail under the losing keying, and be shown to.** A plant that passes under both
  is the defect this work order was written about, arriving in the fix for it. The mutation goes in
  `tools/README.md`'s table with the rest.
- **`--audit` must stay green on the real tree.** Both keyings agree there today; if the ruling
  changes what WO-8.13 reports, that is a finding to hand back, not a number to adjust.

**A second instance in the same file, folded in 2026-08-30.** WO-1.38's verifier reported one branch
of `applyRelease()` that no plant reaches: the `fs.existsSync(result)` arm at `tools/wo-gate.mjs:1137`,
which appends *"and there is no such file, which is its own thing to find out before touching this
row"* when the result file the refusal names is missing. **It is this work order's shape exactly** —
two behaviours behind one check, with no fixture separating them — so it rides here rather than
taking a row of its own. It is not a defect in WO-1.38: no Acceptance line of that work order asked
for it, and the verifier said so when it reported it. **The missing-file arm is the one worth a
plant**, because it fires precisely when a row's dispatch trail is *already* damaged, which is when a
reader is least able to tell a real refusal from a malformed one.

**Acceptance**
- [ ] The keying is **ruled on in prose where the code makes the choice** — at `rideAlongReport()` —
      naming the reading that lost and why, so the surviving sentence is one a reader can check.
- [ ] A plant puts a 🎒 row in a **later section than an open `⬜` row**, on a shelf it planted
      itself, and asserts the ruled behaviour.
- [ ] That plant goes **red** under the other keying — collapsing `openAbove` to one global bucket if
      per-section won, restoring the per-section `Map` if global won — recorded in `tools/README.md`'s
      mutation table with the rest.
- [ ] No comment in `tools/wo-gate.mjs` claims a distinction no plant pays for; the
      *"different shelves"* sentence either has a plant behind it or is gone.
- [ ] `applyRelease()`'s missing-result-file arm is reached by a plant — a row at `🔍 AWAITING
      VERDICT` with **no** `.claude/dispatch/<ID>-result.md` behind it — and the two arms are proved
      to print differently rather than assumed to.
- [ ] `--self-check` is green and its own count goes up by the number of checks added.
- [ ] `node tools/wo-sweep.mjs` is green, and `--audit` is green on a clean tree with WO-8.13's NOTE
      reading as it does today.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `tools/README.md`
  - `tools/wo-gate.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `plans/work-orders/README.md` § "Ride-along rows" — the mark's definition; if the ruling changes what the NOTE means, that section and `tools/README.md` must say the same thing.

**Orchestrator notes — traps the work order's text does not tell you (checked 2026-10-01):**

- **Line numbers in the work order are stale.** The "different shelves" comment is at `tools/wo-gate.mjs:~793`; `rideAlongReport()` is at `~1840`; the missing-result-file arm the work order places at `:1137` is now inside `applyRelease()` at `~1428` (the `fs.existsSync(result) ? '' : ' — and there is no such file…'` ternary). Find them by text, not by number.
- **WO-8.13 is now `✅ DONE`.** `--audit` today prints `ok WO-8.13 ✅ DONE — the mark is spent`, exits 0, and reports `7 ride-along row(s), 0 with nothing open above them`. Read Acceptance line 7's "WO-8.13's NOTE reading as it does today" as: *the ride-along section of `--audit` on the real tree reads the same before and after your change* (zero NOTEs). Capture it before you edit and diff it after. If your ruling changes any real row's line, that is a finding to hand back (Traps, last bullet), not a number to adjust.
- **Record `--self-check`'s count before you touch anything**, so Acceptance line 6's "goes up by the number of checks added" is a subtraction you can show.
- **Mutation hygiene.** Every mutation you insert carries a `MUTATION` marker and is reverted before you write anything else; `grep -rn MUTATION tools/` must be empty at your return. Stage your own edits before any `git checkout` revert, or the revert eats them.
- **Both mutations need recording**, not only the keying one: if you prove the two `applyRelease()` arms differ by mutation (e.g. forcing the ternary), that row goes in `tools/README.md`'s table too, and the sweep counts call sites recorded there — re-run `wo-sweep.mjs` after editing `tools/README.md`.
- **`verify-shell.mjs` is not this work order's harness** — nothing in `src/` or `index.html` should move. Run it once for the record if you can; a "could not run" from the sandbox is an environment, not a failure. The two that must be green are `node tools/wo-gate.mjs --self-check` and `node tools/wo-sweep.mjs`, plus `--audit` exiting 0.

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

## 5. Done means these 7 lines, reported against one by one

1. The keying is **ruled on in prose where the code makes the choice** — at `rideAlongReport()` — naming the reading that lost and why, so the surviving sentence is one a reader can check.
2. A plant puts a 🎒 row in a **later section than an open `⬜` row**, on a shelf it planted itself, and asserts the ruled behaviour.
3. That plant goes **red** under the other keying — collapsing `openAbove` to one global bucket if per-section won, restoring the per-section `Map` if global won — recorded in `tools/README.md`'s mutation table with the rest.
4. No comment in `tools/wo-gate.mjs` claims a distinction no plant pays for; the *"different shelves"* sentence either has a plant behind it or is gone.
5. `applyRelease()`'s missing-result-file arm is reached by a plant — a row at `🔍 AWAITING VERDICT` with **no** `.claude/dispatch/<ID>-result.md` behind it — and the two arms are proved to print differently rather than assumed to.
6. `--self-check` is green and its own count goes up by the number of checks added.
7. `node tools/wo-sweep.mjs` is green, and `--audit` is green on a clean tree with WO-8.13's NOTE reading as it does today.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

