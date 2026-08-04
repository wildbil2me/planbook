# Verification tooling: why there is one script and never a test framework

**Decision record — 2026-08-04. Status: settled.**

Planbook has exactly one verification script, [`tools/verify-shell.mjs`](../tools/verify-shell.mjs).
It is run by hand, it has no dependencies, it gates nothing, and **it is not the beginning of a test
suite.**

This document exists because a future session will look at that file and start growing it. Every
addition will be individually reasonable. Somewhere around the fourth one, someone factors out
`tools/lib/`, adds a config file, then a runner — and the suite has acquired a test framework that
nobody decided to adopt. That is the same failure mode as `package.json` "just for scripts," which
`CLAUDE.md` and Roll Call!'s `plans/b-hygiene.md` already rule out, arriving by a different door.

## Where it came from, stated plainly

It was not a Deliverable. It came out of a retrospective on WO-1.2, on 2026-08-04, after two agents
independently built the same throwaway harness in a scratchpad and threw it away. It is recorded
here rather than as a work order because a work order is a forward commitment with acceptance
criteria; minting one after the fact and immediately ticking it adds one to both sides of the
dashboard, tells you nothing, and implies planning that did not happen.

## Why a script exists at all, when the suite has no test framework

Because some acceptance lines cannot be settled by reading a file, and reading was giving wrong
answers.

WO-1.2 shipped `.search-box { min-height: 44px }` wrapped around a **19px input**. The wrapper
measured 44px. The input did not. Tapping the strip above or below the text hit the wrapper, did
nothing, and the teacher taps twice. **A stylesheet review calls that line compliant.** Only
measurement catches it.

This is not a new convention either. Roll Call!'s `design/execution-guide.md` §7 already says to
verify by driving the built demo in headless Edge/Chromium over CDP, and `plans/ROADMAP.md` names
`TESTING.md` plus a headless demo pass — not an automated suite — as the 1.0 gate. One
dependency-free `.mjs` under `tools/`, run by hand, is the existing rule in `tools/README.md`
applied to verification.

## The boundary

These are the rules that keep it a script. Breaking any one of them is how it stops being one.

| Rule | Why |
|---|---|
| **One file.** No `tools/lib/`, no second harness, no plugin seam | A shared helper directory is the first structural step from "a script" to "a framework" |
| **If it wants a config file, stop** | Configuration is what a runner needs. A script that needs configuring has outgrown the decision recorded here — bring it to the teacher rather than building it |
| **It gates nothing.** No git hook, no CI, no commit check | Everything in `tools/` is optional and run by hand. A gate makes it required infrastructure |
| **It measures; `TESTING.md` judges** | A green run closes **zero** boxes by itself, and never a 👤 item. The checklist is the gate; this feeds it evidence |
| **Never required to run or ship the app** | A teacher's laptop never runs Node. `index.html` and `src/` are served as they sit on disk |
| **Soft cap ~950 lines** (it is ~920) | Raised from ~500 on 2026-08-04 — crossing it is a conversation, not a refactor, and that conversation is recorded below |

## What it is allowed to check

Only claims where reading the source gives the wrong answer: rendered geometry, resolved styles,
real focus movement under dispatched input, runtime storage state, and static preconditions that
silently disable a feature.

Anything a `grep` settles correctly should be settled by `grep`, in the verifier's standing sweep.
Adding a grep-shaped check here trades a one-line command for 400 lines of browser automation.

## The precondition rule, which is the reason it earns its keep

WO-1.2's safe-area acceptance line was marked "needs a real iPad" by both the implementer and the
verifier, on the true observation that safe-area insets resolve to 0 in every desktop emulator. Both
stopped there. Neither asked whether the insets could resolve non-zero **on an iPad either.**

They could not. `index.html` had no `viewport-fit=cover`, without which iOS resolves every
`env(safe-area-inset-*)` to 0. Eight declarations were inert. The iPad pass then succeeded by having
nothing to test, and the box was ticked for the wrong reason.

So the script asserts preconditions, not just declarations, and
`.claude/agents/work-order-verifier.md` now requires that question be answered before anything is
deferred to hardware. **Deferring to a human is what you do after ruling out a static precondition,
not instead of it.**

