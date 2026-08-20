# WO-4.2 dispatch status

- 2026-08-20 — gates checked, PASS: WO-4.1 ✅, tree clean, no prior dispatch files.
- 2026-08-20 — work order read in full (plans/work-orders/phase-4-signals.md:77).
- 2026-08-20 — route: Claude / Opus. Deciding signal: presentation-mode refusal is a sensitive
  surface AND establishes the app's first refuse-rather-than-hide convention; plus a mockup lift and
  an edit to a shipped shared stylesheet. Runner-up set aside: the nine rules alone are specified
  arithmetic and Codex-shaped, but they arrive welded to the surface work. No probe run — Codex was
  never in contention.
- 2026-08-20 — claimed via wo-gate --start.
- 2026-08-20 — brief written to .claude/dispatch/WO-4.2-brief.md.
- 2026-08-20 — brief markers filled: routing decision + 9 additional files to read, the two harness
  touchpoints (verify-shell.mjs ~29753 four-segment assertion, wo-sweep count drift), and the scope
  fence against WO-4.3/WO-4.4.
- 2026-08-20 — implementer spawned at Opus, awaiting return. Expect 20-40 min; the first ~20 of
  those are silent reading, during which a flat status file and an unchanged git status are normal.

---

## The dispatch died, and what a later session found in the tree

- 2026-08-20 15:04 — **the orchestrator's chain was killed by an API error** (session limit). The
  implementer's writes had landed; nothing had been verified, no result file was written, and every
  Acceptance box was still unticked. `plans/dispatch-retro.md`'s rule applied verbatim: *a dead
  dispatch's writes are usually all there and none of its claims are.*
- 2026-08-20 ~15:20 — re-derived from the working tree rather than from any claim.
  - Tree is sane: no CRLF rewrite (every changed file uniformly CRLF, as the repo already was),
    diffstat proportionate, every changed `.js` parses.
  - `wo-sweep.mjs`: 33 checks · 29 passed · **0 failed** · 4 to review (two of the four pre-date
    this work order).
  - The implementation BODY is complete — all nine concern rules in `src/signals.js`, the view, the
    stylesheet with its coarse block, `sw.js` bumped to v91 with both new files in `SHELL`, the
    fifth segment in `src/screen-nav.js`, the `flex-wrap` on `.screen-nav`.
- 2026-08-20 — **the harness was the half-finished part, and it was finished the dangerous way
  round.** `tools/verify-shell.mjs` had its COMMENT rewritten to describe a row-counting assertion
  and its CODE left asserting four segments and the vacuous `scrollWidth <= clientWidth` that the
  new comment itself calls vacuous. Prose claiming what the code never did — the exact scar. A first
  run: **1067 checks · 1057 passed · 10 failed.**
