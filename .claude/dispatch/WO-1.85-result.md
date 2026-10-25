# WO-1.85: the no-remover checks say they catch more than they do · result

**Implementer:** Claude Opus (work-order-implementer) · 2026-10-25 · not committed, as the brief asked.

## Summary

This was prose only. Each of the eight fences F1–F8 now says what it actually searches for, and
names the families of shapes that `TESTING.md` § WO-1.84's table shows getting past it. The edits
touch comments, check titles, detail strings, two sweep `NAME` constants (the printed titles) and
the § 17 paragraph in `tools/README.md`. No regex, token list or `check(` condition moved. Nothing
under `src/` moved, so no `CACHE` bump is owed. No mutation was planted, and
`git diff -- tools/ src/ | grep -c MUTATION` gives 0.

`TESTING.md` § WO-1.85 is written under Phase 1, after § WO-1.84. For each fence it quotes the claim
before and after the change, then gives a *Families → cells* line that maps every *passes* cell to
a family named in the new words. The cells add up to each fence's tally (27 · 47 · 31 · 43 · 39 ·
43/43 · 6 · 1). All five Acceptance boxes are ticked, in both `TESTING.md` and the phase file.

## Acceptance, line by line

1. **Before/after quotes for F1–F8, and every family that passes is named.** Met. See § WO-1.85,
   *The fences, before and after*. The families were taken from the *passes* cells only, and I
   summed each fence's family-to-cell mapping by hand against its tally.
2. **No *"on any input"*, *"could not write"* or *"nothing … could do otherwise"* in F1–F6's prose
   or in the § 17 README paragraph.** Met, with one scope call that a verifier should see (Decision
   1 below). A grep by region, located by anchor, finds 0 hits in F1, F2, F3, F4 (§ 17), F5's claim 4
   (both its header item and its code from `WRITER` to the `check(`), F6 (§ 24) and the README
   paragraph. It finds 3 hits elsewhere in § 20, all in the claim-5 paragraphs that record WO-1.34's
   own retirement of the phrase. The output is quoted in § WO-1.85.
