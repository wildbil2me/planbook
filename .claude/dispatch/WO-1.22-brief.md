# WO-1.22 — copy a class, carrying its terms and its categories · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.22-result.md` — as your last act, and return it in-band too.

**Routing decision.** This work order sits in the **Codex** column on its merits — exhaustively
specified key by key, no new visual language (the `Copy` button is a lift of the `Rename`/`Archive`
siblings already in `src/classes.js`), no sensitive surface (the roster is deliberately *not* copied,
and that exclusion is mechanically asserted), and strong existing conventions to match. **The budget
took Codex off the table, not the runner** — the probe passed `SMOKE OK` this dispatch. The phase
file's routing note counts one full harness run (~262s), but that is the *proof* count: eight of the
nine desk-checkable Acceptance lines are new assertions inside a 22,285-line `verify-shell.mjs`, and
that development run count is open-ended, so routing on the largest it could mean gives three runs =
13.2 min against a 20-minute whole-dispatch cap, over ~27,000 lines of reading surface. That leaves
no room for the reading and the writing, so it goes to **Claude Sonnet** per `ROUTING.md`'s tier
table row 3 — a cap is a fact about the runner, not about the work, and the Codex reasoning stays
intact. **Runner-up set aside:** the two "don't tidy" Traps (the sweep's `cm.length < 12` floor, the
deliberately-uncopied letter scale) and the `announce()` prose lean Claude-on-merits, which would
have made this Opus — set aside because both are stated verbatim below rather than left to taste.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.22 — copy a class, carrying its terms and its categories

**Ship** 2 · **Status** 🤖 CLAIMED — 2026-08-17 · **Size** S · **Depends on** WO-1.6, WO-3.1
**Closes roadmap** Phase 1 → *(no box. The class-management box WO-1.6 closed is amended rather than
replaced — see the field below. Booked 2026-08-17, owner-directed.)*
**Amends roadmap** Phase 1 → the class-management box WO-1.6 closed, which promised create, rename
and reorder, and now also promises copy

**Why it exists.** Setting a year up means creating five classes and then keying the same term
structure and the same weighted categories into each of them, five times, by hand. The teacher who
does that is the owner, the deadline is the first class of the term, and the two things she is
re-keying are exactly the two things that are identical across her sections — the school's quarters
are the school's quarters, and Honors Bio and CP Bio are graded on the same weights.

**The value of this work order is spent if it lands after WO-1.16.** That work order is the fresh-year
cutover, and the setup it performs is the one occasion this button exists for. Built afterwards it is
a feature for next August. That is the whole argument for its place in the running order, and it is
an argument about *when the work is worth doing*, not about how badly the app needs it — see the
placement paragraph in [`README.md`](README.md) § Ship 2, which also names the case for the other
order.

**The shape was chosen by the owner and the alternative should not be re-derived.** The other way to
say the same wish is a *"use these terms in every class"* control, on the model of the letter-scale
panel's **Every class** subject — one structure held at the document level, classes pointing at it.
That is a bigger idea, it fights `plans/rotating-schedule.md`'s deleted schedule model on the term
half, and it is wrong for the category half, where five classes start alike and then diverge the
first time one of them turns out to need a Labs weight. **A copy is a starting point a teacher then
edits; a shared structure is a thing she has to break out of.** The owner asked for the copy.

**What comes across, and what does not, is the entire specification.** Terms and categories. Not the
roster, not attendance, not assignments, not scores, not hall passes, not days off — a copy is a new
class in every other respect, and a class carrying another class's students would be the one shape of
this feature that touches student data at all.