**One check was expected to fail until WO-1.3 landed** — that same `viewport-fit=cover` line. It
went green when WO-1.3 set the meta value, as designed. The run exits zero today.

## Raising the cap, 2026-08-04

WO-1.4 took the script from ~470 to 851 lines and the verifier stopped, correctly, rather than
refactoring past a number this document set. The conversation, and its outcome: **the cap is now
~950 lines, and the one-file rule is untouched.**

Three things decided it.

**Splitting was never available.** The first rule in the boundary table forbids `tools/lib/`, a
second harness, or a plugin seam, and that rule is load-bearing in a way the line count is not — a
shared helper directory is the first structural step to a framework, which is the thing actually
being prevented. A cap that can only be honored by breaking a stronger rule is the wrong
constraint, so the number moved instead of the structure.

**The growth was the right kind.** WO-1.4's additions measure runtime storage state — `rev`
arithmetic across a debounce, a forced `DataCloneError`, a migration ladder run against a real
`schemaVersion: 0` document. Every one is a claim `grep` gets wrong, which is the test this
document already applies. None of it is grep-shaped work smuggled into browser automation.

**The cap was costing a check that catches shipped defects.** WO-1.4 shipped `src/store.js` and
`src/year-picker.js` without adding either to `sw.js`'s SHELL, and the verifier's first pass caught
it — but declined to write the check that would catch it *next* time, on the grounds that the
harness was already over cap. The defect it prevents is an installed app that will not open with
the network off, discovered on a teacher's iPad. Trading that for a line count is the wrong trade,
and noticing that is what a soft cap is for: **it is a prompt to look, not a budget to spend.**

That check now exists, is static rather than driven, and is allowed by "What it is allowed to
check" above — a static precondition that silently disables a feature. It walks `index.html`'s
module graph transitively and asserts SHELL covers it, guarded against a vacuous pass.

Also fixed in the same pass: the forced-failure check waited a fixed 150 ms for the chip, which
raced `MAX_WAIT_MS` and failed a green build intermittently. It now polls for a chip that is
settled **and still settled 600 ms later**, because a single sample cannot tell a finished failure
from the gap between two attempts.

**Still open, and deliberately not fixed here:** a stale max-wait timer restarts a doomed write
once, about five seconds after it permanently failed. `save()` returns early at `store.js:343`
without clearing timers, which is the candidate. It is bounded — the write fails again and stops,
and `rev` is put back both times — so it is a store question for WO-1.5, not a harness one, and
the harness no longer hides it.

## What it cannot do, and must never claim to

- **No 👤 item, ever.** No emulator has a thumb, a safe-area inset, a home-screen install, or
  Safari's real focus behavior. `TESTING.md`'s legend stands unchanged.
- **It is coupled to the WO-1.2 component shelf** — `#aboutModal`, `[data-modal-open]`, and the
  `window.planbook` console seam. WO-1.10 replaces `<main>` and takes all three with it. Those
  checks then degrade to announced `SKIP`s rather than false passes, which is correct behavior and
  still worthless: **a run that is mostly skips proves nothing.** WO-1.10 carries the task of
  re-pointing it at real screens.
- **Windows browser paths only.** It exits with a clear message elsewhere. Fine while the author is
  the only developer; a thing to fix if that changes.

## The traps live next door

Four CDP traps — the empty-but-truthy `CSSStyleRule.cssRules`, headless animations never advancing,
`setEmulatedMedia` not reaching `pointer: coarse`, and fixed debugging ports colliding — are
documented in [`../tools/README.md`](../tools/README.md) § "Driving a browser over CDP". All four
present as app defects rather than harness bugs, and two of them were diagnosed twice by two
different agents before being written down. **Do not write a second harness.** Read that section
first, and use `window.__eachRule` rather than hand-rolling a rule walk.

## If this turns out to be wrong

Back it out. The tool is one commit (`63c5e00`), isolated from app code, and nothing depends on it —
`git revert` is the whole procedure. That is deliberate: a verification tool that is expensive to
delete has already become infrastructure.
