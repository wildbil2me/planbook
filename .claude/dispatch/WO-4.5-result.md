# WO-4.5 — Cooldown & the quiet middle · implementation result

**Status left on the work order** `🔨 IN PROGRESS` — written by `node tools/wo-gate.mjs --tick WO-4.5`,
which refused `✅ DONE` because Acceptance line 4 is still `[ ]` and wears 📆. Four of five boxes
ticked; the fifth cannot be closed by me or by any build.

**Both harnesses green on the delivered tree**, and both numbers below are quoted from output I
read, not predicted:

```
node tools/verify-shell.mjs
1175 checks · 1175 passed · 0 failed · 0 skipped
34,845 lines · 29.7 lines per check · 403s          exit 0

node tools/wo-sweep.mjs
33 checks · 29 passed · 0 failed · 4 to review
```

`verify-shell.mjs` was run **three times**: green on the tree, red in the expected places on the
mutated tree (§ 2), and green again on the delivered tree after the two mutations were restored from
copies taken before them — the third run is the one quoted above, and it is the tree on disk now.

The four `TO REVIEW` lines are all pre-existing or expected, and two of them name my work:
`.sig-quiet-note` and `.sig-since` are listed as selectors added with no coarse-block rule —
correct, and both are text rather than controls (the first is a `<p>`, the second a figure inside a
`.sig-row` button that already carries the 56px floor). `.sig-col-head` and `.sig-col-empty` come up
only because my diff touched the responsive line they share. The sensitive-field-names review lists
the same thirty-one files it listed before this work order; nothing I added mentions a support, a
plan or a medical need outside prose.

---

## 1. The ambiguity the brief told me to resolve out loud

**Nothing writes a `contact` entry, and `{ id, studentId, at, kind, audience, subject, body }` has
nowhere to say which signal it was about.**

**How I resolved it.** The field is **`ruleId`**, on a `contact` entry and on nothing else. It
carries `src/signals.js`'s own `hit.ruleId` unchanged — `grade-fell`, `absence-run`, `grade-rose` —
so the cooldown does not map one vocabulary onto another and WO-5.3 fills the same field the reader
already looks for. It is documented in **`docs/data-model.md` § log**, in the record literal under
§ The document and in a bullet of its own, and it is named in `src/log.js`'s own block over the three
readers WO-4.5 added.

**Nothing in this build writes one, and `newLogEntry()` is untouched.** A `ruleId: ''` on every
behavior note would be an eighth field on every record for a kind Phase 5 owns, paid for by every
document — and it would break `log-entries.mjs`'s "the seven fields and no eighth" assertion for a
value that never means anything. So the writer is left exactly as WO-4.4 shipped it.

**The reader tolerates the absence by silencing *nothing*, and that is the decision worth arguing.**
A contact whose signal cannot be named could reasonably silence everything for that student — and
that is precisely this work order's Traps line arriving through the back door of a missing field. So
it under-fires: `lastContactAbout()` returns `null` for an entry with no `ruleId`, and it **refuses
an empty `ruleId` argument outright**, so a caller cannot ask it "when was she last contacted at
all" and hand the answer to a cooldown. The cost of the choice is one duplicate email; the cost of
the other choice is a list that has quietly lost a student. Same posture as WO-4.3's turnaround rule,
stated in the same words.

**I did not build any part of Phase 5's outreach flow.** The harness plants the record WO-5.3 will
write, in the shape the data model now documents, and everything downstream of it — the suppression,
the foot, the expansion, the *Write anyway*, the restore — is the real path. That is argued at the
top of `tools/verify/cooldown-quiet.mjs`.

**One consequence a later reader needs before WO-5.3 writes the first entry: the cooldown is
class-blind, because the record is.** `log[]` carries no `classId` (`docs/data-model.md` says so and
`behaviorCountSince()` already rules the same way), so an email about a grade fall silences that
student's grade-fall row in every section she is in. I did **not** add a `classId` to the log — that
is a schema decision WO-5.3 should make with its own reasons — and it is written down in
`docs/data-model.md` § log and in the work order's own new note.

---