**The letter scale is deliberately not copied, and this is the owner's call rather than an omission.**
`cls.letterScale = null` means *the bands every class uses* (`src/letter-scale.js`'s `scaleForClass()`),
which is what a fresh class gets and what a copy gets. The per-class override has its own door in the
letter-scale panel's subject row, so nothing here needs to grow one. **The accepted cost, written down
so a verifier does not report it as a defect:** copying a class that *has* its own bands produces a
class on the every-class bands, and `data-scale-override-on` re-copies **the every-class bands** rather
than the source's — so those bands would be re-keyed by hand. That case is one class in the owner's
five, at most, today it is zero, and the fix for it belongs in the letter-scale panel if it is ever
wanted.

**Deliverables**
- **A `Copy` action on every active class row in the class manager**, hook `data-class-copy="<classId>"`,
  dispatched in `src/shell.js` beside the other class mutators and followed by `afterClassChange()` —
  the copy changes which classes are on the bar, so the home cards and the strip both redraw. Document
  the hook in that file's hook block, where the other class hooks are listed.
- **Sited directly after `Categories` and before `Rename`**, because those two buttons are the two
  things this one duplicates and a reader should not have to be told what it copies. **Not on an
  archived row** — archived is a class the teacher has put away, and every other action on those rows
  (Restore, Delete) is about ending that state.
- **What the copy holds**, stated as a list in a comment at the copier so that a per-class key added
  later is a decision somebody makes rather than a key that quietly does not come across:
  - `id` — fresh, `newId('c')`.
  - `name` — the source's, with a suffix; see below.
  - `archived` — `false`.
  - `terms` — every term's `label`, `start` and `end`, in order, **each with a fresh `tm_` id**.
  - `categories` — every category's `name` and `weight`, in order, **each with a fresh `k_` id**.
  - `letterScale` — `null`. See above.
  - `roster` — `[]`.
- **A deep copy, built key by key rather than by spreading the source.** A `{ ...cls }` shares the
  `terms` and `categories` arrays and their member objects, so editing a term label in the copy edits
  it in the source — and it also carries any future key silently, which is the failure
  [`../../docs/data-model.md`](../../docs/data-model.md) opens by describing (WO-2.8's `openPasses` and
  `passes` reached the document and never reached the backup nag).
- **The category half lives in `src/categories.js`** and is called from `src/classes.js`, the direction
  `starterCategories()` already runs in — that file's header states the one-way rule and names the four
  import loops this repo has refused. The term half lives in `src/classes.js` beside `newTerm()`.
- **Naming.** `<name> (copy)`, and where a class of that name already exists, `<name> (copy 2)`,
  `(copy 3)`, and so on — counting against every class in the document, archived included, since an
  archived class comes back. Duplicate class names are not otherwise refused anywhere in this app and
  this work order does not start refusing them; what it avoids is *producing* two rows a teacher cannot
  tell apart.
- **The new row lands in the manager with its rename field open and its text selected** — the existing
  `startRename()` path, no new affordance. `(copy)` is a placeholder for the name the teacher is about
  to type, and a copy button that leaves her to find the Rename button on a row she cannot yet tell from
  its neighbour has done four fifths of the job.
- **Placed directly after its source in `doc.classes`**, which is the tab order — the array *is* the
  order (`moveClass()`'s comment). A copy of Period 1 belongs beside Period 1, and the arrows are there
  if it does not.
- **An `announce()` that says what came across and what did not**, in one sentence naming both counts.
  A screen-reader user cannot see the row appear; and the sentence is also where a sighted teacher
  learns the roster did not come with it.
- **The open class does not change.** A copy is not an invitation to leave the class you are in — the
  rule `createClassFromForm()` follows for every class after the first.
- **One line in [`../../docs/data-model.md`](../../docs/data-model.md)** beside the class sketch saying
  what a copy carries, because "does this new per-class field come across?" is a question about the
  document shape and the sketch is where that shape is settled.

**Out of scope** — copying the roster, attendance, assignments, scores, passes or days off, all of
which are refused above and none of which is a cheap extension of this; copying the letter-scale
override; a document-level *"use these terms everywhere"* control (the shape the owner did not pick);
copying a class between year documents; any change to archive, delete, or the rules about duplicate
class names; a confirm dialog — a copy is cheap, visible, and undone by Archive then Delete, which is
the path an unwanted class already has.

**Acceptance**
- [ ] The class manager shows a `Copy` control on every active class row and on no archived row.
- [ ] Copying a class with four terms and four categories produces exactly one new class, named
      `… (copy)`, sitting directly after its source in the document and on the tab bar, whose term
      labels and dates and whose category names and weights match the source's, in order.
- [ ] Every id in the copy is new: its class id, every term id and every category id are absent from
      the source and from every other class in the document.
- [ ] Editing a term label and a category weight **in the copy** leaves the source's unchanged, and
      editing them in the source leaves the copy's unchanged. *(The check that catches a shared array;
      a spread copy passes every line above this one.)*
- [ ] The copy's roster is empty, and no attendance record, assignment, score or hall pass in the
      document refers to it — asserted against a source class that has all four.
- [ ] Copying the same class twice produces two classes with different names, and neither name
      collides with a class already in the document.
- [ ] The copy is on the class tab bar and in the home grid without a reload, and the open class is
      the one that was open before the copy.
- [ ] The copy's weights note reads what the source's reads: a source at 95% copies to a row saying
      `weights 95%`, and a source that totals 100 copies to a row with no note.
- [ ] `node tools/verify-shell.mjs` is green, the classes-manager 44px sweep included — it measures
      every control in that panel, so the new button is inside it already.
- [ ] 👤 On the teaching iPad, in the installed app, on the deployed build: a class row with seven
      actions wraps onto a second line rather than spilling out of the panel, `Copy` is hittable with a
      thumb, and the rename field it opens takes the software keyboard.

**Traps** — **Build the copy key by key.** A spread or an `Object.assign` shares the two arrays this
work order exists to duplicate and passes most of the list above. **Never carry a `tm_` or `k_` id
across.** WO-3.3's Traps line is the reason: `src/categories.js`'s `removalCounts()` and
`applyRemoval()` were safe filtering on `categoryId` alone only while ids were opaque, and a copy
sharing them would let a category removal in one class count and delete work in another — the exact
bug WO-3.3's `classId` guard closed, reintroduced from the other end. **Do not copy the roster** in any
form, including "just the ids" — a class roster is a list of students and this button is not a way to
move them. **Do not offer Copy on an archived row.** **Do not touch `openClassId`.** **Do not add a
confirm.** **Bump `CACHE` in `sw.js`** — `src/` files are in `SHELL`, and without the bump no device
sees this at all. **The sweep's `cm.length < 12` floor is a minimum and the extra control keeps it
green**; do not "fix" it into an equality, and do not re-aim it at a count that this work order's own
change would then be the only thing asserting.

**Routing note** — app code plus `verify-shell.mjs` checks, one full harness run (~262s), and a 👤
line that only the teacher can close. Nothing here needs mutation proof over the harness, so the
`codex-invoke.mjs` cap arithmetic that forced WO-2.34 to Claude does not apply; the rubric decides it
on its merits.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `docs/data-model.md`
  - `plans/rotating-schedule.md`
  - `src/categories.js`
  - `src/classes.js`
  - `src/letter-scale.js`
  - `src/shell.js`
  - `tools/verify-shell.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**The sibling conventions this must match — read these specific places, not just the files:**

- `src/classes.js` — `actionButton()` and the row render around **lines 570–660**, which is where the
  six existing controls are built and where `Copy` goes (**after `Categories`, before `Rename`**, and
  on the active branch only — the archived branch at ~626 builds Restore/Delete and must not gain
  it). `startRename()` at **~763** is the affordance the new row reuses; do not build a second one.
  `newTerm()` is where the term half of the copier belongs, and `moveClass()`'s comment states that
  the array **is** the tab order, which is what "directly after its source" means.
  `createClassFromForm()` is the precedent for **not** changing `openClassId`.
- `src/categories.js` — its **file header** states the one-way import rule (`classes.js` calls into
  it, never the reverse) and names four import loops this repo has refused; the category half of the
  copier lives here and is called from `classes.js`, the direction `starterCategories()` already
  runs. Also read `removalCounts()` and `applyRemoval()`: the Traps' warning about carrying a `k_`
  id across is precisely WO-3.3's `classId` guard reintroduced from the other end.
- `src/shell.js` — the hook block at **lines ~52–61** is where `data-class-copy="<classId>"` gets
  documented alongside the other class hooks, and the dispatcher at **~967** is where it is wired.
  `afterClassChange()` at **~440** is the redraw this must call, and the comments at ~542, ~605 and
  ~727 explain what each redraw variant is for and what forgetting one costs — read them before
  choosing.
- `src/classes.js` **lines 608–618** — the weights note (`'weights ' + formatWeight(weightTotal(cls)) + '%'`)
  that Acceptance line 8 asserts. It is derived from the categories, so a correct deep copy makes that
  line pass for free; if it does not, the copy is wrong rather than the note.
- `src/letter-scale.js` — `scaleForClass()`, so that `letterScale = null` is understood as *the bands
  every class uses* rather than as an unset field. The work order's accepted cost here is written
  down deliberately; do not "fix" it.
- `tools/verify-shell.mjs` **line ~14552** — the `cm.length < 12` floor in the classes-manager 44px
  sweep. It is a **minimum** and the seventh control keeps it green. Do not turn it into an equality
  and do not re-aim it at a count only this change would assert. Line ~5383's comment says "six
  controls"; that is prose describing today's row, and it is fair to update it to match.
- `sw.js` — bump `CACHE`. `src/` files are in `SHELL`, and without the bump no device sees this at
  all.
- `docs/data-model.md` — the class sketch, which gets **one line** on what a copy carries.

---

## 3. Constraints — non-negotiable, and each one has already cost someone a day

Codex does not read `CLAUDE.md`. It reads [`../../AGENTS.md`](../../AGENTS.md), which points back at
it — but the pointer is not enough for the constraints that matter. The orchestrator inlines these
into every brief, verbatim:

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
- Stay inside the work order's **Out of scope** line.
- You may tick the boxes your own run closed, and update `plans/` and `TESTING.md` as you go. Two
  exceptions: **never tick a 👤 line** — it needs a real iPad and you do not have one — and leave the
  `CHANGELOG.md` entry to the teacher, who decides what a change means. Anything you do tick must be
  something you actually checked; a tick you cannot point at evidence for is worse than a blank box.

---

## 4. Verification

```
node tools/verify-shell.mjs      # measures what a stylesheet review gets wrong
node tools/wo-sweep.mjs          # the eight standing greps
```

Both must be green before you report. **Do not write a second harness** — if this work order
needs a check `verify-shell.mjs` cannot make, say so in your report as a proposed follow-up.
Add checks for what you build; a fixture that cannot express the failure is not evidence.

---

## 5. Done means these 10 lines, reported against one by one

1. The class manager shows a `Copy` control on every active class row and on no archived row.
2. Copying a class with four terms and four categories produces exactly one new class, named `… (copy)`, sitting directly after its source in the document and on the tab bar, whose term labels and dates and whose category names and weights match the source's, in order.
3. Every id in the copy is new: its class id, every term id and every category id are absent from the source and from every other class in the document.
4. Editing a term label and a category weight **in the copy** leaves the source's unchanged, and editing them in the source leaves the copy's unchanged. *(The check that catches a shared array; a spread copy passes every line above this one.)*
5. The copy's roster is empty, and no attendance record, assignment, score or hall pass in the document refers to it — asserted against a source class that has all four.
6. Copying the same class twice produces two classes with different names, and neither name collides with a class already in the document.
7. The copy is on the class tab bar and in the home grid without a reload, and the open class is the one that was open before the copy.
8. The copy's weights note reads what the source's reads: a source at 95% copies to a row saying `weights 95%`, and a source that totals 100 copies to a row with no note.
9. `node tools/verify-shell.mjs` is green, the classes-manager 44px sweep included — it measures every control in that panel, so the new button is inside it already.
10. 👤 On the teaching iPad, in the installed app, on the deployed build: a class row with seven actions wraps onto a second line rather than spilling out of the panel, `Copy` is hittable with a thumb, and the rename field it opens takes the software keyboard.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

