# WO-1.7 — Roster & contacts · implementation result

**Route** Claude (work-order-implementer), resumed after a host crash killed the first implementer
mid-run. **Both harnesses green:** `verify-shell.mjs` 162/162 (was 130, one of which failed),
`wo-sweep.mjs` 8 PASS / 0 FAIL / 2 REVIEW, both exiting 0.

---

## Audit of the crashed draft

**I kept all of it. I rewrote none of it. Not one line of `src/roster.js`, `src/teacher.js`,
`index.html`, `src/shell.js`, `src/classes.js` or `sw.js` was changed by this round.** The only
files I touched are `src/shell.css` (two lines added inside the coarse block),
`tools/verify-shell.mjs` and `tools/README.md`.

That is a verdict, not a shrug, and here is the basis for it.

### What I read, and against what

`src/roster.js` (1279 lines) and `src/teacher.js` (106 lines) in full; `git diff` on all five
modified files in full; then each against the work order's Deliverables, the **Out of scope** line,
the Traps paragraph, and the constraints block. Cross-checked against `docs/data-model.md`
(§ students, § teacher), `src/store.js`, `src/backup.js`, `src/modal.js`, `src/classes.js`, and
`src/README.md`.

### Deliverables, line by line

| Deliverable | Where | Verdict |
|---|---|---|
| Paste box, `Last, First`, tolerant of `First Last` / whitespace / tabs / trailing blank | `roster.js:209-277`, `roster.js:1119-1158` | present, and now measured — see the fixture below |
| Preview before commit, saying how many will be added | `roster.js:1079-1117` | present, and it counts in **four** categories rather than one number |
| Student fields: first, last, nickname, gradYear, email, notes | `roster.js:297-309` | exactly the schema in `docs/data-model.md:71-78`, `supports` deliberately absent |
| Guardians (repeatable): name, relation, email, phone, language, preferred | `roster.js:314-316, 557-631` | exact match to `data-model.md:74-75` |
| Counselor: name, email | `roster.js:306`, `index.html` student modal | exact match |
| Add / edit / remove / move between classes | `roster.js:466-528, 782-797` | present; move is two taps on the class toggles |
| A student belongs to the document; classes hold id lists | `roster.js:11-18` header, and structurally throughout | **honored structurally, not by de-duplication** — verified by mutation, below |
| Teacher settings: name, school, email, adminEmail, defaultCc | `teacher.js` entire | exact match to `data-model.md:46-47` |

### Out of scope — checked hard, and clean

