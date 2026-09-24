# WO-1.52 — result (implementer, Claude Opus, 2026-09-24)

**Summary.** The check is `tools/wo-sweep.mjs` § 26, placed above § 22 like §§ 23–25. It adds two
results, so the recorded count moved from 43 to 45. The first result is mechanical and can FAIL: it
checks that the tracker could be read, that every named document exists, that the tag stripper still
strips, and that at least one claim was read. The second is prose and reports as a REVIEW: a
contradicted status claim in a live voice. Statuses come from `node tools/wo-gate.mjs --list` (that
is, from `parseFile()`) and from nowhere else. `wo-gate.mjs` is untouched, and so are `IGNORE_DIRS`
and `--audit`. The Acceptance boxes are **not ticked** — see "Decisions" below.

## Files changed

- `tools/wo-sweep.mjs`:
  - new § 26 and its banner;
  - a `--claims-in=<file>` flag, repeatable, which points § 26 at other files, plus its usage line;
  - four § 21 helpers (`lineAt`, `SENTENCE_END`, `within`, `clip`) hoisted out of § 21's block to
    module level so § 26 can reuse them. They were moved and not changed, and § 21's results read
    the same.
- `tools/README.md` line 10: the count went from 43 to 45, and the `wo-sweep.mjs` row gained a § 26
  clause. That clause includes the "cannot see itself" sentence.
- Not touched by me: `plans/work-orders/phase-1-shell-store-roster.md`. Its diff is the
  orchestrator's `--start` claim.

## Against the Acceptance list

**1. A contradicting status claim in `plans/*.html` is reported with the file, the line, the claim
and the tracker's value. Met.**
- Each finding reads like this: `<file>:<line> "<sentence>" claims WO-x is <status> (as "<token>"),
  and the tracker says <status>`.
- A document that names an id no tracker holds is reported as "no work-order file holds that id".
- Evidence is the reproduction under line 2.
- On today's tree the sweep is clean. All 16 claims read: 12 agree with the tracker, 2 are excused as
  a dated document, 1 as another clause and 1 as an excluded passage.

**2. The four statements at `06bfa06` are each reported, and the file at `a16b87c` is clean. Met.**

Commands:
```
git show 06bfa06:plans/wo-3-18-video-runbook.html > $SCRATCH/video-06bfa06.html
git show a16b87c:plans/wo-3-18-video-runbook.html > $SCRATCH/video-a16b87c.html
node tools/wo-sweep.mjs --claims-in=$SCRATCH/video-06bfa06.html   # EXIT=0 · 45 checks · 41 passed · 0 failed · 4 to review
node tools/wo-sweep.mjs --claims-in=$SCRATCH/video-a16b87c.html   # EXIT=0 · 45 checks · 42 passed · 0 failed · 3 to review
```

At `06bfa06` the REVIEW names exactly these four, against today's tracker:
- `:270` "drafted 2026-08-28 work order WO-3.18 🔒 GATED on WO-7.2 · S …" claims WO-3.18 is 🔒 GATED;
  the tracker says ⬜ NOT STARTED.
- `:304` "WO-7.2 · transfer ⬜ not started · L Nothing uploads …" claims WO-7.2 is ⬜ NOT STARTED;
  the tracker says ✅ DONE.
- `:322` "WO-7.2 — upload, download, … — is 🔒 GATED and unbuilt." claims 🔒 GATED; the tracker
  says ✅ DONE.
- `:513` "The three marked WO-7.2 are the ones that do not exist yet." claims unbuilt; the tracker
  says ✅ DONE.

At `a16b87c`: PASS, "7 status claim(s) read: 5 agree …, excused 1 by another clause, 1 by an
excluded passage". The working copy was never checked out; `git show` wrote to scratch only.

**3. The historical claim in "what this said until 2026-09-12" is not reported. Met, and the fixture
was shown able to fail.**
- In the repaired runbook that block is `<p class="was">`, and it is excused as "an excluded passage".
- With a MUTATION disabling both the excluded-passage and the dated-sentence excuses, it was reported:
  `plans/wo-3-18-video-runbook.html:335 "What this said until 2026-09-12 … WO-7.2 … is 🔒 GATED and
  unbuilt." claims WO-7.2 is 🔒 GATED … the tracker says ✅ DONE`.
- With only the passage excuse disabled, it was still excused, this time "by a dated sentence". That
  is defence in depth.
