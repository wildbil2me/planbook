# WO-1.17 — result

**Implementer** Claude (work-order-implementer), Opus · **Date** 2026-08-15
**Work order** `plans/work-orders/phase-1-shell-store-roster.md:1032`
**Status left as** `🤖 CLAIMED` — the transition out of it is the orchestrator's `--tick`, not mine.

## The two runs, and which is which

Both were run locally on this machine, to completion, and the summary lines below are copied from
their output rather than predicted.

| Run | Tree | Result |
|---|---|---|
| `node tools/verify-shell.mjs` | the new checks against the **unfixed** `hasSomethingToLose()` | `766 checks · 764 passed · 2 failed · 0 skipped`, 246s, exit 0 |
| `node tools/verify-shell.mjs` | the delivered tree | `766 checks · 766 passed · 0 failed · 0 skipped`, 20,362 lines, 26.6 lines per check, 246s, exit 0 |
| `node tools/wo-sweep.mjs` | the delivered tree | `20 checks · 18 passed · 0 failed · 2 to review`, exit 0 — both REVIEWs are the standing ones (297 sensitive-field-name mentions; the due-date / `late`-`missing` list) |

*(A baseline run before any edit read `762 checks · 762 passed · 0 failed · 0 skipped`, 245s. The
delivered green run was repeated after the last edits landed so the figures above describe the tree
that is on disk and not an earlier one — 246s and 247s across two identical-content runs; the file
records 246s.)*

The red run is reproducible: restore `src/backup.js` to `HEAD`, leave `tools/verify-shell.mjs` as
delivered, run the harness.

## Against the Acceptance list, one line at a time

**1. A document holding score cells and no assignments raises the nag — [x] ticked.**
`verify-shell.mjs`, *"a document holding score cells and NO assignments raises the nag"*. The fixture
is `newYearDocument()` with `scores` filled and nothing else: one column, two cells (`{v:90}` and a
`missing` flag), zero classes, zero students, zero assignments, zero everything else — the check
asserts that emptiness rather than assuming it. **Red on the unfixed build** (`nag down`), green here
(`nag UP`, lead *"You have never downloaded a 2040-2041 backup."*).

**2. A document whose only content is a hall pass — open or closed — raises the nag — [x] ticked.**
Same block, *"a document whose only content is a hall pass — open or finished — raises the nag"*. Two
samples, not one: `openPasses` alone, then `passes` alone, because they are two collections
(`docs/data-model.md` § *Hall passes are two collections*) and a check that only asked one of them
would pass over a build that saw the other. **Both red on the unfixed build**, both green here.

**3. A brand-new document still does not raise it — [x] ticked.**
*"a brand-new document still does NOT raise it — the day-one rule survives the fix"*: a bare
`newYearDocument()`, twelve seeded letter bands, nag **down** — on both trees, which is the honest
reading: this rule was already true and the fix preserved it. The check reports the letter-scale
count in its detail so it cannot pass over a document that is empty of *everything*. The comment that
states the rule is byte-identical to what was there before; the only lines removed from
`src/backup.js` in this whole change are the two lines of the old sum (`git diff` confirms).

**4. `verify-shell.mjs` gains checks proved against a fixture where the omitted collection is the
only content — [x] ticked.** Per check, as the brief asks:

| New check | Against the unfixed build |
|---|---|
| score cells, no assignments | **FAIL** — `scores only: nag down over {…"assignments":0,"scoreColumns":1,"scoreCells":2…}` |
| one open hall pass / one finished hall pass | **FAIL** — `one open pass: nag down …openPasses:1…` \| `one finished pass: nag down …passes:1…` |
| brand-new document | PASS on both trees — stated as such above, not claimed as evidence of the fix |
| scratch year cleaned up | PASS on both trees — it is a fixture-hygiene check, not a claim about the app |

