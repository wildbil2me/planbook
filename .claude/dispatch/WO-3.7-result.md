# WO-3.7 — Per-student grade detail · implementation result

**Route** Claude (work-order-implementer) · **correction pass over an unfinished draft**
**Brief** `.claude/dispatch/WO-3.7-brief.md`
**Reported** 2026-08-12

---

## The short version

Both harnesses are green, from runs I read to completion:

```
node tools/verify-shell.mjs   626 checks · 626 passed · 0 failed · 0 skipped
                              15,311 lines · 24.5 lines per check · 205s   (exit 0)
node tools/wo-sweep.mjs       17 checks · 14 passed · 0 failed · 3 to review
```

The two failures the orchestrator diagnosed are fixed and their checks now pass. **28 of the 626 are
this work order's**, in one new section at the foot of the harness.

**Seven of the nine Acceptance boxes are ticked. Two are deliberately left open** — lines 6 and 7 —
because each has a half that no machine in this repo can close: *"prints to **one page**"* and
*"opens cleanly **in a spreadsheet**"*. Everything else about both is measured. WO-2.6 set that
precedent exactly: its paper half and its spreadsheet half were both ticked by the owner on her own
printer and in her own spreadsheet on 2026-08-11, not by the harness. `node tools/wo-gate.mjs --tick`
will therefore refuse to close this work order, which is correct — it is waiting on a printer and a
spreadsheet, and I have neither.

---

## What I kept versus what I rewrote

I audited the draft line by line before touching it. **The draft was substantially right, and I kept
almost all of it.** That is a finding, not a courtesy: it honored the "Why it exists" paragraph and
both Traps paragraphs, it stayed inside scope, and I found nothing it had quietly widened.

### Kept, after audit — unchanged

| File | Draft | What I checked it against |
|---|---|---|
| `src/detail.js` | new, 789 lines | It is a view, not a dialog. **No `import` of `src/supports.js` and no path to `student.supports`** — the guarantee is that the data never arrives, not that it is filtered on the way past. No arithmetic of its own: every number comes from `src/grade-engine.js`. `handToBrowser()` imported rather than re-written. `PRINT_ATTR` is WO-2.6's idiom with a second subject, argued at the point of departure. |
| `src/detail.css` | new, 393 lines | **Diffed value-by-value against `design/mockups/proposed.css` § STUDENT DETAIL.** It is a lift, not a re-derivation — `CLAUDE.md`'s rule and the WO-2.11 scar. The two things the drawing has that the sheet does not (`.detail-support-btn`/`-dot`, `.detail-stack*`) are each named **at the point the rule would have gone**, with the reason, which is the required shape for a departure. Colors inline, no dark variant, coarse block last. |
| `src/grade-engine.js` | +151 | The brief says *"if the breakdown needs a number the engine does not expose, **extend the engine** rather than shadowing it."* `nextBandFor()`, `openWork()` and `projectedClassGrade()` are in the engine, and `projectedClassGrade()` shares one `weighted()` body with `weightedClassGrade()` so a projection cannot fork into a second weighted average. |
| `index.html` | +80 | `#detailView` a sibling in `<main>`. One empty `<nav data-screen-nav>`, per `gradebook-surfaces.md`. |
| `src/views.js` | +28 | One line to `VIEWS`, one to `CLASS_SCREENS`, one to `REMEMBERED_AS`. The third is not a departure — WO-3.5 set that precedent for `scores`, and `views.js`'s own header explains why no class screen is remembered. |
| `src/screen-nav.js` | **untouched** | Correct, and the sharpest thing in the draft. `gradebook-surfaces.md`'s rule reads "one line each to `VIEWS` and `CLASS_SCREENS`", and the brief warns not to copy WO-3.5's line blindly. Per-student detail is **not a fourth tab**, so it adds no line to `SCREENS` — it appears as the breadcrumb the module was already written to draw. |
| `src/scores.js` · `src/scores.css` | +46 / +28 | The name becomes the door. `.scores-name-btn` gets its 44px in the coarse block **in the same pass**. |
| `src/attendance-report.js` · `src/attendance.css` | +19 / +7 | The second door, inside the history dialog rather than on the registry row. |
| `sw.js` | +4 | `v45`, both new files in `SHELL`. |