- Both mutations were reverted by Edit, not by `git checkout`, before anything else was written. A
  `grep -n MUTATION tools/wo-sweep.mjs` then returned nothing (exit 1).

**4. The files are reached by path; `IGNORE_DIRS` and `--audit`'s walk are unchanged. Met.**
- `IGNORE_DIRS`: `git show HEAD:tools/wo-sweep.mjs | grep -n "^const IGNORE_DIRS"` and the same grep
  on the tree give the identical line,
  `const IGNORE_DIRS = new Set(['.git', 'node_modules', 'certs', 'icons', '.claude']);` (it is at
  line 53 before and 57 after, moved by the four-line flag). `git diff tools/wo-sweep.mjs | grep -E
  '^[-+].*IGNORE_DIRS'` matches only one added comment line in the banner.
- `--audit`: `git diff --quiet -- tools/wo-gate.mjs` gives EXIT=0 (unchanged). Before and after
  `--audit` outputs are identical (diff EXIT=0), and both end in PASS.
- How the files are reached:
  - `fs.readdirSync(path.join(REPO,'plans'))`, top level only, keeping `.html`;
  - `tools/data-viewer.html` by name;
  - or the `--claims-in` paths.

**5. The tool is green, its recorded count matches, and the gate reports are byte-identical. Met,
with two notes.**
- `node tools/wo-sweep.mjs` gives EXIT=0 and `45 checks · 42 passed · 0 failed · 3 to review`. The 3
  REVIEWs are the pre-existing ones and match the baseline run. § 22 reports "45 results emitted this
  run, matching tools/README.md:10".
- **There are 183 work orders, not 169.** `wo-gate.mjs --list` gives 183 unique ids; 169 was the
  count on 2026-09-07. All 183 reports were captured before any tool edit, with
  `for id in $(ids); do node tools/wo-gate.mjs $id > before/$id.txt; echo EXIT=$? >> …; done`
  (172 EXIT=0 and 11 EXIT=1), then captured again after.
- **Byte-identical except the working-tree block.** Each gate report embeds `git status`, so a raw
  `diff -r` differs in exactly one way on all 183. `git N changed path(s)` goes from 3 to 5, and
  two lines are added: `M tools/README.md` and `M tools/wo-sweep.mjs`. `sort | uniq -c` of the diff
  lines shows exactly those four line shapes, 183 times each, and nothing else. With that block taken
  out (the grep is `-vE '^  git +[0-9]+ changed path|^ {8,}(M|\?\?|A|D) [^ ]'`), `diff -r` over all
  183 gives EXIT=0. No report differs in any other way. A report that embeds `git status` cannot be
  byte-identical across any edit to the tree.
- `node tools/verify-shell.mjs` gives EXIT=0 and `1475 checks · 1475 passed · 0 failed · 0 skipped`
  in 537s, read from the log after the process exited. It ran before one small later edit to
  `wo-sweep.mjs`, which moved the stripper sanity check ahead of entity decoding. `verify-shell.mjs`
  does not read `wo-sweep.mjs`, and I checked that by grep. The sweep was re-run after that edit and
  gave the numbers above.

## `grep -rn MUTATION tools/ plans/`

Exit 0, with every hit in pre-existing prose:
- `tools/README.md` lines 1368, 1409, 1448, 1449, 1907, 1951 and 2426;
- `tools/verify/keys-legend-guards.mjs` lines 71, 204, 251 and 256;
- `tools/verify/outreach.mjs:1572`;
- `tools/verify/score-grid.mjs:1674`;
- `tools/wo-gate.mjs:2502`;
- `plans/dispatch-retro.md` lines 218, 245, 260, 292 and 304;
- `plans/session-limits.md` lines 165, 166 and 211;
- the phase-1, phase-2, phase-5 and phase-7 files and `plans/work-orders/README.md:1878`.

None of these is in a file I changed. `git diff | grep -c MUTATION` gives 0.

## Decisions the work order did not settle

1. **The check lives in the sweep, as a REVIEW beside a FAIL-capable mechanical check.** That is
   § 21's split. `--audit` exits non-zero and is the tracker's own report; a stale sentence in a
   drawing is for a person to read. The banner says this at the line.
2. **The status source is `wo-gate.mjs --list`, run through `execFileSync`.** This departs from
   § 19's rule that "this file imports nothing from the other tools". I took it deliberately, because
   a second status parser in the sweep would be a second opinion on the reference half. `--list` is
   read-only. The reason is stated in the banner.