## 2. Against the Acceptance list, one by one

### ☑ 1. Logging a contact about a concern removes that student from that signal for 14 days and not from other signals.

**Met, and mutation-proved.** `tools/verify/cooldown-quiet.mjs` plants seven students in one class
and makes the claim falsifiable three ways:

- **Ada** trips two rules — a grade under the line and three missing — and has a `contact` about
  `grade-below` from three days ago. Measured: her row survives, leads on `missing-count`, and
  `grade-below` is the only entry at the foot.
  `{"onList":true,"lead":"missing-count","rules":["missing-count"],"heldRules":["grade-below"],"heldAudience":"guardian","heldDays":3}`
- **Ben** trips one rule and was contacted about that one two days ago: no row, and a name at the
  foot.
- **Cal** trips the same rule with the same numbers and was contacted about it **twenty** days ago:
  on the list. The window is the threshold's, not the log's — `span` reads `14`, read through
  `thresholdsOf()`.

**Mutation:** dropping `String(e.ruleId||'') === rule` from `lastContactAbout()` — i.e. keying on the
student — turned this check red with
`{"onList":false,"lead":"","rules":[],"heldRules":["grade-below","missing-count"]}`, plus six other
checks. Reverted; the file is byte-identical to the copy taken before the mutation.

The 14 itself is exercised from both sides in a separate check: `cooldownDays` at 0 suppresses
nothing, at 30 it catches Cal's twenty-day-old contact, and **deleting the key** puts the documented
default back with `keyLeft === false`.

### ☑ 2. The cooldown reads the log rather than a separate suppression store — verify by restoring a backup and confirming cooldowns survive.

**Met, both halves.**

- `newYearDocument()` gained nothing. `applyCooldown()` reads `log[]` and `cooldownDays` and returns
  `{ shown, suppressed }`. The document is photographed either side of a pass that silences three
  hits across both columns: `document unchanged = true, suppression-shaped keys = []` (the scan
  looks for `*suppress*`, `cooldown*`, `*silenc*` and `quiet*` keys anywhere in the serialized year).
- The restore is driven **end to end through the real path** — `backup.restoreFromText()` and the
  real `[data-backup-confirm]` button, the same seam `backup-restore.mjs` uses — and the same three
  suppressions come back off the same contacts with the same return dates:
  `["s_wo45ada/grade-below/2026-08-24/2026-09-07","s_wo45ben/missing-count/2026-08-25/2026-09-08","s_wo45gus/high-score-run/2026-08-26/2026-09-09"]`
  before and after.

Because that section replaces the whole year document, it is deliberately **last** in
`BROWSER_SECTIONS` and says why at its row.

### ☑ 3. The quiet-middle list excludes anyone flagged, praised, or contacted this term.

**Met, and mutation-proved.** Of seven students the list holds two, and each exclusion is a different
one: Ada and Cal are flagged, Gus is praised, **Ben** is excluded although his only concern rule is
currently *suppressed* — he has been both flagged and written to, and a build that took the quiet
middle off the post-cooldown list would tell a teacher she had lost track of the student she emailed
on Tuesday — and **Fay** is excluded because she was written home about five days ago.

**Eve is the interesting inclusion.** A four-day-old **note to self** is not contact, so she stays on
the list; what the note did was move her clock, and she sits *under* Dot, whose clock runs from the
term's own start. `days: [40, 4]`.

**Mutation:** disabling the `lastContactDate` exclusion put Fay on the list — `count: 3`, ids
`["s_wo45dot","s_wo45fay","s_wo45eve"]` — turning this check and the note-clock check beside it red.
Reverted.

### ☐ 4. 📆 Two consecutive weekly runs on real data produce visibly different concern lists.

**I cannot close this and did not tick it.** It is 📆: it wants two calendar weeks of a real term with
a real contact logged in between, and there is neither until Sep 2 at the earliest. `--tick` refuses
the mark, and the work order is therefore `🔨 IN PROGRESS` rather than `✅ DONE`.

