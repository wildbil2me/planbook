# WO-1.75 — result

**The rule is in and the sweep is green.** `tools/wo-sweep.mjs` § 19 now fails any line in a `proposed*.css` that has both a `§` and a run of `═` (`/═{2,}/`). The sheet and line are named, and the error message describes the banner box `PROTOCOL.md` rule 4 expects. It does not look at the header index or any other section. `proposed-phase7.css:19` has been reshaped into a banner box with its words unchanged, and the gap paragraph has been replaced in both places. All four Acceptance boxes are ticked, each backed by a command I ran and read the output of. None of them is 👤 or 📆. Nothing is committed.

## Against the Acceptance list

1. **The sheet as it stood turns the sweep red, naming the sheet and line 19, and was reverted:** met, twice.
   - **Before the reshape**, with the new rule and the committed sheet: exit 1, `50 checks · 46 passed · 1 failed · 3 to review`. The only FAIL is `design/mockups/proposed-phase7.css:19 is a one-line banner (…)`.
   - **After the reshape**, as a round trip: I copied the reshaped sheet to the scratchpad and wrote `git show HEAD:` over the tree copy. The sweep went to exit 1 with the same FAIL. I copied the scratchpad version back in the same command, `git diff --stat design/` showed only the reshape, and the sweep returned to exit 0.
   - No `MUTATION` marker was written. `git diff -U0 | grep MUTATION` finds one line: the TESTING.md sentence that says no marker was written.
2. **Every `proposed*.css` passes, phase7 reshaped, no other sheet changed:** met.
   - `git diff --stat design/` lists only `proposed-phase7.css` (`3 insertions(+), 1 deletion(-)`).
   - The § line is byte-identical to the old line's words.
   - § SYNC BUTTON now parses as a landed section, so it is exempt from collisions. It adds no REVIEW; the standing three are unchanged.
3. **`wo-sweep.mjs` green, `wo-gate.mjs --audit` passes:** met.
   - The sweep exits 0: `50 checks · 47 passed · 0 failed · 3 to review`.
   - `--audit` exits 0.
   - `node tools/verify-shell.mjs` (brief § 4) exits 0 with `1915 checks · 1915 passed · 0 failed · 0 skipped`. I waited for it to exit and read the `EXIT=0` line.
4. **TESTING.md § WO-1.75:** met. It is added under Phase 1 after § WO-1.69, with the Acceptance lines verbatim and the evidence for each.

## Traps and decisions

- **The parser is not widened.** The new rule only pushes onto WO-1.69's per-sheet `unreadable` list. Section discovery is untouched, so a one-liner is refused and never read as a section.
- **The pattern was checked against every banner before I relied on it.** A scratchpad node script found 39 banner boxes across the ten `proposed*.css`. None of their `═` rule lines carries `§`, and none of their § lines carries `═`.
- **No new `check()` call site.** The rule folds into the collision check's existing FAIL, the same choice WO-1.69 made. So the sweep stays at 50 checks and the counts in `tools/README.md` do not move.
- **Two small wording edits at the existing message and PASS line:**
  - The trailer `A one-line … is read as nothing` now reads `is never read as a section`. "Nothing" was no longer accurate: the one-liner is read as part of whatever sits above it.
  - The PASS line gains `and no sheet carries a one-line banner`, so a green run says this rule ran.
- **`TESTING.md` § WO-1.69 is not rewritten.** It still names the gap, because it records the tree that work order left. The deliverable listed only the check comment, the § 19 banner and `tools/README.md`.

## Noted, not acted on

- **`src/detail.css:246` has a one-line banner:** `/* ══ § STUDENT ATTENDANCE (WO-2.60) … ══`. It is outside § 19's reach, which reads only `design/mockups/proposed*.css`, and outside this work order's scope. It is harmless there because nothing parses `src/` stylesheets into sections.

## Not verified

- Nothing in this work order needs an iPad or human eyes.

## Files changed

- `c:\dev\planbook\tools\wo-sweep.mjs`: § 19 banner paragraph, rule 3 comment and code, fault trailer wording, PASS line.
- `c:\dev\planbook\design\mockups\proposed-phase7.css`: line 19 is now a banner box.
- `c:\dev\planbook\tools\README.md`: the `wo-sweep.mjs` row's gap sentence is replaced.
- `c:\dev\planbook\TESTING.md`: § WO-1.75 added.
- `c:\dev\planbook\plans\work-orders\phase-1-shell-store-roster.md`: four Acceptance boxes ticked. The status is left at `🤖 CLAIMED`; it was already modified by the orchestrator's `--start`.

All files are LF, and the diffstat shows no line-ending churn.

## Draft CHANGELOG entry (the teacher decides)

> The mockup sweep now refuses a one-line `/* ══ § NAME ══ */` banner wherever it appears in a proposed stylesheet, not only when a header index or an empty parse happens to give it away. The one such banner left in the tree, `proposed-phase7.css` § SYNC BUTTON, is now a proper banner box, with its words unchanged.
