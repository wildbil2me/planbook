# WO-3.48 — result

**Implementer** Claude (Opus), 2026-10-05. Nothing committed. `CHANGELOG.md` not touched.

## Harness totals (read off the runs' own output)

- `node tools/verify-shell.mjs`, final run on the delivered tree: `1796 checks · 1796 passed · 0 failed ·
  0 skipped`, 56,956 lines, 789s, `EXIT=0`. An earlier run on the tree before the list-hint edit in
  `index.html` gave the same totals in 787s.
- `node tools/wo-sweep.mjs`: `48 checks · 45 passed · 0 failed · 3 to review`. The three REVIEWs are the
  same ones as before this work order: sensitive field names, due-date/late on one line, mockup banners.
  The first sweep run was red only on the `check()` call-site count. I updated it from a run: 1763 → 1790
  in `tools/README.md`, with a WO-3.48 paragraph.
- `node tools/wo-gate.mjs WO-3.48`: `PASS | gates clear`. It also prints the expected notes: CLAIMED, and
  the tree is dirty with no result file. This file is the result file.

## Acceptance, line by line

Lines 1–10 are ticked in `plans/work-orders/phase-3-gradebook.md`. Line 11 (👤) is not. Every check named
below is in the WO-3.48 block at the foot of `tools/verify/copy-class.mjs`, unless the line says otherwise.

