# WO-6.9 — The review count opens a page that shows the review · result

**Written by the recovering session, not the implementer.** The implementer (work-order-implementer,
Opus, 2026-09-16) was killed by a power cut inside its mutation round and wrote no result file. This
document is composed from the tree and from commands re-run on it after recovery — nothing below is
taken from the implementer's prose except where it is labelled as its claim.

**Tree** left uncommitted on `main`, fully staged. **Row status** `🤖 CLAIMED — 2026-09-16` at the
time of writing, for the orchestrator's `--handoff`.

## What was found on recovery

- `grep -rn MUTATION src/ tools/ index.html` → **one live plant**, `src/glance.js:758`:
  `row.setAttribute('data-calendar-through', ''); /* MUTATION A: blank the edge */`. That is the
  brief's mutation (a) — the implementer had planted it and died before reverting. Reverted to
  `item.to`, which is what the record `closingIn()` builds already carried (`from: w.from, to: w.to`
  is in `HEAD`'s `src/glance.js:421`).
- Every file the implementer wrote was present: `index.html`, `src/calendar-view.css`,
  `src/calendar-view.js`, `src/glance.js`, `src/shell.js`, `sw.js` (v120), `tools/README.md`,
  `tools/verify/glance-quiet.mjs`, `plans/work-orders/phase-6-calendar-glance.md`.
- **Missing:** `TESTING.md § WO-6.9`, which `tools/README.md` cited as holding the mutation table.
  Written on recovery. **Missing:** this file.
- The phase file's five `[x]` ticks were the implementer's own, written over a tree carrying the
  plant. Every claim under them was re-run before this file was written.

## Commands re-run on the recovered tree

- `node tools/wo-sweep.mjs`: `42 checks · 39 passed · 0 failed · 3 to review` — the same three
  reviews as at `HEAD` (checked by stashing and re-running).
- `node tools/wo-gate.mjs WO-6.9`: PASS, with the expected `🤖 CLAIMED` and *interrupted draft* notes.
- `node tools/wo-gate.mjs --self-check`: 40 of 40.
- `node tools/verify-shell.mjs`: `1411 checks · 1411 passed · 0 failed · 0 skipped`, 43,961 lines,
  31.2 lines per check, 497s, `EXIT=0`. This matches the implementer's cited 1411 exactly.

## Mutation round (owed by the brief, done on recovery)

Each planted by an exact-string swap script, run once, reverted by the same script; the tree was
fully staged first so `git diff` is empty after each revert.

- **M(a) — blank the second attribute** (the corpse's own plant, re-planted on purpose):
  `1411 · 1404 · 7 failed`. Red: the fixture check, the landing-and-sentence check, the
  window-and-nothing-else check, the week check, the → check, the line-2 check, the line-3 check.
- **M(b) — the review's date on the button**: `closingIn()` handing
  `reviewDatesIn(doc, w.from, w.to)[0].date` as `to`. `1411 · 1404 · 7 failed`. Red: the same set
  less the window-and-nothing-else check, plus the disk-read line-4 check (the mutation added a
  second `reviewDatesIn(` call site and the static count caught it).
- `grep -c MUTATION src/glance.js` → 0 after. No headless `msedge.exe` left behind.

## Acceptance, line by line — what the harness shows, not what the implementer claimed

1. **Cross-month window, review only in next month's part.** Met by the harness (option 4: the
   sentence). Tap lands on `calendarView`, scale `month`, September, every class; `#calendarThrough`
   shown, equal to the model's `throughText` and to the sentence the harness builds from the window's
   edge alone; live region carries it; WEEK keeps it reworded; → lands on October with it gone and the
   review a chip in range; the home button's own door draws none; nothing in `localStorage`.
2. **Review only in this month's part.** Met: row `outerHTML` byte-identical, same landing, review a
   chip in range, sentence word for word.
3. **No name, date, kind; no review's ISO date in the DOM.** Met: every ISO date in the row equals
   `leadWindowOf().to` (2026-10-09); the review's 2026-10-01 is absent. M(b) proves the check is live.
4. **`reviewDatesIn()` sole asker; no new `presentationMode()` asker.** Met, read off disk with
   comments stripped; sweep still says *asked by 8 other file(s)*. M(b) proves this check is live too.
5. **Presentation mode: row absent, no "hidden" line.** Met through the header's real control.
6. **👤 iPad.** Owed. Not something a harness closes.

## Open for the owner

- **Option 4** was the dispatcher's answer to the open `Open` line. The status file records that the
  owner may overrule before the verdict. Options 1 and 2 are still on the table; option 3 is refused
  by the Traps line.
- The 👤 line. `CHANGELOG.md` entry, per the brief, left to the maintenance protocol.

## For the verifier

Read `TESTING.md § WO-6.9` and the phase file's parenthetical under the open question. The seam
worth pressing: `throughText()` is computed against the window on screen at every render — the
harness checks month, week and one → page; it does not page *backwards* past today's month to see
the line return, which the view's own comment claims.