`supports` / accommodations: **the draft did not begin building it.** `newStudent()` at
`roster.js:297` carries a comment saying so explicitly ("The fields WO-1.8 owns are not here and
are **not stubbed**"), and neither new file contains the string `supports`, `accommodation`,
`medical`, `IEP`, `504` or `behaviorPlan` anywhere — comment or code. I confirmed this by grep on
both new files (zero hits) and by `git diff` on the three modified files that do mention them (zero
**added** lines matching). **No drift to remove.**

I then made that structural rather than trusted: a new check enumerates the exact key set a student
record carries after the editor has written every field it owns, and goes red if a `supports` stub
appears (`verify-shell.mjs`, "the record carries only the fields this work order owns — no supports
stub").

Roll Call! importer (WO-2.7): no trace. Correct.

### Traps paragraph — the draft over-delivers, and that is the right call

The work order asks for the split to be *shown* in the preview. The draft gives every line two
**editable** fields with the guess in them, a per-row `⇄` swap, a whole-list swap, an amber flag on
any row where the split was a guess, and a re-settle on every keystroke so correcting a name
re-answers "is this person already here?". `roster.js:20-43` argues each of those. This is more than
was asked; it is the same thing that was asked, done properly, and I left it alone.

### Constraints block

- No `package.json`, no dependency, no framework, no bundler. Confirmed by `wo-sweep` check 1.
- Colors inline, no CSS variables, no dark mode. Confirmed by `wo-sweep` checks 2-3 and by
  `verify-shell`'s runtime `var()` walk.
- 44px: see § "The ten selectors" below.
- `localStorage` prefix `planbook_`, UI preferences only: neither new module imports `prefs.js` at
  all. `teacher.js:19-23` explains at length why the teacher's name goes in the *document* and not
  in a preference. I added a check that reads the whole of `localStorage` out of the browser and
  fails if a student name, nickname, guardian address, counselor address, teacher name or school
  appears in it, or if any key lacks the `planbook_` prefix.
- No merge field / log / print / export emits sensitive data: nothing here emits anything.
- `late`/`missing`, category weights, three attendance states: not in this work order's surface.

### Things I noticed and deliberately did not change

1. **`commitPaste` with no class open and a `link` row silently does nothing.** `roster.js:1257-1262`
   — the link branch is gated on `cls`, so pasting a name that is already in the year while no class
   is open adds nothing and the announcement says "Added 0 students". This is not data loss (the
   student already exists) and there is no class to put them on, so the behavior is defensible. It
   is an odd sentence to hear, though. Named here, not fixed.
2. **`src/README.md` has no module table**, so there is nothing to add `roster.js` / `teacher.js` to.
   Its only mention of `roster.js` is as an example of good file naming (line 27).
3. **`shell.js:467-473` says `parseRosterLine()` is exported "for that reason and for no other"** —
   harness reading. My checks deliberately do **not** call it (a check that asked the parser what it
   thought of a line would agree with itself while the paste box wrote something else); they type
   into the real box and read the real fields. The export is still used as the seam probe
   (`typeof window.planbook.roster.parseRosterLine === 'function'`), so the comment is approximately
   true and I left it.

---

## The five Acceptance lines

Every one is now driven end-to-end through the real controls in headless Edge over CDP, in a new
`--- roster & contacts ---` section of `tools/verify-shell.mjs` (28 checks), plus 4 more in the
coarse-pointer section. **And every one was falsified**: I broke `src/roster.js` five times, one
acceptance line at a time, ran the full harness each time, and confirmed the named check goes red —
then restored the file byte-for-byte (the mutation script verified the restore). Full falsification
table at the bottom.

### 1. Pasting 25 names produces 25 students with names split correctly, and the preview matched — **MET**

The fixture is 26 lines: `Last, First`; `Last , First` with stray whitespace both sides; two
tab-separated spreadsheet columns; a double tab; `First Last` with nothing to read the split from;
a particle surname (`Jonas Van Der Berg` → *Van Der Berg, Jonas*); the short-particle case the code
comments name (`Anh Le` → *Le, Anh*); a suffix leading (`Delgado, Robert, Jr.`) and trailing
(`Robert Smith Jr`); a two-word first name; accented and apostrophed surnames; a name carrying
`<b>` markup; and the column heading a copied spreadsheet range brings with it. Blank lines mid-list
and two at the end. **The expected split is written out beside each line rather than computed**, so
the check cannot agree with a broken parser.

Four checks: all 26 rows preview with the expected split; blank lines dropped and the heading
ticked off with its reason; the count line reads exactly `25 new students — out of 26 lines.` and
the button `Add 25 students`; and after commit the document holds 25 more students whose
`[last, first]` array is **identical to the array read out of the preview fields** — that is what
"the preview matched" is asserted as. A fifth check confirms `Bo <b>x</b>, Mae` is still those
characters and zero elements were injected into the list.

### 2. Re-pasting the same list warns about duplicates rather than silently doubling the roster — **MET**

The identical 26-line text is pasted a second time into the same class. Every row comes back
`Skip`, amber, noted *"Already in this class — tick only to add a second student with this name"*;
the count line reads `0 new students · 25 names already in this class, skipped — out of 26 lines.`;
the Add control is **disabled** and says `Nothing to add`. The check then clicks it anyway — a
disabled button fires no click, which is the same gesture a teacher who did not read the count line
makes — and asserts the year still holds the same number of students and the roster is still 27.

### 3. A student added to two classes is one student record with one set of contacts — **MET**

A student is given a nickname, grad year, email, counselor name+email and a full guardian (name,
relation, email, phone, language, preferred) through the real fields, then put into a second class
from the editor's class toggles. Asserted: she is in 2 classes; the year's student count did not
move; exactly one record carries that name; one guardian; the counselor address is there. Then the
roster of the *other* class is opened and her row is asserted to carry **the same id**, the same
rendered name and nickname, and an `also in …` note.

### 4. Removing a student from a class does not delete the student from the other class — **MET**

She is removed from the second class through the row's Remove control. Asserted: off that roster;
still in the document; still in exactly one class; contacts (student email, guardian email,
counselor email) untouched. Then the first class's roster is reopened and asserted to hold all 27,
in pasted order, byte-identical to before.

A second arc covers the remove-vs-delete distinction that makes this true: a student removed from
her *only* class lands in "Not in any class" with **Add** and **Delete** and no Remove, while every
row inside a class has **Remove** and no Delete; the delete confirm names her and counts
`2 contacts — guardian and counselor details`; cancelling moves neither the student count nor `rev`;
confirming destroys exactly one record and leaves the other 26 alone.

### 5. Guardian, counselor, and student emails round-trip through save and reload — **MET**

`store.flush()`, then a real `Page.reload`, then boot, then re-read from IndexedDB: student email,
guardian name / relation / email / phone / language / preferred, counselor name and email, nickname
and grad year all come back. The whole 27-name roster comes back in pasted order, and so do the
teacher's five details. A further check builds the real backup file and asserts all three addresses
and the teacher's address are in it — the half of "round trip" a reload cannot answer, since
IndexedDB is the thing iOS evicts.

**`src/backup.js` was not modified, and needs no wording change.** Its existing copy already names
accommodation, medical, IEP/504 and behavior-plan data; the roster adds only ordinary contact
fields, which the panel's "it holds everything" framing already covers.

---

## The wo-sweep REVIEW lines

Both remain REVIEW (they never fail a run). Each is confirmed below, as owed.

### REVIEW 1 — sensitive field names outside `src/backup.js`: 6 mentions, **all pre-existing, none new, none emits**

Confirmed by `git diff -U0 HEAD` on the three files: **zero added lines** match the sweep's pattern,
and neither `src/roster.js` nor `src/teacher.js` contains a single hit. The line stood at 6 before
WO-1.7 and stands at 6 after; the count is unchanged because the mentions are unchanged.

| # | Location | What it is | Emits? |
|---|---|---|---|
| 1 | `index.html:919` | backup-modal prose: "The backup carries accommodation, medical and behavior-plan data" | No — teacher-facing copy about the permitted path |
| 2 | `index.html:920` | same paragraph: "will hold IEP and 504 details" | No — same sentence |
| 3 | `index.html:955` | backup notice: "accommodations, IEP and 504 plans, medical needs, and behavior…" | No — this **is** the disclosure `CLAUDE.md` requires the backup UI to make |
| 4 | `src/prefs.js:10` | comment: "…accommodation / medical / plan data never come near this" | No — a comment stating the prohibition |
| 5 | `src/shell.css:740` | comment above the backup rules describing the notice block | No — a CSS comment |
| 6 | `src/shell.css:741` | continuation of the same comment | No — a CSS comment |

Three are the backup UI saying out loud what is in the file, which is a WO-1.5 deliverable. Three
are comments stating the rule. **Nothing reaches a merge field, an export, a print surface or a log
line** — there are none of those in the app yet, and no code path in either new module reads or
writes any of these names.

### REVIEW 2 — CSS selectors with no coarse-block rule

The sweep named ten. I went through them one at a time, and then went further: **the sweep's
substring match hides three more**, because it clears a selector if any coarse-block selector merely
*contains* its text. `.paste-field` is cleared by `.paste-fields`, `.paste-row` by `.paste-row-note`,
`.roster-row` by `.roster-row-name`. Those three had never been reviewed by anyone. They are here
too. (Naming this as a possible follow-up to `wo-sweep.mjs`, not fixing it — out of scope.)

**Two got a rule:**

| Selector | Rule added | Why |
|---|---|---|
| `.roster-row-actions` | `gap: 8px` | Edit sits shoulder to shoulder with Remove. 6px between two 44px targets is a mis-tap that takes a student off a roster. |
| `.guardian-head` | `gap: 8px` | "Contact first" sits shoulder to shoulder with the button that deletes a guardian. Same reasoning, worse consequence. |

8px is not invented — `.paste-fields` and `.student-classes` already take exactly that in the same
block, for the same reason.

**Eleven are pure layout containers and got no rule, deliberately.** For each, the control inside it
carries the 44px by class, and — this is the part that matters — **each of those controls is now
measured on an emulated coarse pointer** rather than asserted from a stylesheet. Putting
`min-height: 44px` on a wrapper instead of on the control inside it *is* the WO-1.2 `.search-box`
defect this whole harness exists because of; doing it here to silence a grep would be re-shipping it.

| Selector | What it is | What carries the 44px inside it |
|---|---|---|
| `.roster-list` | flex column of rows | `.class-action-btn` (44×44) on every row |
| `.roster-row` *(sweep-masked)* | one student's row | same |
| `.roster-form` | the add-a-student row | `.roster-input` (44), `.class-action-btn` (44×44) |
| `.roster-actions` | button strips in four dialogs | `.class-action-btn`, `.toggle-btn` (both 44×44) |
| `.student-grid` | wrapping two-column field layout | `.student-input` (44) |
| `.student-field` | `<label>` around one field | `.student-input` (44); the label is not the target |
| `.paste-field` *(sweep-masked)* | `<label>` around one preview field | `.paste-input` (44) |
| `.paste-row` *(sweep-masked)* | one preview row | `.toggle-btn`, `.class-action-btn.move`, `.paste-input` |
| `.guardian-list` | flex column of cards | controls live in `.guardian-head` / `.student-grid` |
| `.guardian-card` | box around one guardian | same |
| `.student-delete-facts` | the danger-wash count block in the confirm | **holds no control at all** — it is `<div>`s of text |

Analogues already in the stylesheet with no coarse rule and no complaint: `.class-list`,
`.class-row`, `.class-row-actions`, `.class-form`, `.class-delete-facts`, `.backup-actions`,
`.restore-compare`. Following that precedent was the point.

Four new measurements back this: `every control on the roster panel measures >=44px` (62 elements),
`…in the paste preview` (12), `…in the student editor, the notes box and guardian card included`
(23), `…on the teacher panel` (7). All under `matchMedia('(pointer: coarse)')` asserted true first.

---

## The one authorized harness repair

**I agree with the diagnosis and made exactly that change.** Verified independently before touching
it: `node -e` prints local `2026-08-04`, UTC `2026-08-05`, offset 240 minutes. `src/backup.js:121`
is right and was not touched.

```
git diff --numstat tools/verify-shell.mjs
671     2     tools/verify-shell.mjs
```

The **two** deleted lines are both halves of the old date expression on that one check:

```
-    built.whole && built.name === 'Planbook ' + YEAR + ' backup '
-      + new Date().toISOString().slice(0, 10) + '.json',
```

No other line was removed. No check was weakened, renamed, loosened or deleted; the check now
derives the stamp the same way `dateStamp()` does, which makes it stricter about the right value
rather than looser about the wrong one. Comment added above it recording why, so it is not
"corrected" back to UTC next year.

---

## Falsification — the evidence that these checks are not decorative

A green run on the first attempt is exactly what `tools/README.md` trap 5 warns about, so I broke
the app on purpose, one acceptance line at a time, ran the full harness each time, and recorded
which checks went red. `src/roster.js` was restored after each and verified byte-identical.

| Mutation to `src/roster.js` | Checks that went red |
|---|---|
| 1 — `commitPaste` writes `(last, first)` instead of `(first, last)` | 11, led by *"committing adds exactly 25 students to this class, split exactly as the preview showed"* |
| 2 — `settle()` never returns `here`, so a name already on the roster reads as new | *"re-pasting the same list warns on every line instead of silently doubling the roster"*, *"and the Add control refuses rather than being live and doubling it"* |
| 3 — `toggleStudentClass` pushes a **copy** of the student into the second class | *"a student put into a second class is still one record, with one set of contacts"*, *"and the other class shows the same record on its roster rather than a copy of her"* |
| 4 — `removeFromClass` also splices the record out of `doc.students` | *"removing her from this class takes her off this roster and touches nothing else"* + 4 more |
| 5 — `editStudentField` refuses to write `guardian.email` | *"the student, guardian and counselor emails all come back after a save and a reload"*, *"and the backup file carries the students, their contacts and the teacher's address"* |

**Two harness defects this exposed, both fixed:** under mutations 4 and 1 the run *threw* instead of
reporting — a detail string dereferenced a student the mutation had destroyed, and the delete arc
tapped a row that was no longer there. Both are the trap `tools/README.md` describes: a harness bug
that presents as an app defect and takes the rest of the run down with it. The detail strings now
report the absence in words, and the delete arc is gated on **both** the stored ids and the rendered
rows (they can legitimately disagree — a dangling roster id renders as nothing, which `roster.js`
documents as the harmless failure). Re-falsified afterwards: all five report cleanly, no crashes.

---

## What I could **not** verify — owed to a human on real hardware

Nothing below is claimed. Each needs a thumb, a Retina panel, or iPadOS itself.

1. **Every 44px measurement is an emulated coarse pointer in headless Chromium, not a thumb.** The
   numbers are real; whether a 44px `⇄` between two name fields is *comfortable* on a moving iPad is
   not a number.
2. **The iPadOS software keyboard over the paste box.** A 176px textarea with a keyboard up on an
   iPad in landscape may leave the preview button unreachable. Not simulable here.
3. **A real paste from a real SIS.** The fixture is 26 lines of my construction covering the shapes
   `roster.js` names. Whether the author's actual school system emits a shape none of them covers is
   answerable only with a real copy-paste — and the preview is the defense either way.
4. **VoiceOver.** Every new control has an `aria-label`, `aria-pressed` where it is a toggle, and
   announces through the single live region. That it *reads well* is untested.
5. **A 26-row preview scrolling inside a modal on iPadOS**, with `-webkit-overflow-scrolling: touch`
   and a capped `max-height` — the class of thing that behaves differently on device.
6. **Service-worker offline behavior with the two new modules.** `sw.js` bumped to `v9` and both are
   in `SHELL`; the harness's static precache check confirms the module graph is covered, but it
   drives a page and has never seen a service worker.

---

## Files changed

| File | Change |
|---|---|
| `C:\dev\planbook\tools\verify-shell.mjs` | **+671 / −2.** New `--- roster & contacts ---` section (28 checks) with three page-side readers; 4 new coarse-pointer measurements for the roster panel, paste preview, student editor and teacher panel; the one authorized local-date correction; two harness-robustness fixes found by falsification. |
| `C:\dev\planbook\src\shell.css` | **+2 lines inside the coarse block**: `.roster-row-actions { gap: 8px }`, `.guardian-head { gap: 8px }`, with the reasoning above them. Nothing else in this file was touched by me. |
| `C:\dev\planbook\tools\README.md` | **+2 / −1.** The check count line, which that file explicitly instructs whoever adds checks to update and explains at length why a stale count is its own problem. 130 at WO-1.6 → 162 at WO-1.7. |

**Unchanged by me, and inherited from the crashed draft as-is:**
`C:\dev\planbook\src\roster.js` (new, 1279),
`C:\dev\planbook\src\teacher.js` (new, 106),
`C:\dev\planbook\index.html` (+318/−8),
`C:\dev\planbook\src\shell.js` (+100/−1),
`C:\dev\planbook\src\classes.js` (+7),
`C:\dev\planbook\sw.js` (+3/−1).
`C:\dev\planbook\src\backup.js` — **not modified**, by anyone, in this work order.

Nothing under `plans/` was touched. No roadmap or work-order box was ticked. `CHANGELOG.md` and
`TESTING.md` are untouched. No third harness was written. No commit, no push.

---

## Decisions the work order did not settle, and which way I went

1. **How to answer the coarse-pointer REVIEW for a layout container.** The handoff said add the rule
   where the selector "is or contains" a touch target. Read literally that covers `.roster-form`,
   `.roster-actions`, `.roster-row-actions` and `.guardian-head` — but the only rule a wrapper can
   carry is a height, and a 44px height on a wrapper around a short control is precisely the defect
   `verify-shell.mjs` was written for. **I went with: the 44px lives on the control, listed by class
   and now measured on the rendered element; the container gets a rule only where separation between
   two adjacent targets is the thing at risk.** Two got one, eleven did not, all named above.
2. **Whether to bump `.class-row-actions` to match.** WO-1.6's equivalent strip has the same 6px gap
   between Rename and Archive. I did **not** touch it — it is outside this work order. Proposed
   follow-up, not done.
3. **Whether to call `parseRosterLine()` from the harness.** It is exported and on the shelf, and
   calling it would have been a third of the work. I did not: a check that asks the parser what it
   thinks of a line will agree with itself no matter what the paste box actually writes. Every split
   assertion reads the fields on screen and the document, and every expected value is written out by
   hand.
4. **Whether updating `tools/README.md`'s count is maintenance I am forbidden to do.** It is not a
   roadmap box, a dashboard, a `CHANGELOG.md` or a `TESTING.md` entry, and that file carries an
   explicit instruction to update the line, plus a paragraph on why a nearly-right count is as bad as
   a stale one. **I updated it.** Flagging it here in case the verifier reads it as scope.

## Proposed follow-ups (not done, not in scope)

1. **`wo-sweep.mjs` clears a new selector by substring**, so `.paste-field`, `.paste-row` and
   `.roster-row` were never surfaced for review. `some(c => c.includes(sel))` wants to be a
   whitespace-boundary match. Small, and it silently under-reports today.
2. **`commitPaste` with a `link` row and no class open** announces "Added 0 students" and does
   nothing. Harmless, but the sentence is wrong.
3. **`.class-row-actions` gap**, above.
4. **A check on the paste box under an on-screen keyboard**, if that is ever simulable — item 2 of
   the un-verifiable list is the one I would most like a number for.
