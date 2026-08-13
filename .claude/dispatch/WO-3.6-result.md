# WO-3.6 — Past-due prompt · implementation result

**Implementer** Claude (work-order-implementer), 2026-08-13
**Brief** `.claude/dispatch/WO-3.6-brief.md` · **Work order** `plans/work-orders/phase-3-gradebook.md:435`

---

## The four Acceptance lines, one by one

All four are ticked in the work order. Each was verified by driving the real app in headless Edge
through `tools/verify-shell.mjs`; none of them needed an iPad, and none of them is a 👤 line.

### 1. Dismissing the prompt changes no score and no grade — **met**

Two checks, on a twin class planted for the purpose.

- *"dismissing the prompt changes NO SCORE"* — `JSON.stringify` of **every score cell in the whole
  document** taken either side of the tap on **Not now**, byte identical. Asked of `scores` entire
  rather than of the fixture's own six columns, so a build that wrote somewhere else could not pass by
  being out of frame.
- *"and it changes NO GRADE"* — all five displayed grades are the same strings after the tap as before
  (`["68.00%","75.00%","—","—","—"]`), and both readings agree with `weightedClassGrade()` asked
  separately, so a screen doing its own arithmetic could not pass by agreeing with itself.

A third check says what a dismissal *did* write: `planbook_pastDueDismissed` holds
`{"wo36b-past":true,"wo36b-past2":true}` — two assignment ids and `true`, nothing from inside the
document.

The construction that makes these worth anything is the negative control at the foot of the section:
accepting on the other class moves all five grades, row 1 from a hand-computed 68.00% to a
hand-computed 50.00%. Without it, a build that drew no prompt at all would pass every line above.

### 2. The grade before accepting is identical to the grade with the prompt never shown — **met**

The "never shown" arm is a real render, not an argument. `c_wo36b` is a twin of `c_wo36` — same
weights, same points, same scores, the same two past-due assignments — and the run dismisses its
prompt and then **reloads the page**. The dismissal lives in `localStorage`, so it is already true
before the document is open on the way back up: the render being read has never drawn a prompt.

The check asserts four arrays equal: class A with the prompt up and nothing accepted, class A again
after a reload, class B with the prompt never drawn, and the engine's own answers for both classes.

### 3. Accepting writes `{ v: null, flag: "missing" }` to exactly the previewed cells — **met**

Two checks.

- The set of cells that **changed in the document** across the tap is exactly the set the review
  listed: `["wo36-past/wo36-s1","wo36-past/wo36-s5","wo36-past2/wo36-s2","wo36-past2/wo36-s3",
  "wo36-past2/wo36-s4","wo36-past2/wo36-s5"]` both sides, computed as a set difference over a flat
  `assignment/student → JSON` map. **The previewed ids are read off the screen** — each review row
  carries `data-past-due-cell` — rather than out of the module, because the acceptance line is about
  what a teacher could have read.
- Every written cell is the string `{"v":null,"flag":"missing"}`, six times, while the excused cell,
  the late blank, the scored cell and the cell on the assignment due today are byte identical to what
  they were, and the two assignments that are not yet due plus the undated one have **no keys at all**.

### 4. A dismissed prompt does not reappear on every render — **met**

Four renders, each a real navigation: the repaint the dismissal itself did, a switch to the assignment
list, a switch back to the grid, and a **full page reload**, which is the one that tells a preference
apart from a variable somebody set. Down on all four.

A second check covers the half a build passes by switching the feature off: on that same reloaded page
the *other* class's prompt is still up, still counting six. The dismissal is per assignment.

---

## The three decisions the brief asked me to take deliberately

Each is written down in `src/past-due.js`'s header (decisions 1, 3 and 4), and the second and third
are also in `src/prefs.js` and `docs/data-model.md` respectively.

### What set of cells counts as a past-due blank

**A cell carrying nothing at all** — no key, or (from a restore or a hand edit) neither a value nor a
flag — on an assignment whose `due` is a real `YYYY-MM-DD` **strictly before today**, in the open class
and term, for a student on that class's roster.

