# Brief — WO-1.5 Backup & restore

**Route:** Claude (`work-order-implementer`).
**Why this route:** backup and restore is on `plans/work-orders/ROUTING.md`'s never-delegate list by
name — the file it produces will carry accommodation and medical data from WO-1.8 onward, and the UI
copy that says so is teacher-facing prose. The mechanical half (JSON round-trip, validation) would
have suited Codex; the sensitive-surface rule overrides it.

**Branch:** `phase/1-shell-store-roster`. Do not create a new branch, do not commit unless the work
order asks (it does not) — leave the changes in the working tree for the verifier.

---

## 1. The work order, verbatim

> ## WO-1.5 — Backup & restore
>
> **Ship** 1 · **Status** ⬜ NOT STARTED · **Size** M · 🚩 · **Depends on** WO-1.4
> **Blocks** WO-1.6 and every work order after it
> **Closes roadmap** Phase 1 → "Backup: one-click JSON download…" and "Restore: drop a backup file…"
>
> **Why it exists.** This is the gate. *No feature that writes student data lands before the path
> that gets it back out.* A file the teacher holds is the only recovery path that survives eviction,
> a wiped browser, and a dead laptop — sync is not a backup, because Drive holds one live copy that
> sync will happily overwrite.
>
> **Deliverables**
> - One-click download of the year document as plain JSON, filename carrying the year and the date.
> - Last-backup timestamp in `planbook_` (a UI fact, not student data), and a nag when it's over
>   7 days old — visible enough to act on, not modal enough to train dismissal.
> - Restore: a file input *and* a drop target, reading a backup file back in.
> - A confirm step that **names what is being replaced** — the year, the class count, the student
>   count, and the date of the document being overwritten versus the one coming in.
> - Backup UI copy stating plainly that the file contains accommodation and medical data, because
>   from WO-1.8 it will.
> - **A way out of the boot-failure screen.** WO-1.4 made `boot()` refuse a document written by a
>   newer build and hold the loading screen up, deliberately — a gradebook that looks like it works
>   and silently discards what is typed into it is the worse lie. But there is currently no exit: the
>   teacher sees a stuck loading screen and can do nothing. Restore *is* the exit, so it is reachable
>   from that screen or it is not really a recovery path. Added 2026-08-04 after WO-1.4's verification.
>
> **Out of scope** — automatic scheduled backups (no background execution exists), and Drive.
>
> **Acceptance**
> - [ ] Download → wipe browser storage → restore: the document is byte-identical in content.
> - [ ] The restore confirm names the outgoing document and the incoming one, with counts, before
>       anything is replaced.
> - [ ] Cancelling the confirm leaves the existing document untouched.
> - [ ] A malformed or non-Planbook JSON file is refused with a message saying what was wrong, and
>       does not partially apply.
> - [ ] A backup from a different `schemaVersion` either migrates or refuses — never half-loads.
> - [ ] The nag appears when the last backup is >7 days old and clears on a successful download.
> - [ ] The backup UI says what sensitive data the file contains.
> - [ ] A document `boot()` refuses — one from a newer `schemaVersion` — leaves the teacher a
>       reachable way to restore from a backup file, rather than a loading screen with no exit.
>
> **Traps** — Restore is the most destructive operation in the app. Never restore into the open
> document in place; build the new document, validate it, then swap. A restore that fails halfway is
> worse than no restore.

The phase file also carries this, above every work order in it, and WO-1.5 is its subject:

> **The ordering rule for this phase:** WO-1.5 (backup & restore) lands before WO-1.6 and everything
> after it. No feature that writes student data ships before the path that gets it back out.

---

## 2. Read these first

Read them before writing anything. The first three are the ones that will change what you build.

