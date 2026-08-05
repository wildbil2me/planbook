# WO-1.8 — Accommodations on the roster · implementation report

**Route** Claude (work-order-implementer) · **Branch** `phase/1-shell-store-roster` · **Not committed.**

**Verification, both green:**

```
node tools/verify-shell.mjs   → 184 checks · 184 passed · 0 failed · 0 skipped   (baseline was 164/164)
node tools/wo-sweep.mjs       → 11 checks · 9 passed · 0 failed · 2 to review · exit 0
```

No third harness was written. The 20 new browser checks live in a new
`--- support details ---` section of `tools/verify-shell.mjs`, one new check went into the touch
pass, one existing WO-1.7 check was rewritten (see below), and one grep check was added to
`tools/wo-sweep.mjs`.

---

## Against the five Acceptance lines, one at a time

### 1. Every field in the data model's `supports` block is editable and round-trips — **met**

The block is written by `newSupports()` in `src/supports.js`, spelled exactly as
`docs/data-model.md` lines 79–91 spell it: `plan`, `caseManager {name, email}`, `reviewDate`,
`accommodations[] {kind, detail, appliesTo}`, `medical`, `behaviorPlan`. `src/roster.js`'s
`newStudent()` now seeds it, so a pasted or typed student carries an empty block rather than no
block.

**What I verified, and how.** Four harness checks drive the real controls in the real dialog —
tapping "Show support details", tapping the IEP button, typing into each field, adding two
accommodation cards, picking a kind from the `<select>` with a real `change` event — then read the
document back:

- `every field in the supports block is editable from the panel and lands in the document` ::
  plan IEP, 2 accommodations, case manager, review date, medical and behavior plan all stored.
- `` `appliesTo` is an array of the words typed, and an empty one means everything `` ::
  `[["tests","quizzes"],[]]`.
- `the whole supports block comes back out of IndexedDB after a save and a reload` :: identical to
  what was written, field for field — a `store.flush()` then a `Page.reload`, per trap 6.
- `and the record still carries exactly the keys the data model gives a student` ::
  `["counselor","email","first","gradYear","guardians","id","last","nickname","notes","supports"]`
  — enumerated, so an eleventh key would fail it.

**Two shape decisions the work order did not settle.** Named here because a verifier reading cold
will meet them:

- **`appliesTo` is a free-text comma-separated field**, split into the array on the way in. Not a
  picker over grade categories: categories are configured per class, a student is commonly in two
  of the teacher's five, and an accommodation follows the student — a picker built from one class's
  categories would offer the wrong words in the other. Reasoning is in `src/supports.js`'s
  `parseAppliesTo`.
- **A fresh accommodation's `kind` is `''`, not the first enumerated value.** The picker's first
  option reads "Choose one…". Seeding it to `extended-time` would make a card added by a mis-tap
  claim a student has extended time, and a false accommodation is a worse error than an unfilled
  one. `''` is off the data model's enumeration, which lists only chosen values; empty-means-unset
  is the idiom every other string field in the document uses. Reasoning is in `newAccommodation()`.

**Deliberately not done: no schema migration.** `SCHEMA_VERSION` stays 1 and `MIGRATIONS` stays
empty. A missing `supports` block reads as an empty one everywhere, and `supportsOf()` repairs it
in place on first use — the same pattern `counselorOf()` already uses. A version bump would have
made every backup this build has already written unreadable by the deployed build for no gain.

### 2. No list view shows plan status, accommodation detail, medical, or behavior text without a deliberate tap — **met**

The roster row carries one dot and no words. The student editor's support panel arrives **shut on
every open**, including via Edit, and its fields are *emptied* rather than merely unpainted while
it is shut — a `display: none` block full of the data is still readable from the DOM and the
accessibility tree. None of the four plan buttons reads `aria-pressed="true"` while the panel is
shut, for the same reason.