- 2026-08-20 — the ten were walked and closed, none of them by loosening an assertion:
  - the 390px check now counts **distinct row offsets (two)** and proves every segment sits inside
    the strip's own box — the claim `scrollWidth` was standing in for;
  - the 834px check asserts **one row, five segments**, so the wrap is proved to be a phone answer
    and not a squeeze that fired everywhere;
  - four more strips that hardcoded four labels / four hooks, and the detail breadcrumb, moved to
    five and six respectively;
  - three WO-4.1 engine fixtures that WO-4.2's attendance rules legitimately changed the hit COUNT
    of (Fixture B's student is 6 of 7 meetings = 85.71%, below the documented 90% line) were moved
    to their new counts and re-cut to find hits **by rule id and direction rather than by index**,
    since an index there was a claim about ordering neither check was trying to make;
  - `.sig-sort:focus-visible` was **removed** from `src/signals-view.css` — a second focus ring
    whose only difference from the global one at `src/shell.css:102` was a 1px outline-offset, and
    the harness asserts exactly one such rule, globally scoped. The absence is noted at its place.
- 2026-08-20 — second run: **1067 checks · 1066 passed · 1 failed.**

## The one failure left, and why it was NOT papered over

    every screen in <main> is one this sweep knows how to open ...
    NOT IN VIEW_PLAN, so nothing measured them: signalsView

**This is the real remaining gap, not a harness nit.** `tools/verify-shell.mjs`'s diff for this work
order was **comment-only** — the implementer added **zero** checks for the new view. A whole screen
ships with nine rules, a sort control, rule chips, a modal, an inert-rule notice and the app's first
refuse-rather-than-hide presentation mode, and the harness measures none of it.

The cheap way out is an entry with a `byHand` string. **That would be a lie of exactly the kind this
file's neighbours refuse** — `byHand` means *measured in full somewhere else*, and there is nowhere
else. `#detailView` and `#calendarView` earn theirs by being measured at the foot of the file; this
one would earn nothing. A skip is not a pass.

**So `signalsView` was left out of `VIEW_PLAN` deliberately, and the run left RED**, because a red
run naming the missing coverage is worth more than a green one that stopped asking.

## Owed before WO-4.2 can be ticked

1. **Harness coverage for `#signalsView`** — the substantive remainder. Then its `VIEW_PLAN` entry.
2. **All six Acceptance boxes** are unticked and none has been verified by anyone.
3. The sweep's `.sig-*` review item — 33 selectors to confirm as non-targets or give the 44px rule.
4. The maintenance protocol: `CHANGELOG.md`, the status line, `plans/work-orders/README.md`, and the
   work order's own status (still `🤖 CLAIMED`).

---

## Finished in-session, 2026-08-20

- **The coverage was written.** § *"who needs you, drawn (WO-4.2)"* at the foot of
  `tools/verify-shell.mjs` — nineteen checks against a fixture built for the screen: two classes,
  three students each carrying one answer, nine recorded meetings **with the 8th dropped in the
  middle of an absence run**, and an assignment that makes one student fail while the absentee
  passes. That last detail is what stops the banding claim being satisfied by a build that sorts on
  the grade.
- `signalsView` is in `VIEW_PLAN` with a `byHand` string naming that section. The entry says in as
  many words that `byHand` is a pointer to coverage and never a way out of one — delete the section,
  delete the line, let the loop go red.
- **Both tools green.** `verify-shell.mjs`: `1086 checks · 1086 passed · 0 failed · 0 skipped`,
  30,566 lines, 373s, exit 0. `wo-sweep.mjs`: `33 checks · 29 passed · 0 failed · 4 to review` (all
  four review items pre-date this work order or are answered below). `wo-gate --audit`: PASS.
- Two of my own assertions were wrong on the first green-ish run and were corrected rather than
  loosened: the rule strip carries an **All rules** chip so the count is rules + 1 (asserted, along
  with **All classes**, because a strip that filters and cannot unfilter is the cul-de-sac WO-6.6
  was opened to remove), and `planbook_openClassId` is the long-standing which-class-is-open
  preference rather than this screen's filter — excluded **by name**, with the reasoning written at
  the check and the separate arrival-from-another-class assertion proving the two are different facts.
- The sweep's `.sig-*` review item is answered: the 33 selectors it lists are layout and text
  classes, not touch targets; every actual control (`.sig-row`, `.sig-card-act`, `.sig-sort`,
  `.sig-inert`) carries the 44px floor in the coarse block, and the harness now measures **33
  controls on the live screen at 390px with none under 44**.

### Maintenance protocol, done

`CHANGELOG.md` · `CLAUDE.md` status line · `plans/work-orders/README.md` § Ship 3 row and the `next`
note · `tools/README.md` call-site count 1051 → 1070 with its narrative entry · the work order's own
Acceptance list and status · `plans/dispatch-retro.md` § *"The comment that ran ahead of its code"* ·
and the About modal's **This build** paragraph, which `index.html` requires be rewritten in the same
pass as the work order that makes it untrue — it still said there were no scores and no grades, and
that signals came later.

### Still owed

1. **Acceptance line 1** — all nine rules reproducible by hand. Four fire on the fixture and are
   reproducible from what they print; the behavior rule is inert by construction. The grade fall, the
   low-score run, missing work and tardies have no fixture that fires them.
2. **The 👤 iPad readings.** No emulator has a thumb. The five-segment strip wrapping to two rows at
   390px is the one most worth a real device, and `CLAUDE.md`'s force-quit rule applies before reading.
3. **A verifier's own pass.** Nothing here has been checked by fresh eyes; this session both finished
   the build and measured it, which is exactly the pairing the pipeline separates.

---

## Mutation pass, 2026-08-20 — four reddened, one survived

Run because `plans/verification-tooling.md` says **mutation-proved acceptance is this project's house
style**, and the nineteen new checks had never been proved able to fail. A verifier was considered and
set aside: its mechanical pass is the two tools, both already green, and then reading — and the defect
this pass found is invisible to reading.

| Cut | Result |
|---|---|
| presentation mode builds the list and only hides it | REDDENED — 1, the refusal check alone |
| a `null` grade read as a zero | REDDENED — 8, Acceptance line 4 among them by name |
| `meetingDates()` keeps non-`TAKEN` days | REDDENED — 22, incl. the absence-run check |
| `.screen-nav` loses its `flex-wrap` | REDDENED — 1, exactly the two-row count |
| `severityOrder()` stops banding attendance first | **SURVIVED — 1086 of 1086** |

**The survivor was guarding the ruling the phase turns on.** `evaluate()` walks the roster outer, so
row order is roster order, and `Array.prototype.sort` is stable — a ranking cut to a no-op leaves rows
as the roster listed them, and the fixture was seeded `[Abe, Lena]`, already the asserted answer. The
roster is `[Lena, Abe]` now; baseline unchanged at 1086 of 1086, and the same mutation reddens three
checks including this one. Written up in `plans/verification-tooling.md` § "A stable sort is where a
vacuous ORDER check hides" and in `TESTING.md` § WO-4.2's desk pass.

**Also found while planning the cuts, before any of them ran:** the Acceptance-line-3 fixture seeded
its dropped day as a bare gap plus a calendar event. `stateOf()` has two ways to not be a meeting — a
record wearing an `exception` is `DID_NOT_MEET`, no record at all is `COVERED`/`NOT_TAKEN` — and only
the first reaches `meetingDates()`'s predicate; a date with no record is filtered out one line
earlier. So it proved the untaken half and left the dropped half untouched, while the Acceptance line
names both. The 8th is a real ledger record wearing the exception `dropClass()` writes now, which is
what the fourth cut above is able to reach.

**A process scar worth keeping:** the first re-proof attempt ran inside a ten-minute tool cap against
a ~12.5-minute pair. `SIGTERM` killed node before its `finally` restored the file, leaving
`src/signals.js` mutated on disk with a commit as the next step. A signal is not an exception. Caught
by grepping the shipped line; every mutated line was then verified back by hand.