3. **Scope is the `.html` directly in `plans/` plus `tools/data-viewer.html` by name**, because the
   Why paragraph names it. `tools/inspector-mockup.html`, `tools/audio-probe.html`,
   `design/mockups/` and `.claude/dispatch/` are left out, with the reason given at the line.
4. **`plans/return-brief.html` is on a hand-maintained list of dated documents.** It is anchored on
   its own words, "kept because this is a dated brief". If that anchor is reworded out, the file is
   read as live and a note says so, following § 21's lost-region pattern. **This hides two
   contradicted claims**, and the owner may want to overrule it. Both can be reproduced with
   `cp plans/return-brief.html $SCRATCH/x.html; node tools/wo-sweep.mjs --claims-in=$SCRATCH/x.html`:
   - `plans/return-brief.html:275`: the WO-7.1 tile shows ⬜ NOT STARTED; the tracker says ✅ DONE.
   - `plans/return-brief.html:477`: "WO-7.2 and WO-7.3 stay 🔒 GATED." For WO-7.2 the tracker says
     ✅ DONE.

   I did not repair either one; that would widen the work order. If the owner reads the brief as
   live, the fix is to delete the `DATED_DOCUMENTS` entry. The sweep stays green either way, because
   the result becomes a REVIEW.
5. **What counts as live and what counts as historical.** A claim is a WO id followed in the same
   sentence by a status glyph, a status word in capitals, "not started", or unbuilt / not built /
   does not exist yet, and it must come before the next id. `p`, `li` and `h*` end a sentence;
   `div` and `span` do not, because key/value cells are sibling divs or spans. A claim is excused
   when it is in any of these:
   - an `<em>(…)</em>` note or a `class="was"` element;
   - a sentence with `until YYYY-MM-DD`, "what this said" or "this read";
   - a dated document;
   - a stretch between the id and the status that holds a denial, the past tense, a hypothetical, or
     a conjunction starting another clause.

   The last rule is what keeps the repaired runbook's "WO-3.18 reports PASS | gates clear and all
   five declared dependencies are ✅ DONE" quiet. The design deliberately under-reports.
6. **I did not tick the Acceptance boxes**, although the brief allows it. Ticking would change
   WO-1.52's own gate report and spoil the all-183 comparison. The evidence for each line is above,
   for the verifier.

## Could not verify or left undone

- Nothing here needs an iPad or human eyes. There are no 👤 or 📆 lines.
- Known limits, written in the banner:
  - § 26 cannot see its own prose, the README row, WO-1.52's text or `CLAUDE.md`.
  - It does not know status words such as "landed", "shipped" or "finished".
  - It misses a claim whose id is implied by the page but not written in the sentence. For example,
    `plans/wo-7-1-runbook.html:388` reads "Status ⬜ NOT STARTED" about WO-7.1 without naming it, and
    it is not read.
  - It misses a stale date where the status is still right.

## Proposed follow-ups (not done)

- The owner's ruling on `plans/return-brief.html`: keep it on the dated list, or read it as live and
  let the two claims above surface as a REVIEW.
- The implicit-subject claim in `plans/wo-7-1-runbook.html:388` ("Status ⬜ NOT STARTED", false
  today). A runbook-subject convention, such as a `data-wo` attribute on the band, would let § 26 read
  it. That is a separate work order.
- `CLAUDE.md` has no mention of § 26. That is left to the teacher, as the brief directs.

## Draft CHANGELOG line (the teacher decides)

> The sweep now reads the planning documents in `plans/` against the tracker and reports any status
> claim they make in a live voice that the tracker contradicts. It is the check that would have
> caught the video runbook calling WO-3.18 locked five days after the lock came off.

## Correction round 1 (implementer, Claude Opus, 2026-09-24)

The verifier failed Line 1 for two reasons, and both are fixed.
- **The card shape.** An id and its status sat in separate cells of one strip, with a description
  cell between them that held a full stop, so the sentence splitter ended the "sentence" before the
  status. As a result `plans/wo-3-18-runbook.html` read as zero claims.
- **The guard.** The "a claim was read" check was aggregate across documents, so that zero passed.

Everything is in `tools/wo-sweep.mjs` § 26 and `tools/README.md`. `wo-gate.mjs` is untouched,
neither walk is widened, and no planning document was edited.