`excused`, `missing` and a scoreless `late` are **out of the set**. Excused leaves the denominator, so
sweeping it into `missing` turns a teacher's decision into a zero — the single most expensive mistake
this feature can make. A `late` with no score records that the work *arrived* and has not been graded;
marking it missing would record that it never arrived, and the flag is the record.

That makes this set **narrower** than `src/scores.js`'s `isUngraded()`, which does count a late blank —
so the banner's count and the grid's "N blanks" summary can legitimately differ on screen at once. They
answer two different questions, and I chose to let them differ rather than widen this one. The cost is
a teacher who sees 12 blanks in the summary and 6 in the prompt; the alternative cost is a zero on a
student who handed the work in late.

The set is computed **once** (`pastDueBlanks()`), held in `previewed`, and used three times — the count
in the sentence, the rows in the review, the cells written on accept. One thing is re-checked at accept
time: that each previewed cell is still untouched. Nothing is blocked while the banner is up, so a
teacher can type into a cell the prompt is holding, and writing `missing` over a score she just entered
would be "a score that silently isn't what you typed" with the app's own hand on it. Cells that stopped
being blank are dropped and named in the live-region announcement.

### What surface the prompt uses

**A banner in the view, with an inline review.** Not a dialog, and this was the decision most likely to
go wrong.

`plans/gradebook-surfaces.md`'s test — a surface you work in is a view, a task you finish and dismiss is
a modal — genuinely does not settle a prompt that appears unasked, as the brief said. Three things
settled it. WO-3.5 shipped *"`Esc` mid-column closes nothing, because there is no dialog to close"* as a
**tested acceptance line**, and a dialog on arrival would put something on that screen for that key to
close; I re-assert that line over the new banner in my own section rather than trusting WO-3.5's check
to keep covering it. A focus trap on arrival stands between the teacher and the first cell of the column
she came to type. And the prompt is not a task she came to finish — it is the screen telling her
something before she starts, which is exactly what `.grade-none` one row above it is.

So it is **the same component as the no-grade banner**: Roll Call!'s inline notice banner
(`design/portable-components.md` § 6) as `src/scores.css` already lifted it, in the overdue tint's own
`#8a6d1a`. That sameness is deliberate — a second banner shape for the same slot on the same screen is
the WO-2.11 correction run backwards. What separates them is content: this one ends in a question mark
and carries three buttons. The review expands **inline** under the sentence and collapses on the next
tap, the same disclosure the key legend is.

It is mounted on **both** screens the deliverable names — the score grid and the assignment list — from
one module and one computed set, so the two can never disagree about the number.

### Where a dismissal is persisted

**`localStorage`, via `src/prefs.js`, keyed `pastDueDismissed`**: `{ "<assignmentId>": true }`.

Both sides of the map are ids and booleans — no name, no due date, no student, no score, nothing from
inside a year document. That is the same category of fact as `openClassId` ("an ID and never a name")
and `openTermIds` (ids on both sides), and it is what makes it legal in a file whose entire job is that
nothing from inside a document comes near it. The key is declared in `PREF_DEFAULTS` with its reasoning
beside it, so `setPref()`'s refusal still holds.

The year document was the other candidate and I rejected it: it syncs and is restored from backup, so a
field there is a schema change `docs/data-model.md` would have to carry — for a banner — and a restore
would resurrect or destroy dismissals along with the grades, making a UI nudge part of the record of a
school year.

**The accepted cost, stated rather than hidden:** dismiss on the laptop and the iPad still asks once.
For a prompt whose whole job is to ask, that is the right way round — accepting on either device writes
the same cells. Stale ids for deleted assignments are left inert, exactly as `openTermIds` leaves a
stale class key.

---

## What I verified, and how

`node tools/verify-shell.mjs` — **694 checks · 694 passed · 0 failed · 0 skipped**, 226s, exit 0, run on the tree exactly as it stands (the two mutations below were applied and reverted before it). Seventeen new checks in one new section
(`--- the past-due prompt (WO-3.6) ---`), 19 call sites of which two are fixture-guard failure arms that
never fire on a green run. The full output is quoted in `TESTING.md` § WO-3.6.

`node tools/wo-sweep.mjs` — **17 checks · 14 passed · 0 failed · 3 to review**. All three REVIEWs read
and answered, in `TESTING.md`:

- *sensitive field names outside `src/backup.js`* now names `src/past-due.js`. The hit is that file's
  own prose saying the review lists student names and nothing else — no plan, no accommodation, no
  indicator. Nothing on this surface emits support data; it never reads it.
- *due-date and late/missing on the same line* names five lines in `src/past-due.js` and one in
  `src/shell.js`. Every one is prose or teacher-facing copy — the header's account of the draft this
  work order replaced, the button label "Mark them missing", its `title`, the sentence itself. **The
  line that actually reads the clock is `assignment.due < today`, which contains neither word.**
- *CSS selectors with no coarse-block rule* names `.past-due-said`, `.past-due-lead`,
  `.past-due-review`, `.past-due-names` — two containers and two text elements, none tappable. The
  three real controls are `.past-due-btn` and are in the coarse block, and are measured on an emulated
  coarse pointer with the banner actually up.

`node tools/wo-gate.mjs --audit` — passes; the dashboard rows still match their boxes.

**Two mutations, both reverted**, because three of the four acceptance lines are satisfied perfectly by
a build that draws no prompt at all and I did not want to report a green run over a fixture that could
not express the failure:

| Mutation | Result |
|---|---|
| `isUntouched()` stops asking about the flag — i.e. reuse the score grid's own `isUngraded()`, which is the obvious thing to do | **8 red.** The decisive line: *"the excused cell reads `{"v":null,"flag":"missing"}`"*. Sentence goes to "8 blanks", review lists the excused and late cells, accept turns a decision into a zero. `694 · 686 · 8` |
| `assignment.due < today` becomes `<=` — a date that IS today counts as past due | **9 red.** "10 blanks are past due", the cell on the assignment due today stops being byte identical, and the dismissal preference picks up a third id. `694 · 685 · 9` |

### What I could **not** verify — three 👤 lines, left unticked

They are in `TESTING.md` § WO-3.6 and in the work order's new **Owes** field. I have no iPad and did
not tick them:

1. **The three controls under a thumb**, and specifically whether *"Mark them missing"* can be
   mis-tapped for *"Not now"*. This is the one control in the app that writes a flag onto a column of
   cells the teacher did not point at. The boxes measure ≥44px with 10px between them under an
   emulated coarse pointer; an emulator has no thumb.
2. **Whether the banner reads as an offer rather than an error** at a glance — amber, above a grid she
   came to type in — and whether it pushes the first grid row off the fold in landscape. This is the
   WO-2.11 question again: a lifted component can be right in every measurement and wrong in the room.
3. **An offline launch on `planbook-shell-v51`**, with `src/past-due.js` served from the precache. The
   harness has never seen a service worker.

Because those three are open, I have **not** ticked the ROADMAP box *"Past-due blanks generate a
prompt"* (Phase 3 stays 8/10). The maintenance protocol ticks a box when the work lands **and** its
`TESTING.md` items pass, and three of them have not. That is the one box I left for the owner.

---

## Files changed

New:

- `src/past-due.js` — the whole feature. The computation, the banner, the review, accept, dismiss.

Modified:

- `index.html` — two empty `[data-past-due]` hosts, in `#scoresView` and `#assignmentsView`.
- `src/assignments.css` — `.past-due*` in **§ SHARED** (both screens wear it; `src/scores.css` must
  never restyle it), plus its `@media (pointer: coarse)` rules in the same pass.
- `src/scores.js` — imports and calls `paintPastDue()`; **decision 1 rewritten** so the file stops
  denying what its screen now does. It still reads no clock itself, which is now stated as the split
  rather than as an absence.
- `src/assignments.js` — the same import and call, beside the overdue tint that is the quiet half of
  the same fact.
- `src/shell.js` — the three click hooks, their entries in the hook census, and the one chain that
  matters: accept redraws the screen under the banner, review and dismiss do not.
- `src/prefs.js` — `pastDueDismissed` declared in `PREF_DEFAULTS`.
- `sw.js` — `./src/past-due.js` added to `SHELL`, `CACHE` bumped `planbook-shell-v50` → `v51`.
- `tools/verify-shell.mjs` — one new section, 19 call sites.
- `tools/README.md` — the recorded call-site count 676 → 695, with the WO-3.6 clause the sweep's
  paragraph wants.
