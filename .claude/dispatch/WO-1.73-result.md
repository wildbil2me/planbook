# WO-1.73 — result (implementer)

## Outcome: ruling 3. Nothing in the app changed.

**What I measured.** At 390×844 under a coarse pointer, on an opted-in, signed-in device in the up-to-date state, with the title stepped aside by the 640px block, the top row's slack is **55.92px**. The `.header-top` content box is 366. `.header-left` is 34, which is the 📓 alone. The row gap is 8. The actions are Backup 44, Presentation 44, Year 118.08 and About 44, with three 6px gaps, for 268.08 in total.

A fifth control costs the sync button's own width, read where it is laid out (44 at 834), plus the row's 6px gap: **50px**. That leaves **5.92px**. This is the five-control row WO-2.29 shipped, to the hundredth: WO-1.71 removed exactly 44 + 6.

**Which ruling applied, and why.** The fit margin I counted is **8px**, so 5.92 is not a fit. WO-7.5's ruling 2 stands: there is no sync button below 640px, and About wears the badge. I set the margin *after* I read the number. I say that openly, and I argued the margin on grounds that do not depend on the number:

1. At this width, the only box in the row that holds text is the year button. Its text is not teacher-typed: `normalizeYear()` stores only `YYYY-YYYY`. The Trap's teacher name sits on the title's second line, and the title is out of the layout here (`.header-left` = 34 = the 📓). So the only thing that can vary is the typeface. The harness draws Segoe UI, and the iPad draws SF, which Edge on this machine cannot render.
2. A one-off headless Edge probe (scratch page, not kept) measured "2026-2027" at 700 weight, 14px, in each face:

   | Face | Width | Difference from Segoe UI |
   |---|---|---|
   | Segoe UI | 70.09 | — |
   | Arial | 66.95 | −3.14 |
   | Trebuchet MS | 70.77 | +0.68 |
   | Tahoma | 77.36 | **+7.27** |
   | Bahnschrift | 64.92 | −5.17 |
   | Calibri (outlier) | 61.06 | −9.03 |
   | Verdana (outlier) | 86.36 | +16.27 |

   5.92 falls inside the spread of ordinary sans faces.
3. The overflow checks cannot see a shortfall. `.header-left` is `min-width: 0`, so the row shrinks it, and the 📓 slides under the first control while `scrollWidth` stays the same. A one-off probe forced the sync button into the layout during one full `verify-shell.mjs` run (I removed it, and its run is not the one I cite). At 375 it showed header-left at 24.92 and the actions' left edge at 44.92, against the 📓's right edge at 46. The two overlap, and overflow reads 0.
4. 8px is the coarse `.header-top` gap, the space between the 📓 and Backup that a shortfall eats first. It also clears the 7.27 above.

If the owner reads 5.92 as a fit, ruling 2's deliverables apply as written, and the tripwire's margin is one constant (`FIT_MARGIN`).

## Files changed
- `c:\dev\planbook\tools\verify\sync-button.mjs`:
  - The `SLACK` readout now also returns `gap`, `left` and `logo`.
  - After the phone-width check there is a `MEASURE |` line, plus two checks: the measurement, and a tripwire that goes red when what would be left over reaches `FIT_MARGIN = 8`.
- `c:\dev\planbook\tools\README.md`: the call-site line moved from 1931 to 1933, using the sweep's own count, and there is a new WO-1.73 count paragraph.
- `c:\dev\planbook\TESTING.md`: new § WO-1.73 under Phase 1.
- `c:\dev\planbook\plans\work-orders\phase-1-shell-store-roster.md`: a "Measured 2026-10-10 — ruling 3" note, and boxes 1–4 ticked. The status is left as 🤖 CLAIMED for the orchestrator.

Nothing in `src/`, `index.html` or `sw.js` changed. `CACHE` is not bumped, because no `SHELL` file moved.

## Acceptance
- [x] **Slack printed and quoted.** The harness prints `MEASURE | WO-1.73 — top row at 390×844, coarse, opted in: slack 55.92px; the sync button and its gap want 50px; left over if it were laid out 5.92px, against a fit margin of 8px`. The check passes with `header-left 34px, the 📓 34px … opt-in "true"`. It is quoted in TESTING.md.
- [x] **Nothing changed, and the number shows why.** 5.92 is less than 8. The existing WO-7.5 checks are green:
  - At 390, all six states have 4 controls laid out, the About badge is drawn in all but the up-to-date state, and slack is 55.92.
  - At 834, the sync button is 44×44 and sits beside Backup, and About has no badge.
- [x] **Both tools pass.**
  - `node tools/verify-shell.mjs` exited 0: `1937 checks · 1937 passed · 0 failed · 0 skipped`, 61,761 lines, 967s. I read this from the log after the `EXIT=0` line was written.
  - `node tools/wo-sweep.mjs` exited 0: `50 checks · 47 passed · 0 failed · 3 to review`. The three to review are the standing three. I re-ran it after the last doc edit.
  - `wo-gate.mjs --audit` passes.
- [x] **TESTING.md § WO-1.73** carries the Acceptance lines verbatim, with evidence.
- [ ] 👤 **Not ticked.** It needs the iPad. What to expect is written in TESTING.md.

## Not done / not verified
- **The tripwire is not mutation-proved.** It is one `<` comparison of two numbers the run prints, and a planted run costs about 16 minutes. `grep` for MUTATION/PROBE in the changed harness file returns nothing.
- **The iPad's actual SF width for the year label is unmeasured.** No harness here can render SF.

## Found, out of scope, not touched: booking candidate
- **The shipped row already collides at 320.** This is today's row, with sync hidden. The probe at 320×844, coarse, measured header-left at 19.92 and the actions starting at 39.92, against the 📓's right edge at 46. The 📓 sits about 6px under Backup, and no overflow check sees it. 320 is iPad Slide Over and portrait one-third split view, which is exactly where the 👤 line will be read.
- **Stale comments left as they are.** Two comments state the premise in pre-WO-1.73 terms:
  - `src/shell.css`: the 640px block says "5.92px of slack … after WO-2.29's fourth control" (~2551), and the coarse block (~2081–2084) and `src/sync-button.js` (~52–62) still say "whether … is WO-1.73's measurement".

  Both are historically accurate and point here. The brief says no `SHELL` file should move under "nothing changed", so I left them. Updating them later would be a comment-only change; it could ride the `Shell-Cache: not needed — comments only` trailer, but `index.html` (~370–375) would need a real bump.

## Decision the work order didn't settle
- **The fit margin.** I chose 8px, with the reasons above.
- **Adding a tripwire check beyond "print the figure".** I added one so the ruling cannot quietly outlive a row that gains room. It goes red only on gained room, never on lost room.

## Draft CHANGELOG entry (for the teacher to decide)
> The sync button still stays off the header at phone width. With the sound switch gone, the top row at 390px has room for it with 5.92px to spare. That is the margin the five-button row always ran on, and it is less than the year label's width can shift between the harness's font and the iPad's. Below that margin, a shortfall does not scroll; it slides the 📓 under Backup. So About keeps the badge on phones, and the harness now prints the figure on every run and goes red if the row ever gains enough room to re-decide.
