# WO-8.13 — the About modal names two documents and not the licence · implementer's result

**Implementer** Claude (Opus), 2026-09-20. **Not committed** — the brief said not to.

## What landed

| File | Change |
|---|---|
| `C:\dev\planbook\index.html` | One `modal-section-label` (*Source and licence*) and one `.doc-link` row (*Released under the Apache License 2.0 →*, href `https://github.com/wildbil2me/planbook/blob/main/LICENSE.md`, `target="_blank" rel="noopener"`), placed after the FERPA row and before the `#drivePanel` comment block, with a comment above them in the grammar of the FERPA row's. The two rows beside it did not move. No copyright line, no version line, no licence summary. |
| `C:\dev\planbook\src\shell.css` | Exactly one CSS change: `.modal-body .doc-link + .modal-section-label` added as a second selector on the existing `.modal-body p + .modal-section-label { margin-top: 16px; }` rule, and that rule's comment extended to say why (second instance of the adjacency break the `.drive-panel` comment records). No other declaration, no new class, no margin on the row. |
| `C:\dev\planbook\sw.js` | `CACHE` `planbook-shell-v125` → `planbook-shell-v126`. |
| `C:\dev\planbook\tools\verify\build-line.mjs` | Five `check()` calls inside the existing first `openAboutAndRead()` of § *which build this device is running (WO-8.10)*, before that open's `closeAbout()`. No new section, no second open. Reads every `.doc-link` in `#aboutModal`. |
| `C:\dev\planbook\TESTING.md` | New `### WO-8.13` entry under Phase 8 (before *Known limitations*), all seven Acceptance lines with evidence, the 👤 line written and left blank. |
| `C:\dev\planbook\tools\README.md` | Call-site sentence `1432` → `1437`; a `**WO-8.13 moved it from 1432 to 1437…**` paragraph after WO-5.15's, in that convention. |
| `C:\dev\planbook\plans\work-orders\phase-8-packaging.md` | Acceptance lines 1, 2, 3, 4 and 6 ticked. Lines 5 and 7 left blank (see below). Status line untouched (still `🤖 CLAIMED — 2026-09-20`, as the orchestrator left it). |

`git status --short` names exactly those seven files plus the two untracked dispatch files. `privacy.html`, `docs/FERPA.md`, `LICENSE.md`, `CHANGELOG.md` and `plans/work-orders/README.md` did not move. All seven files are `w/lf` per `git ls-files --eol`; diffstat is 237 insertions / 10 deletions, no wholesale rewrite.

## The harness, both runs, figures read from the log after `EXIT=` printed

- **Green, delivered tree:** `1446 checks · 1446 passed · 0 failed · 0 skipped` · 45,579 lines · 31.5 lines per check · 509s · `EXIT=0`. The five new lines print PASS at log lines 1050–1054.
- **Red, licence row deleted** (label left in place, deletion marked with a `MUTATION` comment): `1446 checks · 1441 passed · 5 failed · 0 skipped` · 510s · `EXIT=1`. All five new checks red and nothing else; evidence lines read `hrefs = ["./privacy.html",".../docs/FERPA.md"]`, two `{target,rel}` objects instead of three, `text = null`, `label = null`, `computed margin-top = null`.
- The row was restored by hand immediately after the red run, before a word of TESTING.md or this file was written. `grep -rn MUTATION` over the seven changed files finds only prose about the discipline (TESTING.md and tools/README.md entries, mine and earlier ones) — no live plant.
- I predicted four of five would go red and five did; the harness comment was corrected to say five and why (the fifth finds the label through the row). The comment now describes the run, not the guess.

**Sweep:** `node tools/wo-sweep.mjs` → `42 checks · 39 passed · 0 failed · 3 to review`. The three reviews are the same three the untouched tree printed before I edited anything (sensitive-field mentions, due-date/late on one line, mockup banners). § 9 reports the `v126` bump as uncommitted beside the `index.html` edit, which is the rule being followed. Call-site count 1437 matches `tools/README.md:1213`.

## Acceptance, line by line