**What I verified, and how.** Six checks, each pairing an absence claim with the presence claim
that proves the fixture was really there (an absence with nothing behind it is not evidence — this
is stated in the section's header comment):

- `the roster list shows a dot for each student who has something on file, and nothing else` ::
  26 rows, 3 dots, `leaked: []` — the roster panel's whole `textContent` searched
  case-sensitively for 14 needles, including the three students' typed phrases *and* the words
  `IEP`, `504`, `ELL`.
- `and opening the editor by Edit shows no plan, no accommodation, no medical, no behavior text` ::
  panel hidden, no plan button pressed, zero cards, all five values `''`, nothing leaked.
- `one deliberate tap on that panel is what puts them on screen — and it really is them` ::
  plan `["IEP"]`, 2 cards, kinds `["extended-time","other"]`, every typed value back.
- `and tapping it again takes them back off, fields emptied rather than merely unpainted`.
- `the dot is that deliberate tap: it opens the editor with the panel already showing`.
- `and the next open is shut again — it is not a setting that stays where it was left`.

**On the needle lists.** Two lists, and the difference matters to a cold reader. `IEP`/`504`/`ELL`
are searched for on the *roster*, which has no such furniture. They are **not** searched for inside
the student dialog, because the panel's four plan buttons name the options in static markup whether
or not any is chosen; a check that called that a leak could only pass by deleting the picker. What
proves the student's plan is not on screen there is that none of the four reads as pressed.

**The choke point (asked for in the brief, not scope creep).** One function decides:
`supportsVisible()` in `src/supports.js`. `sensitiveValue()` and `setSensitiveText()` are the only
two doors a support string takes to the page, and both consult it. The roster dot, the panel's
openability, every field fill and every write path consult it too. WO-1.9 changes that one function
body and nothing else. A new sweep check enforces it:
`the support-visibility rule is defined in exactly one place :: defined in src/supports.js, asked
by 1 other file(s): src/roster.js`.

### 3. The indicator dot does not itself encode the plan type by color or shape — **met**

One `.support-dot` class, one glyph, one size, one colour. No variant class exists to be added
later. The label and tooltip are the same generic sentence for everyone — `Support details for
<name>` — and name no plan, need or accommodation.

**What I verified, and how.** Three students with three different things on file (one IEP + case
manager + review date + two accommodations + medical + behavior plan; one 504 and nothing else; one
medical note only), and the dots compared **to each other** — computed `background-color`, `color`,
`border-color`, `border-width`, `border-radius`, `font-size`, measured box, glyph, class list:

- `three students with three different things on file get three identical dots` :: one distinct
  look across all three.
- `and neither its label nor its tooltip names a plan, a need, or an accommodation`.
- `a student with nothing on file carries no indicator at all` :: 23 of 26 rows have no dot.

**This check failed on its first run, and the failure was worth having.** It reported two distinct
colour sets. The cause was the harness, not the app: `Input.dispatchMouseEvent` leaves the cursor
where it released, so the dot the harness had just tapped was returning its `:hover` rule while the
other two returned resting. That is *exactly* what a plan-coded dot would look like. I fixed it by
parking the pointer (`mouseMoved` to the corner) rather than by dropping the hover-sensitive
properties from the comparison — dropping them would have left the check measuring almost nothing
and it would have gone green. Written up as trap 7 in `tools/README.md`, since the artifact is
indistinguishable from the defect the check exists for.

### 4. `reviewDate` is stored and readable, whether or not anything consumes it yet — **met**

Stored as an `<input type="date">` value on `supports.reviewDate`. Nothing reads it; the calendar
is WO-6.1 and I did not start it. The panel's own copy says so in words ("It is stored so the
calendar can carry it later; nothing reads it yet").

**What I verified, and how.** `reviewDate is stored and readable whether or not anything consumes
it yet :: reviewDate = "2027-02-11"` — read out of IndexedDB after a flush and a reload, and
separately out of the built backup file.

**One thing I added that the work order did not ask for and I think is required anyway.**
`supportDateCommitted()` mirrors `classes.js`'s `termDateCommitted()`: on iPadOS the date popover
keeps its own selection, so a cleared field cannot be re-set to the value it just held until the
element is thrown away. Without it, clearing a review date and re-picking the same date silently
does nothing. It is a `change` handler and clones the node rather than rebuilding it from a
template, because unlike a term date this field is authored in `index.html`. **I could not test
this on hardware** — see the iPad list below.

### 5. The backup UI names accommodation and medical data as present in the file — **met**

Deliverable 5 was "updated if it isn't already accurate". Three passages, all read:

- **`index.html` ~919–920 (comment)** — said "from WO-1.8 it **will** hold IEP and 504 details".
  Now: "since WO-1.8 that includes IEP and 504 details, a case manager and a review date, all of
  them really in the file rather than promised".
- **`index.html` ~955 (the copy a teacher reads)** — was already present-tense and already named
  accommodations, IEP/504, medical and behavior plans. I added "case managers and review dates",
  which are new in the file as of this work order. Nothing else changed; the feature was not
  rewritten.
- **`src/backup.js` ~12–16 (header)** — said "From WO-1.8 the year document carries…". Now "Since
  WO-1.8… on every student who has any — `students[].supports`, src/supports.js — and the backup
  carries them too, today rather than eventually".

**What I verified, and how.** Two checks, because a notice is only worth anything if it is true:

- `the backup panel names accommodation, IEP/504, medical and behavior-plan data as being in the
  file` :: prints the actual sentence out of the live panel.
- `and the file really does carry them, so the notice is a fact rather than a promise` ::
  `buildBackup()` parsed, plan `"IEP"`, 2 accommodations, medical, behavior plan, review date and
  case manager all present in the downloaded JSON.

I did **not** touch `docs/FERPA.md` — it does not exist in this repo yet, and creating it is not in
this work order.

---

## The sweep's REVIEW lines — the evidence each one is asking for

Neither is a failure; the sweep exits 0. Both are the greppable prompts the tool exists to raise.

### `sensitive field names outside src/backup.js` — 154 mentions (was 6)

The brief said this count would go up and that I should list what I introduced. By file:

| File | Hits | Why none of them is an emit path |
|---|---|---|
| `src/roster.js` | 73 | The editor and the roster dot. Mostly comments. The only writes are into the year document via `update()`; the only reads onto the page go through `sensitiveValue()` / `setSensitiveText()`. Every `announce()` in the support code carries a name, a count or the words "support details" — never a value. Checked by grep: no `console.*`, no `mailto`, no print surface, no `localStorage` in this module. |
| `src/supports.js` | 25 | The new module. Holds the shape, the two enumerated lists and the visibility rule. It has no DOM of its own beyond `setSensitiveText(el, text)`, and no function in it returns a formatted summary sentence — `hasSupports()` deliberately returns a boolean, because a helper returning "IEP · 2 accommodations" is the convenient shape for a row label and the row is the wall. |
| `index.html` | 24 | The editor markup and its comments, plus the backup notice. The panel's `IEP`/`504`/`ELL` are **option labels**, present whether or not any is chosen. |
| `src/shell.js` | 16 | The hook table and the click/change routing. Passes ids and indices; carries no values. |
| `src/shell.css` | 14 | Rules and comments. No content, no `content:` property. |
| `sw.js` | 1 | `'./src/supports.js'` in the precache list. |
| `src/prefs.js` | 1 | Pre-existing — the comment stating that this data never comes near `localStorage`. |

Independently confirmed by the harness: `no support detail, and no memory of the panel being open,
reached localStorage :: planbook_lastBackupAt, planbook_openClassId, planbook_openYear,
planbook_openTermIds`.

### `CSS selectors added in this diff with no coarse-block rule` — `.supports-panel`, `.accommodation-list`, `.accommodation-card`

All three are `<div>` containers, none is a touch target, and the control inside each carries its
own 44px. I deliberately did **not** invent rules for them: the coarse block's own comment says "a
wrapper is not a touch target, and putting the height on one instead of on the control inside it is
the WO-1.2 `.search-box` defect". Every control I added *is* in the coarse block —
`.support-dot` (44×44, both directions, because a 22px circle in a 44px row is half a target),
`.student-select`, `.student-date`, plus `.accommodation-head` (8px gap, where Remove sits beside a
label) and font bumps for `.supports-hint` and `.accommodation-label`. Measured, not asserted:
`every control in the support panel measures >=44px, the kind picker and review date included ::
measured 18; under = []`.

---

## What I could not verify — needs a real iPad or human eyes

1. **The iPadOS cleared-date rebuild on `reviewDate`.** The quirk is a WebKit one found on hardware
   at WO-1.6. My `supportDateCommitted()` is the same fix on a new field, tested only in headless
   Chromium, where the bug does not reproduce. **Owed to a human on an iPad:** set a review date,
   clear it from the picker, re-pick the same date, confirm it takes on the first tap.
2. **Touch targets under a real thumb.** The 44px numbers are measured under an emulated coarse
   pointer, not tapped. The two I would test first are the roster's `.support-dot` (small on
   desktop, 44×44 on touch) and the `<select>` kind picker, which opens iPadOS's own wheel.