### What changed

**1. A second reading: the card.** A new `cards()` builds a minimal element tree from the masked
HTML and reads a claim when both of these hold:
- one cell's text **opens** with a WO id;
- a **later cell of the same parent** opens with a status token.

The rules:
- **What counts as a cell:** `div`, `span`, `td`, `th`, `dt` or `dd`. It is never `p`, `li` or a
  heading, because siblings of those are running prose.
- **Where the search stops:** an id cell reached first ends it, which is the same "before the next
  id" bound the sentence reading uses.
- **Excuses that still apply:** excluded passages, a dated sentence (read over the whole card) and
  a dated document.
- **Excuses that do not apply:** the span excuses, meaning denial, past tense, hypothetical and
  another clause. They are not read across a card, because the words between the two cells are
  another cell's prose. "Nothing in the app touches the scope" is a denial about the app, and
  letting it excuse the strip would reproduce the miss.
- **No double reading:** an id that the sentence reading already took a claim for is skipped, so an
  id-then-status card with no full stop between is not read twice.

The shared judgement was factored into one `judge()` closure so the two readings report identically.
The finding quotes `<id> … <state cell>`, because quoting the whole card would clip the status off
the end.

**2. The guard now works per document.** Each document read must yield at least one claim, or the
mechanical check FAILs and names that document.
- `tools/data-viewer.html` yields none: its only WO mention is inside an HTML comment, which is
  masked.
