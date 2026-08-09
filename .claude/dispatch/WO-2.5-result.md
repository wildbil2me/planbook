# WO-2.5 — Keyboard & touch pass · implementation result

**Implementer** Claude (work-order-implementer, Opus)
**Date** 2026-08-08
**Verification** `node tools/verify-shell.mjs` → **428 checks · 428 passed · 0 failed · 0 skipped**
(405 on the tree this arrived on). `node tools/wo-sweep.mjs` → **12 checks · 11 passed · 0 failed ·
1 to review** — the standing sensitive-field-name REVIEW line, unchanged at the same 172 mentions it
had before this work order. Both ran here; neither reported "could not run".

---

## What was built

**A class is marked from the keyboard in one keystroke per student.** `↓` picks up the first name,
then `P` `T` `A` `E` `D` — one letter each — and the selection advances on its own. `Esc` stops.
Roll Call!'s model (`dashboard.html:3580-3677`), lifted with its `.row-selected` component
(`design/portable-components.md:152`): indigo wash `rgba(91,111,204,0.07)` and a 3px `#5b6fcc` left
rail, copied by value.

Three deliberate divergences from Roll Call!, each argued at the point of departure in
`src/attendance.js`:

1. **A letter sets, it does not cycle.** `A` means absent from wherever the cell was reading.
   `cycleMark()` remains the tap's writer, untouched. A cycling keyboard makes one absence cost up
   to five keystrokes and makes the count depend on what the cell already said — the opposite of not
   looking at it.
2. **The selection is a real DOM focus.** Roll Call! paints a highlight and leaves
   `document.activeElement` alone. Here the selected row's cell is focused, which is what makes
   `design/style-guide.md:86`'s global `:focus-visible` ring land on the exact cell the next letter
   writes into — and it gives a screen reader the cell's own accessible name (student, date, mark)
   for free, so moving the selection needs no announcement of its own.
3. **The rail is reserved transparent on every row** and only coloured when selected. Roll Call!
   adds the border on selection, which steps every name 3px sideways — once per student, down a
   class of thirty, on the one screen whose whole design is about not looking at it. Measured: the
   name cell's `left` is identical selected and unselected.

**The keys go quiet exactly where a thumb is refused.** Every letter writes through the same
`setMark()` a tap does, so a locked past column, a dropped day, a covered day, a date after today
and a window paged off the day being edited all refuse a keystroke. No second writer, no second set
of rules. Plus four guards in the listener: a modifier held (Ctrl+A is select-all), a dialog open,
focus in a field, any view but the class one.

**`Enter` is deliberately not bound**, and it is the one Roll Call! key that did not come across.
Over there it means "skip to the next student" and is safe because focus is never on a control; here
the selected cell *is* focused, so binding it would fire the cell's click **and** move the row — one
keystroke doing two things, one of which writes. `↓` already means skip.

---

## Against the Acceptance list, one by one

### 1. A full class can be marked from the keyboard without touching the mouse — **MET**

Evidence, all measured in `tools/verify-shell.mjs` § "marking a class from the keyboard (WO-2.5)":

- The harness puts itself on the **home screen** — the screen a teacher opens the app to, and the
  only pointer event in the section — then **10 Tabs** reach the class card and **Enter** opens it.
  The class view comes up with 26 tappable cells.
- Then **one ArrowDown and 26 letters and nothing else** — no arrow between the letters, which is
  the difference between thirty keystrokes and sixty. The whole `marks` object is then compared
  against exactly what those keystrokes should have produced, **including the five `P` students, who
  must have no entry at all** (present is never stored). Zero disagreements.
- `openPasses` is compared byte for byte across the walk: a keyboard mark moves no hall pass.

Mutation proof: making the letter mark without advancing turns **3 red**; making it cycle instead of
set turns **1 red** (every mark one code off along the class).

*What I could not verify:* whether it is fast enough **in a doorway**. That is the standard the work
order is written to and it needs a real class walking in. Two 👤 lines are open in `TESTING.md`
§ WO-2.5 for it, and the second is the one I would watch: marking the *next* period without looking
the keys up again.

### 2. No attendance control is under 44px on a coarse pointer — **MET**

Measured, not read off a stylesheet, and gated on `matchMedia('(pointer: coarse)').matches` actually
being true first (tools/README.md trap 3):