3. **Whether the dot is discoverable but quiet.** That is a judgement about a projected classroom
   wall and a teacher's eye, and no emulator has either. It is grey `#8a9bb0` on a hairline circle,
   deliberately not an accent colour.
4. **The projection scenario itself.** Nothing here proves what a room full of students can read
   from six metres. The full suppression story is WO-1.9's.
5. **Service-worker behaviour after the `CACHE` bump to `planbook-shell-v10`.** `src/supports.js`
   is in `SHELL` and the harness's static precache check passes, but nothing in this run has ever
   registered a worker.
6. **Voice and copy.** The panel's sentence about projection is the feature, per the work order's
   Traps line. A human should read it and decide it sounds like this app.

---

## Out of scope — noted, declined

- **Surfacing at point of use (WO-3.8).** Not started. `src/supports.js` says out loud that it must
  not grow a summary-sentence helper for an outreach draft, which is how that would arrive early.
- **The calendar reading `reviewDate` (WO-6.1).** Not started; the field is stored and the panel's
  copy says nothing reads it yet.
- **Presentation mode (WO-1.9).** No toggle, no header control, no persisted preference. What
  exists is the single function it will change, and the fact that the roster dot and every fill
  path already consult it.
- **Counting support details in the student delete confirm.** Tempting — the confirm counts
  contacts, attendance marks and scores, and support details are the most consequential thing a
  delete destroys. Declined: it is not a deliverable, and "2 accommodations" on that dialog is one
  more surface that names the data. Worth a sentence in a later work order.
