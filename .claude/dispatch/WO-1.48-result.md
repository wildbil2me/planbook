# WO-1.48 — a date field cannot tell mid-typing from cleared, and the app infers it anyway · result

**Route** Claude (work-order-implementer), Opus · **Delivered** 2026-09-06
**Status written into the tracker** Acceptance lines 1, 2, 3 and 6 ticked; 4, 5 (both 👤) and 7 left
open. The row is still `🤖 CLAIMED` — I did not run `--handoff` or `--tick`; the orchestrator owns
both.

---

## Against the Acceptance list, line by line

### 1. Each of the ten date fields carries a Clear — ✅ **MET**

Ten buttons on five surfaces: **2** in the assignment editor and **2** in the term editor, built by
`dateField()` in `src/assignments.js` and `src/classes.js`; **6** static in `index.html` —
`supportsReviewDate`, `daysOffFrom`, `daysOffTo`, `eventFrom`, `eventTo`, `eventUntil`. 2 + 2 + 1 +
2 + 3 = ten, which is the enumeration the work order's corrected Traps bullet gives.

**Evidence:** `tools/verify/date-clear.mjs`, a new harness section that walks all five surfaces.
Quoting the run (`vs2.log`, 2026-09-06):

```
PASS | ten Clear buttons across the five surfaces, each inside a wrapper holding exactly one date input
       :: assignment editor 2, term editor 2, supports panel 1, days off 2, events 3 = 10 ::
       of the 10 in the document with the dialogs shut, wrappers holding other than one date input: []
PASS | the assignment editor's Clear empties the field, writes the empty date, and leaves a live element
       :: field "" (drawn = true, a new element = true, same button = true), document due = "", assigned = "2026-11-16"
PASS | the term editor's Clear …    :: document start = "", end = "2026-11-20"
PASS | the review date's Clear …    :: document = "", panel revealed = true
PASS | the days-off form's Clear …  :: To = "2026-11-16", doc.events 0 -> 0
PASS | the events form's Clear …    :: doc.events 0 -> 0
```

The census is **one check, not five per-surface ones**, deliberately: five green surfaces say nothing
about a sixth, and the work order's own Traps bullet is a record of what a hand-counted number does.
Five Clears are **pressed**, one per surface, chosen so the three that write to the year document and
the two that must not are both exercised — the two forms assert `doc.events` is unmoved, since a
Clear that wrote there would be authoring a calendar exception out of a teacher changing her mind.

Each read also asserts the field is a **new element** (an expando-property witness, which a
`cloneNode` rebuild drops and an *attribute* witness would wrongly survive — `date-zero-key.mjs`
predicts that trap from the other side) and that the **Clear button is the same element**. The second
half is what "leaves a live element in the panel" is really worth: the reset replaces the INPUT and
never the wrapper, or the control under the teacher's finger is destroyed under the tap and focus
goes to `<body>`, which is the WO-1.47 symptom wearing new clothes.

### 2. No code path rebuilds a date field from an empty value — ✅ **MET**

`document.addEventListener('focusout', …)` is gone from `src/shell.js` (11 document-level listeners
now, down from 12). The five `*DateBlurred()` functions are renamed `*DateCleared()` and are reached
from exactly one place: `clearDateField()` in `src/shell.js`, the body of the `[data-date-clear]`
click route.

**Asserted structurally**, in the § 17 shape the line asks for: **`tools/wo-sweep.mjs` § 23**, four
clauses in one check.

1. No `addEventListener('focusout'` anywhere in `src/` **code**.
2. No `*DateBlurred`/`dateBlurred` name anywhere in `src/`, **in code or in prose** — a comment
   pointing at a deleted function is the exact defect WO-1.47 failed verification for.
3. Five exported `*DateCleared` functions, one per owning module, each called from exactly one place,
   and that place inside `clearDateField()`'s brace-bounded body.
4. The `closest('[data-date-clear]')` route present — without which clauses 1–3 are all satisfied by
   an app that deleted the reset outright, which WO-1.47's Traps line forbids in as many words.

Green reads: *"no `focusout` listener and no `*DateBlurred` name anywhere in src/; 5 `*DateCleared`
function(s) … each called from exactly one place — inside clearDateField() at
src/shell.js:1698-1713."*

**Mutation-proved, four ways, each reverted immediately and before any prose was written.** All four
were made in a scratch-backup/restore loop (never `git checkout`, per the standing note about
clobbering unstaged work), and `grep -rn MUTATION` over `src/`, `index.html`, `sw.js` and the touched
`tools/` files returns nothing but pre-existing prose in `tools/README.md`, `keys-legend-guards.mjs`
and one unrelated comment at `src/shell.js:819`.

