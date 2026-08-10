# WO-3.3 — Assignments · result

**Implementer** Claude (work-order-implementer), Opus. **Date** 2026-08-09.
**This file is the correction-round-1 report and replaces the first-round one.** § 1 is the four
things the verifier's FAIL asked for, one by one. § 2 is the seven Acceptance lines as they stand
now. Everything below § 2 is the first round's account, updated where this round changed it.

**Harnesses, on the tree as it stands**
`node tools/verify-shell.mjs` → **515 checks · 515 passed · 0 failed · 0 skipped** (473 before this
work order, 507 at the end of round 1, 42 added in total). `node tools/wo-sweep.mjs` → **15 checks ·
13 passed · 0 failed · 2 to review**, both the standing REVIEWs argued in § 6 and unchanged in kind
by this round. `node tools/wo-gate.mjs --audit` → **PASS**, 78 roadmap fragments and **5 `**Owes**`
pointers**, all resolving.

**Untouched, deliberately:** the six 👤 ticks in `TESTING.md` § WO-3.3 and WO-3.1's re-opened one.
They are the owner's, from real hardware, and nothing in this round went near them.

---

## 1. Correction round 1, against the four asks

### Finding 1 — the duplicate dialog showed a category it would not use. **Fixed, and the check was red first.**

**The fix** is in `copySelect()`, `src/assignments.js`. When the proposal holds a value that is not
among the options and there *are* options, a real `<option value="">` is appended at the top and
marked `selected` — which is exactly what `categoryField()` twelve lines up does, and the two no
longer disagree. That answers both halves the brief named: the control can no longer display a value
the proposal does not hold, and because the displayed option is now the placeholder, **every real
category is a genuine change** and therefore reachable by a tap that fires `change`. The option
disappears the moment the proposal holds a real category, so it cannot be chosen back into by
accident — `categoryField()`'s rule, stated again at the new function's head with the scar that
produced it. `renderCopyFields()` passes `— choose a category —` and `— choose a term —`; the term
select cannot reach the unmatched state today, and the label is passed rather than defaulted so that
a future caller cannot get a blank option by omission.

**The evidence that the check is a check.** I wrote the harness checks first, reverted both of this
round's source fixes, and ran the harness: **three checks went red** (run kept at
`scratchpad/vs-unfixed.txt`) —

- `the duplicate dialog proposes the TARGET class's own term, and files under nothing when that class has no category of the source's name` — the select read `k_3x5k0g2m57`, a real category id, where the proposal held `''`. This is the verifier's own observation reproduced.
- `the copy dialog never displays a category it will not file the copy under, and every real category is a change away from what is shown` — *displaying "Tests — 40%" for a proposal of "" over 4 real categories*.
- the term-switch check, below.

Both reverts were made in one run rather than two. The attribution is unambiguous from what each
check reads — the first two read the copy dialog's `<select>`, the third reads the assignment table
after a term tap — but I did not run them separately and am saying so rather than implying I did.