What is measured instead, and what it does *not* prove, is written into `TESTING.md` § WO-4.5: the
same document read at `cooldownDays` of 0, 14 and 30 returns three different concern lists, which
exercises the mechanism. **A threshold moved by hand is not a week passing**, and I have not claimed
otherwise anywhere in the tree.

### ☑ 5. Suppressed hits are recoverable and counted, never silently dropped.

**Met, measured on the markup rather than on the model.**

- The foot is a control that says the count in **both** states —
  `"2 you wrote about recently · show them"` closed, `"… · hide them"` open — with `aria-expanded`
  and `aria-controls` on it. A count that stopped being visible once you opened it would be a number
  you had to close the thing to read.
- The expansion draws one `.sig-muted` per suppressed hit, and each one carries the rule's own
  sentence **unchanged** followed by the contact and the return date:
  *"In WO-4.5 Cooldown, Ada Wo45Split's grade is 43.48%, below 65%. You wrote to their guardian about
  this on Aug 24, 3 days ago. Back on the list on Sep 7."*
- The row is **not** a button (`isButton: false`); the one thing on it that acts is *Write anyway*,
  with an `aria-label` that names the student, the rule and the class.
- *Write anyway* puts that one row back, drops the foot to `"1 you wrote about recently · hide it"`,
  and the document is byte-identical across the tap (`same: true`).
- An arrival closes the expansion and forgets every *Write anyway* — the same rule the class filter
  and the sort already follow. Nothing reaches `localStorage`.
- The big empty state can no longer claim *"every rule ran and none fired"* over a column the
  cooldown has emptied: `nothing` now also tests the suppressed lists.

---

## 3. What I could not verify — say so rather than assume

**No 👤 line is ticked, and four are owed.** They are written into `TESTING.md` § WO-4.5 as open
boxes:

- The foot under a thumb: readable at the bottom of a column, and one tap that opens the rows without
  moving the list under a finger already travelling.
- *Write anyway* on a portrait iPad. **The ruling that pays for this control is *where it sits*** —
  quiet, at the end of a muted row, behind an expansion opened on purpose — and only a thumb can say
  whether it sits there. A headless 44px measurement says it is reachable; it cannot say it is not
  *too* reachable.
- **The quiet middle at real length.** The fixture holds two rows. A real class in the first
  fortnight holds most of a roster, because almost nothing has been written down yet — see § 5.
- The card with both chips on a portrait iPad across five classes. Measured headless at a 202px card
  (24px slot around a 21px chip, no wrap), but the coarse block bumps both and nobody has seen it.

**One claim in the code is asserted by reading and not by measurement, and I have said so at the
place it would have been measured.** `src/home.js` skips the signal pass while the grid is not the
view on screen, because `src/shell.js`'s `afterAttendanceChange()` calls `refreshHome()` on **every
mark** and attendance marking is on the critical path. Timing that from the harness wants `home` and
`views` on the `window.planbook` seam — two new entries for one performance guard — and I declined
the widening; the note sits in `cooldown-quiet.mjs` where the check would have been.

---

## 4. Files changed

Source:
- `c:\dev\planbook\src\signals.js` — `applyCooldown()`, `silencedBy()`, `quietMiddle()`,
  `quietSentence()`, and `termRangeOf()` extracted out of `makeContext()` so the term's range is
  defined once. Still **no writer of any kind**.
- `c:\dev\planbook\src\log.js` — `lastContactAbout()`, `lastContactDate()`, `lastEntryDate()`, the
  `ALL_KINDS` list, and the block arguing `ruleId`. No new writer; `newLogEntry()` untouched.
- `c:\dev\planbook\src\calendar.js` — `daysBetween()`, exported for the one caller, stated as a
  departure from the note above `shiftDays()` because that file forbids a `Date` outside its own
  `utcOf()`.
- `c:\dev\planbook\src\signals-view.js` — the foot, the muted row, *Write anyway*, the quiet panel,
  the two new view-state values, and the three exported controls.
- `c:\dev\planbook\src\signals-view.css` — `.sig-hidden`, `.sig-muted`, `.sig-undo`,
  `.sig-quiet-note`, `.sig-since` lifted from the drawing value for value, plus their coarse floors
  and the narrow-breakpoint padding.
