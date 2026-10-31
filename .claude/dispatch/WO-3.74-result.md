# WO-3.74 — result (implementer)

**The notice opens when you leave a quarter that changed, and home carries the bar.** Built,
mutation-proved and both tools green. Every non-👤 Acceptance box is ticked in the phase file. The 👤
line is open. The row's status is left at `🤖 CLAIMED`, and I wrote no `CHANGELOG.md` entry (a draft is
at the foot of this file).

## Against the Acceptance list

1. **Leaving a changed recorded quarter by another term, another class or All classes opens the notice once and lists who changed: met.** In `tools/verify/term-record-notice.mjs`, scores are typed into the grid's own cells and then each of the three doors is tapped. Each tap opens the changed form with the expected rows. A second check is green: going back into the quarter and leaving again with nothing new changed opens nothing, and neither does returning to the class just left. Opening the notice and closing it with *Not yet* leaves the document and the `planbook_` keys identical. The three navigation preferences are excluded from that comparison.
2. **Working in the quarter opens nothing: met.** The check makes two typed edits, visits Attendance, Assignments, Scores, Detail and Scores again, and re-taps Quarter 1. All seven readings are `false`.
3. **A change made from another quarter opens the notice once, at the next class opening, and not again: met.** The letter scale is changed while the class is on Q2. Nothing opens while the teacher stays, and nothing opens on leaving for another class. The notice opens when the class is reopened, listing Bell374 at 83.00% C. It does not open on the opening after that.
4. **Presentation mode: met.** Nothing opens on a class opening, on leaving the quarter, or on turning the mode off. The notice opens on the next class opening with the mode off. The refusal is never shown in its place.
5. **Home bar: met.** It is the `#termRecordHomeNag` strip after the backup nag and outside `#homeView`. It reads *Quarter 1 needs recording in 2 classes. WO-3.74 Notice has changed since it was recorded.*, has one button per class, and names no student. Each button lands on that class's Scores for the quarter with the right form of the dialog open. A further check covers presentation mode: the bar stays up, and its button lands on the refusal.
6. **Q1 never recorded and Q2 changed, so the button opens Q2: met.** The engine's list is `[[q1,"unrecorded"],[q2,"changed"]]` and `newestNeedOf` returns q2. The button carries q2 and lands on Q2's changed form. The class's own bar lists `[q1, q2]`.
7. **Mutation: met.** In `unshown()` I replaced the return with `return !!model && model.form === 'changed'; // MUTATION WO-3.74`. Two checks went red, "opens ONCE" and "a change made from another quarter … not again", and those were the run's only FAILs. The red output is in `TESTING.md` § WO-3.74. I stopped the run, then reverted by hand before writing anything else.
   - `grep -rn "MUTATION WO-3.74" src tools` prints nothing.
   - **`grep -rn MUTATION src tools` is not empty.** It prints 18 lines, and `git grep -n MUTATION HEAD -- src tools` prints the same 18. They are pre-existing prose, for example `src/shell.js:1095` and comments in `tools/verify/*.mjs`. None of them is a live mutation and none is mine. The brief's "must be empty" cannot be met literally on this tree.
8. **Both tools pass: met.**
   - `node tools/verify-shell.mjs` on the tree as delivered, after the revert, real clock 2026-10-31: `2147 checks · 2147 passed · 0 failed · 0 skipped`, `69,238 lines · 32.2 lines per check · 1215s`, `EXIT=0`.
   - An earlier run on the same `src/` had one FAIL. WO-3.72's one-writer check pins the module's export list, and the new reader wasn't in it. I added `newestNeedOf` to that list in `tools/verify/term-record.mjs` before the clean run.
   - `node tools/wo-sweep.mjs`: `52 checks · 49 passed · 0 failed · 3 to review`, `EXIT=0`. The three reviews are the standing ones. Call sites: 2138, recorded in `tools/README.md`.
9. **👤 iPad: not done.** It needs a real iPad. The box is left `- [ ]`.
10. **`TESTING.md` § WO-3.74: met.** It is under Phase 3, after WO-3.78, with the Acceptance lines verbatim and the evidence for each.

## Open question for the owner: how "once" is remembered

**Proposal:** keep it in memory only, as the work order suggested.

