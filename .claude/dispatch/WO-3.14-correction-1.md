# WO-3.14 — correction round 1

**Route** Codex (same implementer as the first round)
**Original brief** `.claude/dispatch/WO-3.14-brief.md` — still in force, read it again.
**Report to** `.claude/dispatch/WO-3.14-result-2.md` — as your last act.

Your first round got the shape right: `formatPercent()` at two decimals, one combined check, the
comment rewritten, the per-student detail correctly ruled absent, attendance untouched, and **no
acceptance box ticked you had not verified** — that last one is the discipline this pipeline usually
has to ask for twice.

But your report said *"Browser harness: could not run"* and *"Static sweep: 1 failed."* Both were
measured again on the real machine, where the browser harness runs fine. **The harness fails, and the
sweep fails twice, not once.** Three defects, all of them objective tool output. Fix these three and
nothing else.

---

## Defect 1 — the expected value is wrong, and the comment you edited says so

`node tools/verify-shell.mjs` on your tree:

```
564 checks · 563 passed · 1 failed · 0 skipped

FAILED:
  - moving an assignment to another category moves EVERY displayed grade in the class on the
    keystroke — case 1's row 87.00% -> 86.67%, with no weight and no score touched
      25 of 25 displayed grades moved; case 1's row 87.00% -> 86.73%; that column head now reads
      "Homework 20%"; scores byte-identical = true, weights byte-identical = true
```

**The engine says `86.73%`. You asserted `86.67%`.** You took that number from the work order's prose,
which says *"case 1's 86.666… after the category move"* — and the work order's prose is loose there.
The arithmetic is in the comment block you edited, two lines below the line you changed, and it
survived your edit intact:

> `90 x 30/50 + 81.81… x 20/50 = 86.72…%`

That is `54 + 32.7272… = 86.7272…%`. To two decimals it is **`86.73`** — and this is a better witness
for the work order's second acceptance line than `86.67` would have been, because **truncation would
give `86.72` and rounding gives `86.73`**, so the assertion now actually distinguishes the two. Your
edit left the comment's headline (`86.67%`) contradicting its own arithmetic (`86.72…%`) an inch
below. A comment that disagrees with itself is worse than the stale number it replaced.

**Do:**
- `tools/verify-shell.mjs` — the assertion that reads `afterMove.grades[row20] === '86.67%'` becomes
  `'86.73%'`, and the check's own name string changes with it (`87.00% -> 86.73%`).
- The comment headline `Case 1's row goes 87.00% -> 86.67%` becomes `87.00% -> 86.73%`. **Leave the
  arithmetic sentence beneath it alone** — it was right before you arrived and it is right now.
- Do not change `src/scores.js`, the engine, or any weight or score to make a number match. The
  underlying percentage did not move: `86.7272…` printed at one decimal was the old `86.7%`. Only the
  display precision changed, which is the whole work order.
- Re-read the other five updated strings for the same defect. `87.00%` is exact and correct
  everywhere it appears; `86.73%` is the only inexact one.

## Defect 2 — the service worker was not bumped, and this defect ships the bug to the iPad

```
FAIL | every SHELL file change is paired with a CACHE bump
  src/scores.js changed since planbook-shell-v42 was set at 9489265 — bump CACHE in sw.js, or an
  installed app keeps the shell it already has
```

`src/scores.js` is a cached shell file. Without the bump, the installed PWA on the teacher's iPad
keeps serving the old `toFixed(1)` — the app would show one decimal on the exact device where the
re-keying happens, which is the harm this work order exists to remove. **Bump `CACHE` in `sw.js:37`
from `planbook-shell-v42` to `planbook-shell-v43`.**

## Defect 3 — the harness's own recorded size

```
FAIL | the recorded `check()` call-site count matches the harness
  tools/verify-shell.mjs has 571 `check()` call site(s), up 1 on the 570 recorded at
  tools/README.md:548 — update that line, and the executed-check count in the paragraph beside it,
  from a run rather than by arithmetic.
```

You added one check, so this is expected — it is the sweep doing its job, not a surprise. Two edits in
`tools/README.md`:

- **`:548`** — *"`verify-shell.mjs` holds 570 `check()` call sites"* → **571**. Reword nothing else in
  that sentence; the sweep greps for it, and rewording turns the sweep red rather than turning the
  check off.
- **The paragraph beside it** — *"It is 570 − 563 = 7 on this tree and it was 560 − 554 = 6 at
  WO-2.19"* → **`571 − 564 = 7`**, leaving the WO-2.19 half of the sentence exactly as it is. That
  paragraph insists these numbers come from a run rather than from arithmetic, and **your sandbox
  cannot drive a browser, so here is the run**: on the corrected tree `verify-shell.mjs` reports
  `564 checks` executed against 571 call sites. The gap stays 7 because your new check executes. If
  your own arithmetic disagrees with those measured numbers, report the disagreement rather than
  writing a third number.

---

## What "done" means this round

- `node tools/wo-sweep.mjs` — **no FAIL.** The one REVIEW (`sensitive field names outside
  src/backup.js`, 174 mentions) is pre-existing and not yours; leave it.
- `node tools/verify-shell.mjs` — you cannot run it. **Say so plainly again rather than claiming it,
  and do not adjust an expectation to make an unrun check look right.** The orchestrator re-runs it on
  the real machine and a verifier reads it after that.
- Change **only** the four files this brief names: `tools/verify-shell.mjs`, `sw.js`,
  `tools/README.md`, and nothing in `src/` at all this round. `src/scores.js` is already correct.
- The 👤 acceptance line stays `- [ ]`. You have no iPad and no SIS.
