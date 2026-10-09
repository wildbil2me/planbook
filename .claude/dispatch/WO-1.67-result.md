# WO-1.67 — result (implementer, Claude Opus)

**`--tick` ticks a roadmap box that a Closes roadmap line quotes in order to disown it**

All five Acceptance boxes are ticked in `plans/work-orders/phase-1-shell-store-roster.md` and in
`TESTING.md` § WO-1.67. None of them is 👤 or 📆. The status is still `🤖 CLAIMED`; I did not run
`--handoff` or `--tick`. `--tick WO-1.67 --dry-run` was run once, which writes nothing, to confirm it
finds the TESTING section.

## What changed

- **`tools/wo-gate.mjs`**
  - New `NO_BOX_OPENING` and `closesFragments()`, placed directly above `roadmapEdits()`, with the
    survey and the rule in a comment there. A **Closes roadmap** value yields no fragments if it
    opens, after an optional `Phase N` and `→`, with any run of `*`, `_`, `(` or spaces followed by
    the words `no box`. The match ignores case.
  - Four callers used to each run their own `matchAll(/"([^"]+)"/g)`, and they now all go through
    `closesFragments()`: `roadmapEdits()` (`--tick`), `--audit`'s fragment walk,
    `notComingProblems()`, and `trackerDrift()` (the `--self-check` precondition).
  - **`--tick`'s NOTE.** A no-box line that contains a quotation now prints
    `…quotes no box — it opens with a no-box note, so the box it quotes is named as another work
    order's and not closed here; no roadmap box to tick`. A line with no quotes prints the same
    message as before.
  - **Double claims.** New `doublyClaimedBoxes()` and `SHARED_BOXES`, and a new `--audit` section
    titled "Roadmap boxes, against the work orders whose fragments claim them". It lists a box
    claimed by two or more work orders as a `BAD` row, counted in the verdict, unless the box is
    excused by name. An excuse must name the box and every claimant. An excuse that no longer
    matches anything is itself reported.
  - `fixtureBlock()` gains a `targetCloses` option (default `''`) that gives WO-9.8 a **Closes
    roadmap** line.
  - Two new plants, plus their lines in the run's closing coverage text, plus one line in `--help`.
- **`tools/README.md`**: the `--self-check` count goes from forty-seven to forty-nine, and
  `47 of 47` becomes `49 of 49`. Added a paragraph on WO-1.67's two plants and their mutations, and
  a line in the `--audit` description.
- **`plans/work-orders/README.md`** § Header fields: the **Closes roadmap** row and quoting rule 4
  now state the no-box exception and the one-box-one-work-order check.
- **`TESTING.md`**: § WO-1.67 is added under Phase 1, after WO-1.66.
- **`plans/work-orders/phase-1-shell-store-roster.md`**: the five Acceptance boxes are ticked.

WO-8.16's line is **not edited**, per the Traps. Nothing in `src/` moved, so no `CACHE` bump.

## Acceptance, line by line

1. **Scratch `--tick WO-8.16` from 🔍 AWAITING VERDICT leaves ROADMAP.md untouched and says
   "quotes no box".**
   - **Setup.** I copied `plans/`, `TESTING.md` and the new script to the scratchpad and set
     WO-8.16's status to `🔍 AWAITING VERDICT — scratch`.
   - **New script.** `PASS | WO-8.16 ticked.`, exit 0. The only edit was the status line. It printed
     the "quotes no box" NOTE. `ROADMAP.md`'s md5 was the same before and after (`d0298feb…`), and
     `diff` against `git show HEAD:plans/ROADMAP.md` was empty.
   - **HEAD script, same setup, second copy.** It reproduced the defect:
     - `plans\ROADMAP.md:712 - [ ] → - [x]`
     - two dashboard NOTEs, Phase 8 going 3/8 → 4/8 and Overall going 75/81 → 76/81.
   - **Real tree.** `git diff --quiet plans/ROADMAP.md` is clean. I never ran `--tick WO-8.16` on
     the real tree.
2. **A line that quotes a box without a no-box note still ticks it.** This is shown two ways:
   - The existing plant "a fully ticked work order still gets ✅ DONE, its roadmap box, and the
     dashboard" is green.
   - The new plant's control half ticks from 🔍 AWAITING VERDICT in two cases: with no prose on the
     line, and with `no box` written mid-line after the quotation. Both must tick the box.
   - Widening the test to match anywhere on the line (mutation m1, below) turns exactly that control
     red: 1 red of 49.
3. **`--audit` names a box claimed by two work orders, with a plant.**
   - **The plant.** WO-9.8 is given a line quoting WO-9.9's box. The audit then:
     - prints a `BAD` row naming `ROADMAP.md:<line>`, WO-9.9 and WO-9.8;
     - counts exactly one more problem than a baseline run of the same copy;
     - exits non-zero.
   - **Control.** Behind a `*(no box` opening there is no row and no extra problem.
   - **Count on today's tree: one box**, and it is excused. It is `ROADMAP.md:275`, Phase 2's
     *"Marking screen, exceptions-only"*, claimed by:
     - WO-2.1, which closed it;
     - WO-2.10, whose line reads `amends "Marking screen, exceptions-only", closes …`.
   - **Without the no-box fix the count would be two.** WO-8.6 and WO-8.16 would also both claim
     `ROADMAP.md:712`. I measured this in a scratch copy with `NO_BOX_OPENING` disabled. WO-8.16 stops
     counting once the first deliverable lands, as the orchestrator asked me to confirm.
