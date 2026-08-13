# WO-2.25 — the print gate is answered when it is read, on every surface · implementation result

**Route** Claude (work-order-implementer) · **Reported** 2026-08-13
**Verdict in one line:** built as specified; five of six Acceptance lines closed and ticked, the
sixth (👤) is owed to the owner and is **not** ticked.

---

## What was built

`src/print-gate.js` — one module, `registerPrintGate(attr, isOnScreen)`, taking the `<body>`
attribute a surface's `@media print` block is selected under and a predicate answering whether that
surface is on screen right now. It registers the `beforeprint`/`afterprint` listeners and returns the
sync function to call immediately before `window.print()`. It knows nothing about modals, views or
`.hidden`; it holds a list of `{ attr, isOnScreen }` and nothing else.

`printGrades()`'s comment block **moved** into it rather than being paraphrased — it is the record of
the 2026-08-12 bug and it is now told once, with the three callers pointing at it. The three
surfaces each hand in their own attribute and their own predicate:

| Surface | Attribute | Predicate |
|---|---|---|
| `src/attendance-report.js` | `data-attendance-print` | `#attendanceRecordModal` is not `.hidden` |
| `src/detail.js` | `data-detail-print` | `currentView() === 'detail'` |
| `src/grades-report.js` | `data-grades-print` | `#gradesRecordModal` is not `.hidden` |

Every `PRINT_RELEASE_MS` and every timer around a print attribute is gone.

---

## Against the Acceptance list, one by one

### 1. `src/print-gate.js` exists; no `setTimeout` clears a print attribute — ✅ ticked

`grep -rn "PRINT_RELEASE_MS" src/` returns **nothing**. The seven `setTimeout`s left in `src/` are
`src/attendance.js:987` (rotation settle), `src/backup.js:328` (object-URL revoke),
`src/live-region.js:25`, `src/save-indicator.js:70` (fade) and `src/store.js:422`, `:423`, `:468`
(debounce, max-wait, retry). None touches an attribute. Verified by reading the grep output, not
inferred.

### 2. Three surfaces, three attributes, asserted per surface — ✅ ticked

One new check per surface, each reading all three attributes **and** the boxes of all three surfaces
out of one snapshot taken inside the stubbed `window.print()`. From the final green run:

- attendance — `{"attr":true,"detailAttr":false,"gradesAttr":false,"recordH":407,"detailH":0,"gradesH":0,"headerH":0,"mainH":0}`
- detail — `data-detail-print = true, data-attendance-print = false, data-grades-print = false; #attendanceRecordModal 0px, #gradesRecordModal 0px`
- grade sheet — `data-grades-print = true, data-attendance-print = false, data-detail-print = false; #attendanceRecordModal 0px, #detailView 0px`

### 3. The same five readings on all three; the timed-release check gone; run green — ✅ ticked, with one correction

`node tools/verify-shell.mjs` → **`674 checks · 674 passed · 0 failed · 0 skipped`**, 16,921 lines,
25.1 lines per check, **206s**, exit 0. That is the run made on the tree exactly as it now sits on
disk (the last of several — see "Runs made" below); I read the output, I am not predicting it.

**The line says "the two checks that asserted a timed release are gone" and there was only one.**
The detail section's *"and the attribute comes back off, so the next Ctrl+P is the browser's
business again"* is deleted here. The attendance section had none to delete: it never called
`printRecord()` at all — its own header said so and said why — and the only thing it measured about
the gate was that `<body>` carried no attribute **at rest**, which is green on a build that prints
the whole app on the second tap. The grade sheet's was already deleted at WO-3.9. So: one deleted
here, one deleted earlier, one that never existed. Nothing in the harness asserts a release now.

Each surface makes all five readings: gate ON at print time · still on 700ms after the tap · re-armed
by a `beforeprint` the app never asked for · cleared by `afterprint` · cleared by a `beforeprint`
raised while that surface is **not** up.

### 4. Each new check fails on the tree as it stands — ✅ ticked, on a narrower claim than the line makes

**Thirteen call sites added, one deleted (net twelve; 663 → 675).**