- `c:\dev\planbook\src\home.js`, `c:\dev\planbook\src\home.css` — the post-cooldown attention chip
  and the view guard.
- `c:\dev\planbook\src\shell.js` — three delegated hooks and their rows in the census at the top.
- `c:\dev\planbook\index.html` — the two column feet and their containers, and the quiet-middle
  panel.
- `c:\dev\planbook\sw.js` — `CACHE` v97 → **v98** (`index.html` is `./`, entry one of `SHELL`).

Docs, drawings and trackers:
- `c:\dev\planbook\docs\data-model.md` — `ruleId` in the record and a bullet of its own; § Cooldown
  extended; a new § The quiet middle.
- `c:\dev\planbook\design\mockups\proposed-phase4.css` — § SIGNALS banner amended from
  `WO-4.5 pending` to `lifted 2026-08-27`, with what the build declined.
- `c:\dev\planbook\TESTING.md` — § WO-4.5.
- `c:\dev\planbook\plans\work-orders\phase-4-signals.md` — four boxes ticked, status `🔨`, three
  notes recording the decisions below.
- `c:\dev\planbook\plans\work-orders\README.md` — the Ship 3 row for WO-4.5.

Harness:
- `c:\dev\planbook\tools\verify\cooldown-quiet.mjs` — **new**, 19 `check()` call sites, last in the
  run order.
- `c:\dev\planbook\tools\verify-shell.mjs` — one import, one row, "sixty" → "sixty-one".
- `c:\dev\planbook\tools\verify\ungraded-count.mjs` — two assertions repaired (see § 6).
- `c:\dev\planbook\tools\README.md` — the recorded `check()` call-site count 1141 → **1160**, with
  the WO-4.5 sentence beside it.

No `package.json`, no dependency, no scratch file under `tools/`. No `git commit` and no `git push`.
No `CHANGELOG.md` entry — a draft is in § 7 for the teacher to accept, reword or bin.

---

## 5. Decisions the work order did not settle

**(a) The home-screen slot took one chip and not two.** The Deliverable says *"Both surfaced on the
home screen slot from WO-1.10"* and I have delivered one of the two there. The reason is a
measurement rather than a preference: `.class-card-signals` reserves **24px for one row of chips**
(WO-1.10, WO-3.26) so that the first real datum on a page of five cards reflows nothing, and
`.class-card` sits on a `minmax(200px, 1fr)` grid — the harness measured a **202px** card in this
run. Two `.class-card-count` chips and their gap are ~160px of a ~169px content box at that width,
and ~180px once the coarse block bumps the font. A third wraps the slot and breaks that invariant on
every card at once.

So the card carries the **post-cooldown attention count** (`4 need you` — students, both directions,
after suppression) and the quiet middle's home-screen presence stays **WO-6.4's**, which already
draws it by name as `The quiet middle · N`, *"a door onto that screen"*. What WO-4.5 owed that
control it has: `quietMiddle()` is one exported answer, so the glance page's count and this panel's
rows cannot be a student apart. **If the owner wants both numbers on the card, that is a second row
in the slot and a new height for every card — a change worth its own work order, not a line here.**
The harness now measures the invariant (`slotHeight < chipHeight * 2`) so the next person to add a
chip finds out from a red check rather than from an iPad in September.

**(b) The chip does not hide under a projector, and `src/home.js` stays off the presentation redraw
list.** This is the closest call that file's own test has had and I have written the argument into
its header. The signals *screen* refuses because its entire content is a ranked list of **named**
students in trouble; a count names nobody, is identical whichever four they are, and discloses
strictly less than the roster support dot that has shipped since WO-1.7. That is the owner's own
grammar for this page, ruled 2026-08-19 for WO-6.4's review count: *a launcher says how much is
waiting and the surface it launches says what.* `src/home.js`'s stated test — "the first datum on
this card that varies with WHO a student is" — still answers no. **If the owner disagrees, this is
one import and one line, and it is her call rather than mine.**