- Every visible interactive element in the document, document-wide: none under 44px.
- Every control inside `#classView` for the 26-name roster with two hall passes open — cells, column
  heads, pass buttons, banner cards, the note field: none under 44px.
- The days-off panel, date fields and class picker included: none under 44px.
- **The new ⌨ Keys button by name**, 72.66 × 44, plus `scrollWidth` vs `clientWidth` = 0 — that
  second measurement is the "Days off" spill the first iPad sitting found, asked of the next button
  of the same shape (a glyph and a word in a flex row) rather than left to be rediscovered.

I also did the **reading** the deliverable asks for, not just the measurement, and it found something
the measurement could not: **six `.attendance-*` selectors had no rule in any coarse block**, while
three separate comments in `src/attendance.css` cite `.attendance-student-cell` as the *precedent*
for naming a non-control there. The precedent existed only in prose. None of the six is a touch
target — five are text and the sixth is the flex row holding the avatar, the name and the `⋯` (which
takes its 44px from `.attendance-detail-btn`) — so they are now in the block with their **base values
restated** rather than new ones, with the finding written down. After that, **83 of 83
`.attendance-*` and 7 of 7 `.dayoff-*` selectors have a coarse rule.**

*What I could not verify:* a thumb. The pointer is an emulator at 1024×768. A 👤 line is open for the
owner's own iPad in the orientation she holds it, and it names the ⌨ button as the new one.

### 3. Keyboard focus is visible on every step and never lost after a mark — **MET**