### Rewritten or added by me

1. **`src/shell.js` — the diagnosed defect.** Renamed the *local* `detail` at (then) line 1163 to
   `attDetail`, matching `attFilter`/`attSort` three lines below. The module import keeps the name it
   owns across ten uses. A comment at the site records why the rename is load-bearing rather than
   cosmetic, because a future reader restoring the "clearer" name would silently re-break the Print
   button.

   **I checked the rest of the listener as instructed.** I cross-checked every `const`/`let` in the
   listener body (lines 704–1302 as it stood) against the file's full import list mechanically, not by
   eye: **one collision, the one already found.** I extended the check to the whole file, which found
   one more — see "Decisions and follow-ups" below.

2. **`tools/verify-shell.mjs` — one added check, one corrected claim.**
   - **Added:** the door from the attendance history dialog measured at 44px under a coarse pointer.
     See below; this is the one real coverage gap I found in the draft.
   - **Corrected:** a WO-3.14 check whose *name* read `(WO-3.7 per-student detail does not exist yet)`.
     This work order made that false. It is now reworded to say where the third percentage surface is
     measured. No assertion changed — a name only. A check name that has quietly gone false is a line
     nobody re-reads.

3. **`tools/README.md` — the recorded counts, which the draft never updated.** `wo-sweep.mjs` was
   **FAIL**ing on this and would have failed the verifier: 599 recorded against 626 actual. Now 627
   call sites and 626 executed, both from runs. I also added the WO-3.7 measurement block, including a
   write-up of the temporal-dead-zone defect as the trap it is — the Print button *reached*
   `printDetail()` (`{"ok":true,"label":"🖨 Print this page"}`) and `printCalls` was still 0, which
   without the harness's `attrRightAfter`/`printCalls` fork reads as a CSS defect in a print block
   that is perfect.

4. **`plans/work-orders/phase-3-gradebook.md` — the Acceptance boxes**, seven ticked with the evidence
   inline, two left open with the reason. Plus a consequence the tracker audit caught: **WO-3.3
   carried an `**Owes** WO-3.7` field** pointing at the breadcrumb box I just ticked. `wo-gate --audit`
   went `BAD` on it. WO-3.3's line 7 is now ticked on this work order's evidence and the `**Owes**`
   field dropped, following the `→ WO-3.5` discharge idiom already in that file. `--audit` is now
   **PASS**.

5. **`TESTING.md` — the whole § WO-3.7 section, which did not exist.** Modeled on § WO-2.6, which is
   the print-and-CSV precedent. Nine acceptance lines with their evidence, plus **four 👤 lines, all
   left `- [ ]`.**

---

## Against the nine Acceptance lines, one by one

**1. The breakdown's contributions sum to the displayed overall grade. — ✅ ticked, measured.**
Three claims, because a build could satisfy any two: the column **as printed** sums to the footer **as
printed**, and both agree with the engine. `["36.71","19.12","9.41"]` → 65.24, footer `65.24%`, hero
`65.24%`, engine `65.23529411764706`. A second student exists specifically to prove the printed column
is not the naive one: her contributions rounded individually give `36.71 + 25.00 + 21.18 = 82.89`
under a total of `82.88`, and the check asserts **both** that the naive sum would have missed **and**
that the printed one does not — so it cannot go green against a build that dropped the cent allocation.

**2. With a category empty, the breakdown shows the redistribution. — ✅ ticked, measured.**
Participation carries 15% and holds nothing. Its row is drawn (not hidden, not printed as `0%`) in the
caution wash, reading `nothing graded in it yet — its 15% is shared across the others`, and the three
rows beside it print a **Counts at** column of `47.06% · 29.41% · 23.53%` rather than their face
weights. The fixture's weight base is 85 rather than 100 throughout, so a build that ignored
redistribution entirely fails every figure in the section rather than just this one.

