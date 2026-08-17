# WO-1.22 — copy a class, carrying its terms and its categories · implementation report

## What I built

- **`src/classes.js`** — `copyClass(id)`, exported, wired to `data-class-copy="<classId>"`. Refuses
  (returns without writing) if the id doesn't resolve or resolves to an archived class. Builds the
  copy key by key: fresh `newId('c')`, a deduped `<name> (copy)`/`(copy 2)`/… via a new
  `uniqueCopyName()` helper, `archived: false`, `terms` mapped through a new `copyTerm(t)` (fresh
  `tm_` id, source's label/start/end), `categories` via `categories.js`'s new `copyCategories()`,
  `letterScale: null`, `roster: []`. Splices the new class immediately after the source in
  `doc.classes` inside one `update()`. Opens the new row's rename field via the existing
  `startRename()` (no new affordance), then `refreshClassBar()` and an `announce()` naming both
  counts and stating the roster did not come across. Added the `Copy` button in `classRow()`'s
  active branch, directly after `Categories` and before `Rename`; absent from the archived branch.
- **`src/categories.js`** — `copyCategories(cls)`, exported: maps the source's categories through
  the existing `newCategory(name, weight)`, so every category in the copy gets a fresh `k_` id and
  carries only `name`/`weight`. Called from `classes.js`, the one-way direction the file's header
  already documents.
- **`src/shell.js`** — documented `data-class-copy="<classId>"` in the hook census (right before
  `data-class-rename`, matching the row order) and wired it in the delegated click listener,
  calling `classes.copyClass(id)` then `afterClassChange()` (the copy changes which classes are on
  the bar, so the home cards and the tab strip redraw).
- **`sw.js`** — `CACHE` bumped `v72` → `v73` (three `SHELL` files changed: `classes.js`,
  `categories.js`, `shell.js`).
- **`docs/data-model.md`** — one comment beside the class sketch's `roster` field stating what a
  copy carries and what it does not.
- **`tools/verify-shell.mjs`** — a new section, "copying a class, terms and categories only
  (WO-1.22)", at the foot of the file (after the WO-8.10 build-identity section, before the
  summary). Plants three fixture classes (`c_wo122_src` unbalanced-95%-with-a-roster-attendance-
  assignment-score-and-two-hall-passes, `c_wo122_bal` balanced-100%, `c_wo122_arch` archived) and
  two students, then drives the real `Copy` button through `clickSel`, reading results off
  `window.planbook.store`/`classes`. Also updated the stale "six controls" comment near the
  letter-scale per-class-override section to "seven controls (WO-1.22 added Copy)", since that
  work order's own comment invited the update.
- **`tools/README.md`** — the `check()` call-site sentence (808 → 825) and a new paragraph in the
  running "WO-X moved it from A to B" narrative, sourced from an actual run (17 call sites, one a
  fixture-guard failure arm, sixteen executed results; delivered tree `840 checks · 840 passed · 0
  failed · 0 skipped`, 269s). I did not rewrite the older "gap" audit paragraph further down that
  file — that paragraph already documents itself as not kept in lockstep with every landing (its
  own aside about WO-3.6), so I left it as the historical record it is rather than widening this
  work order into auditing prose it doesn't own.
- **`plans/work-orders/phase-1-shell-store-roster.md`** — ticked Acceptance lines 1–9 (see below);
  left line 10 (👤) unticked. Left the `Status` field (`🤖 CLAIMED`) untouched — that's a pipeline
  field I read as owned by the orchestrator/verifier, not something the brief asked me to flip.
- **`TESTING.md`** — added a `### WO-1.22` section under Phase 1 (after WO-1.17, before Phase 2),
  copying the Acceptance lines per the file's own "How to use it" step 1, with the same 9 ticked /
  1 open split and a desk-pass paragraph naming the actual run numbers.

## Acceptance, one by one

