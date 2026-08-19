# WO-4.1 — continuation brief: the harness section

**Why this exists.** The original WO-4.1 dispatch was terminated mid-run by an API session limit.
The implementer's writes all landed; its result file never did, so its self-report is gone. The
verifier then passed all five Acceptance lines **by construction** and named one undischarged
requirement, which is the whole of your job. Do not re-implement WO-4.1. Do not touch the five
Acceptance lines. The engine is built and the 👤 iPad sitting came back green on all six readings.

## Your scope, and it is narrow

Add a `tools/verify-shell.mjs` section that exercises `src/signals.js` and `src/signal-settings.js`.
Today the harness is **byte-for-byte unmodified** by this work order: 963 checks pass over a
codebase that does not call `evaluate()` once. That green count cannot express any failure in either
new file, which is the same shape as the backup-nag escape.

**The seam already exists and nothing reads it.** `src/shell.js:2405-2415` exposes `signals` and
`signalSettings` on `window.planbook` and argues at length for exactly this check — including the
one defect no click can reach, that a RESET might delete the keys rather than write twenty-two
numbers, two builds that "look identical on screen and evaluate identically today." That comment
currently asserts a purpose the repo does not fulfil. Your section is what makes it true.

## The four cases, each named by the verifier as fixture-invisible today

1. **A student failing with perfect attendance.** Acceptance 3's archetype. A generic
   strong-student / struggling-student fixture cannot express it — the struggling student is usually
   also the absent one. This is the one that proves both directions from one pass, one student, two
   different explanation strings.
2. **A grade within 0.005 of a threshold** (e.g. 64.9985 against the 65 line). `sayPercent`'s
   escalation branch at `src/signals.js:294-297` is unreachable on round fixture grades, so the
   entire rounded-lie defence is untested unless a grade is planted to land there. Assert on the
   printed sentence, not on the internal number.
3. **A class with a partial window, and one with zero recorded meetings.** The partial-window
   sentence ("across the last 6 recorded meetings") and the `percent: null` no-window arm are both
   invisible against a fixture class that always has a full 20.
4. **The document read after `resetThresholds()`.** Delete-vs-write is indistinguishable on screen
   and in today's evaluation. Only `getDoc().signals` can tell — assert all 22 keys are **present**
   with their shipped values, not merely that nothing is left non-default.

## Constraints

- **Instrument only.** `src/signals.js` and `src/signal-settings.js` are verified and iPad-green.
  If your section finds a genuine defect in either, **report it, do not fix it** — that is a separate
  decision for the owner, not a quiet repair folded into a harness commit.
- Follow the file's existing fixture idiom — read neighbouring sections first and match how they
  seed, announce, and tear down. A SKIP is never a pass: if a case cannot be built, say so loudly in
  the check's own message rather than letting it pass silently.
- No new dependencies, no test framework, no `package.json`. Bare Node under `tools/`.
- Do not touch anything under `design/mockups/` — six modified, three untracked, unrelated in-flight
  design work by the owner.
- `sw.js` is already at v82 with both new files in `SHELL`. `tools/` is not in `SHELL`, so a harness
  change needs **no** further CACHE bump. Do not bump it again.
- Nothing is committed yet and the work order still reads `🤖 CLAIMED — 2026-08-19`. Leave the
  status line and all five Acceptance boxes exactly as they are; ticking is not yours.

## Report

Quote the full `node tools/verify-shell.mjs` output — the new count, and any failure your section
produces. Say which of the four cases each check covers, and name anything you could not make
falsifiable and why.
