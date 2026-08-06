# WO-1.6 — Classes & terms · implementation report

**Implemented by** Claude (re-routed from Codex, which wrote nothing) · **2026-08-04**
**Branch** `phase/1-shell-store-roster` · **Not committed** — the brief did not ask for a commit.
**Verification** `node tools/verify-shell.mjs` → **117 checks · 117 passed · 0 failed · 0 skipped**.

Nothing in `plans/`, `TESTING.md`, `CHANGELOG.md`, or any roadmap box was touched. No box was ticked.

---

## 1. What was built

| File | Change |
|---|---|
| `src/classes.js` | **New**, ~970 lines. Classes and terms: the tab bar, the term nav, the manager, the term editor, the delete confirm, and the read point later screens import |
| `index.html` | Filled the `.header-bottom` slot WO-1.2 reserved (tabs · divider · term nav · manage button) and added three modals — `#classesModal`, `#termsModal`, `#classDeleteModal` — with all teacher-facing copy. Updated the file header comment and the About modal's "there is nowhere to enter anything yet", which stopped being true |
| `src/shell.css` | New `── CLASSES & TERMS ──` section; `.cls-tab-add` and `.hdr-term-nav` in the header section; `.class-action-btn.archive/.restore/.delete/.move` in the buttons section; 16 new lines in `@media (pointer: coarse)`, plus `min-width: 44px` added to `.cls-tab`, `.q-btn` and `.class-action-btn` |
| `src/shell.js` | 20 new `data-*` hooks in the header table and the delegation chain; an `input` listener for term fields; `afterYearChange()` so a year switch and a restore both redraw the bar; `classes.refreshClassBar()` at boot; `classes` added to the `window.planbook` seam |
| `src/prefs.js` | Declared `openClassId` and `openTermIds` in `PREF_DEFAULTS`, each with why-it-is-a-UI-fact comments |
| `src/store.js` | Comment only: added `tm_` term to the id-prefix list, with why `t_` could not be used and why the schema sketch's `"id": "Q1"` does not govern |
| `sw.js` | `./src/classes.js` added to `SHELL`; `CACHE` bumped `v4` → `v5` |
| `tools/verify-shell.mjs` | New `--- classes & terms ---` section (29 checks) and 3 more in the touch pass |
| `tools/README.md` | Check-count line updated, and corrected — see §5 |

**Shape written to the document.** A class is `{ id: 'c_…', name, archived: false, terms: [], categories: [], letterScale: null, roster: [] }`; a term is `{ id: 'tm_…', label, start: '', end: '' }`. Every collection is present and empty per `store.js:102-104`. `categories` stays empty: weights are WO-3.1. Order is the array's order — no `order` field, because two ways to say where a class sits is one way for them to disagree.

**Not built, deliberately:** categories, weights, anything grade-shaped, drag-to-reorder (see §3, line 1), roster UI.

---

## 2. Acceptance, line by line

### ☐ → Six classes can be created, reordered by drag or by explicit up/down controls, and renamed