- `TESTING.md` — § WO-3.6: 17 ticked lines, 3 👤 lines, the fixture's reasoning and the mutation table.
- `docs/data-model.md` — a note under § *"Missing is marked, never inferred"* recording that its
  paragraph is now built, and the three things it decided that the paragraph did not say.
- `plans/work-orders/phase-3-gradebook.md` — the four Acceptance boxes ticked with their evidence, a
  **Surface** paragraph recording the three decisions, an **Out of scope** line for the tint below, and
  an **Owes** field for the three 👤 lines.

I did **not** write the `CHANGELOG.md` entry. A draft is at the foot of this file.

I did **not** touch `CLAUDE.md` or `AGENTS.md`: this adds no command and no convention, and changes no
status that either file states. The `planbook_` / UI-preferences-only rule they both carry is what the
new key obeys rather than something it amends.

I did **not** commit or push.

---

## Proposed follow-ups — things I did not do, and why

1. **The overdue tint on a score-grid column head.** `design/mockups/proposed.css` draws it
   (`.scores-col-due.overdue { color: #8a6d1a; }`) and three files in the repo say it belongs to this
   work order — `src/scores.css:301`, `src/scores.js` decision 1, `src/assignments.css:147`. It is one
   CSS rule and three lines of JS, it writes nothing, and it would tell the teacher *which columns* the
   banner means without opening the review. **It is not in this work order's Deliverables**, which are
   the prompt, the accept/dismiss and the review, so I left it and updated `src/scores.css`'s comment to
   say the prompt landed and the tint deliberately did not. Worth an XS work order; the temptation to
   fold it in was real and is the main thing I declined.
2. **`shortDate()` is now the third copy of the same eight lines** — `src/scores.js`,
   `src/assignments.js` and now `src/past-due.js`, each with a comment saying why it is not an import.
   Two copies was a defensible convention; three is a formatter waiting to disagree with itself. The
   honest fix is one exported `Mon D` formatter (a leaf module, or an export from `src/categories.js`'s
   neighbourhood), and it touches two shipped files this work order does not own. I noted the debt at
   the third copy rather than paying it here.
3. **The banner's count can go one stale while the teacher types.** `paintPastDue()` is deliberately
   not on the typing path — `src/scores.js` repaints its grade column on every keystroke, and rebuilding
   three buttons under a hand mid-column is the failure `index.html` records about the flag bar. So a
   teacher who fills a blank in while the banner is up sees "6" until the next render. Accept re-checks
   every cell and drops the ones that stopped being blank, so nothing is ever overwritten; the number is
   the only thing that lags. If that reads badly on the hardware, the fix is a cheap recount on
   `paintGrades()` that rewrites only the sentence and never the buttons — worth a work order, not worth
   guessing at now.

## A decision the work order did not settle, and which way I went

**"On opening an assignment or a class gradebook"** — the deliverable names two scopes, and this app has
no screen that *is* one assignment (the editor is a modal for writing one down). I read the two as
*surfaces* rather than as scopes and mounted the same class-and-term-scoped prompt on both class
screens: the score grid, where the cells are and where accept lands visibly, and the assignment list,
where the overdue tint already says a date has gone by. The per-assignment half survives in the two
places it matters — the sentence names the assignments, and the dismissal is recorded per assignment, so
"Not now" on either screen is "Not now" on both.

---

## Draft `CHANGELOG.md` entry — yours to keep, cut or rewrite

```markdown
### Added
- **The past-due prompt (WO-3.6).** Open a class's scores or its assignment list and, if work whose
  due date has gone by still has blank cells, a banner asks: *"6 blanks are past due — mark them
  missing?"* **Review** lists exactly which cells it means, student by student, with what each one
  would cost. **Mark them missing** writes them all at once. **Not now** writes nothing and stops the
  prompt asking about that work on this device.

  It is a prompt and never arithmetic: no grade in Planbook has ever changed because a date rolled
  over, and none does now. A cell that is `excused`, or `late` with no score yet, is a decision you
  made and is never swept — the prompt only offers to fill in silence. Work due *today* has not gone
  by, and work with no due date can never be past due.
```
