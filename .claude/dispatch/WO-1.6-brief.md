# WO-1.6 — Classes & terms · implementation brief

You are implementing **one** work order in the Planbook repo at `c:\dev\planbook`, on branch
`phase/1-shell-store-roster`. Build exactly what is below. Nothing more.

Write your report to `.claude/dispatch/WO-1.6-result.md` as your last act.

> **Re-routed to Claude, 2026-08-04 15:23.** This brief was written for Codex and dispatched there.
> Codex's Windows sandbox could not launch `codex-windows-sandbox-setup.exe` (31 failures across
> reads, `apply_patch`, and `exec`), so it wrote nothing — the record is in
> `.claude/dispatch/WO-1.6-codex-blocked.md` and the worktree was untouched. **The brief has not
> changed; only who receives it has.** Two amendments only: read `CLAUDE.md` as well as `AGENTS.md`,
> and the constraints in §3 apply to you exactly as written. **This is a clean start, not an
> interrupted draft** — no source file for this work order exists yet, so there is nothing to audit.

---

## 1. The work order, verbatim

> ## WO-1.6 — Classes & terms
>
> **Ship** 1 · **Status** ⬜ NOT STARTED · **Size** M · 🚩 · **Depends on** WO-1.5
> **Closes roadmap** Phase 1 → "Class management: create/rename/reorder five-plus classes; term
> structure per class."
>
> **Why it exists.** Five classes, reachable at a touch, is the owner's founding requirement. Terms
> are per class and configurable because the five classes differ and because the app must be sellable
> to a teacher on semesters or trimesters.
>
> **Deliverables**
> - Create, rename, reorder, and archive classes. Reorder is what makes "one tap to any class" work.
> - Per-class term structure: add/rename/date terms. Quarters, semesters, trimesters, or one term.
> - A term picker in the header that every later screen reads from.
> - Sensible defaults on first run that are trivially editable — never hardcoded `Q1`–`Q4`.
>
> **Out of scope** — categories and weights (WO-3.1); anything grade-shaped.
>
> **Acceptance**
> - [ ] Six classes can be created, reordered by drag or by explicit up/down controls, and renamed.
> - [ ] Two classes in the same document can have different term structures, and both work.
> - [ ] A class can be given a single year-long term.
> - [ ] Term dates can overlap or leave gaps without the app breaking — real calendars are messy.
> - [ ] Deleting a class warns about the attendance and grade data it takes with it, and can be
>       cancelled.
>
> **Traps** — Never write `Q1` as a literal anywhere outside seed data. The term id is opaque.

---

## 2. Read these first, before writing anything

| File | Why |
|---|---|
| `AGENTS.md` | The repo's standing instructions to you |
| `docs/data-model.md` lines 51–58 | The `classes[]` / `terms[]` schema. This is the settled shape |
| `src/README.md` | The `src/` conventions every later work order copies |
| `src/store.js` | The document, `update()`, `newId()`, `getDoc()`, `subscribe()`, seed-data precedent |
| `src/year-picker.js` | **Your template.** Header button → modal → rows rendered from the document |
| `src/shell.js` lines 1–130 | The `data-*` delegation convention and the hook table you must extend |
| `src/prefs.js` | `PREF_DEFAULTS`. Read this before you reach for `localStorage` |
| `src/modal.js` | Modal behavior. Semantics live in `index.html`; do not duplicate behavior |
| `index.html` lines 142–149 | The slot WO-1.2 reserved for **this** work order |
| `src/shell.css` lines 155–170, 280–300, 355–370, 420–445, 530+ | The classes you must reuse |
| `design/style-guide.md` | Every colour and spacing value. Colours are inline, by convention |
| `plans/rotating-schedule.md` | Why there is no schedule model. Term dates must not become one |
| `tools/README.md` § `verify-shell.mjs` | The harness, and four CDP traps already paid for |

---

## 3. Constraints — non-negotiable, and each one has already cost someone a day

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

---

## 4. Where this plugs in

WO-1.2 left you a labelled socket. `index.html:142-149`:

```html
<div class="header-bottom">
  <!-- WO-1.6 fills this with .cls-tab buttons and adds the term nav to the right, behind
       .hdr-divider. .hdr-empty stands in meanwhile, because a blank navy strip reads as a
       bug and "No classes yet." is the truth. -->
  <nav class="hdr-class-tabs" id="classTabBar" aria-label="Classes">
    <span class="hdr-empty">No classes yet.</span>
  </nav>
</div>
```

**Reuse the components that already exist. Do not invent a second visual language:**
`.cls-tab` / `.cls-tab.active` (on-dark class tabs), `.hdr-divider`, `.hdr-empty`,
`.avatar` + `.av0`–`.av9` (class avatars, ten colours by `id % 10`),
`.class-action-btn` / `.primary` / `.danger` / `:disabled`, `.year-row` (the row grammar for a
list in a modal), `.empty-state`, `.modal-*`. All are in `src/shell.css` and all are
demonstrated on the component shelf in `index.html`.

