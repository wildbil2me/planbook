# WO-3.2 — Letter-scale editor · implementation report

**Implementer** Claude (work-order-implementer), Opus · **Date** 2026-08-09
**Branch** `phase/3-gradebook` · **Not committed** — the brief did not say to commit.

**Verification, both halves, run on the tree as it now stands:**

```
node tools/verify-shell.mjs   →  473 checks · 473 passed · 0 failed · 0 skipped   (exit 0, 148s)
node tools/wo-sweep.mjs       →  12 checks · 11 passed · 0 failed · 1 to review   (the standing
                                 sensitive-names REVIEW, discussed below)
node tools/wo-gate.mjs --audit → PASS, trackers agree with themselves
```

The browser harness **did** launch here (Edge at `C:/Program Files (x86)/Microsoft/Edge/…`), so
nothing below is inferred from a run that did not happen. Twenty-four checks were added: 22 in a new
`--- letter grades ---` section and 2 in the coarse-pointer sweep. Four mutations were planted and
reverted; the table is in `TESTING.md` § WO-3.2 and one of them is the interesting part of this report
(see § "One check proved nothing until a mutation said so").

---

## Against the Acceptance list, one by one

### 1. `[x]` Setting an A boundary of 89.5 makes 89.5 an A and 89.49 an A−

**Verified, driven through the real field.** The harness types `89.5` into the A row's boundary input
(setting `.value` + dispatching `input`, which is the path a keystroke takes through `shell.js`'s
delegated listener), then moves A− to 89, then asks the exported mapping:

```
PASS | an A boundary of 89.5 makes 89.5 an A and 89.49 the band below it, with no rounding anywhere
       in between :: 89.5 -> A, 89.49 -> A-, 89.4999 -> A- (boundaries 89.5 / 89)
PASS | the boundary is stored exactly as typed — 89.5, as a number, not 90 and not "89.5"
       :: document [89.5,89,87] :: field "89.5" :: ranges ["89.5% and up","89% up to 89.5%"]
```

`89.4999` is in there deliberately: a build that rounded anywhere would answer `A` for it. The
mutation `editBandField()` rounds the boundary to a whole percent turns **4 checks red**, which is
what makes this line evidence rather than a claim.

**Why it is read through `window.planbook.letterScale` and not off a screen:** nothing in this app
displays a grade (no WO-3.4 engine, no WO-3.3 assignments, no WO-3.5 grid), and § 2b.3 forbids
building a preview over student data to demonstrate the mapping. So the boundary is typed into the
control a teacher touches and `letterFor()` is then asked what it makes of a percentage. That is also
the only way to tell a build whose on-screen ranges come out of the exported mapping from one whose
panel does its own arithmetic while the export WO-3.4 will import says something else.

### 2. `[x]` A per-class override applies to that class only

**Verified.** The harness selects a class in the subject row, taps "Give … its own bands", types 95
into that class's A boundary, and asks the same percentage of three scales:

```
PASS | a per-class override applies to that class only: 94% is one letter there and another
       everywhere else :: 94% -> A- in "Period 1 — Biology", A in "Period 3 — Biology",
       A document-wide; classes with their own bands = 1
PASS | turning the override on copies the bands that already applied, and the rows become editable
PASS | turning the override off writes null rather than an empty array
PASS | the bands survive a reload — the document scale and the one class override both come back
       out of IndexedDB
```

The isolation check also asserts that exactly one class holds an array and no other class does. The
mutation `enableOverride()` stores the document array **by reference** turns 3 red — that is the
`starterCategories()` scar (two classes sharing one object) asked of this feature.

### 3. `[x]` A scale with a gap or an out-of-order band is caught in the editor, not at render

