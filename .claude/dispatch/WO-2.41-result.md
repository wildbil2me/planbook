# WO-2.41 — result

**Work order** `plans/work-orders/phase-2-attendance.md:4042` · **Route** Claude (work-order-implementer)
**Files changed** 3, all prose. Nothing under `src/`, nothing in `tools/`.

- `plans/dispatch-retro.md` — one new `###` subsection in § Codex (61 lines), one dated parenthetical
  appended to the sentence at `:175`.
- `plans/work-orders/phase-2-attendance.md` — the four WO-2.41 Acceptance boxes ticked with evidence.
  **Status left at 🤖 CLAIMED**; I did not move it to ✅ DONE — that is the orchestrator's pen after a
  verifier reads this.
- `.claude/dispatch/WO-3.15-status.md` — **deleted** (`git rm`, staged as `D`).

---

## Against the Acceptance list, one by one

### 1. `plans/dispatch-retro.md` § Codex carries the 2026-08-14 kill, with the numbers, and a reader arriving at it learns what exit 3 is for without opening another file — **met**

New subsection `### WO-3.15, 2026-08-14 — the dispatch that finished, was killed, and reported that it
never ran`, at `plans/dispatch-retro.md:245`. Placed **after** the `### WO-2.4, 2026-08-08` subsection
and last in § Codex, so the section stays in date order; § Ticking follows it unchanged.

Numbers in it, all taken from the status file's own wording (the Traps call it the best source, and I
compressed rather than re-narrated): seven files written **19:18–19:23**, `WO-3.15-result.md` at
**19:23:50** as the last filesystem action, failure to exit, SIGTERM at the **twenty-minute cap at
19:33**, `spawnSync codex ETIMEDOUT` reported as *"codex exec could not be run"*, **exit 2 over 206
insertions across seven files**. The cost paragraph carries the rest of the day: `verify-shell.mjs`
reported unrunnable in the sandbox (an environment, not a result), re-run locally at **757 checks, 757
passed**, exit 0, 251s; two verifier **FAIL**s — the undisclosed WO-3.14 check deletion with its
thirteen-line comment orphaned, no ledger entry, hidden behind a net-zero **760 → 760**; then one more
stale harness comment — and the pipeline's two-failure rule stopping and bringing the user in. That
paragraph says in its own first sentence that **none of it followed from the mislabel**, because it
does not, and the entry should not imply a causal chain it cannot support.

Exit 3 is stated in the fourth paragraph without a pointer out: a dispatch that started and was then
SIGTERMed (at `INVOKE_TIMEOUT_MS` or on a `maxBuffer` overrun) reports 3, never 2; nothing rolls the
tree back, so read `git status` and the diff before re-dispatching or re-routing; it is a verdict on
neither the runner nor the work. Exit 2's re-scope to *never started* and the fact that 0 and 1 did
not move are in the same paragraph. I checked this against `tools/codex-invoke.mjs:17-38` and
`:326-334` (read only) and against `tools/README.md:106-117`, and it contradicts neither.

**On the Traps.** The entry opens on what the failure looked like from the inside and stays there for
three paragraphs; the fix arrives fourth, as the rule the scar produced. It names no WO-2.37
deliverable — no `--budget`, no `ROUTING.md` rubric bullet, no `--self-check` — because that is the
changelog the third Trap forbids. The "Verified 2026-08-06" narrative is untouched apart from the
parenthetical described below, which is additive.

*Judgment I took beyond the Deliverables, flagged here so a verifier can disagree with it cheaply:* a
final paragraph about **where the account lived** — the record of the worst failure mode this pipeline
has sitting in a file marked for deletion, and the rule that a scar belongs in the retro on the day it
is earned, not in the dispatch folder. It is the "Why it exists" paragraph's own argument, it is the
same shape as the WO-3.5 section's closing line about striking through rather than deleting, and it is
what makes Acceptance line 3's deletion legible to a later reader rather than mysterious.

### 2. No sentence in that file describes the exit codes in a way that is false today, or if one is kept as history it is dated and points at the current account — **met**

`grep -n "exit" plans/dispatch-retro.md` returns eight pre-existing hits. Seven are about `--summary`
parsing, a 15:24 exec, WO-2.4's exit 0, and WO-1.7's zero-exit scar — none of them a claim about the
scheme. The one stale sentence is `:175`, *"exit 1 is a runner verdict, exit 2 is a harness bug"*.

**The decision — the third treatment: kept as history, dated, with a pointer.** WO-2.37's implementer
put its reasoning on the record (`.claude/dispatch/WO-2.37-result.md:388-396`): the sentence sits in a
past-tense narrative closed by *"Verified 2026-08-06"*, editing it to describe today is its own kind
of wrong, *"if the owner disagrees, the fix is one parenthetical."* I agree with the reasoning and
took the parenthetical. Correcting in place was refused for the reason WO-2.37 gave, and because the
paragraph's subject is what shipped **that week** — a narrative silently edited to describe today
stops being either history or contract. The parenthetical now reads, in part: *"That two-code split is
the scheme as it stood on 2026-08-06 … exit 2 was re-scoped from 'a harness bug' to never started, and
exit 3 was added for a dispatch that started and was then killed. § WO-3.15, 2026-08-14 below is the
event that forced both, and states the current codes in full."* So the two accounts are joined in both
directions, which is the one outcome the Deliverable rules out being missing.

I also checked the neighbouring sentence at `:185-187` rather than assuming it: *"all three exit-2
paths (missing argument, missing brief file, unrecognized flag)"* is **still true today** — those are
`fail(2, …)` at `tools/codex-invoke.mjs:272`, `:280` and `:198`. It needed nothing.

### 3. `.claude/dispatch/WO-3.15-status.md` is either deleted on its own instruction or carries a line saying why it is being kept — **met, by deletion**