- **Where:** a `Set` named `noticed` in `src/term-record-view.js`.
- **Key:** class id + term id + the newest record's id + each changed student's live figure as the dialog prints it (`noticeKey()`). The same record, students and figures count as the same change and are not shown again. A further edit makes a new key and is shown.
- **Bar buttons count too:** opening the changed form from either bar's button counts as shown.
- **Nothing is stored:** nothing goes to the year document or `localStorage`. The structural check confirms the home bar and notice code calls no writer, preference or storage.
- **Cost:** a relaunch forgets, so the same change can be shown once more after the app is reopened.

## Decisions the work order didn't settle

All three are open to the owner.

1. **The template editor counts as leaving the quarter,** like All classes, because it isn't one of a class's screens. Moving to the calendar or the concern list through the switcher counts as staying, because `src/views.js` lists them as class screens.
2. **Moving terms with the register's `Today` button is noticed late.** That button can move the term (WO-2.52) without repainting the bar, so the notice comes at the next navigation rather than at the press.
3. **Leaving is checked before opening, and at most one notice opens per tap.** When a class tab both leaves a changed quarter and opens a class that has its own unshown change, the quarter just left is shown. The arrived class keeps its change for its next opening.
4. **The opening notice can open on the quarter the class opens into** (a change from a sync, say), because arriving is not "still working in it". It never opens while the teacher stays. *(Added after the verdict, 2026-10-31, so this list and `TESTING.md` § WO-3.74 name the same four; all four accepted by the owner as built.)*

There are also four smaller choices:
- **Home bar wording:** the drawing's *Quarter 1 needs recording in N classes.* is used only when every button opens a term with the same label. Otherwise it reads *Grades need recording in N classes.* The second sentence names the classes whose button opens a changed quarter. The drawing's banner was amended to record this.
- **Separate aside:** the home bar is its own `#termRecordHomeNag`, not a repaint of `#termRecordNag`.
- **Microtask:** the notice check runs as a microtask, so it reads where the whole navigation lands and sees any dialog the navigation itself opened.
- **Not over another dialog:** the notice never opens over another dialog (`anyModalOpen()`).

## Files changed

- `src/term-record-view.js`: home bar model and painter, the notice, `recordId` on the changed model, and the dialog marks the change it shows.
- `src/term-record.js`: new reader `newestNeedOf(cls, needs)`. It walks from the last term back, with no sort and no `.find(`.
- `src/shell.js`:
  - the `data-term-record-home` hook, added to the header list and the click handler;
  - `openRecordFromHome()`;
  - one line in the term-tap hook calling `checkTermRecordNotice()`.
- `index.html`: the `#termRecordHomeNag` aside.
- `src/shell.css`: `.term-record-nag-classes`, lifted, with an 8px gap under coarse pointers. The buttons are the existing `.term-record-nag-btn`, so they already get 44px.
- `sw.js`: CACHE `planbook-shell-v200` → `v201`.
- `tools/verify/term-record-notice.mjs` (new), registered in `tools/verify-shell.mjs`.
- `tools/verify/term-record.mjs`: the export list.
- `tools/verify/term-record-bar.mjs`: one check's message.
- `tools/README.md`: call-site count 2127 → 2138, plus a ledger paragraph.
- `design/mockups/proposed-quarter.css` and `design/mockups/closing-a-quarter.html`: banners.
- `TESTING.md`: § WO-3.74.
- `plans/work-orders/phase-3-gradebook.md`: ticks, and a dated note under "Open".

**Out of scope, not touched:** `src/glance.js` and its fence (§ 31); WO-3.75's *What changed* (`.term-record-cause` stays drawn but not lifted).

## Draft CHANGELOG entry (the teacher's to decide)

> **A changed quarter tells you when you leave it, and All classes says which classes still need
> recording.** After a quarter is recorded, any change that moves a grade now opens *Quarter 1's grades
> have changed* when you move to another term, another class or All classes — never while you are
> still correcting scores in it. A change made from elsewhere (a setting changed from Quarter 2, a
> sync) opens it the next time the class is opened. It shows each change once, never under a projector,
> and the bar stays until you record again. All classes now carries one strip naming every class with a
> quarter to record, with a button per class that opens its Scores on that quarter with the Record
> dialog up — on the newest quarter waiting, when there are two.
