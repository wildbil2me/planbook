# WO-3.67 — result: STOPPED on the Traps' red-before-mutation line. Nothing delivered, tree unchanged

**Verdict.** I did not finish the work order, and I stopped on purpose. The reworked route, built the
way the first Deliverable describes it, **went red with no mutation in place**. The Traps say that is
the point to stop and report rather than adjust the check, so that is what I did. I don't think the
red is a defect in `src/scores.js`, though, and the Traps assume it would be. The route can't pass
because of a ruling that `src/list-note.js` records as decided. The work order needs re-cutting before
anyone builds it. Evidence and a proposed re-cut are below.

## What I ran

I wrote the route into `tools/verify/copy-class.mjs` § "Acceptance 4" exactly as the Deliverable
describes it. After the blank close on P2's list: home → P4's card → `#classView [data-class-screen="scores"]`,
which puts P4's Scores up. Then home → P2's card → the Scores pill, so P2's Scores is reached from home
and no list renders on the way. I added one probe check, "the detour emptied the Scores host", to cover
brief trap (2). The existing line-4 assertions were left exactly as they were. **No mutation was in
place. `src/` was untouched.**

`node tools/verify-shell.mjs`, unmutated (1110s; I read the log's own `EXIT=` line):

```
PASS | WO-3.67 PROBE: the detour emptied the Scores host  :: {"away":{"view":"scoresView","open":"tm349_p4a","scores":["",false,...,0],"list":["",false],...}}
FAIL | WO-3.66: on a class with no roster, the note still draws on Scores — #scoresTop hidden (its class and no height), the empty line saying there are no students, and the amber line drawn above where that row sits, outside it  :: {"view":"scoresView","open":"tm349_p2a","scores":["",false,"rgb(61, 79, 158)","rgb(238, 242, 255)","rgb(91, 111, 204)",0],"list":["",false],"order":true,"pastDue":{"shown":false,"b":0},"top":{"hidden":true,"h":0,"t":0},"empty":"WO-3.49 English I P2 has no students yet, so there are no ro"}

2062 checks · 2061 passed · 1 failed · 0 skipped
EXIT=1
```

The route itself worked: view `scoresView`, class P2, term `tm349_p2a`, `#scoresTop` hidden, and the
no-students line drawn. The only failure is that the note is not there, on **either** host. In the
reading, `list` is `""` as well as `scores`.

## Why it is red, and why that is not a `src/scores.js` defect

- The only thing that writes into either `[data-list-note]` host is `drawHosts()` in `src/list-note.js`.
  `grep -rn "scoresMoved\|data-list-note" src index.html` turns up nothing else. Every draw writes the
  same `listNote` state into **every** host.
- `paintListNote()` drops `listNote` whenever the selected class or term is not the one the note is
  about. The header of `src/list-note.js` § "When it is dropped" records that as decided rather than
  inherited: *"a Scores render on another class or term drops it as a list render would."*
- So any render of another class's Scores (or list) that empties the host has also **deleted the
  note**. No route through "another class's Scores" can come back to a note that still exists. Both
  hosts reading `""` in the failure confirms it: the note was dropped, not left undrawn. If Scores'
  render had simply failed to draw it, the list host would still carry the text whenever the list
  was painted.

Put plainly, the Deliverable asks for an empty host and a live note at the same moment. With the
module as it is, nothing in the app can produce that state.

## Proposed re-cut (not built, not run; the orchestrator's or owner's call)

1. **Empty the host by hand, not by a detour.** After the blank close on P2's list, the fixture blanks
   `#scoresMoved` directly over `evalJs` (empty `textContent`, add `hidden`) and asserts that it is
   empty. Then it goes home → P2's card → Attendance → the Scores pill. That leaves the note alive in
   the module and the host empty, so only Scores' own `paintListNote()` call can refill it. With that
   call deleted, the check should go red. This is a test-only DOM write to a view-state element,
   and nothing in `src/` gains a door. The Traps forbid a door, not this. I have not proved either
   half of this by running it.
2. **Drop the other half of "Why it exists"**, *"the one that must clear a note left by another class"*.
   WO-3.66's third check already covers it (`s3other`: another class's Scores is bare), and this
   work order's route can't reach it anyway.

## Against the Acceptance list

| # | Line | State | Why |
|---|---|---|---|
| 1 | reaches the no-roster Scores after another class's Scores has painted the host, and still passes | **not met** | red before any mutation; see above. Not ticked |
| 2 | with Scores' paint call deleted, the check goes red; reverted; red output in TESTING.md | **not attempted** | no green baseline to mutate against. No mutation was ever planted |
| 3 | `verify-shell.mjs` and `wo-sweep.mjs` pass | **not claimed** | the tree is byte-identical to HEAD for the one file I touched, so it is WO-3.66's green tree. But I ran neither tool against the reverted tree, so I claim neither |
| 4 | `TESTING.md` § WO-3.67 carries these lines verbatim | **not written** | the Acceptance lines are what the re-cut will change. A section recording evidence for lines that are about to be rewritten would be the wrong record. The re-cut work order owes it |

No box ticked. The status in `plans/work-orders/phase-3-gradebook.md` is left at `🤖 CLAIMED`, as the
orchestrator set it. Release or re-cut is the orchestrator's decision.

## Tree state

- `tools/verify/copy-class.mjs`: probe reverted with `git checkout --`, then `cmp` against a copy saved
  before editing. Identical. **No file changed by me remains changed.**
- `src/`: never touched. No `CACHE` bump is owed.
- `grep -rn MUTATION src tools` was run after the revert. Every hit is pre-existing prose (`src/shell.js:1070`,
  `tools/README.md`, `keys-legend-guards.mjs`, `outreach.mjs`, `score-grid.mjs`, `score-search.mjs`,
  `wo-gate.mjs:2800`), and none of them were planted by this dispatch.
- I briefly ran `git add -N .`, which marked the two untracked dispatch files intent-to-add. I undid
  it straight away with `git reset -q --` on those two paths. `git status --short` matches the session
  start again (plus this file).

## Notes

- **Harness duration.** The full run took **1110s (~18.5 min)**, against the ~160s the agent prompt
  cites and the ~4.5 min per run the brief's routing assumed. A re-cut that wants a green run plus a
  mutated run is roughly 37 minutes of harness time.
- **CHANGELOG draft.** None. Nothing changed that means anything to a teacher.
