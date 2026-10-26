# WO-1.88: result (implementer)

**Status of the row:** still 🤖 CLAIMED. I ran no `--start`, `--handoff` or `--tick`. All five
Acceptance boxes are ticked in the phase file and in `TESTING.md` § WO-1.88, and each tick cites
evidence I read. There are no 👤 or 📆 lines. Nothing is committed. `src/` is clean.

## What changed

- `tools/verify/log-entries.mjs` (F1, over `src/log.js`). Three regexes changed:
  - **Index regex.** It now takes F1's WO-1.86 compound group, so `d.log[0] += 1` is caught.
  - **Both dotted regexes** match `\.\s*log`, so `d . log = []` and `d . log[0] = x` are caught.
  - **Quoted-key regex.** It takes one optional subscript, so `d['log'][0] = x` (B2) is caught.

  The title, the detail's fence line and the comment are updated to match. No token changed and no
  `check(` was added.
- `tools/verify/term-record.mjs` (F3, over `src/term-record.js`):
  - **`delete`.** The `'delete '` token is replaced by F1's any-form regex
    `/(?:^|[^\w$.])delete\b[^;\n]*/`, so `delete` followed by a tab, and `delete(…)`, are caught.
  - **Quoted-key regex.** It takes one optional subscript, so B2 is caught.
  - **Text.** The title and comment are updated. The comment's false sentence ("a `delete` in any
    key form was already refused") is replaced, and "four regexes" became "five".
- `TESTING.md`: new § WO-1.88 under Phase 1, after § WO-1.86.
- `CHANGELOG.md`: a new entry at the top of `[Unreleased]`.
- `plans/work-orders/phase-1-shell-store-roster.md`: the five Acceptance boxes ticked. The 🤖 CLAIMED
  status line was already in the working tree when I arrived; it was not my edit.

Staged: the two harness files and most of `TESTING.md`. Unstaged: `CHANGELOG.md`, the phase file,
and the tail of `TESTING.md`.

## Against the Acceptance list

1. **The per-file argument came before any pattern change.** `TESTING.md` § WO-1.88 § 1 was written
   and `legit188.mjs` run before either harness file was edited. Only my word records that order.
   The search's output can be re-run against the clean `src/` today. Result: neither file holds
   legitimate code any widened pattern matches. The only matches are the create-on-first-write
   guards, which both checks lift out by exact spelling first. `src/term-record.js` holds no
   `delete`, not even the letters. Neither file has a quoted key in any form.
2. **Plants: one spelling per check per run.** WO-1.86's one-block-per-file approach was called
   contestable, so I did not repeat it. Four full `verify-shell.mjs` runs:

   | Run | F1 spelling | F3 spelling |
   |---|---|---|
   | 1 | `d.log[0] += 1` | `delete`⇥`d.termRecords` |
   | 2 | `d . log = []` | `delete(d.termRecords)` |
   | 3 | `d['log'][0] = null` | `d . termRecords = []` |
   | 4 | `d . log[0] = null` | `d['termRecords'][0] = null` |

   - Each run printed *2117 · 2115 · 2 failed*, `EXIT=1`.
   - The two failures each time were exactly these two checks, and each detail line named its one
     planted spelling. They are quoted verbatim in § 3.
   - `d . termRecords = []` was **already refused at HEAD**: F3's dotted regex has no dot in it.
     So it closes nothing in F3, and only F1 changed for that spelling.
   - Plants were dead code (`if (entry === null) { … }`), written by a scratch script after
     staging, and reverted with `git checkout --` between runs.
   - B3 and the whitespace family (below) are named as passing in both fence lines.
3. **No title or detail claims a spelling its patterns let pass.** `probe188.mjs` slices each
   check's code out of the harness at HEAD and in the working tree, without retyping it, and runs
   37 spellings, each alone, over the clean guarded files. Results:
   - Every named spelling passes at HEAD and is refused now, except `d . termRecords = []`, which
     is refused at both.
   - Reads (`==`, `===`, `!=`, `<=`, `>=`) stay green.
   - Each example a fence line names as passing does pass.

   Limit: this is a reading of two titles against 37 spellings, not a proof over all spellings.
4. **Both tools pass.**
   - `node tools/verify-shell.mjs` on the final bytes: *2117 checks · 2117 passed · 0 failed ·
     0 skipped*, 1151s, `EXIT=0`.
   - `node tools/wo-sweep.mjs`: `EXIT=0`, *52 · 49 · 0 · 3 to review* (the three standing reviews).
     I re-ran it after ticking the phase file, with the same result.
   - **One aborted run, disclosed.** An earlier clean run stalled at log line 180 for more than ten
     minutes with no headless Edge process alive. I killed it by hand. It is not counted, and
     `TESTING.md` says so.