**3. The "to move" figure is reproducible by hand. — ✅ ticked, measured.**
Every figure was computed by hand first and written into the harness section's header, then asserted
**as a string** — never read back off the screen and compared to itself. Floor `52.54%`, ceiling
`75.09%`, next reachable band D+ at 67, rate `(67 − 52.5392…)/(75.0882… − 52.5392…) = 0.6413…` rounded
**up** to `64.14%`, landing at `67.00%`. Rounded up and never to nearest, which the code argues at the
site: a rate rounded down reads as reaching the band and does not. Two things are named rather than
folded in — the missing-work route (`77.00%`) and the 0-point bonus assignment, since a percentage of
nothing is nothing.

**4. No `supports` data appears on this screen in presentation mode. — ✅ ticked, measured.**
Discharged together with line 8, in both modes, with the data planted first. Stronger than the line
asks and deliberately so: `src/detail.js` has no path to the data at all, so the mode question is
trivially true rather than conditionally true.

**5. It is a view in `<main>`, not a dialog. — ✅ ticked, measured.**
`#detailView`'s `parentElement` is `<main>`, it carries no `role`, and the tap that opened it left zero
visible `.modal-overlay`s. Opened through the real door.

**6. Prints to one page carrying name, class, term and date; no chrome on it. — ⬜ LEFT OPEN.**
**The chrome half is fully measured; the "one page" half is not, and cannot be from here.** Driven
through the real Print button and the real delegated handler, with `window.print()` stubbed so the
snapshot is taken **at the instant the app asks to print**, under emulated print media — nothing races
the 500ms attribute release. The hero carries `Zoë Ñuñez-Öztürk`, `WO-3.7 Detail` and `WO-3.7 Term`;
the stamp reads `Printed August 12, 2026 · Planbook`. App header, panel header, nav strip, breadcrumb,
action row and every other view are `display: none` with **zero-height boxes**, and `0 element(s) still
drawn outside #detailView`. Heights *as well as* `display`, because the computed display of an element
inside a `display: none` ancestor is its own value. Also measured: **all 40 `@media print` rules
touching this surface are gated on `body[data-detail-print]`, none ungated**; `<body>` carries no such
attribute at rest; the attribute comes back off; and a print with the attribute **off** leaves the whole
app on the page — the blank-sheet regression the gate exists for, which has happened once in this app.

*Why the box is open:* **no emulator has paper.** The harness's own section header says so. Ticking it
would be claiming a line I did not meet. It is 👤 line 1 in `TESTING.md` § WO-3.7.

**7. The per-student CSV opens cleanly in a spreadsheet, including a non-ASCII name. — ⬜ LEFT OPEN.**
**The bytes are fully measured; the spreadsheet is not.** Read through the `detailModel()` /
`studentCsv()` seam. A BOM, no bare LF anywhere, five category rows all seven cells wide, `Ó"Brien, Jr`
surviving as one cell, figures identical to the screen's including the contribution column, and the file
named `Planbook Ñuñez-Öztürk, Zoë WO-3.7 Detail WO-3.7 Term grades 2026-08-12.csv`.

**The BOM is asserted *useful* and not merely present**, which is the hole WO-2.6 left and this work
order was told not to inherit: both fixture surnames leave ASCII, and the same bytes decoded as
Windows-1252 read `Ã‘uÃ±ez-Ã–ztÃ¼rk` — the failure the BOM prevents, demonstrated rather than described,
over 727 bytes for 716 characters. **This is genuinely closed at the byte level for the first time.**

*Why the box is open:* the line says "opens cleanly in a spreadsheet." I have not opened it in one, and
WO-2.6's identical box was ticked only when the owner did. 👤 line 2 in `TESTING.md` § WO-3.7.

