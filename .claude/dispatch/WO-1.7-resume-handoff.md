# WO-1.7 — resume handoff after a host crash

**Read `.claude/dispatch/WO-1.7-brief.md` first and in full. It is unchanged and it is still the
spec.** This file is an addendum, not a replacement. Where the two disagree, the brief wins.

## What happened

A previous work-order-implementer was killed mid-run by a host crash. It never reported and never
wrote `.claude/dispatch/WO-1.7-result.md`. **Its context is gone. Its work is on disk.**

That makes what is in the tree an **unverified draft**: substantially complete, but nothing has
checked it — including whether it stayed inside the work order's **Out of scope** line. So:

- **Do not restart from scratch.** It is most of a good implementation and rebuilding wastes it.
- **Do not trust it.** No verifier, no harness, and no human has read it. It may have drifted.

**Your first task is an audit, before you add a line.** Read `src/roster.js`, `src/teacher.js`, and
the diffs to `index.html`, `src/shell.css`, `src/shell.js`, `src/classes.js`, and `sw.js` **line by
line against the brief**. Check it against the Deliverables, the Out of scope line, the Traps
paragraph, and the constraints block. Then finish it.

**In your result, report what you kept versus what you rewrote, and why.** A section titled
"Audit of the crashed draft" listing the drift you found — or stating plainly that you found none
and on what basis — is part of the deliverable. Silence there reads as "did not look."

## Tree state, confirmed by the orchestrator at resume

```
?? src/roster.js      1279 lines, new
?? src/teacher.js      106 lines, new
 M index.html         +326
 M src/shell.css      +149
 M src/shell.js       +101
 M src/classes.js       +7
 M sw.js               +4
   src/backup.js      NOT modified
```

All four changed JS files pass `node --check`. There is no result file.

## What is still owed — five items, in priority order

### 1. No roster checks were added to `tools/verify-shell.mjs`. This is the biggest gap.

There is no roster or contacts section in the harness output at all. The brief asks for checks
covering what you build, in the existing idiom. Read the neighbouring checks first and match their
shape — the checks WO-1.6 added for classes and terms are the closest model.

A fixture that cannot express the failure is not evidence. Each of the five Acceptance lines below
should have a check that would go **red** if the behavior broke, not one that merely confirms a
function exists.

### 2. `wo-sweep` REVIEW — ten new CSS selectors with no `@media (pointer: coarse)` rule

```
.roster-list  .roster-row-actions  .roster-form  .roster-actions  .student-grid
.student-field  .guardian-list  .guardian-card  .guardian-head  .student-delete-facts
```

The 44px minimum is a hard constraint, not a nicety. Go through these one at a time: add the coarse
rule where the selector is or contains a touch target, and where it is a pure layout container that
holds no tappable thing, say so explicitly in your result naming the selector and why. Do not
blanket-add rules to silence the sweep, and do not blanket-dismiss them either.

### 3. `wo-sweep` REVIEW — sensitive field names outside `src/backup.js`

Six mentions across `index.html`, `src/prefs.js`, `src/shell.css`. Read every one and confirm none
emits to a merge field, export, print surface, or log line.

**`supports` / accommodations is out of scope for WO-1.7** — it belongs to WO-1.8. Anything beyond
an inert placeholder deserves a hard look and, if the crashed draft started building it, it should
come back out and be named in your result as removed drift. This is the most sensitive data in the
app; the work order deferred it deliberately.

Note: this same REVIEW line stood at 6 mentions **before** WO-1.7 began, so it is likely pre-existing
and unchanged. Confirm that rather than assume it — `git stash` is not needed, `git diff` will tell
you whether any of the six is yours.

### 4. The five Acceptance lines are unverified

Nothing has exercised the paste box, the duplicate warning, the one-student-two-classes identity,
the remove-from-one-class case, or the email round-trip. Verify each one, by a check or by driving
the browser over CDP — `tools/README.md` § "Driving a browser over CDP" documents four traps that
present as app defects rather than harness bugs, and two agents have each rediscovered them from
scratch. Read it before you write a driver.

Anything that genuinely needs a real iPad or human eyes: say so. Do not assume it.

### 5. `.claude/dispatch/WO-1.7-result.md` does not exist

Write it as your last act, and return it in-band too.

## One authorized harness repair, scoped narrowly

`node tools/verify-shell.mjs` currently reports **1 failure**, and it is a **harness bug, not a
regression**. The orchestrator diagnosed it independently:

- `src/backup.js:121` — `dateStamp()` builds the stamp from **local** date parts
  (`getFullYear`/`getMonth`/`getDate`).
- `tools/verify-shell.mjs:865` — the check compares against
  `new Date().toISOString().slice(0, 10)`, which is **UTC**.

At the moment of the run, local was `2026-08-04` and UTC was `2026-08-05`. The app produced the
correct `Planbook 2026-2027 backup 2026-08-04.json` and the check demanded `…2026-08-05.json`. It
passes at every other hour of the day, which is why it survived prior work orders. `src/backup.js` is
untouched by this work order.

**You are authorized to fix the check to derive the local date, and only that.** Change the date
derivation on that one check; touch nothing else in the harness except to add your new roster checks.
This is repairing a check that tests the wrong thing — it makes the check stricter about the right
value, not looser. Prove that in your result: `git diff --numstat tools/verify-shell.mjs` should show
your added checks and this one-line correction, with no existing check weakened or deleted.

**Do not** "fix" this by changing `src/backup.js` to emit a UTC stamp. A teacher in EDT downloading a
backup at 8pm expects today's date on the file, not tomorrow's. The app is right and the check is
wrong.

If you disagree with this diagnosis, leave the check alone and say so explicitly in your result with
your reasoning, so the verifier is not blindsided by a red run.

## Standing reminders that the crash does not change

- **Stay inside the work order's Out of scope line.** `supports`/accommodations is WO-1.8; the Roll
  Call! importer is WO-2.7. If the right thing to do is outside the Deliverables, say so in your
  result as a proposed follow-up work order — do not just do it.
- **Do not tick roadmap boxes, edit `plans/`, or touch `CHANGELOG.md` / `TESTING.md`.** Maintenance
  happens after the verifier reports, and the orchestrator holds that pen.
- **Do not write a second harness.** `tools/verify-shell.mjs` and `tools/wo-sweep.mjs` are the two.
- Both must be green before you report — `wo-sweep` REVIEW lines are not failures, but each one owes
  a written confirmation in your result.
