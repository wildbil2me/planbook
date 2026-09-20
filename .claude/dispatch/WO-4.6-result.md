# WO-4.6 — A rule that cannot fire *yet* is a different sentence from a rule that is not built · result

**Implementer** work-order-implementer (Claude, Opus), 2026-09-20.
**Tree** left uncommitted on `main`, **fully staged** (eight files). Row status `🤖 CLAIMED —
2026-09-20`, untouched, for the orchestrator's `--handoff`. Nothing committed, nothing pushed.
**Mutations** two planted, two reverted; `git diff --cached | grep "^+.*MUTATION"` finds one line and
it is `TESTING.md` prose quoting the grep command. `grep -rn MUTATION src tools` lists the same
thirteen pre-existing prose mentions `HEAD` carries (`src/shell.js:911`'s "A CLASS MUTATION ADDED
LATER…", README history, harness comments) — counted at `HEAD` and in the tree, 13 and 13.

## What was built

`notYetRules(doc, cls, termId, { through })` in `src/signals.js`, beside `inertRules()`. It answers
*built, registered, and cannot fire yet against this document on this date*; `inertRules()` still
answers *not built*. Same entry shape — `{ id, direction, text, why }` — plus `have`, `want`, `unit`.

- **Ten rules carry `early(t, has)`** next to their `measure()`, each with a comment saying why it is
  window-shaped and which null arm it mirrors. `t` is `ctx.t` (= `thresholdsOf(doc)`); `has` is five
  class-level numbers: `assignments`, `worthPoints`, `meetings`, `termMeetings`, `reach`.
- **Four rules have none**, listed with reasons at `notYetRules()`: `grade-below` and
  `attendance-below` (levels — fire on the first graded cell / first recorded meeting),
  `attendance-window` (fires on any non-empty window), `behavior-window` (days over the log, not
  term data; two entries on day two fire it).
- **Every count is an upper bound on what any one student can have**, so a named rule is one
  `evaluate()` cannot return a hit for that morning, for anybody. The answer under-names rather than
  over-claims.
- `makeContext()` gained two class-level readers: `termWork()` (the existing `sequence`) and
  `everyMeeting()` (`this.meetings(Infinity)` — one meetings resolution, same cost as a window of 20).
- `src/log.js` gained one reader, `firstBehaviorDate(doc, studentIds, throughISO)` — a date or `''`,
  over a roster, for the turnaround probe (below). No entry, subject or body crosses.
- `docs/data-model.md` § Signal thresholds gained a subsection *Not enough term yet*.
- `sw.js` `CACHE` v120 → v121 (`src/signals.js` and `src/log.js` are `SHELL` entries).

## Acceptance, line by line

1. **Thin term names the rules whose windows are not full and no others; full term returns `[]`.**
   **Met, measured both ways** in `tools/verify/signal-engine.mjs` (new block at the foot, eight
   `check()` sites). Thin class (term four days old, 3 assignments worth points, 3 meetings) names
   exactly, in registry order: `grade-fell 3/5 assignments`, `absence-window 3/4 recorded meetings`,
   `tardy-count 3/5 recorded meetings`, `grade-rose 3/5 assignments`, `turnaround 4/21 days`,
   `no-missing 3/8 assignments`, with six literal `why` sentences asserted word for word. It names
   none of the four rules whose shipped threshold is exactly 3 (`low-score-run`, `missing-count`,
   `absence-run`, `high-score-run`). Full class (9 assignments, 25 meetings reaching back 34 days)
   returns `[]`. The title's claim is asserted against the pass: the thin class's student fires
   `grade-below`, `low-score-run`, `attendance-below`, `absence-run` and the intersection with the
   not-yet list is `[]`. Also: an empty dated term names all ten with the turnaround's *nothing
   dated yet* sentence; and the reach class stops naming the turnaround once a behavior entry 25
   days old exists. Mutation-proved both ways (table below).
2. **`inertRules()` unchanged and still `[]`.** **Met.** `git diff src/signals.js` deletes exactly one
   line (the `./log.js` import, re-wrapped to add a name); `inertRules()`' body is untouched. The
   harness asserts `inertRules()` is `[]` beside the full term's `[]`, and that `signalRules()` shows
   no `inert` string on any of the fourteen.
3. **No writer of any kind; reads through `{ through }`; stores nothing.** **Met.** Grepped: no
   `update(`, no store import, no `setPref`/`localStorage` in `src/signals.js`. `through` is
   `opts.through || todayISO()`, the same line `evaluate()`, `applyCooldown()` and `quietMiddle()`
   use. The harness byte-compares `JSON.stringify(doc)` either side of the four calls: `identical`.
   (No structural sweep section covers `src/signals.js`'s no-writer claim; the harness line and the
   grep are the evidence, as they were for WO-4.3 and WO-4.5.)
4. **A rule is handed its own measured numbers and nothing else; no `evaluate()` re-run.** **Met, read
   off disk.** `notYetRules()` calls `rule.early(ctx.t, has)` and nothing else on a rule; its body
   contains no `evaluate(` and no `measure(` (awk over the function, grepped). `has` is five numbers
   (one of them `null` when nothing is dated); no document, no context, no clock reaches a rule.
5. **No screen changed.** **Met.** `git diff --cached --stat`: `src/signals-view.js`, `src/glance.js`,
   `index.html` and every `.css` are absent. The eight files that moved are listed below.

Nothing on this work order is 👤 or 📆, so no box is left open for hardware or the calendar. All
five `[x]` in `plans/work-orders/phase-4-signals.md` are mine, each backed by the evidence above.

## What I could not verify

- Nothing needing an iPad — there is no surface. When a screen wears this answer, its own row will
  owe a 👤 reading; this one does not.
- The `absence-window` edge where `absenceCount > absenceWindowMeetings` (a window that can never
  fill): the answer names the rule with e.g. `have 20 / want 25`, which reads as the setting it is.
  Deliberate, commented at the rule, not harness-covered.

## Decisions the work order did not settle

- **`grade-fell` / `grade-rose` want `asked + 1`, not `asked`.** The brief listed them as
  partial-window rules ("measures over `slice(-asked)` whatever its length"). The window is, but
  `before` = `gradeWithout(window.length)` is null whenever the student's whole counted history is the
  window — the rule's own paragraph — so the smallest firing history is `asked + 1` and a term of
  exactly 4 assignments can supply a fall to nobody. Sentence: *"wants 5 — 4 to measure across and
  one before them"*. Recorded at both rules and in the phase-file landing note.
- **The turnaround's bound is the dated record, not the term's age.** "Term started < 21 days ago"
  is unsound: `absence-window` is not term-bounded, so in week one of Quarter 2 a student absent at
  the end of Quarter 1 and present since *is* a turnaround. Only four concern rules can differ across
  the gap (three attendance, one behavior; grade rules read nothing dated, and if one fires then it
  fires now and `concernNow()` empties the turnaround). So the rule cannot fire while no recorded
  meeting of the class and no behavior entry about anyone on the roster is dated `through − days` or
  earlier. `has.reach` = days from the older of those two to `through`; named iff `reach < days`.
  The behavior half needed a roster-level date out of `src/log.js` — the only file touched that the
  work order did not name — because reading it per student is the concern pass in disguise.
- **`early()` lives on the rule object**, like `figure()`, rather than in a switch at
  `notYetRules()`: it keeps each threshold reading next to the null arm it mirrors so an edit to one
  cannot miss the other. The four "out" rules are listed once, centrally.
- **A threshold of 0 is the rule switched off, not early** (`grade-fell`, `grade-rose`,
  `no-missing`, `turnaround`, `absence-window`'s window): those `early()`s return null on 0, matching
  their `measure()`'s own `if (!asked) return null`.

## Out-of-scope temptations declined

- Wearing the answer on `.sig-inert` or the glance quiet panel — Acceptance 5 forbids it; the
  machinery is one `import` away when the room argument is made.
- A `wo-sweep.mjs` section asserting `src/signals.js` has no writer structurally (the § 17 shape).
  Not asked for; would be its own row.
- Making `early()` skip permanently-impossible settings (`need > asked`). Left honest and commented.

## Files changed (all staged)

- `C:\dev\planbook\src\signals.js` — header paragraph, `firstBehaviorDate` import, `shortOf()`,
  `early()` on ten rules, `termWork()`/`everyMeeting()` on the context, `notYetRules()`.
- `C:\dev\planbook\src\log.js` — `firstBehaviorDate()` at the foot.
- `C:\dev\planbook\tools\verify\signal-engine.mjs` — WO-4.6 block at the foot, eight checks.
- `C:\dev\planbook\tools\README.md` — call-site count 1405 → 1413; a WO-4.6 paragraph.
- `C:\dev\planbook\sw.js` — `CACHE` v120 → v121.
- `C:\dev\planbook\docs\data-model.md` — § *Not enough term yet*.
- `C:\dev\planbook\TESTING.md` — § WO-4.6 with the mutation table.
- `C:\dev\planbook\plans\work-orders\phase-4-signals.md` — five `[x]`, landing note after Traps.
  (The `🤖 CLAIMED` status line was the orchestrator's edit and is unchanged.)

## Commands run, with their summary lines (all read from output after exit)

- `node tools/wo-sweep.mjs` on the untouched tree: `EXIT=0` (baseline).
- `node tools/wo-sweep.mjs` after the harness block, before the README count moved: **FAIL** ×2 —
  SHELL/CACHE (`src/log.js, src/signals.js changed since planbook-shell-v120`) and call-site count
  (`1413 … up 8 on the 1405 recorded`). Fixed by the `sw.js` bump and the README line.
- `node tools/verify-shell.mjs` (run 1, delivered code): `1422 checks · 1422 passed · 0 failed ·
  0 skipped`, `44,517 lines · 31.3 lines per check · 496s`, `EXIT=0`. All eight WO-4.6 lines PASS.
- **Mutation A** (`shortOf()` `<=` for `<`): `1422 checks · 1419 passed · 3 failed`, `EXIT=1` — the
  thin-set check, the sentences check, and the overlap check (`overlap ["low-score-run","absence-run"]`).
- **Mutation B** (`return []` before consulting a rule): `1422 checks · 1418 passed · 4 failed`,
  `EXIT=1` — thin set, sentences, empty term's ten, reach class's turnaround; the full-term `[]` and
  the no-writer line stayed green, correctly.
- `git checkout -- src/signals.js` after each; `grep -c MUTATION src/signals.js` → 0.
- `node tools/verify-shell.mjs` (final, delivered tree): `1422 checks · 1422 passed · 0 failed ·
  0 skipped`, `44,517 lines · 31.3 lines per check · 504s`, `EXIT=0`.
- `node tools/wo-sweep.mjs` (final): `42 checks · 39 passed · 0 failed · 3 to review`, `EXIT=0` —
  the same three reviews as `HEAD`.
- `node tools/wo-gate.mjs WO-4.6`: `PASS | gates clear for WO-4.6` (with the expected `🤖 CLAIMED`
  and interrupted-draft notes, since this file did not exist yet).
- `node tools/wo-gate.mjs --audit`: PASS, `overall row 71/81`.
- `tasklist | grep msedge`: no headless `msedge.exe` left behind (only WebView2 hosts unrelated to the run).

## Draft CHANGELOG entry (the teacher decides)

> **The signal engine can now say "not enough term yet."** `notYetRules()` names the rules whose
> thresholds ask for more assignments, meetings or days than a class has produced so far, with the
> figures — *the term has 3 assignments so far; this rule wants 5*. It is a second answer beside
> "not built", never the same one, and no screen wears it yet.