3. **The diff changes only comments, detail strings and `tools/README.md`.** Met for `tools/`. I read
   the diff hunk by hunk. Then I ran a scratch script (`codeonly.mjs`) that reduces each file to its
   code skeleton: comments removed, string and template text replaced by a placeholder, `${…}` and
   regex literals kept, concatenations collapsed. Four of the five harness files give
   byte-identical skeletons at `HEAD` and now. `front-door.mjs` differs by exactly one ` + S`, the
   appended detail literal, and its condition is identical. `node --check` passes on all five.
   Outside `tools/`, the tree also differs in `TESTING.md` (the owed section) and in the phase file
   (`--start`'s 🤖 CLAIMED, which predates me, plus my five ticks).
4. **Both tools pass and their check counts are unchanged.** Met. Both "before" runs were taken on
   the clean tree before my first edit.
   - `wo-sweep.mjs`: before *52 checks · 49 passed · 0 failed · 3 to review*, `EXIT=0`. After, the
     same. It was re-run after the `TESTING.md` section was written, and again at the end, with the
     same result.
   - `verify-shell.mjs`: before *2117 checks · 2117 passed · 0 failed · 0 skipped*, `EXIT=0`,
     1182s. After, the same, `EXIT=0`, 1170s. I waited both runs out and read their summary lines
     myself.
   - The *67,612 lines* figure printed the same on both runs, and that needs explaining. The harness
     reads it from disk at the end of the run, and by then my edits had landed. The modules it runs
     load at start. The clean-tree figure is 67,537, which is § WO-1.84's number. The arithmetic is
     in § WO-1.85.
5. **§ WO-1.85 carries these lines verbatim with evidence.** Met. A diff against the phase file's
   Acceptance block confirms the lines match.

No 👤 or 📆 lines exist in this work order. Nothing needed an iPad.

## Decisions the work order did not settle

1. **What "the prose of F5" is.** WO-1.84's fence table defines F5 as *"§ 20, claim 4"*. § 20's
   header has three more uses of *"on any input"*, at `tools/wo-sweep.mjs:2160`, `:2222` and
   `:2224`, in the paragraphs about **claim 5**. Two of them quote text WO-1.34 retired, and the
   third is the argument that made WO-1.34 retire it. I left them as written. Rewording a quotation
   would falsify it, and swapping a synonym in to get past the grep is exactly what this chain of
   work orders exists to stop. If the owner reads F5 as the whole of § 20, those three lines are the
   correction round.
2. **Check titles and `NAME`s count as "detail strings".** WO-1.84 read each fence's claim as *"its
   detail line (the check's title and detail)"*, so I narrowed the titles of F1, F2 and F3 and the
   `NAME`s of § 17 and § 24. Those are printed output. No count moved. F8's title is unchanged; the
   new comment and detail qualify it instead.
3. **The § 17 count: I dropped the number.** `WRITERS` lists twelve names; I counted them by hand
   and the list is in § WO-1.85. The README paragraph now says *"the writer names on its `WRITERS`
   list"*, which cannot rot. The work order allowed either choice.
4. **F2's guarded file.** No prose under `tools/` said F2 searches `src/log.js`. The only text that
   does is WO-1.84's own Deliverables (the phase file and `WO-1.84-brief.md`). That is a closed
   record, and § WO-1.84's *Where the code disagrees* paragraph already corrects it. I left it
   alone. F2's comment now states in words that the searched file is `src/contact-history.js`, that
   `src/log.js` is read for one regex, and that log-entries is the check that searches `src/log.js`.
5. **One neighbour outside F1–F8.** In `contact-log.mjs`, WO-5.4's runtime check *"a second handoff
   APPENDS"* ended *"there is no writer in src/log.js that could do otherwise"*. That is a banned
   phrase in F2's file, making a claim about F1's file. I narrowed it to point at the log-entries
   fence and say it is a fence. It is a title string and its count is unchanged.

## Declined (out of scope, for the owner or for WO-1.86/1.87)

- **No pattern was added anywhere.** That would be WO-1.86's or WO-1.87's work, landing without its
  argument.
- **The `tools/README.md` row for `wo-sweep.mjs`** (line 10) still says § 24's *"`src/outreach.js`
  has no writer in it at all and `copyDraft()` in its neighbour reaches none"* and § 30's *"the
  writer … let through by file and by shape"*. § WO-1.84 counts both as part of F6's and F7's
  claims, but the Deliverables name only the § 17 paragraph. They are worth fixing in WO-1.87 or as
  a ride-along.
- **`CLAUDE.md` § Data, the `src/calendar-derived.js` bullet**, says *"the grep proves there is
  nothing in the file that could write on any input"*. It is the same overclaim, now contradicted
  by § 17's own comment. CLAUDE.md is the owner's file and outside this work order. **This is the
  one I would act on first**, and `AGENTS.md` should be checked for a twin.
- **The section banners** for § 17 (*"has no writer"*) and § 24 (*"writes nothing"*) are unchanged.
  Each now sits directly over a *fence, not a reading* paragraph.

## A conflict in my instructions about CHANGELOG.md

The brief's note 7 says to draft the `CHANGELOG.md` entry in the file. My standing instructions
(and the brief's own § 3) say to leave the entry to the teacher. I followed the second, so
`CHANGELOG.md` is untouched. A draft, in the style of the WO-1.84 entry:

> ### The no-remover checks now say what they actually search for — 2026-10-25
>
> WO-1.85, owner-directed, the first of WO-1.84's three recommendations. Prose only: no check
> catches anything it did not catch before, nothing in the app changed, and there is no `CACHE`
> bump.
>
> - **"On any input" is gone from all six whole-file and append-only checks.** So are "could not
>   write" and "nothing in the file could do otherwise". Each check now names what it searches for,
>   and then, under *a fence, not a reading*, the families of shapes WO-1.84's table showed getting
>   past it: bracketed and computed keys, compound assignment, destructuring, writes through an
>   alias, `.length` writes, `delete`, the reflective writes, and the two whole-year swaps.
> - **The contact-history check says plainly that it searches three words**, in
>   `src/contact-history.js`, a file that imports the store. It also says that `src/log.js` is
>   searched by a different check.
> - **§ 30 names the four reflective writes it cannot see**, and the front-door check names the
>   store function imported by name.
> - **The § 17 paragraph in `tools/README.md` no longer counts the writer names.** It said
>   "eleven", and the list holds twelve.
> - Both tools are green at unchanged counts: 2117/2117 and 52 · 49 · 0 · 3.

## Files changed

- `c:\dev\planbook\tools\verify\log-entries.mjs`: F1 comment, title and detail.
- `c:\dev\planbook\tools\verify\contact-log.mjs`: F2 comment and title, plus WO-5.4's "second
  handoff" title.
- `c:\dev\planbook\tools\verify\term-record.mjs`: F3 comment and title.
- `c:\dev\planbook\tools\verify\front-door.mjs`: F8, a new comment and a detail suffix.
- `c:\dev\planbook\tools\wo-sweep.mjs`: § 17 (F4) comment, NAME and detail; § 20 claim 4 (F5) and
  its detail; § 24 (F6) comment, NAME and detail; § 30 (F7) *WHAT IT DOES NOT SEE*.
- `c:\dev\planbook\tools\README.md`: the § 17 paragraph.
- `c:\dev\planbook\TESTING.md`: § WO-1.85.
- `c:\dev\planbook\plans\work-orders\phase-1-shell-store-roster.md`: five Acceptance ticks. The
  status line was already changed by `--start`.

Scratch only, not committed (session scratchpad): `codeonly.mjs`, `banned.sh`, and the run logs
`vs-before.log`, `vs-after.log`, `sw-before.log`, `sw-after.log` and `sw-final.log`.