**Four of the thirteen fail on the unfixed tree.** `git stash push -- src/attendance-report.js
src/detail.js` (the timer, verbatim as shipped, with everything else in place) →
**`674 checks · 670 passed · 4 failed`, exit 1**:

```
FAIL | and the gate is still on while the record is on screen …
       :: <body> carries data-attendance-print 700ms after the tap = false
FAIL | a print the browser refused and the teacher then allowed re-gates itself …
       :: beforeprint with the record on screen left data-attendance-print on = false
FAIL | and the gate is still on while this screen is on screen …
       :: <body> carries data-detail-print 700ms after the tap = false
FAIL | a print the browser refused and the teacher then allowed re-gates itself …
       :: beforeprint with the detail on screen left data-detail-print on = false
```

**The other nine passed on the broken tree, and I am not going to pretend otherwise.** They are
shaped as absences the timer build also satisfies — it had already cleared the attribute, so
*"`afterprint` clears it"* and *"a Ctrl+P made when the surface is NOT up clears it"* pass for the
wrong reason. Rather than leave nine guards nobody had watched fail, I ran three mutations:

| Mutation | Result |
|---|---|
| `syncAll()` never removes an attribute, **and** the `afterprint` listener stops removing one | **6 red** — the `afterprint` and not-up readings on **all three** surfaces, `= true` in each detail line. Four of the six are new checks; the other two are the grade sheet's own, which is this work order re-verifying the surface that already worked |
| All three entry points call `window.print()` twice, **and** `syncAll()` sets every gate's attribute whenever any surface is on screen | **7 red** — the three one-tap checks at `= 2`, the detail and grade-sheet isolation checks, plus two collateral: *"9 element(s) still drawn outside the sheet"* and *"4 element(s) still drawn outside #detailView"* naming `DIV.modal-panel attendance-report-panel` — the shared-attribute defect printing the wrong surface, exactly as the three `@media print` headers say it would |
| `src/attendance-report.js`'s `PRINT_ATTR` set to `data-detail-print` — the Trap, made literal | **3 red.** The attendance isolation check reports `{"attr":false,…,"recordH":900,"headerH":100,"mainH":816}` — the whole app on the page |

The third exists because the second cancels itself for the first-registered gate (attendance is
`gates[0]`, so the later gates removed what it had just set) and its isolation check stayed green for
a mechanical reason rather than a good one. I found that by reading the run, not by predicting it.

4 + 4 + 4 + 1 = **13 of 13 new checks watched red at least once.** The box is ticked on that, and the
work order and `TESTING.md` both say so in those words. If the verifier reads the line strictly —
*each new check fails on the tree as it stands* — then it is 4 of 13 and the box should come back
open; I would rather be told that than have claimed it.

All mutated files were restored from byte copies taken beforehand (`diff` clean) and the green run
above was made **after** the restoration, not before the mutations.

### 5. 👤 Print each sheet twice in one sitting, allow Chrome's block, turn a preview to landscape — ⬜ **not ticked, owed**

**I cannot close this and did not.** It needs the owner's own machine, a real printer dialog and
eyes on the paper; no emulator has any of the three. The harness can say the attribute is on at the
instant the page is serialised and that it survives a `beforeprint` the app never asked for — it
cannot say what came out of the printer after you pressed Allow, which is the only reading that
matters. Expect Chrome to show *"This website has been blocked from automatically printing"* on the
second tap: that is browser policy, one tap calls `window.print()` exactly once and there is now a
check saying so on all three surfaces.

### 6. `tools/README.md` and `TESTING.md` updated from a run; the sweep prints what it printed before — ✅ ticked