5. **`TESTING.md` § WO-1.88** has the five Acceptance lines verbatim, with evidence for each. It
   also includes the source of all three scratch scripts.

**End-of-run checks:**
- `git status --short src/` is empty.
- `grep -rn "MUTATION WO-1.88" src/ tools/` is empty (exit 1).
- The bare `grep -rn MUTATION src/ tools/` is **not** empty. It finds 18 lines, the same 18 that
  `git grep -n MUTATION HEAD -- src tools` finds. They are prose that was already in the tree
  (`src/shell.js:1077`, `tools/README.md` and harness comments), as § WO-1.86 recorded. None is a
  plant, and this grep cannot come back empty on this tree.

## Decisions the work order did not settle

- **`||=` and `??=` on an index (F1).** I reused WO-1.86's group, which leaves them out, as the work
  order says. My ruling: they only fill a falsy or nullish slot, and every stored entry is an
  object, so that is an add and outside F1's append-only claim. The comment and the printed
  detail now say so. F3's full group refuses them, which matches its "only pushes" claim.
- **The dot before `log` was widened in the index regex too** (`d . log[0] = x`), not only in the
  reassignment regex. It is the same token, and the title claims "assignment into .log[...]".
- **A family nobody had listed: whitespace or a comment at any other dot, or before a call's `(`.**
  Examples: `d.log.splice (0, 1)`, `d.log . length = 0`, and a third `push (` that the push count
  cannot see. The same holds in F3. This passes both checks, and both titles name those tokens.
  I **named it** in both fence lines rather than closing it. The fix would be one normalisation of
  the searched text, and that touches every token, the push and update counts, and F3's guard and
  writer anchors. That is a work order with its own per-token argument and plants, not a growth of
  this one. **Proposed follow-up:** book it, M or S, against both files (and perhaps F2 and F4–F7
  with WO-1.87).
- **CHANGELOG.** My standing implementer instruction says to leave this entry to the teacher. The
  brief and the work order's Deliverables both say to write it (§ 2: "write it, in the voice of the
  WO-1.86 entry"), and WO-1.86's verdict said its own entry was owed. I followed the brief and
  wrote it. Edit or drop it as you see fit.

## Not done / out of scope, declined