The masking is why this mattered: any fixture with a class, a roster or an assignment in it goes
green on both trees. Every fixture here is one collection and no other.

**5. The collection list is checked against `docs/data-model.md` rather than against memory, and the
way it is checked is written down — [x] ticked.** `tools/wo-sweep.mjs` § 14. `src/backup.js` now
carries two lists — `CONTENT_COLLECTIONS` (each key paired with the counter its documented shape
needs) and `NOT_CONTENT` (every other top-level key with the reason it is not content) — and the
sweep asserts they name **exactly** the top-level keys of the sketch under `## The document`, in both
directions, plus that each counter matches the documented shape (`[` → `count`, `{` → not `count`).
Written down in three places: the block comment at the check, the block comment at the lists, and
`tools/README.md`. Proved non-vacuous by three mutations, all reverted:

- a `"rubrics"` collection added to the sketch and classified nowhere → red, naming it;
- `scores` paired with `count` → red, quoting the trap;
- `templates` misspelled `template` in the code list → red **twice**, once per direction.

## The judgment call (deliverable 2), and why this mechanism

Options considered: a runtime assertion, a single derived list, a harness check.

I chose **a static reconciliation in `wo-sweep.mjs` against `docs/data-model.md`**, with the
enumeration restructured into two machine-readable lists in `src/backup.js`. Reasons, all written
into the code:

- The acceptance line names `docs/data-model.md` as the thing to reconcile against, and that file is
  where collections are actually argued (WO-2.8's two are added there with three paragraphs of
  reasoning). The sweep runs in a second, in a command every dispatch already runs, without a browser.
- Requiring an **exclusion with a reason** is what makes the next omission loud in the right way: the
  sweep does not ask "did you count it", it asks "did you decide". That is a question a hand-written
  sum cannot be asked at all.
- The counter-vs-shape clause exists because the Traps line describes a fix that looks right and
  changes nothing; now that edit is red rather than silent.

**The alternative I rejected, and it was close:** deriving the list at runtime from
`newYearDocument()`'s keys, which is exactly what `parseBackup()` does one screen away in the same
file ("so this check cannot drift away from the document it is checking"). Three reasons, recorded at
the point of departure: it reconciles against a second hand-maintained list in `src/store.js` rather
than against the documentation; it has nowhere to hold *why* a key is excluded, and every exclusion
here is a judgment somebody will want to re-open; and "every collection except these" is one refactor
away from "anything non-empty", which is the thing the Traps line forbids.

**What it would and would not have caught**, since the brief asks: it would have gone red on
2026-08-06, the day WO-2.8 added `openPasses` and `passes` to the sketch — which is the whole defect,
six days before a verifier found it by accident. It would **not** catch a wrong decision: an entry
parked in `NOT_CONTENT` with a plausible sentence passes. Nor does it see a collection that reaches
`src/store.js` and never reaches `docs/data-model.md`; that bound is stated at the check rather than
built, because the acceptance line names the documentation as the source of truth.

## Decisions the work order did not settle

- **`teacher`, `letterScale` and `signals` are classified `NOT_CONTENT`, with reasons.** The work
  order names three collections to add and forbids widening into "anything non-empty", so I did not
  widen — but the new list forced every remaining key to be classified explicitly, which is the first
  time anyone has had to write these down. `teacher` is the one worth a second opinion: a name, a
  school and two addresses *are* typed by a teacher. I excluded it because they are re-typed from
  memory in a minute and the nag is about the record that cannot be reconstructed. The reason is in
  the code where it can be argued with. `signals` carries a note to revisit when Phase 4 lets a
  teacher tune thresholds.
- **The harness's own duplicate of the enumeration** (`tools/verify-shell.mjs`, the WO-1.11
  `beforeAll` fixture) restated the same seven collections and would have been stale the moment the
  app's list grew. I corrected it and kept it an *independent* restatement rather than routing it
  through the seam — it decides which years *ought* to nag, and asking the app that would make the
  assertion agree with itself. Said so in the comment.
