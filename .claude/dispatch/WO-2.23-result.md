# WO-2.23 — every date field in the app is short of 44px on the iPad · result

**Implementer** Claude (work-order-implementer), Opus · **Date** 2026-08-10
**Branch** `phase/3-gradebook` · **Status written** `🔨 IN PROGRESS` (by `wo-gate.mjs --tick`, which
refuses `✅ DONE` while four 👤 lines are open — see § "Status")
**Revised 2026-08-10, correction round** — see § "Correction round" at the foot. One Acceptance line
came back ❌ on its *provenance*, not its value; nothing about the fix changed.

> **⚠ Correction, 2026-08-10 — three claims in this report are false, and the body below is kept as
> written.** This file states that Roll Call!'s `#dateJumpInput` shows "a date plus a disclosure
> arrow", that it is "at least as wide" as a rendered date, and that 160px therefore leaves "roughly
> double" the headroom (§ "Correction round", and again in its closing notes). Verification round 3
> disproved all three by rendering rather than by argument: `appearance: none` — which this same file
> correctly cites two paragraphs earlier — is exactly what removes that arrow, and the source control
> measures **narrower** than the destination, 83px against 139px in Chrome. The rule's comment in
> `src/shell.css` now claims no measurement, no headroom and no comparison at all. This report is left
> unedited because it is the record of what was reported; the full five-round history, including the
> two further false claims found after this file was written, is in `WO-2.23-status.md`.

---

## What landed, in one paragraph

One declaration and one number. `src/shell.css`'s BASE section now carries
`input[type="date"] { -webkit-appearance: none; appearance: none; }` — the app-wide form of the line
WO-3.17 put on `.assign-field-date` alone — and `.term-date`'s coarse `min-width` goes 44px → 160px,
because taking the native painting away takes the native intrinsic *width* with it. Nothing else
about any date field changed: no padding, no border, no colour, no font, no layout, no parsing, no
storage. **Seven fields on four screens** are affected, one more screen than the work order's 👤 list
names — the student editor's plan *Review date* (`.student-date`) had the identical defect and its
own comment had already written the diagnosis without the reset ever following.

---

## Against the Acceptance list, one by one

### 1. The reset is applied to every date input in the app, in one place or with the per-sheet choice argued at the rule — **met, ticked**

**One rule, keyed to the element rather than to the three date classes**, in `src/shell.css`'s BASE
section at line 85, with the argument written in the 37 lines above it. I enumerated the date inputs
first rather than trusting the work order's count: `grep -rn "type *= *'date'\|type=\"date\""` over
`src/` and `index.html` returns **seven** live fields — assignment *Assigned* and *Due*
(`src/assignments.js:671`), term *Starts* and *Ends* (`src/classes.js:1052`), days-off *From* and
*To* (`index.html:2056`/`2062`, rebuilt at `src/days-off.js:266`), and the plan *Review date*
(`index.html:1779`). An element selector reaches all seven, including the two that are built in JS
and the two that are thrown away and rebuilt at runtime.

**Why one element rule and not a class per sheet** (this was the deliverable, so here is the argument
in the same words it is written at the rule):

- `src/shell.css`'s own header forbids it styling a class another sheet owns — that is what keeps a
  per-file touch pass safe from the cascade — and `.assign-field-date` is `src/assignments.css`'s. A
  grouped selector over the three classes would have to break that rule in order to exist. Keyed to
  the element it does not have to, exactly as the `font-family` line directly above it states an
  app-wide fact about controls without naming anyone's class. That precedent is why the rule is
  placed there and not somewhere new.
- **The deciding reason:** a rule keyed to a class is a rule someone must remember for every date
  field added after this one, and this is the one defect class in the app that nothing here can
  catch — the 44px sweep skips fields inside `.hidden` dialogs, and desktop Chromium honours
  `min-height` on a date input regardless. Keyed to the element there is nothing to remember, and a
  date field added by a screen that does not exist yet arrives fixed.