| File | Why |
|---|---|
| `CLAUDE.md` | The architecture and the reasoning you must not undo. The accommodations section is directly relevant to the backup copy. |
| `src/store.js` (523 lines) | The whole surface you are building on: `boot()`, `openYear`, `createYear`, `migrateDocument`, `MIGRATIONS`, `SCHEMA_VERSION`, `flush()`, `leaveCurrent()`, the save loop and its `rev` discipline. Read the header comment in full. |
| `src/prefs.js` | `setPref()` **refuses any key not declared in `PREF_DEFAULTS`.** Your last-backup timestamp needs a declared key with a default and a comment saying why it is a UI fact and not student data. Adding the key is not optional plumbing — without it the write silently fails and only logs. |
| `docs/data-model.md` | The document shape, § Storage, § Backups, and line 193's note that the JSON now contains IEP and medical data. |
| `design/style-guide.md` | Colors, the 44px rule, the `@media (pointer: coarse)` block, voice. |
| `src/README.md` | The `src/` conventions every file here follows: one concern per file, kebab-case, named for what it owns. |
| `src/shell.js` | The delegation convention (`data-*` hooks, one document click listener — **never** inline `onclick`, which cannot see a module's exports), and `showBootFailure()`, which you are extending. |
| `src/year-picker.js` | The closest existing model for what you are writing: a shell feature in its own module, driven by `data-*` hooks, rendering rows with `createElement` rather than `innerHTML`, surfacing store errors in its own modal rather than on the save chip. Copy this shape. |
| `index.html` | Where the modals, the loading screen, and the teacher-facing copy live. Copy a teacher reads belongs in the markup, not in a JS string — both the install banner and the loading error say so in comments. |
| `tools/README.md` § `verify-shell.mjs` | **Four CDP traps plus a fifth about sleeps-as-races.** Every agent so far has rediscovered these from scratch. Do not write a second harness. |
| `plans/work-orders/README.md` | How a work order is used. |

`docs/FERPA.md` is referenced by `CLAUDE.md` and `docs/data-model.md` but **does not exist in this
repo yet** — it belongs to a later phase. Do not create it. The backup copy still has to say what is
in the file; that obligation is this work order's, not the doc's.

---

## 3. Constraints — from `ROUTING.md`, verbatim, non-negotiable

- No dependencies, no framework, no bundler, no linter, no test framework. No `package.json`.
- Colors inline, not CSS variables. No dark mode anywhere — no `prefers-color-scheme`, no
  `[data-theme]`.
- Every new control gets a 44px minimum in the `@media (pointer: coarse)` block.
- `localStorage` prefix `planbook_`, UI preferences only — never student data.
- No merge field, log line, print surface, or export emits accommodation, medical, or plan data.
- `late` and `missing` are teacher-marked, never inferred from a date. Blank means ungraded.
- Empty categories redistribute their weight.
- Taken · dropped · not-taken-yet are three states. Everything counts recorded meetings, never
  calendar days.
- Stay inside the work order's **Out of scope** line. Do not tick roadmap boxes, edit `plans/`, or
  touch `CHANGELOG.md` / `TESTING.md` — the teacher does maintenance, after the verifier reports.

**One clarification on the fifth bullet, because it reads backwards here.** "No export emits
accommodation data" governs *merge fields, print surfaces, and outreach* — surfaces where the data
leaks to a third party. **The backup file is the deliberate exception**: it is a complete copy of the
year document, accommodations included, because a backup that omits them is not a recovery path. That
is exactly why the work order requires the UI to say so out loud. Do not "fix" this by filtering the
backup.

---

## 4. What is already on disk

Everything below is WO-1.1 through WO-1.4 and is working. Build on it; do not rebuild it.

- **`src/store.js`** — one IndexedDB object store `years`, keyed by year string, one record per year
  document. `migrateDocument(doc)` returns `{ doc, applied[] }` and throws with a teacher-readable
  message on: no `schemaVersion`, a newer `schemaVersion` than this build, or a gap in the migration
  ladder. `SCHEMA_VERSION` is `1` and `MIGRATIONS` is empty by design. `writeDocument()` resolves on
  transaction `complete`, never on request `success`. The save loop bumps `rev` before the write and
  **puts it back if the write never lands**.
- **`src/prefs.js`** — `PREF_DEFAULTS` currently declares `installBannerDismissedAt` and `openYear`.
- **`src/shell.js`** — the single delegated click listener, the `data-*` hook table in its header
  comment (keep that table current), `showBootFailure(e)`, and the `window.planbook` console seam.
  The seam exists because nothing on screen writes to a year document yet; if your feature needs a
  console-reachable handle for the verifier, add it there with a comment saying why, and expect it to
  go when WO-1.10 removes the shelf.
- **`src/modal.js`** — `openModal(id, opener)` / `closeModal(overlay|id)`, focus trapped, Escape and
  backdrop close, focus returned to the opener. Safari does not focus a button on tap, which is why
  the opener is passed explicitly rather than read from `document.activeElement`.
- **`src/live-region.js`** — `announce(message)`. One `aria-live` region in the document; do not add
  a second.
- **`src/save-indicator.js`** — `showSaveState(state)`. **The chip means "did a save land."** A
  restore validation error is not a save; put it in the dialog and announce it, exactly as
  `year-picker.js` does.
- **`index.html`** — `#loadingScreen` with `#loadingStatus`, `#loadingError`, `#loadingErrorDetail`;
  the header with `#yearButton`; the install banner; the component shelf inside `<main>` (temporary,
  removed at WO-1.10); `#aboutModal` and `#yearModal`.
- **`sw.js`** — precaches the shell. If you add a file the app loads, the precache list needs it and
  the cache version needs bumping, or an installed iPad will not see the new file.
- **`tools/verify-shell.mjs`** — 28+ checks, currently green, driven over CDP against the real page.

---

## 5. Notes on the hard parts

These are observations from the dispatch, not instructions that override the work order. Where they
conflict with the work order text, the work order wins.

**The boot-failure exit is the subtle deliverable.** The failing document is, by construction, one
the store refuses to open — so the restore path reachable from that screen cannot assume `getDoc()`
returns anything, cannot call `update()`, and cannot rely on any module that expects an open
document. Whatever you build has to work with `current === null`. This is also the one acceptance
line with no existing UI to hang off; `#loadingError` in `index.html` is where it goes.

**"Byte-identical in content" is the phrase to read carefully.** Downloading, wiping, and restoring
must give back the same *document content*. `rev` and `updatedAt` are save bookkeeping and the store
will move them the moment it writes — decide deliberately what the restored document's `rev` is,
write down the reasoning in a comment, and make sure the answer cannot make a later sync compare
against a `rev` that never existed. `docs/sync.md` explains why `rev` is the ordering key.

**Validation must complete before anything is replaced.** The trap says it: build, validate, swap.
A partially-applied restore is worse than a refused one. Consider what "validate" means concretely —
it is JSON, it is an object, it has a `year`, it has a `schemaVersion` the migration ladder can
place, and its collections are the shape `newYearDocument()` produces. A file that passes JSON.parse
and is a shopping list must be refused by name, not by a stack trace.

**The nag is not a modal.** The work order's phrasing — "visible enough to act on, not modal enough
to train dismissal" — is the whole spec. The install banner in `index.html` is the established
pattern for a persistent strip, and its comment explains why it is amber and not red: a strip that
looks like an error every launch is a strip that is tuned out by October. The same reasoning applies.

**A restore replaces a year document.** Think about what happens when the incoming file's `year`
differs from the open one, and say what you decided in a comment. There is a real choice here and
either answer can be defended; an unstated one cannot.

---

## 6. Verification you are expected to run

- **`node tools/verify-shell.mjs` must still pass, with its check count not fallen.** Run it before
  you start and after you finish, and report both numbers. New controls you add should appear in its
  touch-target sweep; if they do not, say so in your report rather than papering over it.
- **Read `tools/README.md` § "Driving a browser over CDP" first.** Five traps, each of which first
  looks like an app defect, each already diagnosed twice by two different agents. In particular:
  a fixed sleep before a measurement is a race that *hides* defects, and an empty result set and a
  clean result set are the same value.
- **Do not write a second harness.** If this work order needs a check `verify-shell.mjs` cannot
  make, say so in your report as a proposed follow-up. That is a conversation, not a refactor, and
  not a throwaway script in the repo.
- Anything that needs a real iPad — a real drop of a real file, a real download to the Files app,
  a 44px target under a thumb — is a 👤 item. Name it as one in your report. Do not claim it.

---

## 7. What "done" means

Report against exactly this list, one line each, marked ✅ / ❌ / 🙋 (needs a human on an iPad), with
the evidence for each — the command you ran or the file:line that satisfies it.

1. Download → wipe browser storage → restore: the document is byte-identical in content.
2. The restore confirm names the outgoing document and the incoming one, with counts, before
   anything is replaced.
3. Cancelling the confirm leaves the existing document untouched.
4. A malformed or non-Planbook JSON file is refused with a message saying what was wrong, and does
   not partially apply.
5. A backup from a different `schemaVersion` either migrates or refuses — never half-loads.
6. The nag appears when the last backup is >7 days old and clears on a successful download.
7. The backup UI says what sensitive data the file contains.
8. A document `boot()` refuses — one from a newer `schemaVersion` — leaves the teacher a reachable
   way to restore from a backup file, rather than a loading screen with no exit.

Also report: files added and changed with line counts, the `verify-shell.mjs` before/after counts,
anything you decided that the work order did not settle (with your reasoning), and any follow-up you
think is warranted but did **not** do because it was outside the Deliverables.

**Write your report to `.claude/dispatch/WO-1.5-result.md` as your last act.** It is half the audit
trail: the brief records what was asked, the result records what came back.