| Mutation | § 23 said |
|---|---|
| a `focusout` listener appended to `src/shell.js` | RED, naming `src/shell.js:3990` |
| `dateCleared` → `dateBlurred` in `src/days-off.js` | RED twice — the stale name, *and* four functions where five are wanted |
| a second `daysOff.dateCleared()` call in the `change` listener | RED, naming it as outside `clearDateField()` |
| `closest('[data-date-clear]')` deleted | RED — "the ten Clear buttons are routed by nothing" |

`tools/README.md`'s recorded sweep count moved **40 → 41** in the same edit, per the Traps line.

### 3. WO-1.47's three Acceptance drives still pass unchanged — ✅ **MET**

`tools/verify/date-zero-key.mjs`'s first three checks are byte-unchanged and green: one `0` into the
month leaves the same element with the caret in it and the date complete after the `9`; `09032026`
leaves `2026-09-03`; `10032026` leaves `2026-10-03`.

**Two checks elsewhere were re-cut, and I want to be explicit that this is a change of subject and
not a relaxation:**

- `date-zero-key.mjs`'s **fourth** check asserted the WO-1.47 move — survive the empty `change`, *be
  replaced* on `focusout`. Its second clause is exactly what this row removes. It now asserts that an
  empty value replaces the element on **neither** event, both clauses failing in the same direction.
- `classes-terms.mjs`'s cleared-term-date pair went red on the first run (`{"rebuilt":false,…,
  "label":"StartsClear"}`) — correctly, both halves. It is now **three** clauses: the empty `change`
  does not throw the field away; **leaving** it does not either; and pressing the field's own Clear
  **does** replace it. Its `label` read moved from the wrapper's whole `textContent` to the caption
  element, because the wrapper now holds the Clear's own word too.

That block has now been re-cut by two consecutive work orders and both times the check was right and
its premise had moved under it. Written up in `tools/README.md` beside the count.

### 4. 👤 On the iPad: clear a date and tap the same day again without leaving the field — ⬜ **NOT MET, and not mine to meet**

Needs a real iPad after a force-quit from the app switcher. I have neither. Headless Chromium cannot
reproduce the iPadOS popover's stale selection — the whole reason the reset exists — so every harness
check above measures the **mechanism** (a fresh element, wired to the same term and field) and none
of them measures the **symptom**. `TESTING.md` § WO-1.47 records the pre-change reading of this exact
sequence as failing, on 2026-09-06, so the before-picture exists.

### 5. 👤 Every one of the ten Clears is reachable under a thumb at 44px — ⬜ **NOT MET, and not mine to meet**

What a machine can say is measured and is stated as less than the line asks:

- `tools/verify/touch-targets.mjs` already opens the term editor, the student editor's support panel,
  the days-off panel and the events panel on an emulated coarse pointer and measures every `button`
  in each — so **eight** of the ten arrived covered on the day they were added.
- `tools/verify/date-clear.mjs` measures the assignment editor's **two**, which that sweep does not
  reach: `boxes = [{"w":58.63,"h":44,"spill":false},{"w":58.63,"h":44,"spill":false}]`.

All ten wear `.class-action-btn`, whose 44px floor is already in `src/shell.css`'s
`@media (pointer: coarse)` block, and `.date-clear` is named there too (per that sheet's rule that
every control appears in the coarse block by its own name). **None of that is a thumb**, and none of
it is portrait. The row worth looking at first is the events form's *Repeat weekly until*: it is the
widest caption of the ten, and at 390px the caption + a 160px field + a 44px button do not fit one
line, so I gave `.term-date-field` `flex-wrap: wrap` and the button drops to a line of its own. That
wrap is a layout decision a person should approve on glass.

### 6. Both harnesses and `--audit` green on a clean tree — ✅ **MET**

Run on the delivered tree, 2026-09-06, each command run to completion and quoted from its own output:

```
node tools/verify-shell.mjs
1299 checks · 1299 passed · 0 failed · 0 skipped
40,199 lines · 30.9 lines per check · 443s        EXIT=0

node tools/wo-sweep.mjs
41 checks · 38 passed · 0 failed · 3 to review    exit 0