- **A "does this student have a plan" filter or sort on the roster.** Not asked for, and it would
  be a list view that sorts by plan status, which is the Traps line in a different shape.

## Conventions I set, since nothing existed yet

- **`src/supports.js` owns the shape and the rule; `src/roster.js` owns the editor.** Named for the
  thing it owns, not its layer, per `src/README.md`.
- **Three exports form the choke point** — `supportsVisible()` (the policy), `sensitiveValue()`
  (into a form control), `setSensitiveText()` (into rendered text). A grep for `supportsVisible` is
  the audit, and the sweep now runs it.
- **`data-support-kind` rather than `data-student-field` on the `<select>`.** A `<select>` commits
  on `change`; hooking both listeners would write the same value twice and move `rev` twice for one
  tap. The distinct attribute makes the `input` listener unable to see it at all.
- **The panel's open state is a module variable, never a preference.** It resets to shut on every
  open. A remembered `true` in `localStorage` would be exactly the preference the Traps line
  forbids.

## Files changed

```
c:\dev\planbook\src\supports.js          (new — the shape, the enums, the choke point)
c:\dev\planbook\src\roster.js            (dot, editor, allowlists, accommodation cards)
c:\dev\planbook\src\shell.js             (hook table, click/change routing, window.planbook.supports)
c:\dev\planbook\src\shell.css            (styles + the coarse-pointer pass, same edit)
c:\dev\planbook\src\backup.js            (header comment: future tense → present)
c:\dev\planbook\index.html               (support panel markup; backup copy)
c:\dev\planbook\sw.js                    (precache src/supports.js; CACHE v9 → v10)
c:\dev\planbook\tools\verify-shell.mjs   (new support-details section; 1 touch check; 1 WO-1.7 check rewritten)
c:\dev\planbook\tools\wo-sweep.mjs       (check 5b: the visibility rule is defined once)
c:\dev\planbook\tools\README.md          (check count 164 → 184; CDP trap 7)
```

Nothing under `plans/` was touched. No roadmap box was ticked. `CHANGELOG.md` and `TESTING.md` are
unchanged. Nothing was committed or pushed.