1. **Copy on every active row, none on archived.** Verified — `verify-shell.mjs` opens the
   manager, checks `c_wo122_src`/`c_wo122_bal` (active) both carry `[data-class-copy]`,
   `c_wo122_arch` (archived) does not but does carry `[data-class-restore]`, and sweeps the whole
   panel: every active row has Copy, no archived row does. **Ticked.**
2. **One new class, `… (copy)`, directly after source, terms/categories match in order.**
   Verified — read the document before/after the click; new class count +1, sits at
   `idxSrc+1`, name `"WO-1.22 Copy Source (copy)"`, term labels/dates and category names/weights
   equal the source's arrays element-for-element. **Ticked.**
3. **Every id in the copy is new.** Verified — class id, all four term ids, all four category ids
   checked absent from a pre-copy snapshot of every class/term/category id in the document, and
   each set checked internally unique. **Ticked.**
4. **Editing in the copy doesn't touch the source, and vice versa.** Verified — edited the first
   copy's term-0 label and read both source's and copy's labels; then edited the source's term-0
   label and re-read both. Same pattern for a category-0 weight. Both directions hold. **Ticked.**
5. **Roster empty, nothing else refers to it.** Verified — `copy.roster.length === 0`,
   `letterScale === null`, `archived === false`, and zero matches in `doc.attendance`,
   `doc.assignments`, `doc.openPasses`, `doc.passes` for the copy's id, against a source class that
   has one of each (plus a score on its one assignment — a leaked score is structurally impossible
   with zero copied assignments, since scores are keyed by assignment id). **Ticked.**
6. **Copying twice → two different names, no collision.** Verified — copied `c_wo122_src` a second
   time; three classes now share the `WO-1.22 Copy Source` name prefix (`…`, `… (copy)`,
   `… (copy 2)`), and every class name in the document is unique. **Ticked.**
7. **Tab bar + home grid without reload, open class unchanged.** Verified — `getSelectedClassId()`
   before and after the click both read `c_wo122_src` (set deliberately as the open class right
   before the copy, so the claim is meaningful); the copy's id sits immediately after the source's
   in both `#classTabBar` and `#homeGrid`. **Ticked.**
8. **Weights note matches: 95% carries across, 100% carries no note.** Verified — read after both
   copies of the unbalanced source, and after copying the balanced fixture: source, copy 1 and
   copy 2 all read `weights 95%`; the balanced source and its copy both read no note (`''`). Read
   before the independence-editing step, deliberately, so the weight values were still pristine.
   **Ticked.**
9. **`verify-shell.mjs` green, classes-manager 44px sweep included.** Verified by an actual run:
   `840 checks · 840 passed · 0 failed · 0 skipped`, 22,698 lines, 27.0 lines per check, 269s,
   exit 0. Full log at
   `C:\Users\WildB\AppData\Local\Temp\claude\c--dev-planbook\29c7fdab-83c9-4eed-aebd-3397d3e24ef8\scratchpad\verify-shell-wo122.log`.
   The pre-existing classes-manager sweep at `tools/verify-shell.mjs:14552` (`cm.length < 12`) ran
   in this same pass — I did not touch that floor. **Ticked.**
10. **👤 iPad line.** **Not ticked, and I have no evidence to point at.** I have no iPad. The
    44px-per-control floor is covered by the standing sweep (control 9 above), but wrapping onto a
    second line, thumb-hittability and the software keyboard opening on the rename field are all
    outside what a headless CDP session on an emulated coarse pointer can show — no emulator has a
    thumb, per `CLAUDE.md`'s own rule.

## `node tools/wo-sweep.mjs`

Ran clean: `21 checks · 19 passed · 0 failed · 2 to review`, exit 0. The two REVIEWs are the two
standing ones (sensitive-field-name sweep at 297 mentions across pre-existing files, and the
due-date/`late`/`missing` co-occurrence list) — neither names any file I touched
(`src/classes.js`, `src/categories.js` appear in neither list). Before I updated
`tools/README.md`'s call-site sentence, this sweep correctly FAILed on the stale count (808 vs. the
new 825); fixed by sourcing the real numbers from the `verify-shell.mjs` run above rather than by
arithmetic, per the file's own instruction.