**8. Neither output emits accommodation, medical or plan data, both modes, data asserted present first.
— ✅ ticked, measured.**
A plan (`"plan":"IEP"`), a case manager, a review date, an accommodation, a medical line and a behavior
plan are planted on the student whose detail is opened, and **their presence in the serialised document
is asserted before anything is read** — an absence check over a student with nothing on file proves
nothing, and shipping a fixture that cannot fail is the exact defect this work order calls out. Then
the screen's text, the CSV's text **and the model's JSON** are searched for all five sentinels and for
the bare word `IEP`, twice: mode **OFF**, where `supportsVisible()` answers `true` and the roster shows
everything, and mode **ON**. Zero hits in either pass, over surfaces of 2,735, 716 and 1,322 characters,
so none of the three was empty. **The mode-OFF pass is the one that matters** — a build that gated the
screen and the file on the toggle would pass mode-ON and fail this.

**9. The strip shows the student's name while this screen is up, and switching tabs takes it with it.
— ✅ ticked, measured. This is the half nobody has been able to demonstrate since WO-3.3.**
With the screen up the strip draws **four** segments — `Attendance · Assignments · Scores ·
Zoë Ñuñez-Öztürk` — the fourth carrying the `detail` class, `aria-current`, and no `data-class-screen`
of its own. Then **each of the three tabs in turn**, not the one somebody tested: every strip on the
page comes back to three segments with the name on none of them, and re-entering through the score
grid puts it back. Set through `setDetailBreadcrumb()` in `src/screen-nav.js`, which needed no change.
This also discharged WO-3.3's `**Owes**` debt (see above).

---

## The one coverage gap I found in the draft, and closed

The draft never measured **the door it added inside the attendance history dialog**.
`src/attendance.css` gives `.attendance-report-door` a margin and nothing else, on the correct grounds
that it wears `.class-action-btn` and that component already carries its 44px floor. The reasoning is
right — and it is still a *claim*. `wo-sweep.mjs` flags every new selector with no coarse rule and asks
a human to confirm it is not a target, and answering "it inherits one" by reading is the exact shape of
the BOM this work order was told not to inherit: asserted present, never asserted useful.

It is now opened at 1024px under a coarse pointer, on the surface a teacher reaches it from, and
measured: `{"open":true,"found":true,"w":196.08,"h":44,"spill":0,"label":"Grades for Zoë Ñuñez-Öztürk"}`.
Asked for before it is clicked, so a missing fixture is a red check and never a crash.

---

## The three `wo-sweep.mjs` REVIEWs, read rather than waved at

1. **Sensitive field names — 188 mentions across 15 files.** The two files new to that list are
   `src/detail.js` and `src/detail.css`. Their five mentions between them are **all prose in comments**,
   stating at the point where a future author would break it that none of that data reaches these
   surfaces. Neither file has a `supports` identifier in executable code, and `src/detail.js` does not
   import `src/supports.js` at all. Same shape as WO-2.6's seven.
2. **Thirteen new selectors with no coarse-block rule.** Each is a layout container or a text node, not
   a control: `.detail-panel`, `.detail-body`, `.detail-actions` (a flex row *holding* buttons),
   `.detail-cols`, `.detail-print-stamp` (`display: none` at rest, print-only), `.detail-avatar`
   (`aria-hidden`), `.detail-hero-*`, `.detail-grade-big`, `.detail-missing-row`, `.detail-att-*`. This
   screen adds no control of its own — every control on it is `.class-action-btn` or `.screen-nav-btn`,
   which carry their floors in the sheets that own them, and the harness confirms it end-to-end:
   `measured 7 control(s) on #detailView … under = []`. **The two selectors that ARE new targets —
   `.scores-name-btn` and `.attendance-report-door` — are precisely the two that do not appear on this
   REVIEW list**, which is the sweep working.
3. **`src/detail.js:349`, due-date and late/missing on one line.** It is the sentence on the missing-work
   card stating the rule it was flagged for: *"Missing is marked by you and is never worked out from a
   due date, so nothing on this list appeared because a date rolled over."*

---

## Decisions the work order did not settle, and which way I went