**Verified, for the two failures this shape can express** — and the third, an interior gap, is
argued as not expressible rather than quietly skipped (§ 2b.1 answer below, and now in
`docs/data-model.md` § Letter grades and `src/letter-scale.js`'s header).

```
PASS | a band the list can never reach is caught in the editor: named in the note, and flagged on
       its own row :: "⚠ A- can never be reached: a band above it starts at the same percentage or
       lower … Move it higher, or change a boundary. Nothing is blocked: keep going."
       :: row 2 range "never reached"
PASS | and the mapping skips the unreachable band rather than sorting the scale behind the teacher
PASS | a gap at the bottom is caught in the editor, and a percentage under it gets no letter rather
       than an invented one :: "⚠ Nothing below 50% has a letter at all …" :: 49% -> (none)
PASS | setting it back to 0 clears the gap and the note goes positive again
PASS | reordering changes no boundary at all, and can strand a band on its own
PASS | and moving it back repairs the scale, again without touching a boundary
PASS | a faulty scale blocks nothing: every field still live, and the only disabled controls are
       the ends of the list :: {"disabled":["Move A higher","Move F lower"],"fields":24,"errors":0}
```

"Caught in the editor" is per keystroke: the note is recomputed and the derived range chip beside
every row is patched in place (the row itself is never re-rendered — that would take the caret).

### 4. `[x]` There is no rounding code anywhere. Grep for it and confirm

**Grepped, and here is the distinction the brief asked for rather than a bare count.** Full grep of
`src/*.js`, `src/*.css`, `index.html`, `sw.js` for `Math.round|Math.ceil|Math.floor|Math.trunc|toFixed|toPrecision|parseInt`:

| Hit | What it is |
|---|---|
| `src/attendance.js:1196` | `Math.round(totals.percent)` — an attendance percentage **for display**. Named in the brief; not mine to remove |
| `src/categories.js:181` | `formatWeight()` — a weight total to two decimals **for display**. Named in the brief; not mine to remove |
| `src/attendance.js:492` | `Math.floor` over a timezone offset in minutes → hours |
| `src/attendance.js:833` | `Math.floor` — how many day columns fit the viewport |
| `src/attendance.js:1158` | `Math.floor` — a "last N meetings" count |
| `src/backup.js:729` | `Math.round(file.size / MB)` — a file size in a warning |
| `src/backup.js:967` | `Math.floor(age / day)` — days since the last backup |
| `src/passes.js:159` | `Math.round((b - a) / 60000)` — hall-pass minutes |
| `src/letter-scale.js:22,31,…` | **prose in comments only** — the header arguing that none of this exists here |

No `toFixed`, no `toPrecision`, no `parseInt` anywhere in the repository. Every hit is display
formatting or layout/date arithmetic over a number that is **not a grade and does not choose a
letter**.

**What the line actually means, and is true:** there is no rounding between a percentage and a
letter. `letterFor()` compares the number it is handed against `min` with a bare `>=`, unmodified —
no epsilon, no tolerance, no `toFixed` on the way in. `src/letter-scale.js` contains **no rounding at
all, not even for display**: a boundary is printed with `String()`, so 89.5 reads as 89.5 and there is
no formatter for a second rule to move into later. A grep of `src/` and `index.html` for the word
"round" finds no option, preference, setting or default that rounds a percentage; the two mentions in
`index.html` are the teacher-facing copy saying Planbook never does, and the comment above
`#letterScaleModal` saying it must not be added.

**Traps line honoured:** no "round to nearest whole percent" option, and none in disguise. The file
also states in its header why `src/categories.js`'s `BALANCE_EPSILON` is not a precedent for a
tolerance here.

---

## The four § 2b decisions, and why

**1. What "a gap or an out-of-order band" means.** A band's upper bound is derived — it runs up to the
lowest `min` above it — so bands are contiguous by construction and **an interior gap is not
expressible**: there is no second number to disagree with the next band's, and no way to type a hole
between 80 and 83. The editor therefore checks exactly two things, in `scaleFaults()`:

- **A band nothing can reach.** Reachability is `min_i < (the lowest min above it)`. That single
  comparison covers equal boundaries, ascending boundaries, and a band whose `min` is not a finite
  number — all of which are the same defect, and all of which are what the deliverable calls an
  *overlap* and the acceptance line calls *out of order*.
- **A gap at the bottom.** The lowest reachable boundary above 0, which leaves percentages below it
  with no letter at all. `letterFor()` returns `null` there rather than falling back to a letter
  nobody defined.

The ceiling is the **running minimum of the boundaries above**, not the previous row's — `[A 93,
B+ 95, A− 90]` leaves A− genuinely reachable between 90 and 93, and a previous-row rule would print
its range as 90-to-95 and be wrong about 94. `bandRanges()` computes the range and the reachability
verdict in one pass, so the chip a teacher reads and the note's verdict cannot disagree. Deliverable 4
is the other half of the same answer: printing the derived range is what does the validator's job, and
a stranded band's chip reads **"never reached"** in the warn palette on the row itself.

**2. Where the per-class override is reached from, and what turning it on writes.** The override had
three places it could not go: a seventh control on the class-manager row (`gradebook-surfaces.md`
forbids re-cutting it; the mockup's "Set up…" fold is an explicitly *open* owner decision I did not
make for them), a fourth icon in either header strip (`index.html`'s own 390px measurements), and the
teacher's own details panel (`src/teacher.js` declines the letter scale by name). So:

- **One door, document-level, in the class-manager panel** — under the class list and its hints, not
  on a row. It is where the year's setup already lives, and it is beside the classes the override is
  about.
- **The override is a subject row inside the panel**: `.pill`s reading "Every class" then one per
  class on the bar, which is the shape § 2b.2 names first. Selecting a class with no override shows
  the bands it uses **read-only** (a dashed `.band-row.inherited`, `.class-row.archived`'s grammar)
  plus the door to give it its own — editing them there would be editing four other classes from a
  panel whose subject row says the name of one. An **archived** class is not offered and keeps
  whatever override it had.
- **On writes:** turning it on stores a **copy with fresh objects** of the bands that already applied;
  turning it off writes **`null`**, the sentinel the document already has a word for. I did not build
  a stored diff, for the reason § 2b.2 gives — it would be a second thing to keep in step every time
  the default moved, and it would make one class silently follow a changed document boundary while
  another did not.
- **Turning it off has no confirm dialog**, and that is a decision. `src/categories.js`'s removal
  confirm exists because a category takes assignments and scores with it and counting them is what
  earns the right to destroy them. A letter scale holds no student data at all; what goes is a list of
  letters and numbers that are on screen above the button until it is tapped. The consequence is
  stated on the line and in the panel copy, and the change is announced. A third stacked modal for
  that would be heavier than the thing it protects.

**3. The mapping is a seam and stops at the letter.** Exported pure functions, no DOM/store/clock:
`letterScaleOf(doc)`, `hasOwnScale(cls)`, `scaleForClass(doc, cls)`, `letterFor(percentage, scale)`,
`bandRanges(scale)`, `scaleFaults(scale)`. **No grade arithmetic** — no category percentage, no
weighted grade, no preview over student data. **WO-3.4 must import `letterFor()` rather than write a
second one**; two percentage-to-letter rules is the disagreement this whole design deletes. That is
now written in the module header, in the work order, and in `docs/data-model.md`.

**4. Out of scope, declined.** WO-3.1's false *"provisional"* copy is untouched: `isProvisional()`
keeps its name, `renderTotal()` and `classRow()` keep their sentences, and the `verify-shell.mjs`
checks that assert `95%` + *provisional* are untouched and still green. It stays folded into WO-3.5's
brief.

---

## One check proved nothing until a mutation said so

Worth reading even if nothing else here is. The check *"the mapping skips the unreachable band rather
than sorting the scale behind the teacher"* originally probed **89.4 and 89.6**. Mutating
`letterFor()` to sort the scale descending before matching turned **zero of 473 checks red** — because
reordering an A at 89.5 above an A− at 90 changes nothing below 90, so both probes answer identically
in both builds. It went green against the exact defect it exists for.

The probe that catches it is **92**: the list says A (89.5 is first), a sorted list says A−. It is now
the third clause of that check, and the mutation turns it red. This is `TESTING.md`'s WO-3.1
float-tolerance footnote happening again in a new place, and it is recorded in `TESTING.md` § WO-3.2
and `tools/README.md`.

**Four mutations, all reverted** (`git status` shows no stray edit; the module was restored from a
snapshot and re-loaded to confirm):

| Mutation | Result |
|---|---|
| `letterFor()` sorts the scale descending | **0 red** as first written → **1 red** with the 92 probe |
| `editBandField()` rounds the boundary to a whole percent | **4 red** |
| `enableOverride()` stores the document array by reference | **3 red** |
| the note says "this scale is invalid" instead of naming the band | **1 red** |

---

## What I could not verify

- **Every 👤 line in `TESTING.md` § WO-3.2 is left blank.** I have no iPad. Specifically owed: a thumb
  on the 64px letter field beside the 66px boundary field and on Remove beside a one-glyph arrow;
  whether iPadOS offers a numeric keypad for the boundary and lets **89.5** be typed into it (I set
  `step="any"` precisely so a browser cannot call it invalid, but only hardware settles it); whether
  the amber "never reached" chip and the standing note are legible on a projector from the back of a
  room; the panel in both orientations with twelve bands in it; and an offline launch with
  `letter-scale.js` served from the precache. The harness measured the boxes — **69 controls in the
  panel, none under 44px in either direction**, and the note and the chip for legibility and for
  `scrollWidth > clientWidth` — but it cannot press them.
- **No letter has ever been read beside a percentage on a screen**, because nothing draws one yet. The
  mapping is verified through the exported function and through the ranges the editor prints. A human
  read of a letter next to a grade — and the re-key against the SIS that "no separate rounding rule"
  exists for — is owed to WO-3.5. Recorded as a carried-forward limit in `TESTING.md`.
- **`wo-sweep.mjs`'s standing REVIEW now names `src/letter-scale.js`** (173 mentions, up one from 172).
  The single hit is a *comment* at line 89 citing `src/roster.js`'s index-keyed guardian/accommodation
  rows as the precedent for keying bands by index. This module reads no `supports` block, renders no
  student data, and emits nothing anywhere: a letter scale is per-document and per-class, never per
  student.

## What I left undone, deliberately

- **I did not run `node tools/wo-gate.mjs --tick`.** The four Acceptance boxes are ticked in
  `plans/work-orders/phase-3-gradebook.md` because I closed them and can point at the evidence, but
  the **Status** line still reads `🔨 IN PROGRESS` and `ROADMAP.md`'s box and dashboard are untouched —
  that is the one script that writes them, and it runs after the verifier. `--audit` passes, so
  `--tick` will not refuse.
- **No `CHANGELOG.md` entry.** Draft for the teacher to accept, reject or rewrite:
  > **Letter grades.** The bands that turn a percentage into a letter are now yours to set — one set
  > for the year, and any class can have its own. Each band shows the range it works out to, so a
  > band nothing can reach or a gap at the bottom is visible on sight rather than at report-card time.
  > The boundary you type *is* the rounding rule: type 89.5 and 89.5 is an A. Planbook never rounds a
  > percentage on its way to a letter, and there is no setting that makes it.
- **No mockup in `design/mockups/`.** That directory holds the four screens `gradebook-surfaces.md`
  names; the letter scale is not one of them and the record does not ask for one. The panel is built
  from components that already exist, so there was nothing to argue with in a drawing.
- **Temptations declined, named here instead of acted on:**
  - **A "Sort by boundary" button.** One tap would repair any out-of-order scale. Declined: the ↑/↓
    pair already repairs it without changing a number, and a sort control is one refactor away from a
    sort inside `letterFor()`, which is the defect mutation 0 exists to catch.
  - **A badge on the door (or on a class-manager row) when a scale is faulty**, the way WO-3.1's
    `weights 95%` badge works. Declined: that badge is WO-3.1's own explicit deliverable and this work
    order has no such line; the row is also the thing `gradebook-surfaces.md` says not to re-cut. If
    the owner wants a faulty scale visible without opening the panel, it is a cheap follow-up — the
    verdict is already an exported pure function (`scaleFaults`).
  - **Warning about a band with an empty letter.** `scaleFaults()` catches a band with no *boundary*
    (nothing can land in it) but says nothing about a band with no *letter*. It is arguably a third
    fault; it is not the two the acceptance line names, and I kept the check to exactly what was
    decided. `letterFor()` would return `''` for such a band, which the screen that wants a letter
    will have to treat as no letter.
  - **A "Letter scale" door inside the categories editor**, so a teacher setting a class up finds it
    without going back to the manager. Declined: two doors onto one panel is two places to learn, and
    the class list the subject row is made of is already on screen behind it.

## Conventions I set, since this module had no exact precedent

- **`.band-*` for the rows and `.scale-*` for the panel-level pieces**, written out in `shell.css`
  rather than sharing `.category-*`, following that sheet's own stated preference (the install banner
  and the backup nag) for writing lookalikes out separately. Fifteen new selectors, every one of them
  also named in the `@media (pointer: coarse)` block **in the same pass** — `wo-sweep.mjs` confirms:
  *"15 new selector(s), all covered"*.
- **`.scale-subjects .pill { min-width: 44px }`** in the coarse block. `.pill` carries a coarse height
  and no width, which is right for a chip holding a class name and wrong for one that could read "AP".
  I qualified the descendant rather than change the shared component.
- **Bands are keyed by index, not by an id.** `docs/data-model.md` settles the shape as
  `{ letter, min }`, and nothing anywhere references a band — a category needs an id because
  assignments are filed under it. `data-band-index` follows `src/roster.js`'s guardian and
  accommodation rows.
- **No error element in the panel.** Every other editor has a `.class-error`; this module refuses
  nothing, so there is no message for one to hold. The standing note carries everything.
- **No repaint chain in `shell.js`.** All nine hooks return without calling an `afterX()`, and the
  comment says why it is an absence rather than an omission: nothing on any screen behind the panel
  says anything about the letter scale. The day a screen draws a letter (WO-3.5), it adds its line
  there, exactly as the categories did.

## Files changed

| File | What |
|---|---|
| `c:\dev\planbook\src\letter-scale.js` | **New.** The module: the mapping, the two fault checks, the derived ranges, the editor, the per-class override |
| `c:\dev\planbook\index.html` | The document-level door in `#classesModal`, and `#letterScaleModal` with its copy and the record of what was rejected |
| `c:\dev\planbook\src\shell.css` | The `LETTER GRADES (WO-3.2)` block (15 selectors) and its coarse-pointer entries |
| `c:\dev\planbook\src\shell.js` | Import, nine hooks documented in the header list and wired in the click/input listeners, and the `letterScale` read seam |
| `c:\dev\planbook\sw.js` | `./src/letter-scale.js` added to `SHELL`; `CACHE` bumped `planbook-shell-v34` → `v35` |
| `c:\dev\planbook\tools\verify-shell.mjs` | New `--- letter grades ---` section (22 checks) + 2 in the coarse sweep |
| `c:\dev\planbook\tools\README.md` | The check-count line: 473 at WO-3.2, with the three notes worth keeping |
| `c:\dev\planbook\TESTING.md` | § WO-3.2 — 21 desk lines ticked, 5 👤 lines left blank, the mutation table, the carried-forward limit |
| `c:\dev\planbook\docs\data-model.md` | § Letter grades: the derived upper bound, why an interior gap is not expressible, the two faults, why a band has no id |
| `c:\dev\planbook\plans\work-orders\phase-3-gradebook.md` | Four Acceptance boxes ticked; three notes added (what "a gap" means, the grep result, what WO-3.4 owes) |
| `c:\dev\planbook\plans\gradebook-surfaces.md` | The table row marked shipped, and a paragraph recording that the class-manager row was left alone and where the door went instead |

Nothing committed, nothing pushed. `CHANGELOG.md` untouched.