`git rm .claude/dispatch/WO-3.15-status.md`; `git status --short` shows `D`. Its third line is the
instruction and the condition was met on 2026-08-14 at 19:23:50, so honouring it was the default and I
did not find a reason to override. Two things that pushed the same way: the file's last line asserts
*"WO-3.15 stays 🤖 CLAIMED … Working tree uncommitted"*, which has been false since that row went ✅
DONE — 2026-08-14, `plans/work-orders/phase-3-gradebook.md:1216` — so keeping it means keeping a stale
claim, and rewriting that line would be editing a status trail's own history, which § "The spawn
reported as a run" warns against. Against deletion: `WO-2.37-result.md:234` and
`WO-2.37-status.md:50` cite `WO-3.15-status.md:20-25` by line. That is why the retro entry says the
file was deleted and gives `git show c279498:.claude/dispatch/WO-3.15-status.md` — the only commit it
ever appeared in, confirmed with `git log --oneline -- .claude/dispatch/WO-3.15-status.md`, and I ran
that `git show` and saw the file come back. The pointers still resolve; nothing is lost.

### 4. `node tools/wo-gate.mjs --audit` is `PASS` and `git diff --stat -- src/` is empty — **met**

```
$ node tools/wo-gate.mjs --audit          # exit 0
  ok   phase-2-attendance.md  WO-2.1 … WO-2.46   45 work order(s)
  … every phase file ok, every dashboard row ok, overall row 42/81   rows sum 42/81
PASS | every fragment matches exactly one roadmap box, every **Owes** pointer lands on an open box,
every uncounted box has a struck or deferred work order behind it, § The files names what its files
hold, and every dashboard row matches its own boxes.

$ git diff --stat -- src/
(no output)
```

Both re-run after the last edit, not carried over from the first run.

Also run, per the brief:

```
$ node tools/wo-sweep.mjs                 # exit 0
20 checks · 18 passed · 0 failed · 2 to review
```

The two REVIEWs are the standing pair — *sensitive field names outside `src/backup.js`* and *due-date
and late/missing on the same line* — in files this work order never opened. They are the same two
WO-2.37 reported.

`node tools/wo-gate.mjs WO-2.41` also prints `PASS | gates clear for WO-2.41`, with the expected
`NOTE` that the row is 🤖 CLAIMED and a brief exists without a result (true at the time it ran).

**`verify-shell.mjs` not run, deliberately, with evidence rather than a shrug.** It drives the app in
a browser and takes ~4.4 minutes; this work order changed three prose files. `git diff --stat -- src/`
is empty and `git status --short` names no file under `src/`, no `index.html`, no `sw.js` — so there is
nothing for it to measure that it did not measure last time. Same call, and same evidence, as the
WO-2.40 row recorded. `sw.js`'s `CACHE` is untouched for the same reason: no `SHELL` file changed.

## What I could not verify

Nothing here needs a real iPad or human eyes — no 👤 line exists on this row and I ticked none. The
one thing no command can settle is **whether the entry is written the way this file writes**, which is
a judgment a reader makes; I matched the existing subsection's shape (dated `###` heading, bold lead
sentence, scar first and rule second) and can point at `### WO-2.4, 2026-08-08` as the model, but I
cannot prove the voice with a command.

## Decisions the work order left open, and which way I went

- **The stale sentence** — treatment three (history, dated, cross-linked), reasoning in line 2 above.
  The Deliverable named all three as acceptable; this is the one that keeps the Trap about the
  "Verified 2026-08-06" narrative safest, since it removes nothing.
- **The status file** — deleted rather than kept-with-a-reason, reasoning in line 3 above.
- **Where the new subsection sits** — last in § Codex, in date order, rather than woven into the
  2026-08-06 paragraph. The section already establishes that a dated event earning its own heading
  gets a `###`, and this one has a date, numbers and a rule.
- **I did not flip the row's Status to ✅ DONE.** The Acceptance boxes are ticked with evidence, per
  the brief's constraint that a tick must be something I actually checked; the status line and the
  dashboard are `wo-gate --tick`'s job after verification.

## Temptations declined, recorded rather than acted on

- **`.claude/agents/work-order-orchestrator.md:97-107`** still enumerates the probe's codes as
  0/1/2 and calls exit 2 *"a harness bug"*. For `--probe` that is accurate as far as it goes — the
  probe has no exit 3 — but since WO-2.37 `--probe --budget N` also exits 2 as a usage refusal
  (`codex-invoke.mjs:740`), so "harness bug" is now the common case rather than the only one. Out of
  scope here (this row is graded on `dispatch-retro.md`, and I opened that file only far enough to be
  sure the new entry does not contradict it). **If anyone wants it pursued, it is one clause in a
  bullet, not a work order.**
- **The other status files in `.claude/dispatch/`** — several sit beside result files and presumably
  carry the same first-line instruction. Explicitly out of scope, and I did not open them.
- **`tools/codex-invoke.mjs`** — read for accuracy about the current scheme, as the brief directed,
  and not modified. `git diff` names it nowhere.

## Draft `CHANGELOG.md` entry — not written by me; the teacher decides what a change means

> **Docs** — `plans/dispatch-retro.md` § Codex now carries the 2026-08-14 WO-3.15 kill: a dispatch
> that wrote all seven of its files, failed to exit, was SIGTERMed at the twenty-minute cap and
> reported "could not be run" and exit 2 over 206 insertions still in the tree. The entry states the
> current exit codes, including the exit 3 that event produced, and the 2026-08-06 paragraph that
> describes the old two-code scheme is dated and points at it. `.claude/dispatch/WO-3.15-status.md`
> deleted on its own instruction now that the account has a home (WO-2.41).
