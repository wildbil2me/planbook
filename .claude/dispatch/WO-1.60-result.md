# WO-1.60 — result

**Implementer:** Claude Opus, 2026-10-04. Nothing committed, branched or pushed in `c:\dev\planbook`;
HEAD is still `c84e02a` and `main` is the only branch. Status line left at `🤖 CLAIMED — 2026-10-04`.
The owner's uncommitted option-1 ruling in the phase-1 file was kept and built on. I did not revert,
stash or check it out.

## What was built (option 1, the commit trailer)

`tools/wo-sweep.mjs` § 9 now excuses a SHELL file changed since the `CACHE` bump only when **every**
commit since the bump that touched it carries the git trailer

    Shell-Cache: not needed — comments only

- **Key:** `Shell-Cache`. git matches it case-insensitively.
- **Value:** any value that *begins* `not needed` (case-insensitive) excuses. The rest is the
  committer's reason and is not read. Anything else (`needed`, an empty value) excuses nothing. I
  chose a prefix over the exact string because the em dash is hard to type and a `-`/`—` mismatch
  should not be the reason an honest excuse fails. The header comment says this.
- **Parsing:** git does it, not a regex. `git log --name-only
  --format=%x1e%H%x1f%(trailers:key=Shell-Cache,valueonly,separator=%x1d)%x1f <bump>..HEAD` is one call
  that returns each commit's trailer values and the files it touched. A trailer has to be in the final
  block of the message, which can be the same block as `Co-Authored-By:`.
- **Never excused:** an uncommitted change (it has no commit, so it has no trailer); `sw.js`;
  `index.html`. If an excusing trailer is on a commit that touches `sw.js` or `index.html`, that is a
  FAIL in its own right and names the commit.
- A file that changed with **no** commit in the log naming it (only possible through a merge
  resolution) has no commit to speak for it, so it stays red.
- The header comment is rewritten and says all of this, plus the four deliberate limits. The biggest
  one: **the trailer is a person's word**, so a code change that carries it passes, and nothing in the
  check can catch that.

## Files changed

- `c:\dev\planbook\tools\wo-sweep.mjs`: § 9's header comment and its logic. The check name and its
  single position are unchanged, and no `check(`/`review(` call site was added (the census still
  reads 87).
- `c:\dev\planbook\TESTING.md`: new § WO-1.60, placed after § WO-1.58 and before Phase 2.
- `c:\dev\planbook\plans\work-orders\phase-3-gradebook.md`: one clause pointing at WO-1.60 in each of
  WO-3.40's `CACHE` Acceptance note and WO-3.44's Traps (a Deliverable).
- `c:\dev\planbook\plans\work-orders\phase-1-shell-store-roster.md`: WO-1.60's three Acceptance boxes
  ticked. The owner's diff is intact.
- `c:\dev\planbook\AGENTS.md` and `c:\dev\planbook\CLAUDE.md`: one identical parenthetical, added to
  both files in this sitting, right after each file's "bump `CACHE`" rule. It names the trailer and
  points at § 9 (brief trap 7). § 21's watched-pair check stays green.
- **Not touched:** `sw.js`. Editing its header would change the worker and would need its own bump,
  and the work order forbids the bump. So the trailer's committer-facing home is
  AGENTS.md/CLAUDE.md, not sw.js. `tools/README.md` has no description of § 9's behaviour (only the
  sweep's general row), so it got nothing.

## Commands run and their results (all read from output I saw finish)

- `node tools/wo-sweep.mjs` on the real tree, before any doc edits and again after all of them:
  EXIT=1, and the **only** FAIL is § 9:
  `FAIL | every SHELL file change is paired with a CACHE bump  :: src/assignments.js, src/detail.js, src/shell.js changed since planbook-shell-v164 was set at 061c53b — bump CACHE in sw.js, or an installed app keeps the shell it already has`.
  **This is expected and correct.** The cause is `de61b73` (WO-3.40) and `c84e02a` (WO-3.44), which
  carry no trailer and cannot gain one. It clears at the next `CACHE` bump. I made no bump.
- `node tools/verify-shell.mjs`: ran in the background, and I waited for its exit before reporting.
  `1760 checks · 1760 passed · 0 failed · 0 skipped`, `56,045 lines · 31.8 lines per check · 780s`,
  `EXIT=0`, real clock.
- `node tools/wo-gate.mjs --audit`: PASS (`overall row 75/81`).
- `node tools/wo-gate.mjs WO-1.60`: `PASS | gates clear for WO-1.60`. Its notes were CLAIMED (expected)
  and "brief exists, result does not" (cleared by this file).
