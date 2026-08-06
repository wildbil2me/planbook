# WO-2.1 — Attendance marking screen · implementation result

**Branch** `phase/1-shell-store-roster` (stayed on it; no branch created, nothing committed).
**Harnesses** `node tools/verify-shell.mjs` → **260 checks · 260 passed · 0 failed · 0 skipped**.
`node tools/wo-sweep.mjs` → **11 checks · 10 passed · 0 failed · 1 to review** (the standing
sensitive-field-name grep, read and confirmed below).
**Status set** `🔨 IN PROGRESS`, not `✅ DONE` — acceptance line 5 is a 👤 line I cannot close. See
§ 6.

---

## 1. The audit of the draft — what I kept, what I rewrote

I read `src/attendance.js` (659 lines), `src/attendance.css` (172 lines) and every hunk of the
seven modified files line by line against the brief, `plans/rotating-schedule.md`,
`docs/data-model.md`, `CLAUDE.md` and `tools/README.md` before touching anything.

**Verdict: the app code was sound and I kept essentially all of it.** The 14 failures were an
unfinished harness edit, exactly as the addendum suspected — no app defect was behind any of
them. I rewrote parts of the harness section and fixed one real app defect the draft's own comment
claimed it had avoided.

### Kept, unchanged (and why I am satisfied it is right, not just plausible)

- **`src/attendance.js` in full.** `setMark()` deletes on `P` and never writes it; `dropClass()`
  writes exactly `{ classId, date, exception: 'dropped' }`; there is no submit, no buffer, no
  confirm anywhere in the module; `stateOf()` is the single predicate for the three states, which
  is what `plans/rotating-schedule.md` § Precedence asks for and what WO-2.3 will extend in one
  place. `todayISO()` is built from local calendar fields rather than `toISOString()` — a real
  trap, since UTC is tomorrow from ~7pm Eastern and the bug is invisible in the morning. Nothing
  in the file reads `supports`; the only mentions of plan/medical/behavior words are in the header
  comment explaining their absence (grepped, and that is the whole of the `wo-sweep` review item's
  new entries).
- **`src/attendance.css` in full, including its `@media (pointer: coarse)` block** — which the
  interrupted transcript's last line made me expect to find missing. It is there, complete, and
  the marks carry `min-width` as well as `min-height` (one-glyph buttons, the `.cls-tab` lesson).
  Colours are inline, no `var()`, no dark variant. `wo-sweep` confirms all eleven new selectors
  are inside a coarse block; `verify-shell` measures 132 controls on a 26-name marking screen with
  none under 44px in either dimension.
- **The home-card restructure** (`.class-card` from `<button>` to `<span>` container with a
  full-bleed `.class-card-open` button plus the state button). I flagged this against the brief's
  "*Fill the slot; do not restructure the card*" and decided it is correct rather than drift:
  the deliverable is "today's state per class, **each with a one-tap fix**", a control cannot nest
  inside a control, and `src/home.js`'s own WO-1.10 header predicted this exact change *by name*
  for this exact reason and drew the boundary at "this function and its stylesheet". The change
  stayed inside that boundary. The card still looks and behaves like one object. Full reasoning
  in § 5.
- **The routing through `classes.selectClass()`** for `data-attendance-open`, so the card, the tab
  and the state line are one selection with one implementation. No second answer to "which class
  is open" was introduced.
- **The read-only `window.planbook.attendance` seam.** It is used by the harness only to read;
  every acceptance claim is driven by clicking real controls.

### Rewritten

**a. The harness fixture was one class short.** The classes section deliberately leaves **five**
active classes (seven created, one deleted to prove deletion destroys records, one left archived
so the touch section has a delete confirm to measure). The attendance checks were written for
six. I reconciled by **building the fixture the checks describe** rather than by lowering the
checks: the section now creates a sixth class ("Study Hall") through the real classes-manager
control before it starts. That matters — with only five, a full day of five marked classes leaves
no untaken class at the end, and the three-state claim silently collapses to a two-state claim in
the exact check that exists to prevent that.

**b. Every claim about "what this section just wrote" now reads `today`, not `records`.** The
draft's page-side reader already exposed a date-filtered `today` array *and carried a comment
explaining why* — the checks just hadn't been moved onto it, which is what made `records[0]`
resolve to the stale 2026-09-09 fixture record. I moved them, and I did **not** delete the
residue: it is the only thing in the run that can catch a screen writing onto the wrong date, and
one check now uses it constructively (§ c). I also corrected the reader's comment, which
attributed the residue to the backup section; it comes from the class-manager delete fixture.