1. **A second `detail` shadow exists at `src/shell.js:1710` — I left it.** It is
   `const detail = document.getElementById('loadingErrorDetail')` inside `showBootFailure()`, a
   function that never uses the module binding, so it is **inert today**. The brief scoped the sweep to
   "that listener", and "Honor *Out of scope* literally" is the standing rule, so I did not touch code
   this work order otherwise has no business in. **It is a live trap** — the day someone adds a
   `detail.` call to `showBootFailure()`, the boot-failure handler itself throws, which is the worst
   possible place for it. Named as a follow-up below rather than fixed.
2. **I did not tick lines 6 and 7.** Argued above. This costs a `--tick` round; ticking them would cost
   more, and WO-1.8's offence was ticking lines its own result file listed as unverified.
3. **I reworded a check name in a section this work order does not own** (`WO-3.14`). One name and one
   comment, no assertion. The alternative was leaving the harness printing a statement this work order
   had made false on every run.
4. **I added one harness check** rather than accepting an inherited-but-unmeasured 44px claim. The brief
   says "Add checks for what you build"; the alternative was a REVIEW discharged by reading.
5. **I ticked WO-3.3's line 7 and dropped its `**Owes**` field.** Not my work order's box, but
   `wo-gate --audit` reported it `BAD` **as a direct consequence of my tick** and instructs exactly this
   edit. Leaving it would have handed the verifier a failing audit.

## Out-of-scope temptations I declined