**(c) *Write anyway* is per row, the cooldown is per pair.** The suppression key is
`student + rule` (the log has no `classId`); the override key is `student + rule + class`, because
this file's own header already rules that the same student in two sections is *two rows and two
conversations*. Taking one back is not a decision about the other.

**(d) A quiet row opens the student's record, not the signal card.** It is the only row on the
screen that does not open the card, and the reason is that there is no card to open: the whole of
what is true about a quiet student is that no rule fired. What resolves *"I have lost track of her"*
is her record.

**(e) The quiet sentence keeps the drawing's grade and declines its two claims.** The drawing reads
*"78% and steady"* and *"83%, no missing work, no absences"*. "and steady" is a claim about a delta
and the second is two more measurements per student — each of them a rule the engine already has,
run again outside the pass that owns it, to report that it did **not** fire. The grade is one read
and it is the fact that answers *why did I lose track of her*; the rest is one tap away on the row's
own destination. Recorded at `quietSentence()` and in the drawing's banner.

**(f) The quiet middle is not capped, and I think that is the right call and the wrong reading may
be mine.** Every qualifying student is listed. In a real first fortnight almost nothing has been
written down, so most of a roster ties at the term's own start and the ranking says little — the
panel will be long. Capping it would be inventing a threshold the work order did not ask for, and
dropping students silently is the failure the suppressed-rows half of this work order exists to
prevent. The class filter is the escape hatch. **This is the 👤 reading I would most want the owner
to take**, and it is on the `TESTING.md` list.

---

## 6. One thing I had to repair that was not mine

`tools/verify/ungraded-count.mjs` asserted `chips === 1` on the card slot — twice. That was never
the claim it meant to make (the ungraded count appears once and is the first chip); it was a bare
count that went red the moment a work order added a legitimate neighbour. I replaced it with a
`gradeChips` reading that counts only chips ending in `to grade` and asserts **that** is one, and
said so in a comment at the reader. Both checks are green and the original intent is intact — a
build that double-counted still turns them red.

---

## 7. Draft CHANGELOG entry — yours to accept, reword or bin

> **Cooldown & the quiet middle.** The *Who needs you* screen stops asking the same question every
> week. Write to a guardian about a student's grade and that signal goes quiet for a fortnight —
> **that signal, not that student**, so a new problem still surfaces the day after you emailed about
> an old one. The rows it takes out are counted at the foot of the column they came from, and
> opening them shows who, which contact silenced them and the date they come back, with *Write
> anyway* at the end of each: the cooldown suggests, it does not hold the door shut. Under the two
> columns, a third list nobody's thresholds will ever produce — the students who are neither failing
> nor excelling and are therefore the ones you lose track of, ranked by how long it has been since
> anything was written down, said, or sent. The suppression is worked out fresh from the outreach log
> every time the screen is drawn, so nothing new is stored and restoring a backup restores your
> cooldowns with it.

---

## 8. Notes for the next session, acted on nowhere

- **A follow-up worth booking:** `log[]` has no `classId`, so a cooldown is class-blind. Whether an
  email about one section should silence the same signal in another is a real question for **WO-5.3**
  when it writes the first `contact`, and it is a schema decision rather than a rendering one. Left
  as the record already is, and written into `docs/data-model.md` so that work order finds it.
- **A temptation I declined:** the quiet panel's *Back to the list* button, which the drawing has.
  It is drawn as though the panel were a surface you arrive on, and the owner's 2026-08-20 ruling
  makes it a panel on the screen you are already on. **WO-6.4** owns the arrival that would give it a
  meaning. Recorded in both banners.
- **A second temptation I declined:** a second sort control, for the quiet list. It has one ranking,
  its head says so, and WO-4.3 already declined one for the praise column on a screen carrying two
  filter strips and a sort.
- **`CLAUDE.md` is untouched.** Two facts in this work order look like § Data bullets if the owner
  wants them there: *the cooldown is derived at read time and there is no suppression store* (a third
  block for the rule that already covers `signals` and `calendar`), and *`ruleId` is read by this
  build and written by none of it*. Both are in `docs/data-model.md` already; I did not put prose
  into the curated file.