**c. Three checks got stronger, not weaker, in the process:**
- *"the same one tap takes that back"* now also asserts the un-take did **not** disturb that
  class's record on another date. `allPresent` is the very class the residue belongs to, so an
  un-take that removed by `classId` alone would take a real day of attendance with it and leave no
  trace on screen.
- *"a full day of five classes"* now asserts `day.records.length === start.records.length + 5` —
  the app wrote five, rather than "there are five here now".
- *"no P"* is asked of the **whole document** (absent key, and complete key set `ADET`), while the
  exact tally `{A:2,T:1,E:1,D:1}` is asked of today, where the section knows every tap it made. A
  new `todayValues` field in the reader carries that.

**d. The three-state visual comparison was measuring one property fewer than it should, and was
reading a `:hover` rule.** `tools/README.md` trap 7: the pointer was left sitting over the grid by
the last click, so the "taken" card measured a hovered border (`rgb(91,111,204)` = `#5b6fcc`, the
hover colour, in the failing run's own evidence line). I park the pointer at the corner first, and
having done so, `distinct()` now requires **four** differences — words, fill, edge colour, type
colour — instead of accepting one. Dropped is additionally the only dashed one.

**e. One real app defect, fixed.** `src/shell.js`'s `data-attendance-open` handler passed the
tapped button to `openModal()` as the focus-return opener — but `afterClassChange()` runs first
and `refreshHome()` empties and rebuilds the grid, so that node is **detached** by the time the
dialog opens. Focusing a detached node throws nothing and does nothing: focus lands on `<body>`,
so a keyboard user closing attendance is returned to the top of the page. The handler's own
comment asserted the opposite. Fixed by re-querying the live button after the redraw, and pinned
by a new check (check #260). This is the only opener in the app whose card redraws under it, which
is why it had never bitten before.

### Left alone deliberately

The `2026-09-09` fixture date in the class-manager section collides with today's date one day a
year. I did **not** change it: the neighbour record shares the victim's date on purpose, and that
is what makes "it deleted the right class, not the right date" falsifiable. Instead the attendance
section's first check now asserts *"records already on `<today>` = 0"* and prints the count, so a
run on 2026-09-09 fails loudly and legibly at the top of the section rather than producing six
confusing failures below it. Named here as a known, dated, one-day-a-year red.

---

## 2. Non-vacuity — three mutations, run and reverted

An absence check with nothing behind it goes green whatever the build does (`tools/README.md`
traps 5, 7, 8). All three absence claims were mutation-tested against the real harness:

| Mutation | Result |
|---|---|
| `setMark()` stores `P` instead of deleting | **5 checks red**, including acceptance line 7's |
| `.class-card-state.dropped` repainted in the untaken palette | three-state comparison **red** |
| `openAttendance()` handed the detached opener again | focus-return check **red**, focus on `<BODY>` |

All three reverted; the final run on the shipped tree is 260/260.

---

## 3. Against the Acceptance list, one by one

**1. A mark lands and survives a reload.** ✅ Verified. Two marks are made by clicking the real
letter buttons on two of 26 rows, `store.flush()` then `Page.reload`, and the record is read back
out of IndexedDB: `{"s_…":"A","s_…":"T"}`, two keys, on today's date, with the card behind the
dialog and the reopened screen both agreeing. (`verify-shell.mjs`, "a mark lands and survives a
reload", "and the card behind it says what the document says", "and the screen it reopens to shows
those two marks".) The 👤 half — a force-quit and relaunch on the installed iPad — is listed in
TESTING.md and is **not** closed.

**2. A dropped class and an untaken class are visually distinguishable without reading fine print,
and are distinguishable in the stored document.** ✅ Verified as far as a desk can. *Document
half:* a dropped class holds `keys = classId,date,exception` with no `marks` key; an untaken class
holds no record at all; `stateOf()` reports `dropped` vs `not-taken`. *Screen half:* computed
styles, pointer parked, three cards side by side — dropped `#fff` / `#d0d8e4` **dashed** /
`#6b7a8d` "Didn't meet", untaken `#fff8e6` / `#f0dfa8` solid / `#8a6d1a` "Not taken yet", taken
`#eafaf1` / `#a3e4bc` solid / `#27ae60` "Taken · all present" — four independent differences, not
one. **What I cannot verify: that it reads as distinct across a lit classroom at arm's length.**
That is eyes on hardware and it is on TESTING.md's 👤 list.

**3. Marking a class taken with zero exceptions still creates a record.** ✅ Verified. One tap on
"Everyone's here" writes `{classId, date, marks:{}}` — `keys = classId,date,marks`,
`exception === undefined`, `marks` an empty object — the state line reads "Taken · all present",
`stateOf()` says `taken`, and it is one more record than before the tap. The same run asserts a
never-touched class is still `not-taken` with no record at all, which is the distinction this line
exists for.

**4. One tap drops a class; one tap undoes it.** ✅ Verified. One click on "Didn't meet" writes
exactly `{classId, date, exception:"dropped"}` — three keys, nothing else, today's date — the
student list drops to 0 rows and the note explains what that means. One click on "The class met
after all" removes the record entirely, leaving `not-taken` (not `taken`), with the card behind
the dialog updated.

**5. Taking attendance for a class of 25 with two absences takes under 15 seconds on an iPad.**
❌ **Not verified, and I did not tick it.** It needs a real iPad and a stopwatch and I have
neither. What the desk half measures, and all it measures: the path is two taps from the home
screen (state line → letter → letter) with nothing to submit; there is no form and no control
whose label reads as a commit; 132 controls on a 26-name marking screen all clear 44px under a
genuinely coarse pointer (asserted `matchMedia('(pointer: coarse)')` first); and no row spills out
of the panel. **None of that is the acceptance line.** It stays open in TESTING.md with a 👤.

**6. All five marks are reachable without a submenu.** ✅ Verified. Every one of 26 rows renders
`codes === "PTAED"` — five buttons, always on screen, exactly one pressed (`aria-pressed`), all
five carrying an accessible name — and zero submenu-shaped controls (`select`, `[aria-expanded]`,
`details`) anywhere in the list.

**7. The document after a full day of five classes contains no `P` entries.** ✅ Verified, after a
reload. Five records on today's date across five classes — four met (one with 4 marks, two with
none, one with 1 absence) and one dropped — plus a sixth class still reading "Not taken yet". Mark
values written today are exactly `{A:2,T:1,E:1,D:1}`; every value stored **anywhere in the
document**, on any date, keys to exactly `ADET`. Five stored marks in total across a 26 + 3 student
day where five students were exceptions and the rest were present — which is the trap: a build
storing `P` would hold 29 here. Mutation-proved (§ 2).

**Traps, both:** `P` deletes and never writes (`setMark()`, and five checks fall over if that
changes). There is no submit step — asserted structurally, as zero `<form>`s in the dialog and
zero controls labelled save/submit/finalise/apply/done/ok, with the dialog's actual controls
printed in the same evidence line so the absence is not a claim about an empty set.

---

## 4. Files changed

Kept from the draft, unmodified by me:
- `c:\dev\planbook\src\attendance.js` *(new, untracked)*
- `c:\dev\planbook\src\attendance.css` *(new, untracked)*
- `c:\dev\planbook\index.html`
- `c:\dev\planbook\src\home.js`
- `c:\dev\planbook\src\home.css`
- `c:\dev\planbook\src\roster.js`
- `c:\dev\planbook\sw.js` *(precache list + `CACHE` bumped to `planbook-shell-v15`; v15 has never
  been deployed, so my later `shell.js` edit needs no further bump)*

Changed by me this round:
- `c:\dev\planbook\src\shell.js` — the focus-return fix in the `data-attendance-open` handler, and
  its comment rewritten to say what the code actually does. Everything else in this file is the
  draft's.
- `c:\dev\planbook\tools\verify-shell.mjs` — the sixth-class fixture, the `today`-scoped reads,
  `todayValues`, the parked pointer, the strengthened `distinct()`, the three strengthened
  assertions, the new focus-return check, and corrected comments.
- `c:\dev\planbook\TESTING.md` — WO-2.1's seven acceptance lines under Phase 2, the desk-pass and
  mutation notes, a seven-item 👤 iPad list, and a standing-checks note recording that the
  touch-target 👤 line is **owed again** for this phase and was not thumbed.
- `c:\dev\planbook\plans\work-orders\phase-2-attendance.md` — status `🔨 IN PROGRESS`, six
  acceptance boxes ticked, line 5 left blank and marked 👤 with what the desk half did cover.
- `c:\dev\planbook\tools\README.md` — the check-count line, **measured**: 260 at WO-2.1, with what
  the 29 new checks are and which three were mutation-proved.

Not touched, by rule: `CHANGELOG.md` (draft entry offered in § 7), `plans/ROADMAP.md` (see § 6).

---

## 5. Decisions the work order did not settle, and which way I went

1. **Status: `🔨 IN PROGRESS`, not `✅ DONE`.** `node tools/wo-gate.mjs --tick WO-2.1` would flip
   the status, tick four roadmap boxes and move the dashboard to 13/55 — I ran it `--dry-run` and
   read the diff, then did not apply it. One acceptance line is unverified and
   `plans/work-orders/README.md` says not to tick a work order that is unverified. The tick is one
   command after the iPad sitting; I would rather leave it than overclaim.
2. **The home card became a container.** Taken from the draft, and I actively decided to keep it
   against the brief's "do not restructure the card". A one-tap fix on the state line requires a
   control there; `<button>`'s content model is phrasing content, so nesting is invalid markup that
   merely happens to render. `src/home.js`'s WO-1.10 header pre-authorised exactly this and drew
   the boundary at "this function and its stylesheet", which is where it stayed. I read "do not
   restructure the card" as "do not rebuild the grid or the card's visual shape" — neither
   changed. If the verifier reads it the other way, this is the line to challenge.
3. **A sixth class in the fixture instead of adapting the checks to five.** Argued in § 1a. The
   alternative — un-archiving the class the classes section leaves archived, then re-archiving —
   was rejected because it borrows another section's fixture and hands it back, which fails
   silently if anything in between returns early.
4. **The fixture residue stays, with a loud precondition instead of a cleanup.** Argued in § 1
   "Left alone deliberately".
5. **`distinct()` got stricter.** Strengthening a check is not in the brief's remit either way; I
   judged that a comparison satisfied by one differing property does not evidence "without reading
   fine print", and the parked pointer is what made the fourth property trustworthy.

---

## 6. What I could not verify, and what is left undone

- **Acceptance line 5** — 15 seconds on a real iPad. Blank, and blank in both `TESTING.md` and the
  work-order file. Not ticked, not implied.
- **The standing touch-target 👤 line** was already `[x]` from WO-1.2–WO-1.10. I left the box as
  it was — unticking it would erase sittings that did happen — and added a dated note saying
  plainly that **WO-2.1's controls have not been thumbed**, with the list of what needs thumbing
  under Phase 2. This is the largest set of new controls any work order has added (five per
  student). It is the single biggest hardware risk in this work order after line 5.
- **VoiceOver, offline launch from the precache, and readability across a room** — all on the 👤
  list, none attempted.
- **`plans/ROADMAP.md`** — four Phase 2 boxes are closable by desk evidence and I left all four
  unticked, because they ride along with the same `--tick` command as the status flip and I did
  not want to split the maintenance protocol across two moments.
- **The `wo-sweep` review item** — I did read it rather than pass it through. The new mentions are
  `src/attendance.js` lines 82–92 and `src/home.js`'s equivalent paragraph, both prose explaining
  that no support data reaches these screens. Grepped: `attendance.js` contains no
  `addEventListener`, no `localStorage`, no `innerHTML`, and reads only `id`, `first` and `last`
  off a student.

**Out-of-scope temptations I declined**, noted here rather than acted on:
- A per-class attendance percentage on the card would have been four lines given `countsFor()`.
  That is WO-2.4 and it stays there.
- The screen refuses a date other than today by construction — every function takes `date` as a
  parameter so WO-2.2 threads one through rather than rewriting them. I did not add the control.
- `dropClass()` clears marks already on the record (the draft's chosen cost, argued in its header,
  announced to the teacher when it happens). A "keep the marks alongside the exception" shape would
  put something in the document that `docs/data-model.md` does not describe. Left as the draft had
  it.
- The marking list sorts by surname while the roster screen renders in paste order. The draft
  decided this and `src/roster.js`'s header explicitly hands the decision to this work order. I
  kept it; it is a real judgment call and a verifier may want to look at it.

---

## 7. Draft `CHANGELOG.md` entry — for the teacher to accept, edit or bin

> **Attendance.** The day loads showing every class in one of three states — taken, didn't meet,
> not taken yet — and the third is not the second. Tap a class's state line to mark it: present is
> the default and is never stored, so you tap only the tardies, absences, events and dismissals. A
> class of twenty-five with two absences is two entries. One tap says a class didn't meet; one tap
> takes that back. Nothing is submitted — every tap is saved as you make it, because the phone
> rings mid-period.