Two supporting checks go with it: the note is asserted to be the *unmatched* note (it names the
source's category and says "Pick one above"), which proves the module's proposal really is empty
rather than only the DOM reading empty; and picking a category through the real `change` path is
asserted to move the proposal onto it and retire the placeholder.

### Finding 2 — the `TESTING.md` line. **Earned back, on a rebuilt fixture and the mutation the brief named.**

The verifier's diagnosis was right and I had missed it about my own check, having caught the same
shape one check earlier. The fixture now builds **both** directions instead of relying on the
absence of a coincidence:

1. The source's category is renamed, **through the real name field in the real category manager**,
   to `Copy probe — labs (WO-3.3)` — a name chosen to be one no teacher would reuse, so "no other
   class has it" is a fixture rather than an accident. A check asserts the fixture is real: the
   source category carries that name and the target class carries none like it.
2. The dialog is driven against that (the no-match case) — Finding 1's checks.
3. The target class is then given a category of **that same name**, through the real category
   manager's *Add a category* and the real name field, at 0% and disturbing no other weight. A check
   asserts the twin exists, has an id of its own, and that the source's id is not among the target's.
4. The dialog is driven again and the copy is confirmed: the proposal, the displayed option and the
   written `categoryId` are all asserted to be **the target's id for that name**, distinct from the
   source's id, present in the target's category list and absent from the source's.

**The mutation the brief asked for by name:** `matchCategory()` returning `''` unconditionally.
Run (`scratchpad/vs-mut-match.txt`) → **2 red**:

```
FAIL | with a category of that name in the target, the dialog proposes the TARGET's id for it and shows it
        proposed "" and displayed "— choose a category —"
FAIL | the copy is filed under the TARGET class's own id for that category name, never the source's
        "Copy probe — labs (WO-3.3)": source id "k_2o525u5923" -> copy id ""
```

Reverted. On that evidence the `TESTING.md` line is `- [x]` again, with the verifier's finding kept
inline rather than deleted, and the mutation is row three of that section's table — which is now
seven rows, not six. Both new fixtures come down at the foot of the section, in the one `update()`
the roster teardown beside them already establishes as the idiom for a fixture coming down.

### Finding 3 — the line-2 debt. **Re-pointed at a purpose-built box on WO-3.5.**

WO-3.5 gained, immediately above the two boxes inherited from WO-3.1:

```
- [ ] **Moving an assignment to another category updates every displayed grade in that class
      immediately** — the two categories it leaves and joins, and the overall grade with them.
      *(Inherited from WO-3.3.)*
```

WO-3.3's line 2 now ends `→ WO-3.5 "Moving an assignment to another category updates every displayed
grade in that class"`. The fragment stops where the box wraps, per README § "Header fields" rule 3,
and it matches exactly one box in the directory (grepped, and `--audit` would say so otherwise). The
box stays `- [ ]`, the **Owes** field is unchanged, and `--audit` reports 5 pointers resolving. A
paragraph under WO-3.5's Acceptance list records *why* it is its own box — that ticking the
reweighting box by walking weights across 100 would have discharged this claim with nobody having
moved an assignment — and WO-3.3's own prose records the re-point with its date.

### The term switch. **Fixed — it was the one line the verifier described.**

`src/shell.js`'s `[data-term-select]` branch now chains `if (views.currentView() === 'assignments')
assignments.renderAssignments();`, the same line and the same reasoning as `afterCategoryChange()`.
I deliberately did **not** call `paintClassScreen()`: that would repaint attendance too, and the
registry's term-totals gap is the one the brief says is somebody else's — repainting it here would
hide that gap rather than close it. The comment at the point of change says so.

Covered by two checks, driven on the real term nav: switching to the other term removes this
section's work from the table and puts the new term's label at the head of the summary line;
switching back brings the two rows and the old label back. Against the unfixed build the first is
red, and its failure line is the defect in one string — `"Assignments · Quarter 2 · 2 assignments ·
100 points" over rows ["Bonus <b>lab</b> write-u","Unit 1 test"]`: the summary still naming the term
just left, over rows that belong to it.

**One honest gap in that fixture.** The check needs two terms and adds one through the real term
editor if the run has left only one. In this run the class had two, so **the term-adding branch of
the harness did not execute** and is unproved. It is four lines of fixture, not a claim.

---

## 2. The seven Acceptance lines

**1. A zero-point assignment can be created and does not break any grade calculation.**
**Half built and verified; half re-homed.** `0` typed into the real points field is stored as `0` —
nothing clamps, rejects or defaults it — the field still reads `0`, the row carries an **Extra
credit** badge in words, and all of it survives a reload out of IndexedDB. Mutating the writer to
fall back to the 100-point default turns three checks red. The arithmetic half has no engine to
break: `- [ ]` with `→ WO-3.4 "a zero-point assignment scored 5 raises the category by 5 earned
points against 0 possible"`. **Path: re-homed.**

**2. An assignment can be moved between categories and the grade updates.**
**Half built and verified; half re-homed, now at a box that only this claim can tick.** The move is
one `<select>` in the editor, guarded to accept only a category of that assignment's own class; the
document's `categoryId` changes, the row redraws under the new group head, and `doc.scores` is
byte-identical afterwards. The displayed-grade half is `- [ ]` with `→ WO-3.5 "Moving an assignment
to another category updates every displayed grade in that class"` — see Finding 3. **Path:
re-homed.**

**3. Duplicating into another class produces a new assignment with no scores attached.** **Met**,
and materially better evidenced than in round 1. Driven through the real Duplicate dialog: class
pills, the target's own term and category pickers, the confirm. The copy has a new id, the target's
`classId` and `termId`, **the target's own category id for the source's category name** (both the
match and the refusal now exercised), and `doc.scores` grows no column for it. The source is
untouched. The absence of scores is structural — `scores` is keyed by assignment id.

**4. No date field auto-populates from anything schedule-shaped.** **Met.** A new assignment arrives
with `assigned: ''` and `due: ''`, asserted in the document and on both fields at once. No `min`, no
`max`, nothing comparing the two dates or either to a term, and nothing in the module reads a clock
except the overdue tint, which writes nothing and changes no grade.

**5. The list is a view in `<main>`, not a dialog, and the class's screens are switchable without
passing through the class manager.** **Met.** `#assignmentsView` is a sibling of `#homeView` and
`#classView`, toggled by `.hidden`, reached by one tap on the strip, with zero `role="dialog"` /
`aria-modal` / `.modal-overlay` descendants, no overlay open, and `#classesModal` shut throughout.

**6. Opening a class lands on Attendance every time.** **Met, proved the way the line asks.** Class A
left on Assignments, class B opened → Attendance; back to A → Attendance, with `active[1] === false`
asserted so a sticky segment cannot pass. Entering from a home card does the same. Across a reload,
`planbook_openView` holds `"class"` both while the list is up and after the reload, because
`REMEMBERED_AS` writes every class screen down as `class`. Both halves proved by mutation.

**7. The switcher carries three tabs and no student tab…** **First sentence met; second re-homed.**
Three segments, named, in order, no fourth, no student — asserted on *both* strips. *Scores* is
drawn disabled with a reason rather than left out. The second sentence cannot be demonstrated in
this build (no per-student detail exists to enter or leave); what is asserted is the rule's safe
direction — a name set through `setDetailBreadcrumb()` with no detail open appears on neither strip.
`- [ ]` with `→ WO-3.7`, on the Acceptance box WO-3.7 gained for it in round 1 (the verifier called
that "an exact quotation of what is owed and a legitimate use of the same move"). **I did not tick
this line.**

### What I could not verify, and why

- **Everything on a real iPad.** Six of those lines the owner ran on 2026-08-09 and they are ticked;
  I have not touched them. **This round adds a seventh, unticked**: the duplicate dialog's category
  picker on iPadOS. It matters because iOS renders a `<select>` as a native wheel and fires `change`
  on *Done* only when the value moved — the platform form of the defect Finding 1 fixes, and with the
  placeholder showing, every real category is a move. The desk half is measured; the wheel is not.
  I added the line rather than assuming, and it is owed to a sitting.
- **The harness's term-adding fallback branch** did not execute in this run (§ 1).

---

## 3. Files changed

**This round**
- `src/assignments.js` — `copySelect()` gains the placeholder option and a `chooseLabel` argument, with a comment carrying the scar; `renderCopyFields()` passes both labels.
- `src/shell.js` — the `[data-term-select]` branch repaints the assignment list when it is the screen up.
- `sw.js` — `CACHE` bumped **v36 → v37**, because two `SHELL` files changed.
- `tools/verify-shell.mjs` — the duplicate block rebuilt in both directions, three checks added around it, two term-switch checks and one term fixture check added, two fixture teardowns added. **515 checks, up from 507; no check was removed or weakened.**
- `TESTING.md` — the copy line re-ticked with its history kept inline, three desk lines added, one 👤 line added and left open, the counts and the mutation table updated.
- `tools/README.md` — 507→515, 34→42, six→seven mutations, and the fixture lesson written up where the file keeps those.
- `plans/work-orders/phase-3-gradebook.md` — WO-3.5's new box and its paragraph; WO-3.3's line-2 marker re-pointed and its prose updated.
- `CHANGELOG.md` — **two sentences added to the existing entry, not a new entry.** § 7 explains.

**From round 1, unchanged this round:** `src/assignments.js` (the module), `src/screen-nav.js`,
`src/assignments.css`, `src/classes.js`, `src/categories.js`, `index.html`, `src/prefs.js`,
`src/views.js`, `plans/ROADMAP.md`, `plans/work-orders/README.md`, `plans/gradebook-surfaces.md`.

## 4. Mutations — seven, all reverted

| Mutation | Result |
|---|---|
| `assignmentsOf()` filters by `termId` alone — the `classId` guard dropped | **1 red** |
| `confirmCopy()` carries the source's `categoryId` into the target class | **1 red** |
| **`matchCategory()` returns `''` unconditionally** *(this round)* | **2 red** |
| `removalCounts()` in `src/categories.js` filters by `categoryId` alone | **1 red** |
| a typed `0` falls back to the 100-point default | **3 red** |
| `REMEMBERED_AS` stops collapsing a class screen to `class` | **1 red** |
| `selectClass()` keeps the screen the browser was last on | **2 red** |

Plus the two source fixes of this round reverted together, which is the same instrument pointed at
code rather than at a hypothesis: **3 red**, listed in § 1.

Round 1's finding stands and is worth restating, because this round is its second instance: the
`classId`-guard check went **green** on the first run of its mutation, because the planted foreign
row shared the target's `termId` and the term filter beside the guard was already excluding it. The
copy check had the same disease and I did not see it — *what would have to be true of the fixture for
this bug to be invisible?* is the question that finds both, and the verifier asked it of my work
where I had only asked it of one check of mine.

## 5. Decisions the work order did not settle, and which way I went

1. **The placeholder is a real `<option>`, not a note or a disabled first option.** A note cannot be
   tapped and a disabled option still leaves the browser displaying something. This is
   `categoryField()`'s existing answer, and the whole point of Finding 1 is that the two agreed.
2. **The term repaint is the narrow line, not `paintClassScreen()`.** Argued in § 1 and in the code
   comment: repainting attendance here would paper over the registry's own term gap.
3. **A seventh 👤 line was added rather than the fix being called done at the desk.** It costs the
   owner a minute at the next sitting; assuming iPadOS behaves like Chrome is what would cost more.
4. **The two harness fixtures come down through one `update()`** rather than through the real Remove
   controls, following the roster teardown five lines below them, which states the rule: a fixture
   coming down is not a claim being made.

Round 1's five decisions are unchanged and still stand: the `classId` guard was widened into
`src/categories.js` (offered back if unwanted); a new assignment defaults to 100 points rather than
0; an empty category at 0% weight gets different words; the delete confirm asks every time; and
WO-3.7 gained a box for line 7's second sentence.

## 6. The two REVIEWs in `wo-sweep.mjs`

Neither fails the run and neither changed this round. **CSS selectors with no coarse-block rule** —
the same eleven from `src/assignments.css`, every one a container, a column-width floor, a
progress-bar element or a text badge, none tappable. **This round added no CSS and no new control**:
the placeholder is an `<option>` inside `.assign-field-select`, which already carries
`min-height: 44px` in the coarse block. **Sensitive field names outside `src/backup.js`** — the
standing review, unchanged in kind; nothing this round touches `supports`, medical or plan data.

## 7. The `CHANGELOG.md` entry — what I did and did not do

The entry is the launching agent's and I did not rewrite it. Both fixes change what a teacher sees,
which the correction brief says to reflect, so I added **two sentences** in the entry's own voice: the
duplicate dialog now *asks* rather than showing you the target's first category, and the term buttons
repaint the list. **The teacher still decides** — if either sentence is wrong about what the change
means, it is one edit, and I would rather be corrected than have the entry describe a dialog that no
longer behaves that way.

## 8. Out-of-scope temptations declined, and notes worth keeping

- **The registry's term-totals gap.** Named by the verifier, explicitly not mine, and left alone. It
  is the same shape as the assignment-list defect fixed here and it will want a work order: the term
  nav is a header control that every class screen sits under, and only one of those screens now
  answers it.
- **A field/label component.** `design/mockups/README.md`'s open question 5. I rolled a fourth
  hand-made form layout in round 1 and left the question open, with the note at the point of
  departure; doing it properly is its own small work order and it is now visibly worth one.
- **A grade, a percentage or a score cell** to satisfy lines 1 and 2 — WO-3.4's Out of scope line
  pointed back at this work order. Nothing in `src/assignments.js` reads a score's *value*; it counts
  keys.
- **Search, sort and grouping controls** drawn on the mockup, and **re-cutting the class-manager
  row**, which `gradebook-surfaces.md` says explicitly this record does not do.
- **`src/README.md` still opens with "Empty today. WO-1.2 puts the first file here."** Stale by
  twenty-four modules, still not mine to fix under this work order, still findable here.

---

*All three tools were run on the tree as it stands: `verify-shell.mjs` 515/515 with zero skips,
`wo-sweep.mjs` 13 pass and 2 standing REVIEWs, `wo-gate.mjs --audit` PASS with 5 pointers resolving.
Nothing here closes a 👤 item; one new one is owed.*