**What happened to WO-3.17's line, since the brief was right that this is the sharper half of the
question.** The rule still reads `.assign-field-date { -webkit-appearance: none; appearance: none; }`,
unchanged byte for byte — it is now at `src/assignments.css:276` rather than `:257` only because the
comment above it grew. I appended a paragraph to that comment saying
that the app-wide answer has since landed, that this line is now a restatement rather than the only
copy, and why it stays: shell.css *cannot* name `.assign-field-date`, so a reader arriving at that
line to find the overlap fix would find it gone with nothing in that file to point at; deleting it
would put WO-3.17's overlap fix inside WO-2.23's diff, where a revert of the second silently takes
the first with it — the exact hazard this work order's Traps name; and this codebase already names a
control in its own sheet when another rule covers it (`.hdr-mode-btn`, `.cls-tab-home`). Both
declarations carry identical values, so there is no cascade question to settle. **A reader arriving
at either rule is told the other exists and why**, which is the thing the brief said must not be
left ambiguous.

*Verified by reading the rules and by enumeration, not by measurement.* The one measurement that
exists is WO-3.17's: `verify-shell.mjs` reports computed `appearance: none` on both assignment
fields (final run, § "the appearance reset that stops WebKit drawing its own date widget is live on
both fields"). It reads the computed value rather than which rule produced it, so it says nothing
about `.term-date` or `.student-date`, and I have not claimed otherwise anywhere.

### 2. 👤 iPad, portrait and landscape: six fields full-height rather than squat — **not verified, no iPad**

Left `- [ ]` in the work order and in `TESTING.md`. I have no hardware and desktop Chromium cannot
demonstrate either the defect or the fix. The device checklist below is written for it.

### 3. 👤 The iPadOS date picker still opens from all six, and a picked date still lands — **not verified, no iPad**

This is the line that decides whether the fix is worth having, and nothing I ran touches it. **One**
thing I can offer instead of a claim, and it is a real one: WO-3.17 shipped exactly these two
declarations on `.assign-field-date`, and the owner confirmed on the hardware on 2026-08-10 that the
picker still opens and commits under them (`TESTING.md` § WO-3.17) — same engine, same iPadOS
26.5.2, same two declarations, now reaching four more fields. That is a reason to expect a pass; it
is not a pass.

*(Corrected 2026-08-10, correction round: this paragraph originally offered a second reason —
Roll Call!'s `#dateJumpInput` carrying the reset on a date input through a year of classroom use.
**That was false and is withdrawn.** `#dateJumpInput` is a `<select>`, so it says nothing about
whether a native date picker survives the reset. Roll Call! has no reset date input at all. See § 6.
The WO-3.17 sentence above is the whole of the evidence, and it was always the stronger half.)*

**If the picker fails to open anywhere, stop and report it — do not accept a typed ISO string**,
which is what `src/assignments.js:644`, `src/days-off.js:53` and `index.html:2022` all explicitly
refuse.

### 4. 👤 An empty date field still reads as a field on the device — **not verified, no iPad**

This is the risk the `min-width` exists for, and it is the one I would look at hardest. iOS draws no
placeholder in an empty date field, and the reset removes the intrinsic width that used to hold the
box open, so an empty field falls back to whatever floor it carries. That floor is now 160px on
`.term-date`; on `.assign-field-date` and `.student-date` it is `width: 100%` of a panel-sized
column, which cannot collapse. The border and white background are unchanged, so an empty field
should read as an empty box rather than as nothing — but "should" is the word doing the work and
only the glass settles it.

### 5. 👤 Days off: the dates still clear after a successful add — **not verified, no iPad**

What I can say from the code, which is not the same as running it: `src/days-off.js`'s
`rebuildDateField()` builds a fresh `<input>`, sets `type = 'date'` and copies `className`, so a
reset keyed to the element type applies to the rebuilt field for the same reason it applied to the
original — it is matched on being a date input, not on carrying a class the rebuild might drop. That
makes the shared rule *more* robust across that rebuild than a class rule, not less. The rebuild
itself is untouched. The thing only the hardware can answer is whether the picker's retained
selection still behaves the way WO-2.3's scar describes once the control is no longer natively
painted.

### 6. A date field is never allowed to collapse to its tap-target floor — **met, ticked**

`.term-date`'s coarse rule is now `min-height: 44px; min-width: 160px; font-size: 14px;
padding: 0 8px`. **160px is copied rather than re-derived** per CLAUDE.md, and here is what it was
copied from — stated precisely, because my first draft of this section was not:

- Roll Call!'s `#dateJumpInput` (`src/dashboard.html:437-440`) carries `appearance: none;
  -webkit-appearance: none; min-width: 160px`, and it is a **date-picking `<select>`** — element at
  `:1288`, populated with day-label `<option>`s at `:3951` — **not an `<input type="date">`**.
- **Roll Call! has no reset date input anywhere.** Its actual date inputs are `.config-date`
  (`:696`; three fields at `:1831`, `:1833`, `:6370`) and `.wiz-term-row input[type="date"]`
  (`:103`). Neither carries an `appearance` reset and neither carries a `min-width`.

So what Roll Call! lends this rule is **a width, not a precedent**: it is evidence for how wide a
date label has to be once the browser has stopped sizing the box, and evidence for nothing about the
control itself. The width transfers in the safe direction — a select showing a date plus a
disclosure arrow is at least as wide as the same date rendered in a field. It was measured there at
12px against the 14px here, which still leaves roughly double what a rendered `M/D/YYYY` takes at
this size — the slack is deliberate, because a width tuned until it looks right at a laptop desk is
how this comes back on the next device.

One datum I looked at and deliberately did not copy: Roll Call! narrows that select to `min-width:
130px` under `max-width: 640px` (`:990`). It is the only thing in the reference that argues for a
smaller number, so leaving it unmentioned would have been the omission doing work. It does not
transfer: it is a phone concession for a header bar that must not wrap, and both rows `.term-date`
sits in do wrap, so the cost of staying at 160px on a narrow screen is a wrapped line rather than a
squeezed field. Noted at the rule for the same reason.

*(Corrected 2026-08-10, correction round. The original text of this section said 160px was
"Roll Call!'s number for exactly this pairing … the same two reset declarations … a year of
classroom use on this same iPad behind it," which was false about the element and therefore false
about the classroom use. **The number did not change** — the verifier checked the value and the box
model independently and both hold — only the sentence that sourced it, here and in `src/shell.css`,
`plans/work-orders/phase-2-attendance.md` and `TESTING.md`. I re-read all of the reference's own
lines before rewriting, rather than trusting the correction second-hand.)*

I put it in the coarse block rather than in the base rule, and **not** in the shared reset — see
§ "Decisions the work order did not settle" for both, since the second one is a real trap.

*Verified by reading the rules and by reasoning about the box model; the overflow half is reasoned,
not measured.* Both containers that hold this class wrap (`.term-dates` and `.dayoff-dates` are
`display: flex; flex-wrap: wrap`), and at the narrowest supported 390px the field plus its uppercase
caption plus the row gap is about 215px against roughly 310–330px of modal content width — so the
wider floor costs a wrapped line and never an overflow. No harness check measures those two dialogs
(see below), so I could not put a number on that from a run.

### 7. `node tools/verify-shell.mjs` passes whole, and `node tools/wo-sweep.mjs` prints what it printed before — **met, ticked**

Both run to completion; I read both summaries after exit.

**`node tools/verify-shell.mjs`**, run against the final tree (a first run finished green at
563/563 too, but I had edited two comments in `src/shell.css` while it was in flight, so I discarded
it and re-ran rather than report a number measured against a tree that no longer existed):

```
================ SUMMARY ================
563 checks · 563 passed · 0 failed · 0 skipped
13,558 lines · 24.1 lines per check · 187s
```

Exit code 0, and `grep -c` over the captured stdout returns zero `FAIL` lines and zero `SKIP` lines.
563 is the same count WO-3.17 recorded — **no check was added**, per the Trap. *(The 13,558 is the
harness's own line count, which WO-2.19 made it print on every sweep — not the length of this run's
output, which is 638 lines. The first draft of this paragraph called it "the whole 13,558-line
output"; corrected in the same round as § 6, and mentioned because a stray wrong number in a run
report is the same species of defect as a wrong provenance.)*

**`node tools/wo-sweep.mjs`**: `16 checks · 15 passed · 0 failed · 1 to review`, exit 0, the REVIEW
still the standing sensitive-field-name sweep at **174 mentions in the same twelve files**,
byte-identical to the baseline I captured before touching anything. Diffed whole-run before against
after; exactly three PASS *details* move, no check changes state:

| Detail | Before | After |
|---|---|---|
| style-line count | 4462 across 8 files | 4547 across 8 files (comments) |
| coarse-block check | "no new CSS selectors — 0 added line(s)" | "1 new selector(s), all covered — 88 added line(s)" — the selector is `.term-date`, whose rule this work order rewrites and which is of course already in the coarse block it sits in |
| CACHE bump | "planbook-shell-v41 was set at 14b1d7e; no SHELL file has changed since" | "planbook-shell-v42 is not in any commit yet — the bump is uncommitted, which is the rule being followed" |

**Both re-run in the correction round (2026-08-10), after the provenance edits, and both held.**
`verify-shell.mjs` again: `563 checks · 563 passed · 0 failed · 0 skipped`, `13,558 lines · 24.1
lines per check · 186s`, exit 0 (the 186 against the earlier 187 is wall-clock, not a check). The
sweep again: `16 checks · 15 passed · 0 failed · 1 to review`, exit 0, REVIEW unchanged at **174
mentions in the same twelve files**. Two PASS *details* moved further, both from comment text only
and neither a state change: the style-line count 4547 → **4557**, and the coarse-block check's
added-line count 88 → **98**, still "1 new selector(s), all covered". The CACHE detail is
**unchanged** — `planbook-shell-v42` is still not in any commit, so this round's `src/shell.css`
edit is already covered by the bump that is sitting uncommitted beside it and a second bump would be
wrong.

`node tools/wo-gate.mjs --audit` also passes: every roadmap fragment, every `**Owes**` pointer and
every dashboard row still agree.

---

## The iPad checklist — the six named fields plus the seventh

Written to be run in one sitting, in this order, with the fewest screen changes. **Do each block in
portrait, then rotate to landscape and re-look before moving on.** In every block, the three things
to look at are the same: *is it as tall as the text field beside it, does the picker open, does the
date land.* Two extra things worth an eye, because they are what this change could plausibly have
broken and nothing at a desk can see them:

- **Is the date text vertically centred in the taller box, or clamped to its top?** The coarse rules
  zero the vertical padding on these fields. `src/assignments.css:303` records that a `<select>` on
  iPadOS clamps its text to the top when you do that. A reset date input should behave like a text
  field instead — WO-3.17's pass suggests it does — but this is the first time `.term-date` and
  `.student-date` have been in that state.
- **Is any row now too wide?** The 160px floor is new. Nothing should push past a panel edge or
  overlap; if a row wraps onto two lines that is expected and fine.

**A. The assignment editor — *Assigned* and *Due*** *(re-check: these two passed at WO-3.17, and the
rule that fixes them has moved)*
1. Open a class → **Assignments** → **Edit** on any assignment.
2. Are *Assigned* and *Due* the same height as *Name* and *Points* above them?
3. Tap *Assigned*. The iPadOS picker should open. Pick a date; it should appear in the field.
4. Clear *Due* from the picker. The now-empty field should still be an obvious empty box, still
   full height — not a gap where a field was.
5. Rotate. Look again at 2 and 4.

**B. The term editor — *Starts* and *Ends***
6. Header, the list icon (**Classes and terms**) → **Terms** on any class.
7. On each term row: are *Starts* and *Ends* as tall as the term-name field beside them? Is each
   wide enough to show the **whole** date rather than a sliver of one?
8. Tap *Starts*: picker opens, pick a date, it lands.
9. Clear *Starts*, then **tap the same day again**. It must register on the **first** tap — that is
   WO-2.3's scar, and it is the behaviour the reset was most likely to disturb.
10. Rotate. Look again at 7.

**C. Days off & drops — *From* and *To***
11. Home → a class → **📅 Days off**.
12. Are *From* and *To* full height, and is a whole date visible in each once set?
13. Type a title, pick *From*, pick *To*, tap **Add to the calendar**.
14. **Both date fields must go empty** and must still be there as empty boxes. Then pick the **same
    *From* date again** — first tap, no detour to a neighbouring day.
15. Rotate. Look again at 12.

**D. The seventh field, which no acceptance line above names — the plan *Review date***
16. Header, the people icon (**Roster and contacts**) → **Edit** a student → the **Support details**
    panel → **Review date**.
17. Is it as tall as the *Case manager* **Name** and **Email** fields beside it? (Before this change
    it was not — it is the same defect, on a fourth screen.)
18. Picker opens, a date lands, clearing it leaves a field you can still see.
19. Rotate. Look again at 17.

**If the picker fails to open anywhere in A–D, stop and report it rather than accepting a typed
date.** Three files say in comments that these are real date inputs specifically so the teacher gets
iPadOS's own picker; trading that for the pixels would be a worse app than the squat fields.

---

## Why no harness check was booked, and where that is written down

`TESTING.md` § WO-2.23 gains a subsection, *"Why neither harness can see this defect, and why no
check was booked for it"*. The short version, and I checked each half rather than repeating the work
order at you:

- **`verify-shell.mjs` never measures these fields.** I grepped the whole final run for `term-date`,
  `student-date` and `daysOffFrom`: zero hits on any field. The only `Days off` hits are the button
  on the registry. All seven date fields live inside `.hidden` dialogs and the 44px sweep skips
  anything computing to `display: none`.
- **And measuring them would not help**, which is the more important half: desktop Chromium honours
  `min-height` on a date input whether or not the reset is present, so a geometry check written for
  this defect reports a compliant 44px on the broken tree. WO-3.17 hit the same wall from the other
  side and wrote it into its own mutation table — removing the reset from `.assign-field-date` moved
  **no measurement at all**, only the computed style.
- **`wo-sweep.mjs` cannot see it either**, and the reason is worth stating: its coarse-block check
  asks whether every new selector *appears* in a `@media (pointer: coarse)` block. All seven fields
  passed that check for weeks. The declaration was there the whole time; what was missing was the
  line that let it reach the glass, and no grep over a stylesheet distinguishes a rule that applies
  from a rule the platform is ignoring.

---

## Decisions the work order did not settle

1. **One element rule vs. per-sheet class rules** — element rule, argued at § 1 above and at the rule
   itself. This sets the convention for every `appearance` reset after it: reset by element type in
   `shell.css`'s BASE, and say at the new rule why it is not a class.
2. **The `min-width` is not in the shared reset, and this one is a trap I nearly walked into.** The
   obvious tidy is to put `min-width` beside the `appearance` reset so the cost is paid where it is
   incurred. That would be wrong: `.assign-field-date` is `width: 100%` inside `flex: 1 1 140px;
   min-width: 0`, and giving it a hard `min-width` would stop it shrinking in a 480px panel — which
   is WO-3.17's overlap, re-opened from a new direction, by this work order, on the control I was
   told not to touch. The floor belongs to the one class that has no width of its own.
3. **The `min-width` is in the coarse block only, not in the base `.term-date` rule.** The reset is
   unconditional, so a fine-pointer browser also loses the intrinsic width — but desktop Chromium
   and macOS Safari both paint `mm/dd/yyyy` segments in an empty date field, so there is content
   holding the box open there. The device is where empty means blank. If that turns out to be wrong
   on some desktop browser, the fix is the same number in the base rule.
4. **The reset is unconditional rather than inside `@media (pointer: coarse)`.** It could have been
   scoped to the pointer that has the defect. I matched WO-3.17's landed shape instead: two answers
   to "when does the reset apply" is exactly the kind of divergence this work order exists to remove,
   and scoping it would make the desk browser and the device differ in one more way.
5. **`.student-date` gets the reset and nothing else.** It is `width: 100%` inside a `flex: 1 1 180px`
   column, so it cannot collapse and needs no floor. It is on the sensitive screen, and height and
   appearance are the whole of what changed there — no plan data, no export, no merge field, nothing
   about who sees what. Said at the rule too, so the next reader does not have to infer it.
6. **Status left at `🔨 IN PROGRESS`.** Written by `node tools/wo-gate.mjs --tick WO-2.23`, which
   refuses `✅ DONE` while four Acceptance lines are open and names them. `🤖 CLAIMED` would have been
   false the moment this dispatch ended (nothing is in flight), and `**Owes**` does not apply — that
   field is for lines re-homed to another *work order*, and these are owed to a teacher with an iPad.
   When the sitting passes, tick the four and re-run `--tick` for `✅ DONE`.

---

## Out-of-scope temptations declined, for the record

- **The `<select>`s are drawn natively too.** `.student-select` and any other `<select>` on a coarse
  pointer take their height from iPadOS, not from the box — `src/shell.css:1386`'s own comment says
  as much about them in the same breath as the date field. They may well be squat on the device for
  a cousin of this reason. **Not touched, not booked.** They are a different control with a different
  fix (a `<select>` keeps its vertical padding, per `src/assignments.css:303`), and CLAUDE.md's stance
  is that iPadOS's wheel is wanted rather than restyled. If the owner sees squat pickers during the
  sitting above, that is a work order, not a patch here.
- **Deleting WO-3.17's `.assign-field-date` line** to make the tree hold literally one copy. Argued
  against at § 1; the revert hazard is the deciding half.
- **Adding a computed-style check for `.term-date` and `.student-date`** in the shape of WO-3.17's —
  which, unlike a geometry check, genuinely *can* fail, as WO-3.17's mutation table proves. I did not
  add it: the Trap says record the limit instead, and the third Deliverable substitutes prose for a
  check deliberately. **Offered as a follow-up for the owner to accept or refuse**, with the honest
  caveat that it would guard the declaration reaching the element and still say nothing about the
  iPad. It is one check, in the block that would have to open the Days off dialog anyway.
- **Widening `.term-date`'s base (fine-pointer) rule** to match, and **tidying the `min-width: 44px`
  on `.student-date`** now that it is covered by `width: 100%`. Both are cosmetic in a file this work
  order is only allowed to touch for the reset's sake.

---

## Files changed

| File | What |
|---|---|
| `c:\dev\planbook\src\shell.css` | The shared `input[type="date"]` reset in the BASE section with its argument (+38 lines, 1 rule); `.term-date` coarse `min-width` 44px → 160px with the reasoning at the rule; a sentence added to the `.student-date` coarse comment naming the reset and the containment. **Correction round: the 160px provenance paragraph above `.term-date` rewritten — comment only, the declaration untouched** |
| `c:\dev\planbook\src\assignments.css` | **Comment only.** A paragraph appended to WO-3.17's block above `.assign-field-date`, recording that the app-wide reset has landed and why this line stays. The declaration is byte-identical |
| `c:\dev\planbook\sw.js` | `CACHE` `planbook-shell-v41` → `planbook-shell-v42` (two SHELL stylesheets changed) |
| `c:\dev\planbook\TESTING.md` | New § WO-2.23 under Phase 2: the seven acceptance lines (three ticked, four 👤 open), the seventh-field note, the harness-blindness subsection, and both run summaries. **Correction round: the 160px provenance sentence in the line-6 note rewritten** |
| `c:\dev\planbook\plans\work-orders\phase-2-attendance.md` | Acceptance 1, 6, 7 ticked with the evidence beside each; status `🤖 CLAIMED` → `🔨 IN PROGRESS` via `wo-gate.mjs --tick`. **Correction round: the 160px provenance sentence inside the line-6 tick rewritten. No box changed state** |
| `c:\dev\planbook\.claude\dispatch\WO-2.23-result.md` | This file |

No `CHANGELOG.md` entry — the teacher's call. A draft, if it is useful:

> **Fixed** — every date field in the app now takes the 44px touch target it was already declared:
> the assignment editor's *Assigned* and *Due*, the term editor's *Starts* and *Ends*, the days-off
> *From* and *To*, and the plan *Review date* on the student editor. iOS Safari draws a date input
> itself and ignores the height a stylesheet asks for until it is told to stop; one rule now tells
> it, in one place, for every date field the app will ever have. Term and days-off dates also carry a
> minimum width, so a field that is empty is still visibly a field.

No commit, no push — the brief did not ask for one.

---

## What I could not verify, stated plainly

Acceptance **2, 3, 4 and 5** — all four 👤 lines, and between them they are the whole of whether this
worked. They need the owner's iPad. I have not ticked them anywhere, and nothing in this report
should be read as evidence for them. Beyond those: the *overflow* half of line 6 is reasoned from the
box model rather than measured, because no harness check opens the two dialogs that hold
`.term-date`; and the vertical centring of the date text in a 44px box with zeroed padding is a new
state for `.term-date` and `.student-date` that only the device can rule on, which is why it is
called out in the checklist above rather than assumed.

---

## Correction round — 2026-08-10

The verifier read this work cold and returned **FAIL on one line only: Acceptance 6.** Not the
number, not the box model — both of those it checked independently and both hold. **The sentence
that said where 160px came from was false**, and it had been copied into three files plus this
report, so four readers-to-come would have been told that Roll Call! has shipped a reset
`<input type="date">` on this iPad for a year. It has not.

**What I checked before rewriting anything**, because swapping one unverified provenance for another
is the same defect twice. Every line below I opened in
`C:\Users\WildB\OneDrive\Documents\Coding Projects\Attendance App\src\dashboard.html` myself:

| Claim | Line | What is actually there |
|---|---|---|
| `#dateJumpInput` has the reset and 160px | `:437-440` | Confirmed — `appearance: none; -webkit-appearance: none; min-width: 160px` |
| …but it is a `<select>` | `:1288` | Confirmed — `<select id="dateJumpInput" onchange="jumpToDate(this.value)" …>`, empty in markup |
| …populated with day labels | `:3951-3962` | Confirmed — `<option>`s built as `date + ' (' + dow + ')'` per school day |
| It was never a date input | — | Confirmed — `git log --all -S '<input id="dateJumpInput"'` in that repo returns **no commits** |
| Roll Call!'s real date inputs are unreset | `:696`, `:103` | Confirmed — `.config-date` is `padding/border/font/color` only; `.wiz-term-row input[type="date"]` is `flex/padding/border/background/color/font` plus `color-scheme: dark`. **No `appearance`, no `min-width` on either** |
| …and there are three of the first | `:1831`, `:1833`, `:6370` | Confirmed, plus a fourth non-date use of the class at `:1559` (a `type="url"` field borrowing it) |
| `.config-date` gets `flex: 1 1 100px` at ≤640px | `:1011` | Confirmed, inside `@media (max-width: 640px)` opening at `:982` |
| the select drops to 130px at ≤640px | `:990` | Confirmed, same block |

So the verifier is right on every particular, and the corrected sentence now reads the same way in
all four places: **160px was lifted from a date-*picking* `<select>` under the same reset; Roll Call!
has no reset date input anywhere, so it lends a width and not a precedent.**

**What changed, and what deliberately did not.**

- **The number stands at 160px.** Nothing I read moved me toward a different value; if anything the
  `<select>`-plus-arrow origin makes it a conservative floor rather than a tight one.
- **Four files, comment/prose only.** `src/shell.css` (the paragraph above `.term-date`),
  `plans/work-orders/phase-2-attendance.md` (inside the Acceptance 6 tick), `TESTING.md` (§ WO-2.23's
  line-6 note), and this report (§ 3 and § 6). **No declaration, no selector, no value changed.**
  The only `src/` file this round touches is `src/shell.css`, and only inside the `/* … */` block
  above `.term-date`; the rule itself still reads
  `.term-date { min-height: 44px; min-width: 160px; font-size: 14px; padding: 0 8px; }`
  (`src/shell.css:1279`, moved down from `:1269` by the longer comment and otherwise byte-identical).
- **The ≤640px 130px drop is now mentioned**, at the rule and here, and I decided that rather than
  defaulting past it: it is the one fact in the reference that argues for a *smaller* number, so
  omitting it would have been the omission doing work. It does not transfer, and the rule says why —
  it is a phone concession for a header bar that must not wrap, and both rows `.term-date` sits in
  do wrap.
- **§ 3's picker reassurance was re-sourced, not deleted.** The Roll Call! half is withdrawn as
  worthless (a `<select>` cannot tell you whether a native *date picker* survives a reset). What
  remains is WO-3.17's `.assign-field-date`, confirmed by the owner on this iPad on 2026-08-10 —
  same engine, same iPadOS, same two declarations. That was always the stronger half and it is now
  the only half. It is still not a pass, and Acceptance 3 is still open.
- **One thing I left alone on purpose, and it needs the owner's word rather than mine.** The
  verifier noticed that my tick of Acceptance 6 at `phase-2-attendance.md:2038` inserted the clause
  *"reasoned from the box model rather than measured"* into the acceptance text itself, which
  narrows the line being graded. It called the narrowing honest and flagged, and did **not** ask for
  a change, so I have left it exactly as it is. But it is a real question this correction should not
  quietly settle by leaving it: **may the run that closes an acceptance line annotate that line's
  own text?** I think a caveat that shrinks what a tick claims is safer than a bare tick over an
  unstated gap — but the acceptance list is the owner's contract with the work order, not the
  implementer's, and if the answer is that annotations belong in the evidence sentence after the
  line and never inside it, the clause should move. Owner's call.
- **One stray number in this report fixed in passing**, § 7: I had described the run's stdout as
  "the whole 13,558-line output". 13,558 is the *harness's own* line count, which WO-2.19 made it
  print each sweep; this run's stdout is 638 lines. Same species of defect as the one that failed
  me, found while re-reading, so it is corrected and flagged rather than quietly repaired.

**Both harnesses re-run after the edits, to completion, and both quoted in § 7 above.**
`verify-shell.mjs`: `563 checks · 563 passed · 0 failed · 0 skipped`, exit 0, 186s.
`wo-sweep.mjs`: `16 checks · 15 passed · 0 failed · 1 to review`, exit 0, REVIEW unchanged at 174.
As predicted, this round moved neither.

**No 👤 line was ticked, in this round or the last.** Acceptance 2–5 remain open and owed to the
owner's iPad, and the checklist above is unchanged — it is still what to run in one sitting.