- It is excused by a new `STATES_NO_STATUS` list, anchored on its own words ("A viewer for one year
  document"), following the `DATED_DOCUMENTS` pattern. If that anchor is reworded, the file is held
  to the rule again and goes red.
- The PASS detail says which document was excused this way.

**3. Prose.** The § 26 banner now describes the card reading and the per-document guard. The
`tools/README.md` row describes both too. The count is still 45: the section still pushes exactly
two results.

### What I ran (all output read after the process exited)

**The four proofs, on the final file.**

| Command | EXIT | Checks · passed · failed · review | § 26 result |
|---|---|---|---|
| `--claims-in=plans/wo-3-18-runbook.html` | 0 | 45 · 41 · 0 · 4 | REVIEW names `:412` and `:417` (below). The file was at zero claims before; now it reads 4. |
| `--claims-in=<scratch>/video-06bfa06.html` | 0 | 45 · 41 · 0 · 4 | **Exactly four findings**, at the same lines as before: `:270`, `:304`, `:322` and `:513`. The card reading added no duplicate. |
| `--claims-in=<scratch>/video-a16b87c.html` | 0 | 45 · 42 · 0 · 3 | PASS. "7 status claim(s) read: 5 agree …, excused 1 by another clause, 1 by an excluded passage". **Clean.** |
| `--claims-in=plans/wo-3-18-video-runbook.html` | 0 | — | Same PASS as `a16b87c`. |

The two findings in `plans/wo-3-18-runbook.html`:
- `:412 "WO-8.12 … 🔨 in progress · 3 of 7"` claims WO-8.12 is 🔨 IN PROGRESS; the tracker says
  ✅ DONE.
- `:417 "WO-7.1 … ⬜ not started · M"` claims WO-7.1 is ⬜ NOT STARTED; the tracker says ✅ DONE.

The two scratch files are `git show` output written to the session scratchpad. The working copy was
never checked out.

**Mutations.** Each was marked `MUTATION`, applied and reverted by an exact-string inverse edit.
None was reverted with `git checkout`. After all three, `cmp` against a pre-mutation copy of
`tools/wo-sweep.mjs` gave "RESTORED-IDENTICAL".
- **`<p class="was">` exclusion.** I disabled both the excluded-passage excuse and the
  dated-sentence excuse in the sentence reading, then ran `--claims-in=plans/wo-3-18-video-runbook.html`.
  The REVIEW named
  `:335 "What this said until 2026-09-12 … WO-7.2 … is 🔒 GATED and unbuilt." claims WO-7.2 is 🔒 GATED … the tracker says ✅ DONE`.
  Reverted, it is excused again, so **the exclusion still holds** and the fixture can fail.
- **Card reading switched off** (`of [] /* MUTATION */`). `--claims-in=plans/wo-3-18-runbook.html`
  gave EXIT=1: `FAIL | … not one status claim was read in plans/wo-3-18-runbook.html`. This is the
  verifier's exact defect, now caught **by name** by the per-document guard.
- **The `STATES_NO_STATUS` anchor broken.** `--claims-in=tools/data-viewer.html` gave EXIT=1, a
  FAIL naming `tools/data-viewer.html`.
- **Per-document guard with no mutation.** `--claims-in=plans/wo-3-18-runbook.html
  --claims-in=<scratch>/silent.html` gave EXIT=1: a FAIL naming `silent.html` alone, while the other
  document yielded claims. Under the old aggregate guard this passed.

**Default sweep.** `node tools/wo-sweep.mjs` gave SWEEP_EXIT=0 with `45 checks · 41 passed · 0
failed · 4 to review`.
- § 22 reports "45 results emitted this run, matching tools/README.md:10".
- § 26 mechanical: PASS. It read 5 documents and 24 claims, "at least one in each, except
  tools/data-viewer.html, which states none and says so".
- § 26 prose: **REVIEW, with four findings.**

**Other checks.**
- `node tools/wo-gate.mjs --audit` gave AUDIT_EXIT=0 and ends in PASS.
- `git diff --quiet -- tools/wo-gate.mjs` gave exit 0, so `wo-gate.mjs` is untouched.
- The `IGNORE_DIRS` line is identical at HEAD (line 53) and in the tree (line 57). The only diff
  line that mentions it is the banner comment.
- `grep -rn MUTATION tools/` returns only the pre-existing prose hits listed in the first report:
  - `tools/README.md` lines 1368, 1409, 1448, 1449, 1907, 1951 and 2426;
  - `tools/verify/keys-legend-guards.mjs` lines 71, 204, 251 and 256;
  - `tools/verify/outreach.mjs:1572`;
  - `tools/verify/score-grid.mjs:1674`;
  - `tools/wo-gate.mjs:2502`.

  `git diff | grep -c MUTATION` gives 0.

### The default sweep's new REVIEW: what I decided

I reported the stale strips rather than excusing them, because this is what the check exists to do.
- `plans/wo-3-18-runbook.html` does not call itself dated anywhere, so it does not qualify for
  `DATED_DOCUMENTS`.
- Its "Where it stands" strip is written in a live voice.
- A REVIEW does not turn the sweep red: the exit is 0 and the recorded count is unchanged.

The card reading also surfaced two identical strips in `plans/wo-7-1-runbook.html` that the first
round could not see:
- `:461` WO-7.1 ⬜ not started · M; the tracker says ✅ DONE.
- `:467` WO-8.12 🔨 in progress; the tracker says ✅ DONE.

The default REVIEW therefore carries four findings, in two files. **None of them was repaired**,
since that would widen the work order.

### Could not close, or did not re-run

- **The 183 gate reports were not re-captured this round.** The first round's before/after
  directories were in that session's scratchpad. This round changed neither `wo-gate.mjs` nor any
  tracker file, and the set of modified paths in `git status` is the same three as when the first
  round took its "after" run. So by construction the reports cannot differ, but I have no fresh
  byte-diff to quote.
- **`verify-shell.mjs` was not re-run.** This round touched no app file and no file the harness
  reads; the first round's EXIT=0 at 1475/1475 stands as the only run.
- **I ticked no boxes and ran no `--tick`**, as instructed.

### Decisions this round

- **The cell set is deliberately narrow:** `div`, `span`, `td`, `th`, `dt` and `dd`. `p` and `li`
  are excluded so that consecutive paragraphs are never read as a key and its value.
- **The span excuses are not applied across cells.** The reason is written in `cards()`'s comment.
- **`STATES_NO_STATUS` is a new hand list** with one entry, anchored the same way `DATED_DOCUMENTS`
  is.

### Proposed follow-ups (not done)

- **Repair or mark historical the four stale strips:**
  - `plans/wo-3-18-runbook.html:412` and `:417`;
  - `plans/wo-7-1-runbook.html:461` and `:467`.

  Either correct the state cells, or wrap each strip in a `class="was"` passage if the owner reads
  these runbooks as dated drawings. Each runbook could instead state that it is dated in its own
  words and go on `DATED_DOCUMENTS`. That is the owner's ruling to make, and it is outside WO-1.52.
- The two earlier follow-ups still stand: the `return-brief.html` ruling, and the implicit-subject
  claim at `wo-7-1-runbook.html:388`.