- B3 and the alias family (WO-1.87's).
- F2 and F4–F7.
- No shared regex module under `tools/`.
- No `CACHE` bump: nothing in `src/` changed.

## Scratch (not committed)

All in
`C:\Users\WildB\AppData\Local\Temp\claude\c--dev-planbook\b4742677-ca96-4b75-92fe-b0ffbd264eca\scratchpad\`:
- `legit188.mjs`, `plant188.mjs` and `probe188.mjs`, the three scripts. Their source is also in
  § WO-1.88.
- `run1.log` to `run4.log`: the plant runs.
- `run5.log`: the aborted run.
- `run6.log`: the green run.
- `sweep.log`.

## Correction round 1 (2026-10-25)

**The verdict.** FAIL on Acceptance line 3: *"No check's printed title or detail claims a spelling
that its patterns let pass."* Both titles claimed these spellings were refused, but the patterns let
them through:
- a parenthesised target: `(d.log) = []`, `(d.log)[0] = x`, `(d.termRecords) = []`,
  `(d.termRecords)[0] = x`
- a subscript containing a bracket: `d.log[a[0]] = x`, `d['log'][a[0]] = x`,
  `d.termRecords[a[0]] = x`

**Decision: widen, and name what is left.** The reasoning is in `TESTING.md` § WO-1.88 › Correction
round 1 › CR.1.
- A parenthesised target is a plain assignment. Naming it as passing would put a plain reassignment
  in the fence line of a title that claims plain reassignments.
- Two changes in every assignment regex in both checks: `[\s)]*` replaces `\s*` after the name, the
  quoted key's `]` and the subscript, and the subscript becomes `\[(?:[^\[\]]|\[[^\[\]]*\])*\]`, which
  allows one level of nesting.
- Operator groups and the `=[^=]` endings are unchanged.
- **Named as still passing**, in both fence lines and both comments: a subscript nested more than one
  bracket deep (`d.log[a[b[0]]] = x`). A regex cannot count brackets to any depth.
- **False red, accepted and documented** in F3's comment and in TESTING.md: an arrow parameter named
  `termRecords`, as in `(termRecords) =>`, now matches. The file has none, and a false red fails safe.

**Order and per-file argument.** `legit188b.mjs` was written and run on the clean tree before
either harness file was edited in this round. Its output is in § CR.2. The only matches are the
create-on-first-write guards, which both checks lift out by exact spelling first. As in round 1,
nothing in the tree records that order. It rests on my word.

**Plants.** These were one spelling per check per run, the same as round 1. There were five full
`node tools/verify-shell.mjs` runs from one loop (`runall.sh`), and each was reverted with
`git checkout -- src/log.js src/term-record.js` right after its harness exited.

| Run | F1 | F3 |
|---|---|---|
| 1 | `(d.log) = [];` | `(d.termRecords) = [];` |
| 2 | `(d.log)[0] = null;` | `(d.termRecords)[0] = null;` |
| 3 | `d.log[a[0]] = null;` | `d.termRecords[a[0]] = null;` |
| 4 | `d['log'][a[0]] = null;` | `d['termRecords'][a[0]] = null;` |
| 5 | `(d['log']) = [];` | `(d['termRecords'])[0] = null;` |

- Every run printed `2117 checks · 2115 passed · 2 failed · 0 skipped` and `EXIT=1`.
- The two FAILs were these two checks every time.
- Each detail named its one planted spelling. All ten are quoted in § CR.4.
- After each revert, `git status --short src/` printed nothing.

**Probe.** `probe188b.mjs` slices the check code from round 1 (the index, staged at the time) and
from the working tree. It runs 35 spellings, each alone. Results, in § CR.5:
- All seven spellings from the verifier pass at round 1 and are refused now.
- Reads stay green.
- The nested-deeper spelling and the whitespace family still pass, as both fence lines name.
- The false red is shown.

**Text changes:**
- F1's title adds "with or without parentheses around the target, and with a subscript that may
  itself hold one bracketed subscript", and "the same parentheses and subscripts allowed" for the
  quoted key.
- F1's detail fence line names the nested-deeper case.
- F3's title adds the same words, and its fence parenthesis names the nested-deeper case.
- No `check(` was added.

**Final tree:**
- `node tools/verify-shell.mjs`: `2117 checks · 2117 passed · 0 failed · 0 skipped`,
  `67,747 lines · 32.0 lines per check · 1164s`, `EXIT=0`.
  - F1 detail: `removers found: none`.
  - F3 detail: `"found":[]`.
- `node tools/wo-sweep.mjs`: `EXIT=0`, `52 checks · 49 passed · 0 failed · 3 to review`, which are
  the three standing reviews. I ran it once before the doc edits and once after; the result was the
  same.
- `tools/README.md` records 2106 `check()` call sites. That is unchanged, because no site was added.
- `git diff HEAD -- src/` is empty.
- `grep -rn MUTATION src/` shows only `src/shell.js:1077`, the standing prose.

**Acceptance line 3** stays ticked in the phase file and in `TESTING.md`. Its evidence is now
§ CR.4 and § CR.5. I added a pointer in italics under the round-1 evidence and did not rewrite that
evidence. Lines 1, 2, 4 and 5 are re-read in § CR.7. No `--tick`, `--start` or `--handoff` was run,
and nothing was committed.

**Files changed this round:**
- `tools/verify/log-entries.mjs`: its three assignment regexes, plus comments, title and detail.
  Staged.
- `tools/verify/term-record.mjs`: its two assignment regexes, plus comment and title. Staged.
- `TESTING.md`: a new "Correction round 1" subsection under § WO-1.88 (CR.1–CR.7 and the scratch
  sources), plus the one pointer line. Unstaged.
- `CHANGELOG.md`: the WO-1.88 entry gains a bullet for this round, and its last bullet now counts
  both rounds' runs. Unstaged.
- The phase file is unchanged this round.

**Declined.** The whitespace and comment family at other dots, B3 and aliases, and F2 and F4–F7 stay
out of scope, as in round 1.

**Scratch, not committed**, all in
`C:\Users\WildB\AppData\Local\Temp\claude\c--dev-planbook\74c2288a-5683-4d2f-8f0d-c1e45ff7f051\scratchpad\`:
- scripts: `legit188b.mjs`, `plant188b.mjs`, `probe188b.mjs`, `runall.sh`, `edit.mjs`
- output: `progress.txt`, `cr1.log` to `cr5.log`, `probe.log`, `final.log`, `sweep.log`

## Correction round 2 (2026-10-26) — wording only, owner's option 3

**Scope followed:** no pattern added, no regex changed, no plant, `src/` untouched
(`git status --short src/` empty). Acceptance line 3 is **not ticked** anywhere. Nothing committed.

### Files changed (unstaged, on top of round 1's staged baseline)

- `tools/verify/log-entries.mjs` — comments and the F1 title/detail strings only.
- `tools/verify/term-record.mjs` — comments and the F3 title string only.
- `CHANGELOG.md` — the round-1 bullet's false sentence rewritten; one option-3 bullet added.
- `TESTING.md` — § WO-1.88: italic supersession notes under the Acceptance line-3 entry and under
  § CR.7's line 3 (history kept), and a new `#### Correction round 2` subsection (CR2.1–CR2.5).

### Reworded lines, quoted

F1 title, changed clauses: *"splice, pop, shift, fill and copyWithin each written .name( with
nothing between the name and its (, … with close parentheses allowed after log and after a
subscript, … assignment to .length with nothing but whitespace between length and the operator,
.length decremented with nothing but spaces or tabs between length and the --, a quoted log key
written directly inside its brackets or one subscript under it assigned plainly or compoundly, the
same close parentheses and subscripts allowed"* (was: "with or without parentheses around the
target", "assignment to .length, .length decremented", "a quoted log key or one subscript under
it", "the same parentheses and subscripts allowed").

F1 detail, fence line additions: *"an update expression on the array or an entry (d.log++,
d.log[0]++, and -- likewise), and anything between the parts of a spelling that its pattern does
not allow there all pass it: a parenthesis other than a close one after log, the quoted key or a
subscript ((d.log.length) = 0, (d.log.length)--, (d.log.splice)(0, 1), d[("log")] = []), a //
comment at a line end (d.log // c, then = [] on the next line), and whitespace at another dot or
before a call's ( or a ?. there (d.log.splice (0, 1), d.log . length = 0, a third push spelled
push (…))"*.

F3 title: the same narrowing (*"fill and copyWithin each written .name( with nothing between the
name and its (", "with close parentheses allowed after termRecords and after a subscript", "a
quoted termRecords key written directly inside its brackets", "an assignment to .length with
nothing but whitespace between length and the operator or an update of .length with nothing but
spaces or tabs between length and the ++ or --"*), and its fence parenthesis gains *"an update
expression on the array or a record (d.termRecords++, d.termRecords[0]++, and -- likewise), and
anything between the parts of a spelling that its pattern does not allow there — a parenthesis
other than a close one after termRecords, the quoted key or a subscript ((d.termRecords.length) =
0, (d.termRecords.length)--, (d.termRecords.splice)(0, 1), d[("termRecords")] = []), a // comment
at a line end (d.termRecords // c, then = [] on the next line), and whitespace at a dot inside
another spelling or before a call's ( or a ?. there (…)"*.

Comments, both files: a "WO-1.88's second correction round changed no pattern" paragraph; the
round-1 parenthesised-target bullet now says a close parenthesis in those three places only; each
*A FENCE, NOT A READING* list replaces its "whitespace or a comment" entry with an update-expression
entry and a class entry ("ANYTHING BETWEEN THE PARTS OF A SPELLING THAT ITS PATTERN DOES NOT ALLOW
THERE", with three sub-kinds and examples).

**A false claim in the old comments was corrected:** "a comment is stripped to a newline, so it is
the same hole". Both checks strip only *whole-line* `//` comments, so a trailing `//` survives
into the searched text and breaks the pattern; only a block comment becomes a newline (which
`[\s)]*` tolerates, so `d.log /* c */ = []` is refused).

### Regex baseline untouched

`git diff tools/verify/` (working tree vs staged): every `-` line is a comment line or a `+ '…'`
string line; no `.concat(matched(…))`, regex literal, `REMOVERS`/`removers` list, or `check(`
condition appears in the diff. `node --check` passes on both files.

### Runs (each once, waited to exit)

- `node tools/verify-shell.mjs`: `2117 checks · 2117 passed · 0 failed · 0 skipped`,
  `67,823 lines · 32.0 lines per check · 1169s`, `EXIT=0`. No `reading 'store'` flake. F1
  `removers found: none`, F3 `"found":[]`.
- `node tools/wo-sweep.mjs`: `52 checks · 49 passed · 0 failed · 3 to review`, `EXIT=0` (the three
  standing reviews). Run after all tool/CHANGELOG/TESTING edits except the typing-in of CR2.5's
  own result lines.

### Decisions and what I could not close

- `d[('log')]` is printed as `d[("log")]` to avoid escaping inside a single-quoted literal; same
  spelling to every pattern (the quoted-key patterns take any quote).
- I named `?.` before a call's `(` (`d.log.splice?.(0, 1)`) in the class — true from the token
  `.splice(`, reasoned rather than planted (no plants this round, by ruling).
- Line 3 is left for the third verifier pass to read. The wording is a class statement; whether it
  claims no more than the patterns is a reading, not a proof, as every earlier round said.
- Not touched, per pickup "owed after the tick": the WO-1.87 note, the phase file, the tick.