## Both commands, run in full, waited for

- `node tools/verify-shell.mjs` — backgrounded, waited for completion via a polling `until`-loop
  (no Monitor tool available to me), read the finished log, confirmed `840 checks · 840 passed ·
  0 failed · 0 skipped`, exit reported 0 by the background-task notification for the whole
  composite command. ~269s.
- `node tools/wo-sweep.mjs` — run twice (once before, once after the `tools/README.md` fix), both
  runs' full output read directly.

## Decisions the work order didn't settle, and which way I went

- **Dispatcher placement of `data-class-copy`.** The brief said "beside the other class mutators,"
  which isn't a single spot — I put it immediately before the `data-class-rename` handler (the
  control it's sited beside on the row) rather than folding it into the five-line group that shares
  the "redraws the second view" comment (moveUp/moveDown/archive/restore/delete-confirm), since
  Copy doesn't move or remove anything already on the bar — it only adds. I left that shared
  comment's "five" unchanged since Copy isn't part of that group.
- **`tools/README.md`'s deep "gap" audit paragraph** (the `808 − 824 = −16` historical narrative
  further down the file) — I updated the primary running sentence and its own chronicle paragraph
  (what `wo-sweep.mjs` actually asserts) but did not extend the older gap-arithmetic paragraph,
  which by its own text isn't kept in lockstep with every landing. Flagging this rather than
  silently leaving it, in case a reader expects it kept current.
- **`Status` field on the work order.** Left as `🤖 CLAIMED` rather than moving it to `✅ DONE` —
  every other `DONE` row in the file appears to reflect a verifier's sign-off, not an implementer's
  self-report, and I didn't want to preempt that call.
- **TESTING.md section.** Not every WO in Phase 1 has one (WO-1.9, -1.12, -1.14, -1.16, -1.18
  through -1.21 don't), so this was optional rather than required by the brief's verification
  commands. I added a proportionate one (Size S, no defects found, so no elaborate mutation table
  like WO-1.17's) since the file's own "How to use it" step 1 asks for it.

## Traps — how each one was avoided

- **Key-by-key, not spread.** `copyClass()` builds a plain object listing all seven keys by hand;
  `copyTerm()`/`copyCategories()` map each source array into fresh objects with fresh ids. Proven
  rather than argued — acceptance line 4's independence check would have failed on a spread copy.
- **Never carry a `tm_`/`k_` id across.** Every id in the copy is freshly generated; acceptance
  line 3 asserts this against the whole document, not just the source.
- **No roster, in any form.** `roster: []`, always, never the source's ids.
- **No Copy on archived rows, and refused even if reached.** The button is absent from the archived
  branch of `classRow()`, and `copyClass()` itself checks `isArchived(cls)` and returns.
- **`openClassId` untouched.** `copyClass()` never calls `setPref('openClassId', …)`; verified by
  reading `getSelectedClassId()` before and after.
- **No confirm dialog.** None added.
- **`CACHE` bumped.** `v72` → `v73`.
- **The sweep's `cm.length < 12` floor left as a minimum**, not turned into an equality and not
  re-aimed — untouched.

## Files changed

- `src/classes.js`
- `src/categories.js`
- `src/shell.js`
- `sw.js`
- `docs/data-model.md`
- `tools/verify-shell.mjs`
- `tools/README.md`
- `plans/work-orders/phase-1-shell-store-roster.md`
- `TESTING.md`

Not touched: `CHANGELOG.md` (left to the teacher, as instructed), `index.html` (no new markup
needed — the button is built in JS via the existing `actionButton()`/`.class-action-btn`, which
already carries the 44px floor in `@media (pointer: coarse)`, so no CSS changes were needed either).