- **A sentence added to `docs/data-model.md` § Backups** saying the nag only fires on a document that
  holds something a teacher typed, and that adding a collection to the sketch and nowhere else turns
  the sweep red. Not asked for; it is where somebody adding a collection is standing when they need
  to know. It changes no shape and no data.

## Out of scope — what I did not touch, and one temptation declined

Untouched, per the Out of scope line: when the nag is evaluated (boot / backup / restore / year
switch), its wording, its markup and styling, and the compare panel. The only lines *removed* from
`src/backup.js` are the two lines of the old sum.

**The temptation, declined and recorded here instead:** `refreshBackupNag()` reads `getDoc()` and
answers about the open year only, so a second year on the device holding nothing but scores is still
silent until the teacher switches to it. The backup panel's "never downloaded" line covers that case
by year label, so it is not a hole — but it is the same shape of problem one screen over, and it is
WO-1.11's surface rather than this one's. Not booked; named here so the next reader has it.

## What I could not verify

- **Nothing needing an iPad, and I claim no 👤 line.** WO-1.17's Acceptance list has none, and
  `TESTING.md` now says why in as many words: nothing on screen changed — the strip's markup,
  wording, styling, touch targets and evaluation points are all untouched — so what changed is a
  predicate, and a predicate is what a desk harness settles. The two 👤 lines this strip has ever
  owed are about how it *reads* on the device and were closed 2026-08-04 and at WO-1.11.
- **The service worker.** `sw.js`'s `CACHE` is bumped to `planbook-shell-v64` because `src/backup.js`
  is in `SHELL` (the sweep demanded it). The harness has never seen a service worker, so that the
  bumped shell actually replaces the installed one is proved by a deploy and `verify-deploy.mjs`, not
  by anything I ran.
- **No 44px work was owed.** No control, no markup and no CSS was added; the sweep's coarse-pointer
  check reports `0 added line(s) in tracked src/*.css`.

## Files changed

- `c:\dev\planbook\src\backup.js` — `CONTENT_COLLECTIONS` and `NOT_CONTENT` above
  `hasSomethingToLose()`, which now reduces over the first list. The day-one comment is unchanged.
- `c:\dev\planbook\tools\wo-sweep.mjs` — § 14, the reconciliation against `docs/data-model.md`.
- `c:\dev\planbook\tools\verify-shell.mjs` — the WO-1.17 block at the foot of the `backup & restore`
  section (four checks + one fixture-guard failure arm), and the corrected duplicate enumeration in
  the WO-1.11 fixture.
- `c:\dev\planbook\docs\data-model.md` — a paragraph in § Backups.
- `c:\dev\planbook\sw.js` — `CACHE` → `planbook-shell-v64`.
- `c:\dev\planbook\tools\README.md` — call-site count 764 → 769 with the executed count from the run;
  the sweep is 19 checks → 20, with what § 14 does and does not catch.
- `c:\dev\planbook\TESTING.md` — a WO-1.17 section: desk pass, the red-run table, the sweep mutations,
  and why no 👤 line is owed.
- `c:\dev\planbook\plans\work-orders\phase-1-shell-store-roster.md` — the five Acceptance boxes
  ticked, each with the evidence beside it. **Status left at `🤖 CLAIMED`.**

Not touched, deliberately: `CHANGELOG.md`. Nothing was committed or pushed.

## CHANGELOG draft — for the teacher to accept, reject or rewrite

> **Fixed** — The backup reminder can now see a year whose only content is grades or hall passes. It
> counted classes, students, assignments, attendance, notes, calendar events and templates, and not
> score cells or hall passes — so a document holding only those could go a week without a backup and
> say nothing. A brand-new year still says nothing, which is the point of it. The list it counts is
> now checked against the data model on every sweep, so the next collection added cannot go missing
> from it quietly.