- **Proof clone.** I ran `git clone` of the repo into the session scratchpad, ran
  `git remote remove origin` (so nothing could be pushed), and copied the new sweep in. Fixture base:
  a commit bumping `CACHE` to `planbook-shell-v165` (`aed5c19`). The outcomes, each § 9 line quoted in
  TESTING.md:
  - **A.** A comment line in `src/detail.js`, with the trailer in the same block as `Co-Authored-By`:
    PASS, `…excused by a Shell-Cache trailer on every commit that touched it: src/detail.js (c7486c7)`.
    The whole sweep exited 0.
  - **B (mutation).** A second commit to `src/detail.js` without the trailer: FAIL naming
    `src/detail.js`, exit 1.
  - **C (mutation).** The trailer on a commit touching `sw.js`: FAIL,
    `2285f49 touches sw.js and carries a Shell-Cache trailer — …`, exit 1.
  - **D (mutation).** The trailer on a commit touching `index.html`: FAIL,
    `1c1ea8e touches index.html …`, exit 1.
  - **Edge cases (one run each):** an uncommitted edit over A was red. The trailer in a middle
    paragraph was red (git does not parse it). `Shell-Cache: needed` was red. A lower-cased key with a
    hyphen in the value was green.
  - After each mutation I ran `git reset --hard` in the clone, and A read green again afterwards. I
    deleted the clone at the end.
- **Names and order.** I ran HEAD's sweep and the new sweep in the clone on HEAD's tree. Both emitted
  47 results with an identical `STATE | name` sequence. The only output difference was the census
  line's line number (`:3693` became `:3765`), and the census still reads 87 call sites.
- `grep -rn MUTATION tools/ src/` gives 19 hits. Every one is pre-existing prose or comments, and
  `git grep -n MUTATION HEAD -- tools src | wc -l` also gives 19. None is in `tools/wo-sweep.mjs`.
  Hits: tools/README.md:1411,1417,1424,1466,1505,1506,1964,2008,2930;
  tools/verify/keys-legend-guards.mjs:71,204,251,256; tools/verify/outreach.mjs:1578;
  tools/verify/score-grid.mjs:1667,2073; tools/verify/score-search.mjs:652; tools/wo-gate.mjs:2562;
  src/shell.js:982. The real tree never held a mutation; all of them lived in the clone.

## Acceptance, line by line

1. **[x] Excused comment-only change gives § 9 green and names the file.** Fixture A in the clone:
   PASS naming `src/detail.js (c7486c7)`.
2. **[x] Mutation-proved.** B (second commit without the trailer) was red; C (`sw.js`) and D
   (`index.html`) were each red. All three were reverted in the clone and are recorded in `TESTING.md`
   § WO-1.60. There was never a mutation in the real tree, so there was nothing to revert there before
   writing.
3. **[x] Check names and order unchanged.** The 47-line sequence diff above is identical.

There are no 👤 or 📆 lines.

## What I could not close / honest limits

- `main`'s sweep stays red on § 9 until the next `CACHE` bump. That is by the owner's ruling and is
  not a defect of this change.
- The trailer cannot catch a code change that is falsely labelled comment-only. This is by
  construction, and the header comment says so.

## Decisions the work order did not settle

- **Accepted value.** A `not needed` prefix, not the exact string. Reason above.
- **The trailer on `sw.js`/`index.html` is a FAIL, not just ignored.** The Acceptance line wants it
  red, and before this change neither file could ever be a § 9 offender (see the finding below).
  Treating misuse as its own failure is what makes "never excuse" observable.
- **The convention's home.** AGENTS.md and CLAUDE.md, in step, as one parenthetical each. `sw.js` was
  excluded for the bump reason above.

## Out-of-scope finding, declined (proposed follow-up)

**§ 9 has never watched `index.html` at all.** It reads SHELL's `'./'` entry, strips it to `''` and
skips it ("the index, not a file on disk"). So an untrailered `index.html` edit with no `CACHE` bump
passes § 9 today, even though `AGENTS.md`/`CLAUDE.md` say "`./` is entry one, so `index.html` counts".
`sw.js` is not in SHELL, so it is not watched either. My change keeps the trailer from ever excusing
either file, but fixing the hole means mapping `'./'` to `index.html` in the offender set, and that
widens the default red. I judged that a separate work order.

## Draft CHANGELOG entry (the teacher's call)

> **The sweep can be told a shell change was comments only.** `wo-sweep.mjs` § 9 used to fail on any
> change to a precached file without a `CACHE` bump, comment edits included. A commit can now say
> `Shell-Cache: not needed — comments only` in its trailer, and § 9 believes it, but only when every
> commit to that file says so, and never for `sw.js` or `index.html`. It is the committer's word, not
> a measurement. WO-3.40's and WO-3.44's commits predate it, so the sweep stays red until the next
> `CACHE` bump. (WO-1.60)