Asked of the element itself — `el.matches(':focus-visible')` — rather than inferred from the presence
of the global rule, because the rule being declared and the ring being drawn are two different facts
and it is the second one this line is about. The ring is `2px rgb(91, 111, 204)` throughout, which is
`design/style-guide.md:86` unmodified; nothing here styles `:focus` bare and nothing removes an
outline (the sweep's standing check confirms).

- After **each of the 26 marks**: 0 steps without a ring, 0 steps on the wrong row.
- At the **last row**, where there is nothing to advance to: ring intact, not `<body>`.
- After **Enter on a focused cell** — the path that predates this work order and that
  `markSelected()` would have papered over. `paintColumn()` now hands focus to the *replacement*
  cell. Mutation proof: removing that hand-off leaves every other check green and turns **only** this
  one red.
- After **Escape**: the ring stays where it was. Escape removes the *target*, not the focus — a blur
  would put focus on `<body>` and leave a teacher who paused hunting for her place with Tab. An
  arrow then resumes from where the focus was left. Mutation proof: blurring on Escape turns **3
  red**, including the dialog's focus return.

### 4. The shortcuts are documented somewhere in the UI, not only in this file — **MET**

Three surfaces, and the first is the one the brief's constraint is about:

- **A ⌨ Keys button in the registry's toolbar** — a real `<button>`, visible, in the tab order,
  `aria-label="Keyboard shortcuts for marking attendance"`. That is what makes the list reachable
  *from the keyboard by someone who does not already know the shortcuts*: Tab finds it like any other
  control. It sits with search, filter and sort — the other three controls on this screen that change
  what you are looking at and write nothing — rather than in the action row, whose three-control rule
  `paintActions()` argues at length.
- **`?` opens the same dialog** for a hand already on the keys, and hands focus back to the cell it
  was opened from on close. (Verified both directions.)
- **A paragraph under the grid**, in the same voice as the two hint paragraphs either side of it, for
  the reader who is scanning rather than hunting.

The dialog itself is prose first and a list second: the thing a teacher needs is not the letters —
those are already on the cells — but the *shape*, that one key marks one student and then moves you
on. It names all five letters, both arrows, Escape and `?`, and says where the keys go quiet.

*What I could not verify:* whether the copy reads right to the person who will use it. That is the
teacher's call and it is one of the 👤 lines.

### The third Deliverable (screen-reader labels) — **already met by WO-2.1; now watched**

"An icon-only `A` button needs `aria-label` and `title`." Every cell, column head, pass button,
`⋯` and door already carried both, written at WO-2.1 — **I added no labels**. What I added is the
check, in that deliverable's own terms: every button on the class view has an accessible name, and
every button whose visible text is one glyph carries both. **150 visible buttons, 55 of them one
glyph, 0 nameless, 0 icon-only missing either.** Mutation proof: deleting `cellFor()`'s `title` turns
it red with 26 named cells listed.

---

## Files changed (absolute paths)

| File | What |
|---|---|
| `c:\dev\planbook\src\attendance.js` | The keyboard path — selection state, `selectStudent` / `moveSelection` / `markSelected` / `clearSelection` / `selectedStudent`, the focus hand-off in `paintColumn()`, `paintSelection()` from `renderRows()`, the tap handing its row to the keyboard in `cycleMark()`, reset in `resetRegistry()`, header section |
| `c:\dev\planbook\src\attendance.css` | `.attendance-row-selected` (Roll Call!'s treatment, by value), the reserved rail, `.attendance-keys-btn`, the key-list styles, and the coarse-block entries for all of them plus the six the audit found missing |
| `c:\dev\planbook\src\shell.js` | The `keydown` listener and its five guards; `anyModalOpen` import; hook-header note about the three non-click listeners |
| `c:\dev\planbook\src\modal.js` | `anyModalOpen()` — one exported seam so the keyboard path can refuse letters while a dialog owns the screen (Roll Call!'s `_topOpenModal()` guard) |
| `c:\dev\planbook\index.html` | The ⌨ Keys button in the toolbar, the `#attendanceKeysModal` dialog and its copy, the keyboard hint paragraph |
| `c:\dev\planbook\sw.js` | `CACHE` → `planbook-shell-v32` |
| `c:\dev\planbook\tools\verify-shell.mjs` | The WO-2.5 keyboard section (22 checks, fine pointer, before the coarse sweep) and the ⌨ door check inside the coarse sweep |
| `c:\dev\planbook\tools\README.md` | The running check count: 405 → 428, and the five checks worth knowing about |
| `c:\dev\planbook\TESTING.md` | § WO-2.5 — what it adds, the four lines with their evidence, the eight-mutation table, five 👤 lines |
| `c:\dev\planbook\plans\work-orders\phase-2-attendance.md` | The four Acceptance boxes ticked, with a note that the classroom sitting is still owed |

No `package.json`, no dependency, no framework, no bundler. No CSS custom properties, no dark mode
(sweep confirms). No `localStorage` write of any kind — the selection is module state and is student
data, so it is deliberately not persisted. No accommodation, medical or plan field is read, written
or emitted; the sweep's sensitive-field count is **unchanged at 172**.

---

## Decisions the work order did not settle, and which way I went

1. **Selection = focus, rather than a highlight with focus parked elsewhere.** Roll Call! does the
   latter. I took the former because acceptance line 3 asks for a *visible focus on every step*, and
   a highlight that is not a focus needs a second, invented indicator plus `aria-activedescendant`
   plumbing to say the same thing the browser already says.
2. **Escape leaves DOM focus where it is.** The alternative (blur) satisfies "deselect" and violates
   the spirit of "never lost". Argued in a comment at `clearSelection()`.
3. **`Enter` is not bound.** Reasoned above; noted in the listener's comment so the next reader does
   not "fix" it.
4. **No key takes the class, drops it, unlocks a past column, pages the window or opens a detail
   panel.** Those are the controls a mis-typed letter would be most expensive on. The deliverable
   names five letters, four arrows and Escape, and that is what shipped.
5. **`.attendance-row-selected`, not `.row-selected`.** The treatment is unchanged; the *name* takes
   this sheet's prefix because `src/shell.css`'s header sets "one class name is styled by one
   stylesheet" and `.row-selected` is a name every later table would want. The departure is stated
   at the point of departure, as CLAUDE.md requires.
6. **The class picked for the keyboard walk steps around the two open hall passes** rather than
   closing them: the pass section hands them on deliberately so the coarse sweep measures the banner
   card, and a `D` closes an open pass. The two students who are out get `E` where the pattern said
   `D`, and `openPasses` is compared byte for byte afterwards — so "this section did not take the
   next one's fixture away" is a check rather than a hope.

---

## Left undone, with the reason

- **The Status line is still `🔨 IN PROGRESS`, not `✅ DONE`, and the roadmap box is still open.**
  `node tools/wo-gate.mjs --tick WO-2.5 --dry-run` now reports *"all 4 Acceptance lines are ticked —
  nothing holds WO-2.5 open"* and would write `✅ DONE`. I did not run it for two reasons, both for
  the teacher/orchestrator to weigh:
  - The same dry run prints `NOTE | roadmap: "Keyboard path on desktop and 44px touch targets. Both,
    not either." matched 0 roadmap boxes — not ticking it`. **That is WO-2.15's known defect**
    (`phase-2-attendance.md:1188`), still `⬜ NOT STARTED`: this work order's `Closes roadmap`
    fragment does not match `ROADMAP.md:280`, which reads *"Keyboard path on desktop (row select,
    `P`/`T`/`A`/`E`, arrows) and 44px touch targets under `@media (pointer: coarse)`. Both, not
    either."* Ticking now would flip the status to done and leave the roadmap box it exists to close
    silently open — the exact gap WO-2.15 was written about. I did not edit the fragment either;
    WO-2.15 owns that, and it explicitly wants a fixture other than WO-2.5 to prove the behaviour on.
    *(Note for whoever fixes it: the roadmap box says `P`/`T`/`A`/`E` — four letters. What shipped is
    five. The box's parenthetical is what is out of date, not the build.)*
  - Five 👤 lines are open in `TESTING.md` § WO-2.5 and two of them are the standard this work order
    was re-cut to: marking a real class from the doorway, and the 44px pass on the owner's own iPad.
- **No `CHANGELOG.md` entry.** That is the teacher's prose. A draft, if it is wanted:

  > **Marking from the keyboard.** On a laptop you never have to touch the mouse: `↓` lands on the
  > first name, then one letter per student — P present, T tardy, A absent, E event, D dismissed —
  > and the selection moves down the list on its own, so a class of thirty is thirty keystrokes.
  > `Esc` stops. The keys are on a **⌨ Keys** button beside the sort pair and behind `?`. The
  > selected row wears Roll Call!'s indigo highlight, and the focus ring stays on the cell your next
  > letter writes into — including at the bottom of the list, where it used to be dropped. Every
  > attendance control was re-checked against the 44px touch pass in the same sweep.

---

## Out-of-scope temptations I declined — proposed follow-ups

None of these are in the diff.

1. **`U` (un-confirm) has no key.** It is a real teacher action with a control in the row's detail
   panel, and one keystroke would be natural. The deliverable names five letters; a sixth is a
   decision about whether `U` becomes something a teacher *marks*, which `src/attendance.js`'s header
   is explicit that it is not. Worth a line in a later work order, not a quiet addition here.
2. **`#attendanceGridWrap` scrolls horizontally and has no `tabindex`.** A keyboard-only user cannot
   scroll it sideways when six columns overflow. Real WCAG gap (2.1.1), fixed by `tabindex="0"` plus
   a `role="region"` and a label — but it adds a tab stop on the critical-path screen, which wants a
   decision rather than a patch.
3. **Seven `.class-*` and four `.roster-*` selectors have no coarse-block rule** — `.class-row`,
   `.class-form`, `.class-list`, `.class-rename-form`, `.class-row-actions`, `.class-preset-row`,
   `.class-delete-facts`, `.roster-row`, `.roster-list`, `.roster-form`, `.roster-actions`, and
   `.pills`. All are WO-1.6/1.7 layout containers, none is a control, and `verify-shell.mjs` measures
   every control inside those panels at ≥44px. Out of scope here (WO-2.5's audit is WO-2.1–2.4), but
   the same reading that found the six attendance ones found these, and `src/shell.css`'s header
   makes the same "every control appears in this block" claim.
4. **`design/style-guide.md` § 5 "Active/selected" does not mention the keyboard row highlight.**
   Roll Call! catalogues it in `portable-components.md`; this repo's style guide is the suite's own
   and one line there would stop the next screen re-deriving it. Amending a shared design doc is not
   a surface this work order covers.
5. **A held-down letter key repeats and walks the class.** `e.repeat` is not filtered. It could be
   an accident or a shortcut ("the rest are absent"); either way it is a behaviour decision, and OS
   key-repeat only starts after ~500 ms.

---

## One scar worth recording

The eighth mutation (deleting `cellFor()`'s `title`) was reverted with
`git checkout -- src/attendance.js`, which took **every** WO-2.5 edit in that file with it. The next
run came back with eight reds that looked exactly like a regression in the feature. The other seven
mutations were driven by a script that held the original bytes in memory and wrote them back, which
is why they were safe. The file was restored and the run is green; the lesson is in `TESTING.md`
§ WO-2.5 under the mutation table — **revert a plant the way you made it.**