1. **Names the licence, links `LICENSE.md`, text says which** — ✅ ticked. Harness reads the href and text `Released under the Apache License 2.0 →`. `curl` on the href answered `200 text/html` on 2026-09-20.
2. **Not inside Privacy and student data** — ✅ ticked. Harness walks back from the licence row to the nearest `.modal-section-label` and reads *Source and licence*, and asserts that label precedes `#drivePanel` in document order.
3. **No new CSS for the row; one selector on the adjacency rule for the label** — ✅ ticked. `git diff src/shell.css` is one comment extended and one selector added; nothing else. Harness reads the label's computed `margin-top` as `16px` with its previous sibling an `<a>.doc-link`. **One thing to know:** the line's parenthetical says `touch-targets.mjs` *measures the row*. It does not — its modal sweep selects `button, input`, and no file under `tools/verify/` names `.doc-link`, so none of the three rows' 44px has ever been measured. The row is the same class as the two that wear the coarse entry, so it gets it, but that is reasoning from the sheet. Named in TESTING.md as a gap that predates this row; not closed here because widening that sweep is not this work order's.
4. **`target="_blank" rel="noopener"`** — ✅ ticked. Asserted on all three rows at once.
5. **`CACHE` bumped in the same commit** — **left blank on purpose.** The bump is on disk beside the `index.html` edit and the sweep sees both; but the line says *same commit*, I did not commit, and a tick on a commit that does not exist yet is a prediction. Closes at the landing on `git show --stat` naming both files. TESTING.md's box for it is blank too and says the same.
6. **Harness green, check goes red on deletion, proved by deleting once** — ✅ ticked. Figures above.
7. **👤 force-quit and relaunched install** — **not ticked; needs the iPad.** The TESTING.md line spells out the reading: serve from `tools/serve-https.mjs`, force-quit from the app switcher first (WO-8.11's own finding that iOS resumes without loading a document), relaunch, About shows *Source and licence* above a build line naming `v126`, tap opens GitHub in Safari, switching back finds Planbook where it was with About open.

## What I could not verify

- Line 7 (real device) and line 5 (a commit I did not make).
- The row's 44px under a coarse pointer, for the reason in line 3 — no tool measures any `.doc-link`.
- The counter-mutation (delete the label, keep the row) was not run; the work order asked for the row's deletion once. Reasoned shape: checks 4 and 5 red, 1–3 green.

## Decisions the work order left open, and which way I went

- **Label text:** *Source and licence* — the work order's own suggestion; reads aloud cleanly and matches the British spelling the suite's prose uses. The link text uses the licence's proper name with the American spelling, as `privacy.html` and `docs/FERPA.md` do.
- **Link text:** *Released under the Apache License 2.0 →* — the sentence both public documents already use (*"It is released under the Apache License 2.0"*), lifted rather than re-derived. Names the licence, describes what the link opens, says nothing about terms.
- **No `<p>` under the label.** The privacy section has a sentence between its label and its rows; this section has one row and no prose, because any sentence about who the row is for slides into what the licence allows, which the Traps forbid. Label + row only.
- **The harness check's extra clauses.** The brief asked for count, hrefs, target, rel and text. I added two readings tied to Acceptance lines 2 and 3 (label identity and position; label follows an `<a>` and measures 16px) so the CSS ruling has a number behind it rather than a diff review. Five call sites, not three.

## Out-of-scope temptations declined, for the record

- The `#drivePanel` comment in `index.html` says *"Same argument as the two links above it"*; there are now three links above it and the licence row does not share that argument (it is not a footnote to "no account and no server"). Left as is — it is not one of the two rows, but it is not this work order's prose either. One clause, whenever that comment is next open.
- `verify/touch-targets.mjs` could take `a.doc-link` beside `button, input` in its modal sweep and measure all three rows in one line. Not done; proposed follow-up.
- `plans/work-orders/README.md` row 42 still reads 🎒 / ⬜ in its Suggested column. Left for `--tick`/the orchestrator.

## Draft CHANGELOG.md entry (the teacher's to keep or cut)

> **About names the licence.** A third row in About, under its own heading *Source and licence*: *Released under the Apache License 2.0 →*, opening `LICENSE.md` on GitHub in the browser and leaving Planbook where it was. It is filed apart from the two privacy rows on purpose — a licence under a heading about student records reads as a privacy term — and it says the licence's name and nothing else about it. The harness now reads all three About links at once, which the two older rows never had; `CACHE` v126.