1. **[x] Three ticked classes → exactly three assignments.** The pills are ticked in the order P6, P2, P4
   and the dialog is confirmed. The result is three new, distinct ids. Each copy has its own class's
   `classId` and `termId` (P2's term was moved to Q2 in its row first). None has a `scores` key. Each
   `due` matches what its row showed: 2026-10-02, 2026-10-06, 2026-10-08. The source and its score are
   unchanged. `rev` moves by exactly 1 across the confirm. Checks: *"confirming writes exactly three
   assignments…"* and *"…one save"*.
2. **[x] Category by name, never by id. Mutation-proved.**
   - P2 has a category ` essays ` (different spelling, different id). The P2 copy is filed under P2's
     own id for it.
   - P4 has categories but none of that name, and P6 has no categories. Both copies arrive with
     `categoryId ''`. Both rows said so before the tap (the *"each row says its own fallback"* check).
   - Mutation M1, made in a throwaway copy of the tree outside the repo: `categoryId: source.categoryId`
     in `confirmCopy()`. Result: `1796 checks · 1793 passed · 3 failed`, exit 1. The three that went red
     were this block's filing check, the create-door copy check, and `assignments.mjs`'s WO-3.3 trap
     check.
   - The copy was deleted afterwards. `grep -rn MUTATION src index.html sw.js tools/verify/assignments.mjs
     tools/verify/copy-class.mjs` in the repo finds only `src/shell.js:992`, a comment that was already
     there ("A CLASS MUTATION ADDED LATER…"). It is not a mutation.
3. **[x] Every row's selects show the proposal.** For each row, the check reads both the select's
   `value` and the option at `selectedIndex`:
   - P2: first term, and the matched category.
   - P4: the *— choose a category —* placeholder (`''`).
   - P6: disabled *"has no categories yet"* (`''`).
   - P5 (no terms): disabled term select holding `''`.
4. **[x] One row's due changes only that copy.** P4's due is set by an `input` event and P6's by a
   `change` event. P2's term is changed. Only those rows move, and the write carries exactly those
   values. A source with a blank due starts every row blank (3 rows, including the source's own class),
   and the note says the source has no due date.
5. **[x] Unticking removes the row.** After unticking P5, its row is gone, its pill reads
   `aria-pressed="false"`, the other rows keep their edits, and the write contains no copy in P5.
6. **[x] No terms → cannot confirm, and the row says why.** The P5 row says it has no terms and to untick
   it. The confirm is disabled and reads *Copy into 4 classes*. A real press on it writes nothing: `rev`
   and the count are unchanged after `flush()`, and the dialog stays open.
7. **[x] Cancel, ✕ and Escape write nothing.** Each one is tested after a tick and an edited due date.
   `rev` and the count are unchanged after `flush()`, and every reopening starts with nothing ticked.
8. **[x] The create door.** All of this was driven through real controls:
   - During a create with other active classes, the button shows beside Done and Cancel.
   - It closes the editor and opens the dialog with the new assignment as source: the typed name is
     there, and the lead says copies are separate. Nothing is ticked, and the source's class is not
     among the pills.
   - Confirming copies it into P2 and keeps the new assignment.
   - Opening a row through Edit does not show the button.
   - With every other class archived through the seam (and restored afterwards), a create shows Cancel
     but not the button.
9. **[x] The note no longer says the dates come across as they are.** Asserted in the WO-3.48 block, and
   again by `assignments.mjs`'s match check, which used to assert the old sentence and now asserts its
   absence. The assignment list's hint in `index.html` said the same thing. I changed it in the same
   pass. No check reads that hint.
10. **[x] `CACHE`** is `planbook-shell-v167` (was v166).
11. **[ ] 👤 iPad.** Not attempted, because I have no iPad. The coarse pass at 768px is the desk half:
    all 32 controls in a three-row dialog are ≥44px, the rows stack, there is no sideways scroll, and the
    create door is 44px. The native date picker and the select wheel inside a stacked row still need a
    human reading.

## The choices the brief asked me to state

- **Create door: the editor closes, and the create flow ends.** `openCopyFromCreate()` clears
  `creatingId`, closes the editor and opens the copy dialog. Focus goes back to the `+ New assignment`
  that started the create; it is remembered in `createOpener`. My reasons:
  - Every editor field autosaves, so closing loses nothing. It is the same act as Done.
  - The editor's Cancel must not be reachable after copies exist. It deletes the source and announces
    "Nothing was added", which would be false with copies left behind in other classes.
  - One dialog at a time. A stacked dialog means dismissing twice, and Escape would drop the teacher
    back into an editor she thought she had finished with.

  So Close, Escape and Cancel on the copy dialog behave exactly as they do from Duplicate. The new
  assignment is kept, the same as after Done.
- **Which existing harness checks changed because pre-selection ended.** None depended on it.
  `assignments.mjs` taps the target pill straight after opening. That tap used to switch the one target;
  it now ticks the only one, and the proposal reads the same either way. Three checks changed in place:
  - The proposal check now reads the no-match sentence from the row's own note, and asserts one row.
  - The pick check reads that same row note.
  - The match check asserts the new dates note.

  `COPY_READ` gained `rowNote` and `rows`. The site count in that file is unchanged.

## Decisions the work order did not settle

- **Rows are kept in pill order, not tick order.** The rows then read in the same order as the pills
  above them, and the write and the announcement follow that order too.
- **Proposals are normalised.** Ticking the source's own class keeps its term and category, but only if
  that class still has them. Otherwise the term falls back to the first term and the category to `''`.
  This keeps "the select shows the proposal" true at the edges. `confirmCopy()` still re-checks the
  category against the target class.
- **A ticked class with no terms disables the whole confirm.** I did not write the other copies and
  skip that one, because that would drop a target silently. The row tells her to untick it.
- **Each row's due field has a Clear.** This follows WO-1.48: `clearDateField()` routes
  `data-assignment-copy-due` to `copyDueCleared()`. The value is taken on `input` and on `change`, and
  the field is not re-rendered while she types.
- **The "copies are separate" sentence is only in the create door's lead.** That is the line the WO
  names. Duplicate's lead is unchanged. The list hint now ends "Each copy is its own assignment from
  then on."
- **Stacking breakpoints.** The rows stack in the coarse block and also in a new
  `@media (max-width: 834px)` block. 834px is the widest portrait iPad, so the WO's "at portrait iPad
  width" holds whatever pointer the device reports.
- **Where the new checks live.** I put them in a block at the foot of `tools/verify/copy-class.mjs`, the
  file the WO names, and not in a new section file. They plant five `c_wo348_*` classes, reload at the
  head and foot, remove their fixture, and hand the page back at 1280x900 with touch off. That is what
  `print-sheets.mjs` leaves for this section.

## What I did not do, or noticed and left

- `plans/future-features.md` § Assignments item 1 was already struck with WO-3.48 at booking, so there
  was nothing to do there.
- `plans/work-orders/README.md`'s running-order row 131 still says the create door and no-pre-selection
  "await the owner before `--start`". Commit 7eaf2c4 settled both. I left it, because status rows belong
  to the orchestrator.
- The comment over `src/shell.js`'s `change` listener still says "THE TEN DATE FIELDS". The new copy-due
  field writes nothing to the document, so that count of writing fields is unchanged. I did not reword
  it.
- WO-3.46 has not landed. The copy is built from eight named fields and asserted to have exactly those
  keys, so `held` and `committedAt` cannot be carried across.
- TESTING.md's WO-3.3 👤 line on the iPad category wheel is annotated as re-read at the desk. It stays
  ticked as it was, and the multi-row iPad reading is the new 👤 line under § WO-3.48.

## Files changed

- `src/assignments.js`: per-target state, proposals, rows, setters, the create door, and `confirmCopy()`
  doing one `update()` for all copies.
- `src/shell.js`: the hook docs, the copy-door click, copy-due `input`/`change`, and the Clear route.
- `src/assignments.css`: the row card, the row note, the coarse rules, and the 834px stacking.
- `index.html`: the create-door button, the copy-modal comment and labels, and the list hint.
- `sw.js`: `CACHE` v167.
- `tools/verify/copy-class.mjs`: the WO-3.48 block, plus `measureIn` imported.
- `tools/verify/assignments.mjs`: three checks and `COPY_READ`.
- `tools/README.md`: call-site count 1790, and the WO-3.48 paragraph.
- `TESTING.md`: § WO-3.48, and the annotation on the WO-3.3 👤 line.
- `plans/work-orders/phase-3-gradebook.md`: Acceptance 1–10 ticked. The row was already CLAIMED.

## Draft CHANGELOG entry (for the teacher to take or leave)

> **One assignment, several classes, one dialog.** Duplicate now takes as many classes as you tick. Each
> gets its own row (term, category, due date), and the due date starts on the original's. Nothing is
> ticked for you. While you are creating an assignment, **Copy into other classes…** sits beside Done.
> Each copy is a separate assignment with no scores, filed under the category of the same name in its
> class, or under none, and the dialog says which before you tap.