Call sites 663 → **675**, executed 662 → **674**, each copied off a summary line rather than added
up. The gap paragraph goes `659 − 658 = 1` → `675 − 674 = 1`. The sweep forced the edit: before it,
`FAIL | … has 675 check() call site(s), up 12 on the 663 recorded at tools/README.md:729`. After it,
`node tools/wo-sweep.mjs` → **`17 checks · 15 passed · 0 failed · 2 to review`, exit 0** — the same
line WO-3.9 recorded, but for the count. Both REVIEWs are the standing pair and both were read: the
sensitive-field sweep is **191 mentions across 16 files**, the same figure and list as the WO-3.9 run
(`src/print-gate.js` is not in it — it names no field and imports nothing), and the due-date REVIEW
is `src/detail.js:364, src/grades-report.js:509`, the same two lines of printed prose at new line
numbers (`:364` is HEAD's `:349`, moved by the fifteen lines added above it — checked with
`git show HEAD:src/detail.js`).

---

## Decisions the work order did not settle

**`syncAll()` answers every registered gate, not only the caller's.** The deliverable says the module
hands back "the sync function to call immediately before `window.print()`", and the obvious reading
is one gate per registration. I made the returned function walk **all** registered gates, for the
reason the moved comment block already gives: *"the next print of anything at all asks the question
again and clears it."* That sentence is true of `beforeprint` either way — every listener fires on
the same event — but it is **not** true of the belt-and-braces call unless every surface is asked. A
teacher who blocks a print of the attendance record leaves that attribute on; on an engine that fires
no `beforeprint` at all, printing a student's detail afterwards would then serialise a page carrying
two gates and print both surfaces. The module still learns nothing about the app: it holds
`{ attr, isOnScreen }` pairs it was handed. Written up at the point it happens in `src/print-gate.js`
and in `TESTING.md` § WO-2.25. **If the reviewer wants one listener pair per gate instead, it is a
four-line change** — but the stale-attribute case above would come back.

