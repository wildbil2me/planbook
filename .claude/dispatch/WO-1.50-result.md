# WO-1.50 result: a document you can read is not a document anything checks

**Implementer:** Claude (Opus), 2026-10-04. Nothing is committed. The index is back at HEAD, so every
change is unstaged in the working tree.

## Running log (kept during the run, with one entry corrected)

- Read the brief, known-bugs § 2, data-viewer.html, inspector-mockup.html, the relevant lines of
  src/attendance.js (codeOf :499, recordFor :1194, marksOf :1199, countsFor :1346, readingOf :1370,
  rosterOf :3127), wo-sweep §§ 22, 26, 27, 28, and the tools/README.md rows.
- Decided on ONE PAGE. Three checks.
- Wrote the panel. Then ran the scratch CDP drive: `23 pass · 0 fail`, EXIT=0.
- 20:04:06Z: MUTATION IN. The key-name replacer was put back into `select()`, with a clean copy
  staged in the index.
- 20:04:19Z: MUTATION OUT, reverted from the index.
  - *Correction:* the log first said "grep -rn MUTATION tools/ empty". That was wrong. The grep is
    empty over the three tools files I changed. Across all of `tools/` it hits pre-existing prose,
    detailed under Acceptance 6.
- 20:07:08Z: sweep 48·44·1 fail (the § 9 failure was already there at HEAD). Audit EXIT 0.
  verify-shell then ran to exit: 1760/1760.

## Files changed

- `tools/data-viewer.html`:
  - New Checks panel: three checks, `shown()` routed through `masked()`, and a Markdown report.
  - Header comment rewritten. This covers the masking paragraph, the one-page decision and the
    deployed-origin decision.
  - `.btn.small` now gets 44px in the `pointer: coarse` block.
- `tools/wo-sweep.mjs`: new § 29, placed above § 22.
- `tools/README.md`:
  - The count moved from 47 to 48.
  - The `wo-sweep.mjs` row gained a § 29 sentence.
  - The `data-viewer.html` row was updated.
  - The `inspector-mockup.html` row was replaced by a `data-viewer.html › Checks` row.
- `tools/inspector-mockup.html`: a five-line note at the top saying what was built and where. The
  rest of the drawing is untouched.
- `plans/known-bugs.md` § 2: one italic parenthetical saying the Checks panel now makes the
  comparison. No diagnosis was added.
- `plans/work-orders/phase-1-shell-store-roster.md`: Acceptance boxes 1–8 ticked. Box 9 is open.
- `TESTING.md`: new § WO-1.50 recording the drive and the mutation.

## Acceptance, line by line