4. **The tools pass:**
   - `--audit`: exit 0 and `PASS`. The new section reads
     `1 box(es) claimed by more than one work order, 1 excused in SHARED_BOXES, 0 problem(s)`.
   - `--self-check`: `PASS | 49 of 49 plants were caught.`, exit 0. It was re-run after the last
     edit to the script.
   - `wo-sweep.mjs`: `50 checks · 47 passed · 0 failed · 3 to review`, exit 0. The three reviews are
     the standing ones (sensitive names, due-date/late, mockup banner). The sweep's own count did not
     move.
   - `tools/README.md` records 49.
   - `verify-shell.mjs` (the brief's § 4): `1881 checks · 1881 passed · 0 failed · 0 skipped`,
     `EXIT=0`. I read this from the log after the process exited.
5. **TESTING.md § WO-1.67**: written, with the Acceptance lines verbatim and the evidence under
   each.

## How the plants were proved

- **Against the HEAD script (`--against`):** **2 red of 49**, both new plants and nothing else.
- **Four mutations, each in a scratch copy and never in the tree:**

| Mutation | Result |
|---|---|
| m1 — opening test widened to anywhere on the line | 1 red: the no-box plant's control |
| m2 — `closesFragments()` returns nothing | 10 red, this pair among them |
| m3 — double-claim problems dropped from the verdict | 1 red: the double-claim plant ("counted 0 against 0", "exited 0") |
| m4 — the double-claim walk reads raw quotations | 4 red: the double-claim plant, plus three plants that expect a clean `--audit`, because the real WO-8.16/WO-8.6 pair becomes a live double claim under it |

- **Not planted:** `SHARED_BOXES`' stale-excuse report. I checked it by hand in a scratch copy, by
  renaming the excused box and by adding a third id. Both were reported, and the tally bug this
  turned up (the stale-excuse line was being counted as a box) was fixed by returning a `boxes`
  count.
- **MUTATION cleanup.** `git diff | grep -c MUTATION` → 0. `grep -rn MUTATION tools/` shows only
  prose that was already in `tools/README.md` and `tools/verify/keys-legend-guards.mjs` at HEAD. My
  diff adds none.

## Decisions the work order left to me

1. **The no-box test.** I read all 212 **Closes roadmap** values in the directory:
   - 156 open `*(no box`, 49 of them after `Phase N →`. Only WO-8.16 quotes a box.
   - 54 quote the box they close.
   - WO-1.13 opens `*(no roadmap line;`.
   - WO-G4 opens `→ the *What 1.0.0 means* section`.

   I **left `no roadmap line` out** of the test. `--self-check`'s bold-prose plant (WO-1.27) already
   writes `*(no roadmap line for the note itself — see **Why it exists** below)*` **ahead of a
   fragment that must still tick**. So those words already carry the opposite meaning in this file,
   and the first draft that included them would have broken that plant. `no box` has only ever had
   one meaning. WO-1.13 quotes nothing, so it reads the same either way.
2. **A failure, not a note.** On today's tree the check fires on exactly one box, and that case is
   legitimate and easy to name. A double claim means the box's state depends on which work order
   ticks first. WO-8.16's own incident printed two accurate NOTEs, which were read as bookkeeping.
   The argument is written at `doublyClaimedBoxes()`.
3. **The excuse is a named list, not a rule.** I did not make `amends` before a quotation into a
   marker, because that would be `--tick` reading the sentence, which the Traps refuse. Instead
   `SHARED_BOXES` names the box text and both ids, with the reason. It goes stale loudly: if the box
   is reworded, the excuse drops and the box is reported.
4. Placement of the new `--audit` section: it comes straight after the fragment walk's tally and
   before the **Owes** section, outside the slices that existing plants cut out of the audit output.

## Out-of-scope temptations declined

- **Checking quotations inside no-box lines.** `--audit` could still check that each quotation in a
  no-box line matches exactly one box, so a quotation used to say whose box it is cannot quietly rot.
  I declined because it was not asked for. It is a plausible follow-up.
- **`--tick` making the WO-2.10 shape safe.** It still treats `amends "…"` as a fragment. That is
  harmless today, because the box is already ticked and the result is the "already ticked" NOTE. The
  structural home for an amendment is the existing **Amends roadmap** field, and moving WO-2.10's
  claim there is a hand edit to a closed work order. I left it alone.
- **The `wo-gate.mjs` row in `tools/README.md`'s map table.** I did not touch it; its wording is
  still true.
- **The memory note "--tick misreads a no-box roadmap line … until WO-1.67 lands".** That is the
  orchestrator's to retire.

## Not verified

Nothing here needs an iPad or human eyes. I did not read the new section's prose against
`CLAUDE.md`, because this change does not touch `CLAUDE.md` or `AGENTS.md`.

## Files changed

- `c:\dev\planbook\tools\wo-gate.mjs`
- `c:\dev\planbook\tools\README.md`
- `c:\dev\planbook\plans\work-orders\README.md`
- `c:\dev\planbook\plans\work-orders\phase-1-shell-store-roster.md` (the Acceptance ticks; the
  `🤖 CLAIMED` status line was `--start`'s, already in the tree)
- `c:\dev\planbook\TESTING.md`
- `c:\dev\planbook\.claude\dispatch\WO-1.67-result.md` (this file)

## Draft CHANGELOG entry (the teacher decides)

> **Tooling — a work order can name another's roadmap box without closing it (WO-1.67).** A
> **Closes roadmap** line that opens *(no box* is no longer read for fragments, so the quotation
> WO-8.16 used to say whose box the onboarding line is can no longer tick WO-8.6's box. `--audit`
> now also fails any roadmap box claimed by two work orders, unless the box is excused by name. Today
> one is excused: WO-2.10's amendment of WO-2.1's marking-screen box.