**Built.** A create form (name field + Create) in `#classesModal`; per-row `↑`/`↓` buttons that swap positions in `doc.classes`, disabled at the ends; in-place rename in the row (a `<form>`, so Enter and the iPad's "go" key work) with Save/Cancel.

**Verified** — `node tools/verify-shell.mjs`, in the `--- classes & terms ---` section, by clicking the real controls:
- *six classes created through the form are in the document and on the tab bar, in that order* — six names typed into the field and six clicks on Create; the document, the tab bar, and the tab `data-class-tab` ids all match, in order.
- *the down control moves a class one place later …* and *the up control puts it back …* — the pair proves the move and its reverse, and that the tab order follows `doc.classes` with no second source.
- *the arrows are disabled at the ends of the list …* — first row's `↑` and last row's `↓` are `disabled`, the other two are not.
- *renaming happens in the row, starts from the old name, and lands on the tab as well* — the field opens holding the old name and focused, the new name reaches the document and the tab, the id is unchanged, and the old name is gone.
- *a class name containing markup is rendered as text* — one of the six is `Honors Bio <b>lab</b>`; zero elements were injected into the bar and the tabs have zero child elements.

**Reorder is by explicit up/down only. Drag was deliberately not added** — Trap 4 says the buttons fully satisfy the line, HTML5 drag does not fire for touch on iPadOS, and `shell.js:147-162` owns document-level `dragover`/`drop` to stop a stray file navigating the page away. A second affordance there is risk with no reward on the device that decides go-live.

**Owed to a human:** that six tabs are actually reachable with a thumb on a physical iPad, in portrait, with the tab strip scrolling.

### ☐ → Two classes in the same document can have different term structures, and both work

**Built.** Terms live on the class. Four starting structures (`Quarters`, `Semesters`, `Trimesters`, `One term`) as pills on the create form and as buttons in the term editor; add/rename/remove/date per term; the header term nav reads whichever class is open.

**Verified:**
- *a class can be given a single year-long term while its neighbour keeps four* — `Homeroom` = `["Full year"]`, `Period 1 — Biology` = `["Quarter 1"…"Quarter 4"]`, in one document.
- *tapping a class tab opens it, and the term nav switches to THAT class's terms* — the nav's labels equal that class's term labels, and `getSelectedTermId()` resolves inside that class.
- *and tapping a term opens that one, with one active tab in the nav*.
- *a class stored with no terms at all still renders, and the term nav offers to add them* — the fixture is the class the backup section restores, which has no `terms` key at all; the nav shows `Add terms` rather than throwing on `cls.terms.length`.

### ☐ → A class can be given a single year-long term

**Verified** by the same check plus *and that term can carry the whole school year, stored exactly as it was typed* — `2026-08-26` → `2027-06-11` on the single term, read back off the document.

**Owed to a human:** the iPadOS date picker that `<input type="date">` opens. The harness sets `.value` and dispatches `input`, which is the same code path from the listener inward, but it has never seen the native sheet.

### ☐ → Term dates can overlap or leave gaps without the app breaking

**Built as an absence.** Nothing sorts, repairs, validates, warns, refuses, or infers from a term date. Empty is valid. `src/classes.js`'s header and `dateField()` both say so and point at `plans/rotating-schedule.md`; the hint in `#termsModal` says it to the teacher in words.

**Verified** with one class carrying all four kinds of mess at once — term 2 starting before term 1 ends, term 3 with two blanks (a gap), term 4 ending three months before it starts:
- *overlapping, backwards and empty term dates are all stored exactly as they were typed*.
- *and nothing sorted, repaired, refused or warned about them* — term ids, order, labels and count unchanged; both error lines empty.
- *the app boots again on those dates, and the header comes back with them* — a full reload, because a date this app could not read would take the year down at boot rather than at the term editor.

### ☐ → Deleting a class warns about the attendance and grade data it takes with it, and can be cancelled

**Built.** `#classDeleteModal`, through the app's modal tier — no `confirm()`. It names the class, says it cannot be undone, says a backup file is the only way back, points at archive as the alternative, and lists counts read off the open document: recorded meetings (and separately, days marked as not meeting), assignments and scores, terms, and roster size with the note that the students stay in the year. Danger-red confirm labelled `Delete <name>`, plus Cancel.

**Verified**, with a fixture of real records on the class being deleted and on a neighbour:
- *the delete confirm names the class and counts the attendance, grades and roster it destroys* — `Attendance for 2 recorded meetings, and 1 day marked as not meeting · 1 assignment and 2 scores · 1 term · 2 students on its roster …`, button reads `Delete Homeroom`.
- *cancelling the delete leaves the class and every record of it exactly as they were* — in memory and re-read off disk, with `rev` unmoved (flushed first, so a pending write could not be mistaken for the cancel writing).
- *deleting takes the class, its attendance, its assignments and their scores — and only those* — the neighbour's records survive.
- *and both students stay — a student belongs to the school year, not to one class*.
- *archiving takes the class off the tab bar and destroys nothing at all* / *and restoring puts it back on the bar, in the place it had* — Trap 6, both directions.

**A decision the work order did not settle: delete is offered on archived rows only.** `Delete` is not on an active class; `Archive` is, and the archived block below carries `Restore` and `Delete`. This follows Roll Call!'s class manager, and it means getting a class out of the way costs one tap and destroys nothing, while destroying a term of attendance costs an archive, a second tap, and a dialog that counts what goes. A check (*no delete control on an active class*) states it so a verifier reading cold knows where to look. If you want delete on an active row, it is one `actionButton` line.

---

## 3. Traps, and how each was handled

1. **Term ids are opaque.** Every one comes from `newId('tm')`. Prefix `tm_` because `t_` is template (`store.js:64-67`); added to that comment list with the reason. Verified twice: *every term id is generated and opaque: tm_ prefixed, unique, and never a label* (21 ids across 7 classes) and a static, comment-stripped sweep — *no module in `src/` carries a term literal like the schema sketch's Q1*. Seed labels are whole words (`Quarter 1`), so `Q1` does not appear in `src/*.js` at all outside comments explaining the trap.
2. **Preference declared.** `openClassId` and `openTermIds` are in `PREF_DEFAULTS`. Verified: *both new preferences are declared in PREF_DEFAULTS, so setPref writes instead of refusing* (the WO-1.4 defect, which fails silently), and *only ids are remembered — no class name, nothing else out of the document*. `openTermIds` is a map keyed by class id, for the reason `lastBackupAt` became per-year: term ids belong to one class, so a single value would answer "which term" with a term the class does not have.
3. **Term dates are not a schedule.** See acceptance line 4.
4. **No drag.** See acceptance line 1. `shell.js`'s document-level drag handlers were not touched.
5. **`createElement` everywhere.** No `innerHTML` in `src/classes.js` (grep confirms one mention, in a comment). Verified with a class named `Honors Bio <b>lab</b>`.
6. **Archive ≠ delete.** Separate operations, separate rows, separate copy; both verified.
7. **The confirm is the app's modal tier**, with real counts, and cancel writes nothing. Voice modelled on `backup.js`'s restore confirm: plain, specific, no exclamation marks.
8. **Only `store.update()`.** Every write in `src/classes.js` goes through it; a new class carries the full shape with `categories: []`. Verified: *each one arrives with a term structure, and with its other collections present and empty*.
9. **Shelf and seam intact.** `<main>`'s component shelf is untouched; `window.planbook` gained `classes` and lost nothing. The seam is used by the harness for *reads* only — the acceptance lines are driven by clicking the real controls.

---

## 4. Decisions I had to make that the work order did not

- **One module, not two.** `src/classes.js` owns terms as well as classes. Terms are per class, so "which term is open" is only answerable after "which class is open", and that resolution — the stored id names an archived or deleted class, so fall back to the first that exists — has to live in exactly one place or the tab bar and the term nav can disagree about what is open. Splitting either duplicates it or closes an import loop between the two modules, and `shell.js:82-89` records this repo refusing to close one. The file header says all of this; if terms grow their own screen, split then and keep the resolution here.
- **`archived: false` is a field `docs/data-model.md` does not show.** The work order requires archiving and archiving has to survive a save. I did **not** edit `docs/data-model.md` — the brief hands it to me as the settled shape, and amending a reference doc to describe my own change felt like maintenance that is not mine. The field is documented at length in `newClass()`. **A one-line addition to that schema block is worth making**, or the next agent reading the doc will not know the field exists.
- **CSS went into `shell.css`, not `src/classes.css`.** `shell.css`'s header says a *screen* with its own styles gets its own file. This is header chrome plus three modals — the same shape as the year picker and the backup panel, both of which live in `shell.css` under their own banner. I followed that precedent rather than the sentence, and no class is styled by two sheets.
- **Term structures are pills, not a `<select>`.** Reuses `data-pill-group`, which `shell.js` already single-selects, so no new hook — and `year-picker.js` already records why a `<select>` is wrong on an iPad.
- **Presets and term removal refuse when an assignment is in the way.** Slightly beyond the deliverable and ten lines: removing a term an assignment lives in would leave a grade pointing at nothing, and a grade that quietly stops counting is the worst failure this app has. There is no assignment screen yet, so this is dead code today — which is exactly why it is verified (*removing a term that still holds an assignment is refused, and says what is in the way*) rather than left to rot.
- **`min-width: 44px` added to three existing coarse rules** (`.cls-tab`, `.q-btn`, `.class-action-btn`). They were shelf specimens with two-word labels; they are now instanced with names like `AP Bio`, labels like `1`, and reorder arrows one glyph wide. 44px of height around a 30px-wide target is half a touch target.

---

## 5. Things found on the way that are not mine to fix

- **The harness count in the brief and in `tools/README.md` was stale: the pre-WO-1.6 baseline is 82, not 79.** Measured, not guessed — `git stash`, a full run on the WO-1.5 tree, then `git stash pop`. The three checks added by the per-year backup fix never reached that line. I corrected it to `82 at WO-1.5, 117 at WO-1.6` and left a parenthetical saying why, since `tools/README.md` explicitly asks whoever adds checks to update it. **I added 35 checks: 29 in the new section, 3 in the touch pass, and 3 more (empty-year header, year-switch chain, term-removal refusal).**
- **`Page.reload` over CDP does not let a debounced write finish, and it looks exactly like a store defect.** My first run lost six classes across a reload; the chip was blank and `rev` had not moved, which reads as "the store stopped saving". It is the limit `store.js`'s own header admits: an IndexedDB write is asynchronous and a context torn down mid-transaction loses it. Every earlier section in the harness happens to `await s.flush()` before reloading; mine now does too, with a comment at the call site explaining why the flush is not papering over anything (flush-on-hide has its own check further up, measured with a dispatched `visibilitychange` and a poll). **This belongs in `tools/README.md`'s CDP trap list as a sixth entry** — it cost me three runs — but that list is prose about traps rather than a count, and adding to it felt like more editorial licence than the count correction. Flagging it here instead.
- **`.claude/agents/work-order-orchestrator.md` shows as modified in `git status` and I did not touch it.** It changed while I was working; presumably the orchestrator wrote to it. Mentioned so nobody attributes it to this work order.

---

## 6. Owed to a human on real hardware

Nothing here is faked green; these are the claims a headless browser cannot make.

1. **A thumb on the reorder arrows and the class tabs**, on a real iPad. The harness measures every control at ≥44×44 under an emulated coarse pointer (*every control in the classes manager … arrows included*, *… in the term editor, date fields included*, *… in the delete confirm*) — a box is not a tap.
2. **The iPadOS date picker.** Two `<input type="date">` per term row. Whether the native sheet is usable at that size, and whether clearing a date back to empty is possible with it, are unknown to me.
3. **The class tab strip scrolling with six or more classes in portrait**, and the term nav scrolling beside it. Both strips shrink and scroll by construction (`.hdr-term-nav` is a sibling of `.hdr-right-controls` rather than a child, precisely because that container is `flex-shrink: 0` and four terms called `Quarter 1`…`Quarter 4` are ~360px), and *no horizontal overflow at 390×844* passes with five tabs and four terms — but two side-by-side scrollers at 390px is a thing to look at rather than measure.
4. **Whether the copy reads right to the teacher**, particularly the delete confirm and the two hints that say Planbook does not check term dates.
5. **Offline.** `src/classes.js` is in `SHELL` and `CACHE` is bumped, and the harness's static precache check passes; nothing here has seen a service worker on a device with the network off.

---

## 7. Proposed follow-ups (not built, by scope)

- **One line in `docs/data-model.md`'s class block for `archived`.** See §4. The only real documentation gap this work order leaves.
- **A sixth CDP trap in `tools/README.md`** for the unflushed-write-across-`Page.reload` finding in §5.
- **Categories and weights in the class row** — WO-3.1 owns them; the row shows the term count and has room for a category count.
- **Moving an assignment between terms**, which is what turns the two refusals in §4 from a dead end into a path. WO-3.x.
- **A `<datalist>` or recent-names hint on the create form** — declined; nothing asked for it, and five classes a year is not a typing problem.