**Follow `year-picker.js`'s shape exactly.** A shell feature owns its own module named for the
thing it owns (`src/classes.js`, and a second file if terms genuinely want one), and `shell.js`
only routes `data-*` hooks to it. Add your hooks to the table in the `shell.js` header comment —
that table is the documentation of the convention.

**The term picker is an API, not just a control.** "A term picker in the header that every later
screen reads from" means WO-2.x and WO-3.x will import an accessor from your module to ask which
term is selected. Export one, and give it a comment saying it is the read point.

---

## 5. Traps specific to this work order

**1. `docs/data-model.md` shows `"id": "Q1"` and you must not copy that.** Line 54 reads
`"terms": [{ "id": "Q1", "label": "Quarter 1", … }]`. That is illustrative shorthand in a schema
sketch. The work order's Traps line overrides it: **the term id is opaque.** Generate it with
`newId()`. The string `Q1` may appear as a *seed `label`* and nowhere else — never as an id, never
compared against, never switched on.

Note the prefix collision: `store.js:64-67` documents `c_ class, k_ category, s_ student,
a_ assignment, l_ log, e_ event, t_ template` — `t_` is already **template**. Pick an unused
prefix for terms and add it to that comment list, so the next work order finds it documented.

**2. Declare any new preference in `PREF_DEFAULTS` or it silently will not write.** If you
remember the open class or the open term in `localStorage`, `src/prefs.js`'s `setPref()` **refuses
any key not declared in `PREF_DEFAULTS`** and only logs to the console. This exact defect shipped
in WO-1.4 — `setPref('openYear')` against an undeclared key — and it fails silently, so it looks
like it works. Declare the key with a comment saying why it is a UI fact and not student data.
Only a class **id** or term **id** may go there; never a class name (that is teacher-typed
content).

**3. Term dates must not become a schedule.** `plans/rotating-schedule.md` records a cycle model
that was designed and removed the same day. Term dates are labels on a range, nothing more.
Nothing may validate them into a contiguous calendar, sort-and-repair them, warn about a gap,
reject an overlap, or infer "which class meets today" from them. The acceptance criterion is that
messy dates *work*, so the correct amount of validation here is close to none. Empty dates are
valid — a teacher who has not looked up the calendar yet still needs the term.

**4. HTML5 drag-and-drop does not work with touch on iPad.** Acceptance says "by drag **or** by
explicit up/down controls," so **explicit up/down buttons are the touch-safe path and they fully
satisfy it.** Build those. If you add drag on top for the laptop, it is a second affordance over
working buttons, never the only one. Also note `shell.js:147-162` already owns document-level
`dragover`/`drop` to stop a stray file navigating the page away — do not disturb it.

**5. Build rows with `createElement`, never `innerHTML`.** `year-picker.js:58-62` states the
convention and why it exists: class names are typed by the teacher, and a name containing an angle
bracket must be text, not markup. This is the file where that stops being hypothetical.

**6. Archive and delete are different operations.** Archive keeps the data and takes the class out
of the way. Delete destroys attendance records, assignments and scores for that class. Do not
implement one as the other, and do not let delete be the only way to get a class off the tab bar.

**7. The delete confirm goes through the app's modal tier, not `confirm()`.** It must name what is
being destroyed with real counts read off the document — attendance records, assignments, scores —
and cancelling must leave the document untouched. `src/backup.js`'s restore confirm is the model
for both the pattern and the voice: plain, specific, no exclamation marks, says what will happen.
This is 🚩 go-live copy; write it for a teacher, not for a developer.

**8. Write only through `store.update()`.** Mutating `getDoc()` directly leaves the change in
memory and nowhere else. A new class carries the full shape from `docs/data-model.md` with every
collection **present and empty** rather than absent — `categories: []`, `roster: []`,
`letterScale: null` — for the reason at `store.js:102-104`. `categories` stays empty: weights are
WO-3.1 and out of scope.

**9. Do not remove the component shelf** in `<main>`. WO-1.10 removes it whole. Do not remove the
`window.planbook` console seam either; if your module needs to be reachable from the harness, add
it there the way `store` and `backup` were.

---

## 6. Verification

**Point everything at `tools/verify-shell.mjs`. Do not write a second harness.** It drives the
real app in headless Edge/Chrome over CDP and currently passes **79/79**. `tools/README.md`
documents four CDP traps that every agent so far has rediscovered from scratch — read that section
before you touch it.

Add checks for your acceptance lines to that file and run `node tools/verify-shell.mjs`. Report
the count. A check that cannot be made there — anything needing a real thumb on real glass — is
reported as owed to a human, not faked green.

## 7. Done means these five lines, reported against one by one

- [ ] Six classes can be created, reordered by drag or by explicit up/down controls, and renamed.
- [ ] Two classes in the same document can have different term structures, and both work.
- [ ] A class can be given a single year-long term.
- [ ] Term dates can overlap or leave gaps without the app breaking — real calendars are messy.
- [ ] Deleting a class warns about the attendance and grade data it takes with it, and can be
      cancelled.

For each: what you built, and the command or check that demonstrates it. State plainly anything you
could not verify from a desk. Do not tick anything in `plans/`, `TESTING.md`, or `CHANGELOG.md` —
a separate verifier reads this work order cold, and the teacher owns the maintenance.