1. **[x] One loader, one predicate, one id map.**
   - It is one page. The checks run from the same `load()` (which now ends in `drawChecks()`), print
     values through `shown()`, which asks the existing `masked()`, and annotate ids from the existing
     `names`.
   - No second id map was built. Class lookup is a linear `classIndex()`. `studentSet()` is a local
     membership set inside a check, not an id-to-name map.
   - The choice and the reasons are written in the header comment ("THE CHECKS … ONE PAGE rather than
     a second page or a shared module"):
     - Chromium refuses a module over `file://`.
     - A `<script src>` would put the predicate in a file § 29 would have to follow.
     - A second page means a second loader and a second id map.
2. **[x] Both required checks find § 2's shape, against a document that carries it and one that
   doesn't.**
   - Driven by a scratch CDP script, which is not committed (per the brief).
   - *carries*: the off-roster card is a hit on `attendance[0].marks.s_x`. The both-ways card is a
     hit reading `1 U` against `none`.
   - *clean* (the same document with that key deleted): both cards read "nothing found" and draw no
     copy buttons.
   - The duplicate check was driven too: a *dup* fixture names `attendance[1], attendance[3]`.
   - Final run: `23 pass · 0 fail`, EXIT=0.
3. **[x] Every check names its source line, and the re-deriving one says so on the panel.**
   - Each card prints a "Mirrors …" line naming the `src/attendance.js` function, with a line number
     as of 2026-10-04.
   - The both-ways card carries an amber paragraph beginning "**This check re-derives the app's
     arithmetic.**" The drive asserted that text in the card's `innerText`.
   - The panel head says "These are readings, not verdicts", which carries the Trap on severity.
4. **[x] No write path.**
   - There is no `.put(`, no `readwrite`, no repair button and no repair snippet.
   - One thing to flag: the **pre-existing** `indexedDB.deleteDatabase('planbook')` in `openLocal()`
     is still there. It runs only when the page's own `open()` has just created an empty shell, and
     the header argues it. I did not count it as a write path, but the verifier should judge that.
   - "A repair is a snippet the reader copies": I offer **no** snippet, and the reason is written above
     `drawChecks()`. known-bugs § 2's suspect has not been tested, and a repair for an untested suspect
     is a diagnosis written in code.
5. **[x] No masked value reaches a finding body, a path list, or the copied report (all four
   surfaces).** Masking was on, the default. The fixture had `supports.medical:
   'ZEBRA-MEDICAL-7731'`, a guardian name and email, and a student phone. Checked:
   - the panel's `innerText` and `innerHTML`;
   - both "Copy the paths" outputs;
   - both "Copy as a known-bugs row" outputs;
   - the whole page, with `students[3].supports` selected.

   No secret appeared in any of them. Positive control: with masking off, the side pane shows the
   medical string.

   **Caveat:** "clipboard text" means the argument the page passed to
   `navigator.clipboard.writeText`, captured by a wrapper. Headless Edge's real clipboard read back
   `''`, so the OS clipboard was not read. The `execCommand` fallback was not driven; it copies the
   same `text` string.

   This line is also partly vacuous by construction: no check reads `supports` at all. What it proves
   is end-to-end absence, not that a filter works.
6. **[x] § 29 exists, one result, and was proved against the 2026-09-06 defect put back on purpose.**
   - Clauses:
     - exactly one `masked()` definition;
     - no `'supports'`/`'guardians'` literal, and no `.supports`/`.guardians` member read, outside
       its body;
     - no `JSON.stringify` with a second argument other than `null`;
     - no `<script src=`.
     - It is also loud if `masked()` stops naming both subtrees.
   - The mutation gave `select()` a key-name replacer, marked `MUTATION`. § 29 went FAIL on two
     clauses, both at `tools/data-viewer.html:574`. The drive also went red on the whole-page probe,
     where the student's phone leaked.
   - Reverted with `git checkout --` from the staged index. `grep -n MUTATION tools/data-viewer.html
     tools/wo-sweep.mjs tools/inspector-mockup.html` reads nothing (exit 1).
     `grep -rn MUTATION tools/` is **not** literally empty: it hits pre-existing prose in
     `tools/README.md`, `tools/verify/*.mjs` and `tools/wo-gate.mjs`, none of which I touched.
   - README count is 48. The run emitted `48 checks`, and § 22 passes.
   - I made § 29 slightly stricter than the line asks: it also fences member reads and external
     scripts. The banner says why.
7. **[x] The header paragraph "NOTHING IN THIS REPOSITORY CHECKS THAT MASKING" is gone.** It is
   replaced by "WHAT CHECKS THAT MASKING: tools/wo-sweep.mjs § 29", which also states the check's
   limit. § 26's anchor ("A viewer for one year document") is kept, and § 26 is green.
8. **[x] The report is Markdown shaped for a known-bugs row.** It has:
   - `## N. <symptom>`;
   - **Found by** (source, `rev`, `schemaVersion`, date);
   - **The reproduction** (what was compared, with no mechanism);
   - a path table and **Counts**;
   - a "Not a diagnosis" line.

   It carries student **ids, never names**, because it is the text that ends up in a committed file.
   The drive asserted the shape and that no name was present.
9. **[ ] Left open, because the sweep is not green.**
   - `node tools/wo-sweep.mjs`: `48 checks · 44 passed · 1 failed · 3 to review`. The one FAIL is § 9
     ("src/assignments.js, src/detail.js, src/shell.js changed since planbook-shell-v164 was set at
     061c53b").
   - That failure **is already there at HEAD**. A worktree of `6e13bd2` gave `47 checks · 43 passed ·
     1 failed`, the same FAIL. The 6e13bd2 commit message says main stays red on § 9 until the next
     CACHE bump.
   - This work order touches nothing in `SHELL`. I did not bump `CACHE`, because that is a shell
     change outside scope.
   - The 3 REVIEWs are the same three as at HEAD.
   - `node tools/wo-gate.mjs --audit`: EXIT 0, PASS.
   - The README row was replaced as asked.
   - The box needs a CACHE bump from someone, then a re-run.

## Other commands

- `node tools/verify-shell.mjs`: `1760 checks · 1760 passed · 0 failed · 0 skipped`, 765s, exit 0. I
  read this after it exited.

## Decisions the work order left open

- **One page, not a module.** The reasons are at the line (see Acceptance 1).
- **Three checks, not two.** The duplicate-record check has a report behind it: known-bugs § 2 names
  it as "the second candidate to read." It is a comparison between records, so it cannot drift.
- **Deployed origin: reachable.** Recorded in the page header and in the README row:
  - It is the viewer's page, which is already public and holds no data.
  - It fetches nothing.
  - Reading the iPad without a file round-trip is the reason to have it.
  - It adds no risk the tree's masking default doesn't already cover.
  - Nothing in the app links to it.
- **The checks panel opens and runs on every load, unasked.** This follows "the viewer answers a
  question; this row asks one."
- **The copied report uses student ids, never names.** Names still show on screen, as the tree
  already shows them.
- **No repair snippet** (see Acceptance 4).
- **The mockup was kept, not deleted.** It still draws the unbuilt Compare panel (WO-7.2's) and now
  says at its top what was built.

## Not verified

- Human-eye reading of the panel layout.
- Any iPad reading. No 👤 line exists in this work order.

## Out-of-scope temptations I declined

- The mockup's other 35 checks.
- The Compare panel.
- A repair snippet.
- Bumping `CACHE` to turn § 9 green.
- A committed runner for the drive.

## Draft CHANGELOG entry (the teacher decides)

> The data viewer now checks what it shows. A Checks panel runs on every load and asks three
> questions with a real report behind them: is there an attendance mark for a student who isn't on
> that class's roster, does a day's header count agree with its grid, and is there a second record for
> one class and date. It offers readings rather than verdicts, says on the card when it is re-deriving
> the app's arithmetic, keeps masked fields masked, and copies a finding out as a known-bugs row with
> ids and no diagnosis. `wo-sweep.mjs` § 29 now fences the viewer's masking to one predicate.