**`src/detail.js`'s predicate asks `currentView()` rather than reading `.hidden` itself.** The other
two surfaces are dialogs and ask their own element. This one is a view in `<main>`, where `.hidden`
on the siblings *is* the view system (`src/views.js`'s header), and `currentView()` is where this app
already reads that back off the DOM. A second copy of "which view is showing" is the second answer
this repo keeps refusing. It adds one import to `src/detail.js` and closes no loop:
`src/views.js` imports only `src/prefs.js`.

**`sw.js`: `SHELL` gains `./src/print-gate.js` and `CACHE` goes v49 → v50**, in the same change that
creates the file, per that file's own rule. The harness's own precache check confirms it: *"every
module reachable from index.html is precached by sw.js :: 30 modules walked"*.

---

## Files changed

- `c:\dev\planbook\src\print-gate.js` — **new**. The mechanism, and the moved comment block.
- `c:\dev\planbook\src\attendance-report.js` — timer out, gate in, header corrected.
- `c:\dev\planbook\src\detail.js` — timer out, gate in, header corrected, `currentView()` imported.
- `c:\dev\planbook\src\grades-report.js` — its own copy of the mechanism replaced by the import.
- `c:\dev\planbook\src\attendance.css` — `@media print` header: the timer sentence out.
- `c:\dev\planbook\src\detail.css` — same.
- `c:\dev\planbook\src\scores.css` — header no longer says the other two carry the bug.
- `c:\dev\planbook\sw.js` — `SHELL` + `./src/print-gate.js`, `CACHE` v49 → v50.
- `c:\dev\planbook\tools\verify-shell.mjs` — 13 checks added, 1 deleted; the attendance section
  drives `printRecord()` for the first time; three stale "500ms release" comments corrected.
- `c:\dev\planbook\tools\README.md` — count 663 → 675, executed 662 → 674, gap paragraph, a WO-2.25
  block, and a parenthetical on the WO-2.6 block's now-false *"the section never calls
  `printRecord()`"*.
- `c:\dev\planbook\TESTING.md` — new § WO-2.25 with the evidence and the mutation table.
- `c:\dev\planbook\plans\work-orders\phase-2-attendance.md` — five Acceptance boxes ticked with their
  evidence; the 👤 box left open; **status line untouched** (still `🤖 CLAIMED`), because
  `--release`/`--tick` is the pipeline's call and not mine.

`CHANGELOG.md` untouched. `git commit` not run — the brief did not ask for one.

---

## Runs made (all read, none predicted)

| # | Tree | Result |
|---|---|---|
| 1 | the fix, first complete pass | `674 · 674 · 0 · 0`, 213s, exit 0 |
| 2 | unfixed `attendance-report.js` + `detail.js` | `674 · 670 · 4 failed`, 211s, exit 1 |
| 3 | mutation: never clear + no `afterprint` | `674 · 668 · 6 failed`, 207s |
| 4 | mutation: double `print()` + all attributes set | `674 · 667 · 7 failed`, 206s |
| 5 | mutation: attendance shares `data-detail-print` | `674 · 671 · 3 failed`, 208s |
| 6–8 | restored tree (three passes; see the note below) | `674 · 674 · 0 · 0`, 212s / 206s / **206s**, exit 0 |

The three restored-tree passes are not padding: pass 6 was made before I noticed that a Python
rewrite had converted five files from LF to CRLF (a whole-file diff, no semantic change), pass 7
after normalising them back, and pass 8 after one three-line comment correction in `src/detail.js`
that landed while pass 7 was in flight. **Pass 8 is the one quoted everywhere above and it is the
tree as it now sits on disk.** `node tools/wo-sweep.mjs` was run last of all: `17 · 15 · 0 failed ·
2 to review`, exit 0.

---

## Notes, temptations declined, and one thing that reads oddly

**Out of scope, and left alone.** Nothing was attempted about Chrome's throttle message — it is
browser policy and was settled 2026-08-13. Nothing about what the three sheets contain, their page
breaks or their CSVs was touched. No fourth print surface was started, though the module is now
shaped for one: it takes an attribute and a predicate, and a Phase 4 signal list would add three
lines to its own module and nothing to `src/print-gate.js`.

**No new control, so no 44px work.** The sweep's own check agrees: *"every control added in the
working tree appears in the coarse block :: no new CSS selectors"*. Nothing here adds a tappable
thing; the change is a mechanism and four comment blocks.

**Accommodation data.** The failure this fixes put *the whole app* on paper, roster included. None of
the three modules imports `src/supports.js` or has a path to `student.supports`, and this work order
added no such path; the two presentation-mode sweeps in the harness still report zero sentinels over
non-empty surfaces on both the record/CSV and the grade sheet.

**A drift worth someone's attention, which I did not act on.** `AGENTS.md` § "If you were dispatched
with a work order" still says *"Do not tick roadmap boxes, edit anything under `plans/`, or touch
`CHANGELOG.md` / `TESTING.md` … no agent has the authority to tick a box."* My brief's constraint
list says the opposite for everything but 👤 lines and `CHANGELOG.md`, citing `ROUTING.md`
§ "Implementers may tick" (retired 2026-08-06), and Acceptance line 6 requires a `TESTING.md` edit —
so the two files have drifted, and `CLAUDE.md`'s standing rule is that they must not. I followed the
brief. Reconciling the two is a one-paragraph edit to `AGENTS.md` and is nobody's work order yet.

**A `CHANGELOG.md` entry, drafted for the teacher to accept, reword or bin — not written:**

> **Fixed** — the second print of a sitting comes out right. Printing the attendance record or a
> student's grade detail twice in one sitting, or turning a print preview to landscape, could put the
> whole app on the paper instead of the sheet you asked for. All three print surfaces now decide what
> to print at the moment the browser prints it rather than half a second after you tap, and they
> share one mechanism so the next printable screen inherits the fix instead of copying the bug.

---

## Correction round — 2026-08-13, after verifier PASS WITH MANUAL CHECKS

**One documentation defect, fixed; nothing else touched.** The verifier accepted the implementation
and the counts on both sides of the paragraph, and said no re-run was needed. No source file, no
harness file, no check count, no box and no status line moved in this round. The only file changed is
`tools/README.md`, and only the one paragraph at what was `:751-759`.

**What was wrong.** The paragraph gave three different figures for one set of checks in nine lines —
*"the twelve"*, *"the other eight"*, *"Those six"* — and disagreed with `TESTING.md` § WO-2.25, which
had it right. Twelve is the *net* (13 added − 1 deleted), and the deleted check is not one anybody
can watch fail, so the denominator is thirteen and the mutation set is nine, not eight. Worse than
the arithmetic: *"The other eight are shaped as absences"* is false of five of them. Four are
absence-shaped (the `afterprint` and Ctrl+P-when-not-up readings, which the timer build satisfies for
the wrong reason); the other five — two one-tap readings and three isolation readings — are a
different shape entirely and went red under two different mutations. *"Those six"* covered only the
`syncAll`/`afterprint` row.

**What it says now.** 4 of 13 fail on the tree as it stands; the other 9 were watched red under
mutation, split 4 (absence-shaped, `syncAll`/`afterprint`) + 4 (doubled `print()` with the gates
shared) + 1 (`src/attendance-report.js` gating on `data-detail-print`). Four plus four plus four plus
one is thirteen — the same account, and the same split, as the table in `TESTING.md` § WO-2.25, which
the numbers were taken from rather than recomputed. The paragraph now says in one clause why the
denominator is thirteen rather than twelve, so the next reader does not re-derive the wrong one.

**Verified.** `node tools/wo-sweep.mjs` — exit 0, `17 checks · 15 passed · 0 failed · 2 to review`,
the same line as before the correction. Its call-site check now reads *"675 `check()` call site(s) in
tools/verify-shell.mjs, matching tools/README.md:766"* — `:766` rather than `:761` only because the
replacement paragraph is five lines longer; the sentence the sweep greps for was not touched.
`verify-shell.mjs` was **not** re-run this round: no check changed, and the verifier said so.

---

## Correction round 2 — 2026-08-13, an owner-found regression

**Verdict in one line:** the collision is gone, it now has the check it never had, and the sentence
that made it look free is corrected — but the 👤 line is **further** from closed than it was, because
the owner's own run is what found the bug and the Ignore path has not been through a printer since.

**The regression, restated from the tree rather than from the brief.** `src/print-gate.js` leaves a
gate attribute on `<body>` when a print is refused — that is the round-1 fix behaving correctly — and
the detail screen's Print button was `data-detail-print`, the *same string* as its gate.
`src/shell.js`'s delegated `e.target.closest('[data-detail-print]')` walks up to `<body>`, so with the
gate stuck every click anywhere matched that hook and re-opened the print dialog. The deleted 500ms
timer had been hiding it for three copies of the idiom. **Round 1's fix is what made it reachable**,
which is also why nothing in the harness was watching.

### 1. The rename, at three sites, and the doc block correct on both its stale halves

Taken as the brief specifies — the **button** renamed, not the selector scoped. `button[data-detail-print]`
is a smaller diff and leaves the landmine armed for the fourth print surface, which is the one thing
this work order exists to protect.

- `index.html:1097` — `<button class="class-action-btn primary" type="button" data-detail-sheet-print>`,
  with the reason written into the markup comment above it, where the next author copying this block
  will be standing.
- `src/shell.js:1111` — `if (e.target.closest('[data-detail-sheet-print]')) { detail.printDetail(); return; }`,
  with a four-line comment naming the invariant at the hook.
- `src/shell.js:145` — the census entry, corrected on **both** counts: the hook is renamed, and *"sets
  the attribute … and takes it off again"* is replaced. It now says the button only ASKS, that
  `src/print-gate.js` answers `data-detail-print` at `beforeprint`, and that no timer takes it off.

**Two things beyond the three sites, both judgment calls, both stated here rather than done silently.**

- **The grades census entry at `src/shell.js:131` carried the identical false sentence** — *"sets the
  attribute … and takes it off again"* — left behind by the same deleted timer. It is the same doc
  block and the same falsehood, so it is corrected in the same edit and now names the hook/gate
  distinction the line below it has on purpose. `data-attendance-record-print` has no census entry at
  all; I did not add one, because inventing a census line is a different job from correcting one.
- **`src/detail.js`'s `PRINT_ATTR` comment gained a paragraph** saying the attribute is not the
  button's name. That file is where a reader lands after `grep data-detail-print`, and it was the
  surface the bug was found on.

### 2. The harness check — general across all three surfaces, and watched red

`tools/verify-shell.mjs`, last section in the file, after the WO-3.9 teardown because it depends on no
fixture: **with each gate attribute stuck on `<body>` in turn, clicking three things that are not
controls — `<body>` itself, the header's own box, `<main>` — must call `window.print()` zero times.**
`window.print` is stubbed and restored, the attribute is re-set before every click (on a broken build
the first click's own `syncAll()` clears it, which would leave targets two and three asking nothing),
and every attribute the block writes comes off before it returns.

**I made it general rather than detail-only**, which the brief left to me. A detail-only check would
assert today's accident; the other two surfaces are separate by luck of naming, and the check that is
worth having is the one a fourth print surface trips on the run that adds it.

**Watched red on the tree the owner ran** — the rename reverted in `index.html`, `src/shell.js` and
the harness's own button selector, everything else as it now sits. `677 checks · 676 passed · 1
failed`, exit 1, and the failure text verbatim:

```
FAIL | with `data-detail-print` stuck on <body> — a print the browser refused and the teacher
       dismissed — a click on something that is not a control does NOT print: the gate is read by
       @media print, never matched as a click hook
       window.print() calls per neutral target = {"body":1,"header.header":1,"main":1} — printed
       from ["body","header.header","main"]; gates on <body> at rest = [], targets not found = [],
       click errors = [], window.print restored = true, attributes left on <body> = []
```

Nothing else on that run moved, which is the other half of the reading: the collision was the only
thing reverted, and the attendance and grade-sheet variants **passed on the broken tree** — by luck of
naming, exactly as the brief says.

**So those two were watched red under their own mutation**, rather than left as guards nobody has seen
fail. Two lines added to `src/shell.js` giving each of them the collision the detail screen had —
`closest('[data-attendance-print]')` and `closest('[data-grades-print]')` beside their real hooks,
which is precisely the mistake a fourth surface would make — and the run is `677 checks · 675 passed ·
2 failed`, both reading `{"body":1,"header.header":1,"main":1}`. **3 of 3 new readings watched red**,
each on the tree that expresses its own defect. All mutated files were restored from byte copies taken
beforehand and `diff`ed clean before the green run.

### 3. `src/print-gate.js` — the false sentence replaced with the rule

*"that costs nothing, because the only block that reads it is `@media print`"* is gone. What replaces
it keeps the design (self-correcting, the attribute may stay on), quotes the false sentence so the
next reader knows what was believed, names the second reader — `src/shell.js`'s click delegation, via
`closest()` walking to `<body>` — and then states the constraint:

> **SO THE GATE MAY STAY ON, UNDER ONE INVARIANT THAT EVERY SURFACE REGISTERING HERE OWES: a gate
> attribute is never also a click hook.** The `attr` handed in below must appear nowhere in
> `src/shell.js`'s delegated `closest('[data-…]')` census, and the control that asks for the print is
> therefore named differently ON PURPOSE …

with all three pairs listed. **A second copy of the same false claim was in the same file** — the
`gates` list comment ended *"One answer per print, for every surface, is what makes the stale
attribute cost nothing."* It now says it is what stops a stale attribute reaching a **printer**, and
that nothing in that module can stop one reaching a click handler; the invariant is what does.

### 4. The sweep for the same collision elsewhere — **nothing else**

- **`src/print-gate.js:79` is the only line in the tree that writes an attribute to `<body>`**
  (`grep -rn "body.setAttribute\|documentElement.setAttribute" src/*.js` returns exactly that one).
  Presentation mode, which was the other candidate, works through classes on elements. So the three
  gates are the only attributes a `closest()` can pick up from an ancestor of everything.
- **All 141 delegated `closest('[data-…]')` hooks in `src/shell.js` cross-referenced** against every
  `data-` attribute written in `index.html` (comments stripped) and every `x.setAttribute('data-…')`
  in `src/*.js`. Every hook but two is written on the control it belongs to. The two exceptions are
  `data-pill-group` and `data-backup-drop`, both `<div>`s, and both are deliberate container hooks
  that exist to catch clicks on their own children — nothing else in the tree sets either string, and
  neither is a gate.
- Attributes that *are* on containers — `data-attendance-row`, `data-attendance-col`,
  `data-pass-cell`, `data-attendance-detail-row`, `data-attendance-student` — are none of them click
  hooks; they are repaint selectors.

**`sw.js`: `CACHE` stays at `planbook-shell-v50`**, and this is a decision rather than an oversight.
v50 was set in round 1 and appears in **no commit**, so no installed app has ever fetched a shell under
that name; the same still-unshipped version now carries this round's `index.html` and `src/shell.js`.
A v51 would name a version nothing ever served. The sweep says so in its own words: *"planbook-shell-v50
is not in any commit yet — the bump is uncommitted, which is the rule being followed"*. If this round
is committed separately from round 1, that reasoning changes and the bump is owed then.

### 5. The owner's four results, recorded verbatim — and the 👤 box is still `- [ ]`

Recorded in **`TESTING.md` § WO-2.25 → Correction round 2** as a block quote, and in the work order's
**Acceptance line 5 evidence**. The box is `- [ ]` in both files. I ticked no 👤 line and have no iPad.

**Is the Ctrl+P limitation a shortfall on that line? Asked plainly: no, but only because that line
never asked for it.** Acceptance 5 is *"print the attendance record twice in one sitting, and the
detail sheet twice, allowing Chrome's block, and turn one preview to landscape"* — three readings, all
three ✅ on the owner's laptop. The Ctrl+P reading comes from the work order's **Traps** (*"a Ctrl+P
made when no print surface is up must leave the ordinary page alone"*), and it is **desktop-only by
the nature of the device**: iOS has no Ctrl+P and the shortcut raises no print dialog on an iPad at
all, so no iPad can perform that step as written. **The guarantee is reachable there by another
route** — Share → Print raises the same `beforeprint` the gate answers, so a teacher printing from the
share sheet with no print surface open should get the ordinary page. That is the version an iPad can
run, it is now written down in `TESTING.md`, and **it is not claimed here because it was not run.**

**What keeps the box open is not the Ctrl+P clause.** It is that the run which produced those four ✅s
also found the Ignore path broken, and the fix for it landed in this round. A new unticked 👤 line in
`TESTING.md` names exactly what to re-run: after pressing **Ignore** on Chrome's block, clicking
anywhere — the header, a blank patch of page — must not re-open the print dialog.

### 6. Both harnesses green, counts off a run

Every number below was read off a summary line I waited for. Four runs of `verify-shell.mjs` in this
round, 213–220s each; none reported before it exited.

| # | Tree | Result |
|---|---|---|
| 1 | rename reverted (the tree the owner ran), new checks in | `677 · 676 · **1 failed**`, exit 1, 213s |
| 2 | fix restored; the other two surfaces given the collision | `677 · 675 · **2 failed**`, 213s |
| 3 | restored, first green | `677 checks · 677 passed · 0 failed · 0 skipped`, 214s |
| 4 | after the last comment edit — **the tree as it now sits** | `677 checks · 677 passed · 0 failed · 0 skipped`, 17,011 lines, 25.1 lines per check, 220s, **EXIT=0** |

`node tools/wo-sweep.mjs` — **`17 checks · 15 passed · 0 failed · 2 to review`, EXIT=0**, the same
line as round 1 but for the count: *"676 `check()` call site(s) in tools/verify-shell.mjs, matching
tools/README.md:783"*. It forced the README edit first, exactly as in round 1: *"FAIL | … has 676
`check()` call site(s), up 1 on the 675 recorded at tools/README.md:766"*. Both REVIEWs were read:
the sensitive-field sweep is the same **191 mentions across the same 16 files** as both earlier runs,
and the due-date REVIEW is `src/detail.js:369, src/grades-report.js:509` — the same two lines of
printed prose, `:369` being round 1's `:364` moved down five by the comment added over `PRINT_ATTR`.

**One number moved in a way worth a verifier's attention: the call-site gap is now negative.** Sites
675 → **676**, executed 674 → **677**, so `676 − 677 = −1`. The three new readings are **one**
`check()` inside a loop over the three gates, the first loop-borne site this harness has added since
WO-2.21. `tools/README.md`'s gap paragraph now opens on that and says why the sign changed, rather
than leaving a reader to think something broke. I chose the loop over three literal call sites
deliberately: one code path, three per-gate assertions, and the README already models loop-driven
gaps in its own second bullet.

### Files changed in this round

- `c:\dev\planbook\index.html` — the button renamed, and the invariant written into the comment above it.
- `c:\dev\planbook\src\shell.js` — the delegated hook renamed with a comment at the hook; the census
  entry at `:145` corrected on both stale halves; the grades census entry at `:131` corrected of the
  same false sentence.
- `c:\dev\planbook\src\print-gate.js` — the false "costs nothing" sentence replaced with the invariant;
  the second copy of the same claim in the `gates` comment corrected.
- `c:\dev\planbook\src\detail.js` — a paragraph over `PRINT_ATTR` saying the gate is not the button's name.
- `c:\dev\planbook\tools\verify-shell.mjs` — the new cross-surface section (one call site, three
  readings) and its reasoning block; the two `#detailView [data-detail-print]` button selectors
  updated to `[data-detail-sheet-print]`.
- `c:\dev\planbook\tools\README.md` — the grepped count sentence 675 → 676; a WO-2.25-correction-2
  entry; the history clause; the gap paragraph rewritten around the negative gap.
- `c:\dev\planbook\TESTING.md` — § WO-2.25 → **Correction round 2**: the owner's four results verbatim,
  the desktop-only statement and the iOS route, the two red runs in a table, the count evidence, the
  collision sweep, the `sw.js` decision, and one new **unticked** 👤 line for the re-run.
- `c:\dev\planbook\plans\work-orders\phase-2-attendance.md` — Acceptance 3, 4 and 6 evidence extended
  with this round's runs and counts; **Acceptance 5 carries the owner's four results verbatim and
  stays `- [ ]`**. **The status line is untouched — still `🤖 CLAIMED`.**

`sw.js` unchanged this round (see above). `CHANGELOG.md` untouched. Nothing committed; nothing pushed.

### Notes, and things declined

**The drafted `CHANGELOG.md` entry now understates the change and should be re-drafted for the teacher
to accept, reword or bin.** The round-1 draft says the second print of a sitting comes out right; it
says nothing about the app becoming unusable after pressing Ignore, which is the part a teacher would
have noticed first. A replacement draft, hers to do what she likes with:

> **Fixed** — printing behaves after the browser blocks it. Printing the attendance record or a
> student's grade detail twice in one sitting, or turning a preview to landscape, could put the whole
> app on the paper instead of the sheet you asked for. All three print surfaces now decide what to
> print at the moment the browser prints it rather than half a second after you tap. And dismissing
> Chrome's *"blocked from automatically printing"* message no longer leaves the app trying to print on
> every tap afterwards.

**Temptations declined.** Nothing was attempted about Chrome's throttle message — browser policy,
settled 2026-08-13. Nothing about what the sheets contain, their layout, page breaks or CSVs. No
fourth print surface. **I did not add the invariant to the work order's own Traps section**, though it
belongs in the same family as *"do not share the attribute"*: the constraint has to live where the
next author reads it, and that is `src/print-gate.js`, which is where it went. **I did not add a
grep-side check to `tools/wo-sweep.mjs`** asserting statically that no gate string appears in the
delegated census — it would be a good complement to the behavioural check, and it is a follow-up
somebody could book, but the brief asked for a check in `verify-shell.mjs` and adding a sweep check
would move a second harness's summary line in a round that is meant to be readable.

**`AGENTS.md` is still drifted from `CLAUDE.md` on whether an implementer may tick a box** — flagged
in round 1's notes, unchanged, still nobody's work order.

**What I could not verify.** Anything on a real device or a real printer: whether the Ignore path is
actually cured on the owner's machine, whether Share → Print on the iPad raises `beforeprint` as
expected, and what comes out of the printer after Allow. The harness drives a page, not an installed
PWA, and it has no thumb and no paper. Those stay owed.
