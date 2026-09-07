# WO-7.2 — Document transfer & conflicts — RESULT (recovered)

**This is a recovery result file, not an implementer's own report.** The dispatch that built this
work order was killed by an API session limit; it never returned, never wrote a result file and
never ticked a box. Everything below was re-derived from the working tree and re-run from scratch by
the parent session on 2026-09-07. **Nothing here is a surviving claim of the dead dispatch** — its
prose was never written, so there was nothing to disbelieve. The verifier is still owed and is a
fresh session.

## How the corpse presented

The seventh dead dispatch in this repository and the fourth killed by a quota. Mtimes: code and docs
11:00–11:23, the new harness 11:31, and `src/drive-sync.js` last at 11:39 — superficially the
WO-5.1/WO-5.3 shape (died in the mutation round, over a tree of ticked boxes). It was not. **Zero of
six Acceptance boxes were ticked and no result file existed**, which is the WO-5.4 shape: died before
the tick pass, presenting honestly as unfinished.

`grep -rn MUTATION` was run first regardless, per `AGENTS.md`, and was **clean** — the only hit in
`src/` is pre-existing prose at `src/shell.js:852` about a *class* mutation in the data sense. The
WO-5.4 correction holds: tick state says nothing about whether a corpse's code is armed.

## One defect in the delivered tree, found and repaired

`tools/verify/drive-sync.mjs` contained **a single raw NUL byte** at line 713, used as a
"match nothing" sentinel:

```js
clash.message.indexOf(spare ? spare.name : '\0') >= 0
```

One NUL makes the whole file **binary to `grep`**: `file` reported `data`, and `grep -n` printed
`Binary file … matches` instead of the matching line. That silently exempts the file from
`grep -rn MUTATION` — **this repository's designated first move on every dead dispatch, in a file the
dispatch pipeline itself would need to search.** Six of the last seven dispatches here died
mid-flight; a harness file that opts out of that grep is a hazard, not a cosmetic flaw.

Repaired to `!!spare && clash.message.indexOf(spare.name) >= 0` — identical semantics, no sentinel.
**The naive fix is a trap worth recording:** simply deleting the NUL leaves `indexOf('')`, which is
always `>= 0`, making the check permanently vacuous while still reading green. The file is now
`JavaScript source, UTF-8 text`, 910 lines, LF preserved, byte-identical otherwise.

## The mutation round

Run **one mutation per harness run**, deliberately. M2b alone produces a 13-FAIL cascade; batched,
attribution for the other three would have been destroyed.

| # | Line | Mutation | Outcome |
|---|---|---|---|
| M1 | 5 | `res.status === 401` → `4010` | **caught** — 1 FAIL, the mid-flight refusal check |
| M2 | 6 | drop the client-side `docId` filter | **not caught, correctly** — defence in depth |
| M2b | 6 | `docId = 'not-this-document'` inside `findRemote()` | **caught** — 13 FAILs, this line's by name |
| M3 | 4 | remove the one retry in `withOneRetry()` | **caught** — 2 FAILs |
| M3b | 4 | write the bookmark **before** the upload | **caught** — 1 FAIL, via the manual-retry check |
| M3c | 4 | plant the word `resumable` in code | **caught** — 1 FAIL, the no-resumable assertion |
| M4 | 3 | drop the conflict copy's name from the message | **caught** — 1 FAIL, the repaired check |

**M2 not being caught is a result, not a gap.** The harness's stand-in Drive parses the `q`
parameter and filters by `docId` server-side exactly as Google does, so the module's own filter is
belt to the query's braces — the same shape as WO-5.3's MUTATION 1.

**M4 doubles as proof that the NUL repair is load-bearing**, which mattered because that line was
changed by this session rather than by the implementer.

## A blind spot in the delivered harness — reported, NOT repaired

M3b wrote the bookmark before the upload. The check whose stated claim is *"a connection that dies
with the upload in the air leaves the local document valid and the remote file exactly as it
was — never half-written"* **passed**, at `baseRev 281 -> 281`, over a document that really had been
corrupted. It reads the **in-memory** bookmark (`mark`), and the mutation moved only the
**IndexedDB** write, which that check cannot see. What caught the damage was its neighbour — the
manual-retry check — which saw the next pass turn into `outcome = conflict`.

**Acceptance line 4 holds**, on the strength of three mutations and that neighbour. But the check's
stated claim is wider than what it measures, which is the same species of defect as WO-5.3's
`flush()` blind spot. It is left for the verifier and the owner: widening a check this session did
not write, on the evidence of its own mutation, is how a harness quietly becomes its author's
second opinion.

## Tools, on the exact shipping tree

- `node tools/verify-shell.mjs` — **1331 checks · 1331 passed · 0 failed · 0 skipped**, EXIT=0.
  Baseline at HEAD is 1299, so this work order contributes ~32 checks.
- `node tools/wo-sweep.mjs` — **41 · 38 · 0 · 3**, EXIT=0. The three REVIEWs are the standing ones.
- `node tools/wo-gate.mjs --audit` — **PASS**, EXIT=0.
- `grep -rn MUTATION src/ tools/` — clean; every hit is standing prose.

## Acceptance

Four ticked, each with its note written at the line. **Two left open, both 👤** — Acceptance 1 and 2
want two devices, and the runnable form is two browser profiles at `https://localhost:8443`
(`TESTING.md` § WO-7.2). Everything a single device can show about them is driven; what is not shown
is two IndexedDBs, which is exactly why those boxes are open.

## What is owed

1. **The verifier — a fresh session.** Nothing in this file is a verdict.
2. **The two 👤 lines**, on two browser profiles.
3. **An owner's call on the half-written check's blind spot** (above).
4. **Nothing is committed.** The tree is staged and uncommitted.