- **The accommodation indicator** (`.detail-support-btn` in the mockup, called "the most sensitive
  control in the gradebook" by its own caption). Not in the deliverables, and this screen carries a
  print surface and a CSV — building it would put the module that writes a sheet for a guardian to take
  home in reach of the one block of data that must never be on one. The draft declined it and said so
  at the point of departure; I agree and kept that.
- **The contribution stack bar** (`.detail-stack*`). Needs a per-category palette this app does not
  have — the avatar colours are per *student*.
- **An at-risk banner / absence letter / email composer.** Explicitly Phase 4 and 5. A threshold
  invented here is a second opinion about "at risk" before the first one exists.
- **A `data-class-screen="detail"` segment.** The owner's 2026-08-09 decision. Absent, and the harness
  asserts it stays absent (`stripOnClass.every((s) => s.detail === 0)`).

## Proposed follow-ups (not done, named as instructed)

1. **The `showBootFailure()` shadow at `src/shell.js:1710`.** One-word rename; needs a work order or an
   owner's nod since it is outside this one.
2. **A `wo-sweep.mjs` grep for a local declaration shadowing a module import in the same file.** This
   defect class cost this work order two failing checks and is invisible to *both* harnesses today —
   `verify-shell.mjs` saw only the symptom (`printCalls=0`), and the sweep has no rule for it. It is
   greppable: collect `^import (\* as )?(\w+)` per file, collect `(const|let|var) \2\b`, report
   overlaps. Cheap, and it would have caught this before the browser ever opened.
3. **A `@page` note.** `src/detail.css` deliberately has no `@page` rule and depends on
   `src/attendance.css`'s, with the reasoning written down. If WO-2.6's print surface is ever removed,
   that rule must **move** rather than be deleted. Already commented in place; flagged here so it is
   also in a searchable record.

---

## Files changed

**New (untracked, from the draft — audited, kept):**
- `c:\dev\planbook\src\detail.js`
- `c:\dev\planbook\src\detail.css`

**Modified by the draft, audited and kept unchanged:**
- `c:\dev\planbook\index.html`
- `c:\dev\planbook\src\grade-engine.js`
- `c:\dev\planbook\src\views.js`
- `c:\dev\planbook\src\scores.js`
- `c:\dev\planbook\src\scores.css`
- `c:\dev\planbook\src\attendance-report.js`
- `c:\dev\planbook\src\attendance.css`
- `c:\dev\planbook\sw.js`

**Modified by me this pass:**
- `c:\dev\planbook\src\shell.js` — the temporal-dead-zone fix (local renamed, module import untouched)
- `c:\dev\planbook\tools\verify-shell.mjs` — one added check; one corrected check name + comment
- `c:\dev\planbook\tools\README.md` — recorded call-site count 599 → 627, executed count 598 → 626, the
  gap paragraph, and a WO-3.7 measurement block
- `c:\dev\planbook\plans\work-orders\phase-3-gradebook.md` — WO-3.7's nine boxes (7 ticked, 2 open);
  WO-3.3's line 7 ticked and its `**Owes**` field dropped
- `c:\dev\planbook\TESTING.md` — new § WO-3.7 (nine lines + four 👤 lines, all `- [ ]`)

**Not touched, on purpose:** `src/screen-nav.js` (already correct), `CHANGELOG.md` (the teacher's),
`plans/ROADMAP.md` (`wo-gate --tick` writes that box, and it will rightly refuse while lines 6 and 7
are open). **Nothing committed and nothing pushed** — the brief did not ask.

---

## Draft CHANGELOG entry — for the teacher to accept, reject or rewrite

> **Per-student grade detail.** Tap a student's name on the score grid — or the new *Grades for…*
> button inside their attendance history — and their whole grade opens as its own screen: where the
> number comes from category by category, what is still missing and what it is worth, what score on the
> outstanding work would reach the next letter, and their attendance for the same term. The screen's
> name appears in the class switcher while you are in it and leaves when you go.
>
> It prints, and it downloads as a CSV — one student, the sheet a guardian can take away from a
> conference. Neither carries anything from a student's support details, in either presentation mode.

---

## What I could not verify

- **That the printed sheet is one page.** No emulator has paper. 👤.
- **That the CSV opens cleanly in a real spreadsheet.** Measured as bytes; bytes are not Excel. 👤.
- **Anything about the actual iPad** — how the name door feels beside cells you are typing into, and
  whether the breakdown table is readable across a desk with a parent beside you. Two 👤 lines in
  `TESTING.md`, both left `- [ ]`. I have no iPad.
- **`verify-shell.mjs` under the sandbox note in the owner's memory.** It ran here, twice, to
  completion — 206s and 205s, exit 0 both times. I read both summaries and the WO-3.7 section of both
  logs before writing any of the above.

---
---

# Correction round — 2026-08-12, after the verifier's FAIL on Acceptance line 6

**Everything above stands as written except where this section says otherwise.** Lines 1, 2, 3, 4, 5,
8 and 9 were verified by the verifier and I did not touch that work. Line 7 stays 🙋. One line failed
and one line is fixed.

## The defect, restated so the fix can be checked against it

`src/detail.css`'s gated print block declared `gap` on `.detail-cols` and **never restated
`grid-template-columns`**. Ninety lines further down, outside the block:

```
@media (max-width: 1024px) { .detail-cols { grid-template-columns: minmax(0, 1fr); } }
```

Under print media a `max-width` query resolves against the **page box**, not the window. Letter at
this app's `@page { margin: 10mm }` is ≈740 CSS px, landscape Letter ≈981, A4 ≈718 — all three under
1024. So the tablet-portrait rule won on every real sheet of paper and the detail printed as **one
column**, which the print block's own comment calls "two pages of half-empty paper", under an
acceptance line that says one page.

I did not argue with the finding. **I reproduced it independently first**, the way the verifier
found it — a page linking `src/detail.css` and `src/attendance.css` (for the `@page` rule), body
carrying `data-detail-print`, two 600px cards in `.detail-cols`, rendered with headless Edge
`--print-to-pdf` at Letter and the `/Count` read out of the PDF:

| stylesheet | pages |
|---|---|
| as shipped (no `grid-template-columns` in the gate) | **2** |
| with the one line restored inside the gate | **1** |

## 1 · The stylesheet — `src/detail.css`

**The one line, gated.** `body[data-detail-print] .detail-cols` now restates
`grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr)` alongside its `gap: 4mm`. Specificity
(0,2,1) against the responsive rule's (0,1,0), so it wins on paper wherever the query matches,
without `!important` and without leaving the gate. The comment above it now carries the page-box
arithmetic and the date, because the next reader's instinct on seeing a column count restated inside
a print block is to delete it as redundant.

**The sweep the correction asked for, and what it found.** Every `max-width` block in the repo,
checked against what is actually on the printed sheet (`#detailView`, its descendants, and its
ancestors up to `<html>`):

| block | declares | reaches the sheet? |
|---|---|---|
| `detail.css` 1024 | `.detail-cols { grid-template-columns }` | **yes — the defect** |
| `detail.css` 640 | `.detail-hero { gap }`, `.detail-hero-grade { text-align }`, `.detail-grade-big { font-size }` | yes on paper narrower than 640px; `font-size` was already beaten by the gated 20pt rule, the other two were not |
| `shell.css` 640 | `.main { padding, padding-left, padding-right }` | yes — already pinned by `body[data-detail-print] > main { padding: 0 !important }` |
| `shell.css` 1024, `attendance.css` 1024/640, `assignments.css` 640, `scores.css` 640, `home.css` 640 | — | no: every selector is inside a view that is `display: none` on this sheet |

So one live defect and **two dormant ones**. I pinned the two — `gap: 14px` and
`text-align: right` restated in the gated block — rather than leaving them with a comment.
**This is a judgement call and I am naming it:** Letter and A4 both clear 640px, so nothing the
teacher prints today is affected, and the strictly minimal fix was the single column line. I took
the two extra declarations because they cost two lines, change nothing on the paper this app is used
with, and let the new sweep check below assert *zero* unpinned rather than assert a hand-maintained
allowlist of "these two are exposed but it does not matter yet". A rule that has to be re-argued
every time somebody reads it is a rule that gets deleted.

The two responsive blocks now carry a header saying that a `max-width` query reaches paper and that
a property added there needs a line inside the gate in the same pass.

## 2 · The harness's blind spot — `tools/verify-shell.mjs`, two checks

The print pass sets device metrics to 1280 once, at the top of the section, and
`Emulation.setEmulatedMedia: 'print'` switches the media *type* and relayouts nothing. So every
`max-width` query in the app was still answering about a 1280px window while the sheet was being
read — **the one width band in which the shipped stylesheet still looked like the designed one**.

Added, in the same section, after the existing print checks:

1. **The sheet re-driven through the real Print button at a real page box.** Device metrics to
   740px, print media, the button clicked (via `element.click()`, per the departure already written
   down two hundred lines above for exactly this reason), and the reading taken inside the stub:
   the grid must resolve to **two tracks** and the two column children must sit **side by side**.
   The check demands `matchMedia('(max-width: 1024px)')` be **matching** and `matchMedia('print')`
   be true before it believes anything — otherwise a metrics override that silently failed puts the
   run back at 1280, where the check would pass for precisely the wrong reason. It reports the
   view's content height at that width and says in the same breath that a content height is not a
   page count.
2. **The general form.** A static sweep run at the moment the attribute is on (half the gated
   selectors match nothing without it): every rule under a `max-width` condition, against every
   element of the sheet, must have each property it declares **restated by a gated
   `body[data-detail-print]` rule matching the same element**. Shorthands are handled both
   directions. Reports `N max-width rule(s) in the app, M gated print rule(s), P rule/element
   pair(s) on the sheet, K unpinned` and names the offenders.

**Its stated limitation, written at the check:** it asks whether a gated rule *declares* the
property, not whether it would win a specificity tie. That is sufficient today because every gated
selector on this sheet is attribute-plus-class and outranks the single-class responsive rules it
faces; a future responsive rule that ties would pass this check and still lose on paper. Said at the
check rather than discovered later.

**Both were watched failing.** With the one line reverted and nothing else changed, a full run:

```
628 checks · 626 passed · 2 failed          (exit 1)

FAIL | at a real page box — 740px … :: page box 740px, print media = true,
       (max-width: 1024px) matches = true, grid tracks ["740px"] over 2 column(s),
       side by side = false
FAIL | and no responsive rule declares a property on this sheet that the gated print block
       leaves unpinned :: 25 max-width rule(s) in the app, 41 gated print rule(s),
       5 rule/element pair(s) on the sheet, 1 unpinned:
       ["@media (max-width: 1024px) { .detail-cols { grid-template-columns } } unpinned on
        div.detail-cols"]
```

**Everything else in that run stayed green** — which is the escape written down as a measurement.
The stylesheet was then restored from a byte copy taken before the mutation (25,948 bytes, the gated
rule present).

**What CDP can and cannot do here, since the correction asked me to say so plainly.** Nothing in CDP
relayouts a page at the page box on its own. `Page.printToPDF` renders one but hands back bytes, not
a tree you can measure — that is why the negative control above is a PDF page count and the harness
check is a width set by hand. Setting `setDeviceMetricsOverride` to the page box is the honest
substitute and it is exact for the media-query question, which is the whole question here. It is not
pagination: **the harness still cannot say how many sheets come out**, and I have not pretended
otherwise anywhere.

## 3 · Acceptance line 6 stays `- [ ]`

Left open in `plans/work-orders/phase-3-gradebook.md`, as instructed and as I would have anyway.
The evidence paragraph under it now records the correction. The `TESTING.md` 👤 line reads **one
page and two columns**, and says the column half is now measured but was measured only after the
verifier found the shipped sheet printing as one column, so it is worth confirming on the first
sheet off the tray.

## 4 · The numbers, from runs I read to completion

```
node tools/verify-shell.mjs   628 checks · 628 passed · 0 failed · 0 skipped
                              15,480 lines · 24.6 lines per check · 206s   (exit 0)
node tools/wo-sweep.mjs       17 checks · 14 passed · 0 failed · 3 to review   (exit 0)
```

Three full harness runs this round: the fixed tree (207s, exit 0), the reverted control (exit 1, two
named failures), and the fixed tree again after the documentation edits (206s, exit 0). The 207s
recorded in `tools/README.md` and `TESTING.md` is the first of those; the last printed 206s. Runtime
is explicitly health rather than a gate.

`wo-sweep.mjs` **FAILed once mid-round and was fixed**: the recorded call-site count went 627 → 629
and `tools/README.md` had not caught up. Updated with the executed count (626 → 628) and the gap
paragraph (`629 − 628 = 1`), from runs rather than by arithmetic, exactly as the failure text
instructs. The three REVIEWs are unchanged in substance from the first pass and were re-read.

## 5 · Files changed this round

- `c:\dev\planbook\src\detail.css` — the gated `grid-template-columns` restatement; `gap` and
  `text-align` pinned on the hero; a header on the two responsive blocks
- `c:\dev\planbook\tools\verify-shell.mjs` — two checks (`+169` lines), both in the existing WO-3.7
  section; no other section touched
- `c:\dev\planbook\tools\README.md` — call sites 627 → 629, executed 626 → 628, the gap paragraph,
  the WO-3.7 measurement block, and **trap 10** in § "Driving a browser over CDP" (the section title
  goes nine → ten; nothing greps that string)
- `c:\dev\planbook\TESTING.md` — line 6's evidence, the 👤 print line rewritten to say *one page,
  two columns*, the desk-half numbers, and a paragraph on the defect and its negative control
- `c:\dev\planbook\plans\work-orders\phase-3-gradebook.md` — line 6's evidence paragraph; the box
  stays `- [ ]`

Not touched: `src/detail.js`, `index.html`, `sw.js` (`v45` is uncommitted and already covers this
change to a `SHELL` file — the sweep's own check agrees: *"planbook-shell-v45 is not in any commit
yet"*), `CHANGELOG.md`, `src/shell.js:1710`. Nothing committed, nothing pushed.

## 6 · What I still could not verify

- **That the sheet is one page on a real printer.** The page count I have is from headless Edge
  rendering a *probe* page to PDF, not the app — it proves the stylesheet's column behaviour and it
  is not the app's sheet on the teacher's tray. 👤, unchanged.
- **The CSV in a real spreadsheet.** 👤, unchanged.
- **Anything on a real iPad.** 👤, unchanged. Two lines, both `- [ ]`.

## 7 · A draft CHANGELOG line for this round — the teacher's to accept or discard

> The per-student sheet prints in two columns on paper, the way it looks on screen, instead of
> stretching to a second page.