node tools/wo-gate.mjs --audit
PASS | every fragment matches exactly one roadmap box … EXIT=0
```

The three REVIEW lines are the three standing ones (sensitive field names outside `src/backup.js`,
due-date/late-missing on one line, the mockup-banner disagreement); none is this work order's and
none moved.

**The first run of the changed tree was `1298 checks · 1297 passed · 1 failed`** — the one red line
was `classes-terms.mjs`'s cleared-term-date check, described under line 3. I re-cut it and re-ran;
the second run is the one quoted. I am naming the first run rather than only the second because the
red line is the evidence that the check had teeth.

### 7. `TESTING.md` § WO-1.48 and a `CHANGELOG.md` entry — ◐ **HALF MET, box left open**

`TESTING.md` § WO-1.48 is written, with the runs, the two re-cut checks, the two 👤 lines unticked,
and an explicit paragraph on what the harness does *not* prove. The `CHANGELOG.md` entry is prose
about what the change **means** and is the teacher's to write (`AGENTS.md` § "If you were dispatched
with a work order"), so the box stays `[ ]`. Draft below.

---

## Draft `CHANGELOG.md` entry — for the teacher to accept, edit or discard

> ### Every date field has a Clear
>
> Assignment dates, term dates, the plan review date, the days-off range and the three dates on the
> calendar-events form each have a **Clear** button beside them. Tapping it empties the field, and on
> the iPad the date picker forgets what it was holding — so the day you just cleared can be picked
> again on the first tap, instead of needing a detour through a neighbouring day that writes a date
> you never wanted.
>
> Underneath, this removes a guess. A date field reports "empty" both while you are still typing a
> date and when you have deliberately cleared one, and it never says which. Every earlier version of
> this had to guess — and last week's guess is what emptied a due date the moment you typed a leading
> zero. Nothing guesses now: the button is you saying which one you meant.

---

## Files changed

Modified:

- `c:\dev\planbook\index.html` — six static date fields rewrapped as `<div … data-date-field>` with a
  Clear button each.
- `c:\dev\planbook\src\assignments.js` — `dateInput()` split out of `dateField()`; the Clear built;
  `assignmentDateBlurred()` → `assignmentDateCleared()`, now writing, rebuilding and re-rendering.
- `c:\dev\planbook\src\classes.js` — same split and Clear; `termDateBlurred()` → `termDateCleared()`,
  which carries the long version of the reasoning for all ten fields.
- `c:\dev\planbook\src\roster.js` — `supportDateBlurred()` → `supportDateCleared()`, which now also
  does the write and the support-dot refresh.
- `c:\dev\planbook\src\days-off.js` — `dateBlurred()` → `dateCleared()`.
- `c:\dev\planbook\src\events.js` — `dateBlurred()` → `dateCleared()`.
- `c:\dev\planbook\src\shell.js` — the `focusout` listener deleted (a paragraph left in its place
  saying so); `clearDateField()` added; the `[data-date-clear]` route added high in the click
  listener; five census entries rewritten and two new ones added; both "two listeners" paragraphs
  rewritten.
- `c:\dev\planbook\src\shell.css` — new § *THE CLEAR BESIDE A DATE FIELD*, `.date-clear`,
  `.term-date-field` gains `flex-wrap`, and both get coarse-block rules.
- `c:\dev\planbook\sw.js` — `CACHE` v108 → v109.
- `c:\dev\planbook\tools\wo-sweep.mjs` — § 23 (new).
- `c:\dev\planbook\tools\verify-shell.mjs` — imports and runs the new section.
- `c:\dev\planbook\tools\verify\date-zero-key.mjs` — fourth check re-cut.
- `c:\dev\planbook\tools\verify\classes-terms.mjs` — cleared-term-date pair re-cut into three.
- `c:\dev\planbook\tools\verify\assigned-and-due.mjs` — a stale comment about `assignmentDateBlurred`.
- `c:\dev\planbook\tools\README.md` — 40 → 41 sweep checks, 1278 → 1288 call sites, sixty-six →
  sixty-seven section files, and a WO-1.48 paragraph.
- `c:\dev\planbook\TESTING.md` — § WO-1.48.
- `c:\dev\planbook\plans\known-bugs.md` — § 1's pointer sentence and a WO-1.48 paragraph; **the
  measurement and its pre-move line numbers are untouched.**
- `c:\dev\planbook\plans\work-orders\phase-1-shell-store-roster.md` — four Acceptance boxes ticked.

Added:

- `c:\dev\planbook\tools\verify\date-clear.mjs`

---

## Decisions the work order did not settle, and which way I went

**1. The wrapper stops being a `<label>`, at all ten fields.** A `<button>` is a *labelable* element,
so a second one inside a `<label>` that already wraps an input is invalid HTML and makes the label's
own "which control am I for" question ambiguous. Every one of these inputs already carries its own
`aria-label`, so the accessible name never came from the caption — nothing is lost but a
click-the-caption-to-focus behaviour that a 44px date input does not need. Noted at the roster's
markup and in both `dateField()`s.

**2. The button is `.class-action-btn` + a `.date-clear` placement modifier, and says the word
`Clear`.** The work order is right that there is nothing to lift from Roll Call! — it has the same
`config-date` fields with no clear affordance at all — so I said so at the point of departure
(`src/shell.css` § *THE CLEAR BESIDE A DATE FIELD*). But "new visual language" is about **placement**,
not about inventing a button: reusing the app's own outline button means the palette, the radius, the
weight, the hover and the 44px coarse floor are all decisions already made and tuned, and the small ✕
the Traps line warns about is answered by not drawing one. A glyph would also have needed an
`aria-label` naming the field — which on the supports panel is *more* words about accommodation data,
not fewer.

**3. Placement follows the field wrapper's own `flex-direction`,** so there is no per-surface rule:
beside the field on `.term-date-field` (a row), under it on `.assign-field` and `.student-field`
(columns). This is the Traps line about five unlike surfaces answered by not imposing one layout on
the other — and it is what keeps `assigned-and-due.mjs`'s 390px geometry assertions (`gap >= 11.5`,
`sameRow`, no spill) measuring what they were written to measure.

**4. § 23 sits *above* § 22 in `wo-sweep.mjs` although it is numbered after it.** § 22 must be the
last thing that pushes a result or its census reads its own position rather than the total, and it
says so at its own head. Renumbering § 22 was the alternative and I refused it: that number is quoted
in `tools/README.md`, in this work order's own Traps line and inside § 22's prose — four things to
keep in step to put two banners in ascending order. The ordering is explained at § 23's head.

**5. The `focusout` deletion leaves a paragraph behind.** The next reader to meet an iPadOS
date-picker report will look for a listener at that seam, and finding nothing would read like nothing
was ever done. The paragraph says where the reset went and why.

---

## What I did not do, and why

- **Nothing was mutation-proved in `date-clear.mjs`.** § 23 asserts an *absence* and could pass over
  an empty grep, so it got four mutations. The eight harness checks each print a real transition —
  `"2026-11-16"` → `""` on five surfaces, and a census computed from live counts taken with each
  dialog open — so a vacuous pass would have to print a value that is not there. Stated in
  `TESTING.md` rather than assumed. If the verifier wants one anyway, deleting `eventUntil`'s Clear
  from `index.html` should turn the census red at 9.
- **I did not repair `src/shell.js`'s "Three other document-level listeners" census.** The brief takes
  it out of scope; WO-1.49 owns it and expects this delete to move its numbers, which it now has —
  there are **11** `document.addEventListener` calls in that file, down from 12.
- **I did not edit `TESTING.md` § WO-1.47.** It names `termDateBlurred()` and its four siblings, which
  no longer exist. It is a record of readings taken on 2026-09-03 and 2026-09-06 and I left it whole,
  the way `known-bugs.md` § 1 keeps its pre-move line numbers. § WO-1.48 says the names moved.
- **I did not strike `plans/known-bugs.md` § 1.** Its own paragraph says it closes when WO-1.48 ticks,
  and two 👤 lines are open — including the one that reads the failing case as passing. I added a
  paragraph saying what this row did and repaired the *pointer* sentence naming the five functions
  (a live pointer, not a measurement); the measurement, the report and the pre-move line-number table
  are untouched.
- **I did not `git commit`, `git push`, `--tick` or `--handoff`.**

---

## Out-of-scope temptations I declined

- **`src/days-off.js` and `src/events.js` each hand-build a replacement `<input>` field by field**
  (className, id, aria-label, one data hook). A `cloneNode(true)` is shorter and cannot drift out of
  step with the markup the way a hand-copied attribute list can — and `src/roster.js` already clones.
  Three near-identical `rebuildDateField`-shaped functions across three modules is a real
  consolidation, but it touches `clearDates()` on both forms, which is a *different* path (a
  successful add), and this row's Out of scope is the Clear. **Worth a Size S row** if anyone is
  already in those files.
- **`fieldWrap(labelText, wide, tag)` now takes a third parameter used by exactly one caller.** The
  tidier shape is a separate `dateFieldWrap()`; I kept the parameter because the two wraps are
  otherwise identical and a second function would be the thing that drifts. Noted here rather than
  acted on.
- **`design/mockups/README.md`'s open question 5** — the four field layouts (`.assign-field`,
  `.term-date-field`, `.student-field`, and the roster's) that a shared field component would collapse
  — is now a five-way question, since every one of them has a Clear in it. Still open, still not this
  row's.

---

## For the verifier

The two 👤 lines are the whole of what is left, plus the `CHANGELOG.md` half of line 7. Everything
ticked is quoted above from output I read; the harness figures are from a run that exited 0 while I
waited for it, not from a prediction. Nothing in the tree is armed: `grep -rn MUTATION` over `src/`,
`index.html`, `sw.js` and the touched `tools/` files returns only pre-existing prose.
