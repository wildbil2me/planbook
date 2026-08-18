# WO-1.23 — import a class's students and contacts from the SIS CSV · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.23-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude, **Opus** tier, on the work order's own merits: the Claude column's
teacher-facing-prose and design-lift bullets both bite here — the preview dialog is a lift of the
paste box's editable-name-guess rule, the refusal copy and the roster hint sentence are teacher
voice, and `docs/data-model.md` gains a prose section sited beside § Importing from Roll Call! — and
an Acceptance line exists solely to assert the accommodations `supports` block comes through
untouched, which is the surface this project never delegates. The runner-up I set aside is genuine:
the CSV reader and the name/phone parsing have a written fixture and mechanically checkable
acceptance, which is the Codex shape the work order's own Routing note names, and the cap arithmetic
would have fit (one harness run, ~262s, no mutation proof). It lost to the fact that this is app code
across four existing files plus a new module plus a schema addition, and to ties going to Claude.
WO-1.23 is Ship 2, so `ROUTING.md`'s Ship 1 pre-routing table names no route to disagree with.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.23 — import a class's students and contacts from the SIS CSV

**Ship** 2 · **Status** 🤖 CLAIMED — 2026-08-18 · **Size** M · **Depends on** WO-1.7, WO-1.8
**Closes roadmap** Phase 1 → *(no box. The roster box WO-1.7 closed is amended rather than replaced —
see the field below. Booked 2026-08-17, owner-directed, with the file's real shape pasted into the
booking conversation.)*
**Amends roadmap** Phase 1 → the roster box WO-1.7 closed, which promised a pasted `Last, First` and
hand-typed contacts, and now also promises a per-class CSV import that fills those contacts

**Why it exists.** The paste box fills a roster with **names**. Every other field on a student —
email, phone, advisor, and one or two guardians with a name, two phone numbers and an email each — is
then typed by hand, from a spreadsheet, one student at a time. That is roughly nine fields × twenty-five
students × five sections before the first class of the term, and the data is already in a file the SIS
exports per class. The owner has that file. This work order reads it.

**The paste box is not extended and this is deliberate.** `openPaste()` takes a textarea of one name
per line and its whole preview is *which half is the surname*. This file is eight columns, quoted,
with a student's guardians on **continuation rows underneath them** — the same dialog cannot ask both
questions without becoming two dialogs sharing a modal. So this is a second door beside the first, in
the same `.roster-actions` row, and neither changes the other. **Nothing about the paste path may move**;
it is the fallback if this import refuses a file at 7am.

**The shape of the file, which is the specification.** Eight comma-delimited columns, RFC-4180 quoting
(a quoted cell holds commas), no reliable header row, and two rows per student where there are two
guardians. The rows the owner pasted at booking, verbatim, and they are the fixture the acceptance
lines below are written against:

```
"Smith, Jonathan (John) '28",SmithJo28@hwg.com,(508)123-4567 (H),"Smith, Mike",SmithMi28@hwg.com,Mr. Tom Smith,"(508) 234-5678 (M), (508) 345-6789 (H)",SmithTom@aol.edu
,,,,,Mrs. Nina Smith,"(508) 456-7890 (M), (508) 567-8901 (H)",SmithNina@aol.edu
,,,,,,,
"Smitha, Jonathan (John) '28",SmithaJo28@hwg.com,(508)123-4567 (H),"Smitha, Mike",SmithaMi28@hwg.com,Mr. Tom Smitha,"(508) 234-5678 (M), (508) 345-6789 (H)",SmithaTom@aol.edu
,,,,,Mrs. Nina Smitha,"(508) 456-7890 (M), (508) 567-8901 (H)",SmithaNina@aol.edu
,,,,,,,
```

Columns, left to right: **Student Name · Student Email · Student Phone · Advisor · Advisor Email ·
Parents · Parent Phone · Parent Email.**

**The all-empty row is decoration and must not be what groups the file.** It is tempting to read
`,,,,,,,` as the record separator, and it works on the sample because the sample ends with one. It
fails on a file whose last student has no trailing separator, on a file a teacher trimmed by hand, and
on a file exported with the blank rows suppressed. **Column 1 is the grouping key**: a row with a
non-empty column 1 starts a student, a row with column 1 empty and column 6 non-empty adds another
guardian to the student above it, and an all-empty row is skipped without meaning anything. The two
sample students differ only in a trailing `a` on the surname (`Smith` / `Smitha`) — that is not an
accident of anonymising, it is the near-miss case the matcher has to keep apart.

**Four mapping decisions the owner made at booking, so a verifier does not re-open them.**

- **Advisor is the counselor.** `students[].counselor` already exists and the SIS simply calls the same
  person something else. It maps straight there, and the surname-first `Smith, Mike` is **flipped to
  `Mike Smith`** through the existing name parser, because `counselor.name` is one string that renders
  into Phase 5 outreach as it stands and *Smith, Mike* reads wrong in a sentence.
- **The `(M)` / `(H)` markers stay in the string, verbatim.** No `type` field, no normalisation, no
  stripping. They are what the teacher reads at a glance, they round-trip exactly, and nothing in this
  app branches on a phone number — outreach is `mailto:`.
- **A phone cell holding two numbers splits into two fields**, not one string. Hence `phone2` below.
- **`relation` is left empty.** `Mr.` and `Mrs.` are a title, not a relationship: a Mrs. on a roster
  line is as often a stepmother, an aunt or a grandmother as a mother, and `{{guardian.relation}}` is a
  Phase 5 merge field, so a wrong guess reaches an email. The honorific stays inside `guardian.name`
  where it was typed.

**What the file does not carry is a fact about the source, not a gap in this work order.** Accommodations,
IEP/504 status, medical alerts, behaviour plans and case managers are **not in this export and never will
be** — the owner receives those per student, through a different channel, and enters them on the student's
own card. So `supports` is not "data this importer declines to write for safety reasons"; there is nothing
in any of the eight columns that could reach it. Two consequences worth writing down:

- **A revised export with a new column does not change this.** If the SIS one day adds `Notes`, `Alerts`
  or `Flags`, mapping it anywhere under `supports` is a new work order and an owner decision, not an
  extension of this one. The failure mode is a column named something innocuous carrying a sentence about
  a seizure protocol into a field this app treats as ordinary.
- **The file itself stays non-sensitive, and that is a property worth keeping.** A contacts CSV sits in
  iCloud Drive, gets emailed to oneself, and gets opened on whatever machine is nearest. Because no plan
  or medical data is ever in it, none of that is a disclosure — which is exactly the position
  `docs/data-model.md` § Accommodations and Roll Call!'s `docs/FERPA.md` take about what may leave the
  app. An importer that learned to read a supports column would quietly end it.

**Two writing rules, and they are the ones that make a re-import safe.** *(Both are owner decisions.)*
**A non-empty imported value wins** — it overwrites what is on the record, because the file is the
SIS's answer and the SIS is the official record. **An empty cell never clears anything** — a column the
export happened to omit, or a cell nobody filled in, must not delete a phone number the teacher typed
by hand. "The file always wins" and "a blank is not a value" are not in tension: the second is what
stops the first from being a delete nobody asked for.

**`phone2` is a schema addition and it lands on the student as well as the guardian.** The owner chose
splitting over keeping the cell verbatim. The student column holds one number in the sample and the
guardian column holds two, but **it is one export writing both**, and a student cell that arrives with
two numbers next August must not behave differently from a guardian cell that does. One splitting rule,
both places, so there is no second behaviour to discover. *(The alternative, `students[].phone` alone
with a guardian-only `phone2`, is cheaper by two inputs in one dialog and buys an inconsistency that
would be found by a teacher rather than by a check.)* **A third number in a cell is appended to
`phone2` rather than dropped** — nothing imported is ever silently lost.

**Deliverables**

- **A new `src/roster-import.js`**, in the shape `src/roster.js` and `src/classes.js` share: a feature
  in its own file, driven by `data-*` hooks that `src/shell.js` routes to it, rows built with
  `createElement` rather than `innerHTML` — a guardian's name comes out of a school system and a student
  called `Bo <b>x</b>` has to be a student called `Bo <b>x</b>` — and refusals reported into its own
  dialog rather than onto the save chip. `src/roster.js` is 1,761 lines before this work order starts.
- **The dependency runs one way: `roster-import.js` imports from `roster.js`, never the reverse.**
  It takes `parseRosterLine`, `fullName` and `renderRoster` from there, plus `nameKey`, which this work
  order **exports** (it is module-private today). `roster.js` gains no import at all — `shell.js`
  dispatches the open, the way it already dispatches `data-roster-paste`. State the rule in the new
  file's header the way `src/categories.js` states its own.
- **A CSV reader that is a real one**: double-quoted fields, `""` as an escaped quote inside them,
  commas **and newlines** inside quotes, `\r\n` and `\n` both, and a leading BOM stripped. This app
  already *writes* CSV with a BOM and CRLF (`csvCell()` and `recordCsv()` in
  `src/attendance-report.js`), so a reader that chokes on either cannot read what its own sibling
  produces — which is an acceptance line below.
- **Grouping by column 1**, per the paragraph above. A continuation row *with no student above it* — a
  file that opens on a guardian — is reported in the preview as a skipped row saying why, not dropped
  in silence and not thrown on.
- **A header row detected and skipped either way.** Feed the first row's name cell to
  `parseRosterLine()` and read its `isHeader` — `HEADER_WORDS` already contains `student name`, so the
  reuse is exact, and a file with no header imports its first student normally.
- **The name cell parsed as `Last, First (Nickname) 'YY`**, in that order of operations: lift the
  `'YY` grad year off the end, lift the `(Nickname)` out of its parentheses, then hand *what is left* to
  `parseRosterLine()` — which is where `Last, First`, the surname particles and the suffixes are already
  solved, and the one place this project has agreed to solve them. `'28` stores as `2028`; a four-digit
  year stores as itself; the nickname stores without its parentheses; `gradYear` stays a **string**, per
  `docs/data-model.md`.
- **A phone splitter, shared by the student column and the guardian column.** Split on commas, trim,
  first → `phone`, second → `phone2`, anything beyond the second appended to `phone2` after `, `.
  Markers untouched.
- **`students[].phone`, `students[].phone2` and `guardians[].phone2` added** to `newStudent()`,
  `newGuardian()`, the student editor and the guardian card — a field the importer can write and the
  editor cannot show is a field the teacher cannot correct. The student's two go beside Email; the
  guardian's second goes directly under its first, labelled so the pair is obviously one person's two
  numbers.
- **Student matching on `nameKey(first, last)` across `doc.students`** — the whole year document, not
  the open class, because a student taught in two sections is one record with one set of contacts and
  that is the split `src/roster.js` opens by refusing to undo. Every preview row is therefore one of
  three things, in the paste box's own words: **new** · **already in this year, not in this class** ·
  **already in this class**.
- **Guardian matching by email first, then by name**, both trimmed and case-folded. A match merges into
  that guardian card; a non-match appends a new one. So importing an updated file does not stack four
  copies of one mother. **`preferred` is set on the first imported guardian only if the student has no
  guardian already flagged preferred** — the flag is what Phase 5's audience picker reads, and an import
  must not silently re-point it.
- **A preview that shows the split and what will be written**, opened on the file being chosen and
  before anything is saved. Per student: the parsed first and last in **two editable fields with the
  guess already in them** — the paste box's rule, for the same reason, and the nickname and grad year
  shown beside them — the state word from above, a one-line summary of the writes (`fills 4 fields ·
  changes 1 · adds 2 guardians`), and an **include** toggle. A count line under the list, in the same
  three-part sentence the paste box's uses.
- **Contacts are shown in the preview, not editable there.** The name is the guess; the contacts are
  the file. A row a teacher does not want is toggled off and its student's editor is one tap away
  afterwards. *(This is the line that keeps the dialog an M and not an L.)*
- **The commit**: new students appended to `doc.students` **and** to the open class's `roster`; students
  matched in the year but not in this class added to `cls.roster`; students already in the class left in
  place. Field writes follow the two rules above. **Nobody is ever removed from anything** — a student
  on the roster who is absent from the file is untouched, and removal stays the deliberate tap it is in
  the roster list.
- **A file input following `src/backup.js`'s `handleChosenFile()` pattern exactly**, including
  `accept=".csv,text/csv"` and **clearing `input.value` afterwards** — that is what makes choosing the
  *same* file twice fire `change` a second time, which is precisely what a teacher does after fixing a
  refusal in the spreadsheet.
- **The button on the Roster & contacts dialog**, in the existing `.roster-actions` row directly after
  `Paste a list of names`, hook `data-roster-import`, `aria-haspopup="dialog"`, and the dialog names the
  class it is importing into the way `rosterPasteClassName` does. The hint paragraph beneath gains one
  sentence saying what the file is.
- **Every refusal writes nothing.** Not a CSV, no readable rows, a row with fewer columns than the name
  cell needs, an unreadable file — each lands on the dialog's own error line, says what to do, and
  leaves the document at the same `rev`. There is no partial import.
- **An `announce()` naming what happened** in one sentence with both counts — added, and updated —
  because a screen-reader user cannot see twenty-five rows appear.
- **`docs/data-model.md`**: `phone`/`phone2` into the student sketch and `phone2` into the guardian
  sketch, plus a short section on this importer sited **beside § Importing from Roll Call!** and saying
  in one line how the two differ. Two importers in one app, one live and one `⏳ DEFERRED` (WO-2.7), is
  exactly the pair a reader will confuse.
- **`sw.js`**: the new module added to `SHELL` **and** `CACHE` bumped. A new `src/` file that is not in
  `SHELL` is a file the installed app does not have offline, and the failure is invisible on the desk.
- **`src/README.md`** gains its row, and **`src/shell.js`**'s hook block gains every new `data-*` hook,
  where the roster hooks are already listed.

**Out of scope** — `.xlsx` (the owner scoped this to CSV; `src/zip.js` makes it possible later and
nothing here should pre-build for it); the Roll Call! importer, which is WO-2.7's `⏳ DEFERRED` job and a
different file with a different shape; a paste-box variant of this dialog; **exporting** contacts;
editing contact fields inside the preview; inferring `relation` from an honorific; normalising or
reformatting a phone number; `tel:` links; any change to the paste path, to removal, to deletion, or to
`src/supports.js` — **this importer never writes a single field under `supports`**, and a future column
called `Notes` does not change that.

**Acceptance**
- [ ] The six sample rows above, imported into an empty class, produce exactly **two** students and no
      third — the all-empty row adds nobody and the two near-identical surnames stay two people.
- [ ] `Smith, Jonathan (John) '28` lands as `first` **Jonathan**, `last` **Smith**, `nickname` **John**,
      `gradYear` **2028**, `email` **SmithJo28@hwg.com**, `phone` **(508)123-4567 (H)**.
- [ ] That student's `counselor` reads name **Mike Smith** — flipped, not `Smith, Mike` — and email
      **SmithMi28@hwg.com**.
- [ ] That student has **two** guardians, in file order: `Mr. Tom Smith` with `phone`
      **(508) 234-5678 (M)**, `phone2` **(508) 345-6789 (H)** and email **SmithTom@aol.edu**; then
      `Mrs. Nina Smith` with **(508) 456-7890 (M)** / **(508) 567-8901 (H)** and
      **SmithNina@aol.edu**. Every marker is present and every `relation` is empty.
- [ ] Both students are on the open class's `roster` and in `doc.students`, and no other class's roster
      changed.
- [ ] **Importing the same file a second time changes nothing**: still two students, still two guardians
      each, no duplicate guardian card, and `preferred` still on the guardian it was on.
- [ ] Importing a file whose parent email for Tom Smith has changed **updates that guardian in place**
      rather than adding a third — matched on email where the email is the same, on name where it is not.
- [ ] A student whose record already carries a hand-typed `phone` and whose CSV phone cell is **empty**
      keeps the typed phone; the same student with a **different** non-empty CSV phone gets the CSV's.
- [ ] **Importing over a student who has an IEP plan, two accommodations, medical text, a behaviour plan
      and a case manager leaves that `supports` block identical, field for field** — and a student the
      import creates gets `newSupports()`'s defaults and nothing else. *(The one acceptance line here
      that is about the most consequential data in the app; the import has no path to it and this is
      what says so out loud.)*
- [ ] A student already in the year but in another class is **linked into the open class**, not copied:
      `doc.students` gains no record, and their contacts are updated on the one record both classes see.
- [ ] A file with a `Student Name,Student Email,…` header row imports the same two students; the sample
      above, which has none, imports its first student rather than swallowing it.
- [ ] A CSV written by `recordCsv()` in `src/attendance-report.js` — BOM, CRLF, quoted cells — is read
      back by this reader without a mangled first cell and without a stray `\r`.
- [ ] A row whose parent phone holds three comma-separated numbers keeps all three: two in `phone`
      and `phone2`, the third appended to `phone2`.
- [ ] A continuation row before any student row, a file that is not CSV, and an empty file each leave
      `doc.rev` unchanged and put a sentence on the dialog's error line.
- [ ] The preview shows every student before anything is written, its name fields are editable, an
      edit is what gets committed, and a row toggled off writes nothing at all.
- [ ] Choosing the **same file twice in a row** fires the preview both times.
- [ ] The student editor shows and saves the new phone fields, and the guardian card shows and saves
      the second one.
- [ ] `node tools/verify-shell.mjs` is green, including the 44px sweep over the new dialog and new
      assertions driving the parser over the fixture above.
- [ ] 👤 On the teaching iPad, in the installed app, on the deployed build: the file input opens Files
      and a `.csv` in iCloud Drive is selectable, the preview scrolls and its toggles are thumb-hittable,
      and a real section's export imports with the right number of students.

**Traps** — **Do not group on the blank row.** Column 1 is the key; the paragraph above says what breaks
otherwise, and the sample file will not catch it. **Do not split the file on commas before handling
quotes** — `"Smith, Jonathan (John) '28"` and `"(508) 234-5678 (M), (508) 345-6789 (H)"` are each one
cell, and a naive `split(',')` produces ten columns for row 1 and a roster of people called `Jonathan
(John) '28`. **Do not re-derive the `Last, First` split** — `parseRosterLine()` already carries the
particles, the suffixes and the header words, and a second parser in a second file is two answers to one
question. **An empty cell is not a value.** **Never write `supports`.** **Never remove a student.**
**Do not import this module from `src/roster.js`** — the cycle is avoidable and `shell.js` is where the
open is dispatched. **Clear the file input's value after every read.** **Bump `CACHE` in `sw.js` and add
the new file to `SHELL`.** **The preview is not a confirmation step** — it is the screen where a wrong
split is caught, and a dialog that only counted the rows would be counting the mistakes about to commit.

**Routing note** — a parser with a written fixture and mostly deterministic acceptance, which is the
shape that routes well; against that, it is app code across four files plus a new module, a schema
addition and a full harness run (~262s), and the 👤 line only the teacher can close. Nothing here needs
mutation proof over the harness, so the `codex-invoke.mjs` cap arithmetic that forced WO-2.34 to Claude
does not apply. **The one thing a dispatch must not do is decide the mapping** — the four decisions and
the two writing rules above are the owner's, taken at booking, and re-deriving any of them is out of
scope rather than a judgment call.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `docs/data-model.md`
  - `src/README.md`
  - `src/attendance-report.js`
  - `src/backup.js`
  - `src/categories.js`
  - `src/classes.js`
  - `src/roster.js`
  - `src/shell.js`
  - `src/supports.js`
  - `src/zip.js`
  - `tools/verify-shell.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**The specific anchors this work order names, so you do not have to hunt for them.** Line numbers
are from the tree as claimed on 2026-08-18 and will move under your own edits — they are a starting
point, not a citation.

- **`src/roster.js`** — the module you take from and must not make take from you:
  - `parseRosterLine()` (~line 245) with `HEADER_WORDS` (~224) and its `isHeader` return — the one
    place `Last, First`, the particles, the suffixes and the header words are solved. **Do not write
    a second one.**
  - `nameKey(first, last)` (~319) — module-private today. **This work order exports it.**
  - `fullName()` (~170) and `renderRoster()` (~477) — already exported.
  - `newStudent()` (~336) and `newGuardian()` (~354) — where `phone`, `phone2` and the guardian's
    `phone2` are added.
  - `openPaste()` (~1407) and everything under it — the preview whose rules the new dialog lifts:
    the two editable name fields with the guess already in them, the three-part count sentence, the
    `include` toggle, the `rosterPasteClassName` element that names the class. **Read it as a model
    and change none of it.** The paste path is the 7am fallback if the import refuses a file.
- **`src/categories.js`** header comment, first ~15 lines — the § "THE IMPORT RUNS ONE WAY" paragraph
  is literally the shape the new file's header is asked to state its own one-way rule in.
- **`src/backup.js`** — `handleChosenFile(input)` (~908) and its `const clear = () => { input.value
  = ''; }` (~911), plus the second `input.value = ''` at ~1208. The file-input pattern to follow
  exactly. `index.html` line ~2237 is the matching `<input type="file" … accept=…>` markup.
- **`src/attendance-report.js`** — `recordCsv()` (~552), `csvCell()` (~576) and the BOM comment at
  ~544. This is the writer your reader has an Acceptance line about reading back.
- **`sw.js`** — `CACHE` is at line 37 (`planbook-shell-v74` as claimed; bump it) and `SHELL` starts
  at line 51 (add the new module).
- **`src/shell.js`** — the hook block where the roster `data-*` hooks are already listed, and where
  `data-roster-paste` is dispatched. Every new hook goes there; `roster-import.js` is opened from
  here, never from `roster.js`.
- **`docs/data-model.md`** § Accommodations and § Importing from Roll Call! — the second is where
  the new importer section sits beside, with the one line saying how the two differ.
- **Roll Call! is not needed for this one.** There is no counterpart screen over there; the design
  lift is intra-repo, from `openPaste()`. (Roll Call! development is paused as of 2026-08-17 in any
  case — its files are frozen, so any pointer into it still resolves.)

---

## 3. Constraints — non-negotiable, and each one has already cost someone a day

Codex does not read `CLAUDE.md`. It reads [`../../AGENTS.md`](../../AGENTS.md), which points back at
it — but the pointer is not enough for the constraints that matter. The orchestrator inlines these
into every brief, verbatim:

- No dependencies, no framework, no bundler, no linter, no test framework. No `package.json`.
- Colors inline, not CSS variables. No dark mode anywhere — no `prefers-color-scheme`, no
  `[data-theme]`.
- Every new control gets a 44px minimum in the `@media (pointer: coarse)` block.
- `localStorage` prefix `planbook_`, UI preferences only — never student data.
- No merge field, log line, print surface, or export emits accommodation, medical, or plan data.
- `late` and `missing` are teacher-marked, never inferred from a date. Blank means ungraded.
- Empty categories redistribute their weight.
- Taken · dropped · not-taken-yet are three states. Everything counts recorded meetings, never
  calendar days.
- Stay inside the work order's **Out of scope** line.
- You may tick the boxes your own run closed, and update `plans/` and `TESTING.md` as you go. Two
  exceptions: **never tick a 👤 line** — it needs a real iPad and you do not have one — and leave the
  `CHANGELOG.md` entry to the teacher, who decides what a change means. Anything you do tick must be
  something you actually checked; a tick you cannot point at evidence for is worse than a blank box.

---

## 4. Verification

```
node tools/verify-shell.mjs      # measures what a stylesheet review gets wrong
node tools/wo-sweep.mjs          # the eight standing greps
```

Both must be green before you report. **Do not write a second harness** — if this work order
needs a check `verify-shell.mjs` cannot make, say so in your report as a proposed follow-up.
Add checks for what you build; a fixture that cannot express the failure is not evidence.

---

## 5. Done means these 19 lines, reported against one by one

1. The six sample rows above, imported into an empty class, produce exactly **two** students and no third — the all-empty row adds nobody and the two near-identical surnames stay two people.
2. `Smith, Jonathan (John) '28` lands as `first` **Jonathan**, `last` **Smith**, `nickname` **John**, `gradYear` **2028**, `email` **SmithJo28@hwg.com**, `phone` **(508)123-4567 (H)**.
3. That student's `counselor` reads name **Mike Smith** — flipped, not `Smith, Mike` — and email **SmithMi28@hwg.com**.
4. That student has **two** guardians, in file order: `Mr. Tom Smith` with `phone` **(508) 234-5678 (M)**, `phone2` **(508) 345-6789 (H)** and email **SmithTom@aol.edu**; then `Mrs. Nina Smith` with **(508) 456-7890 (M)** / **(508) 567-8901 (H)** and **SmithNina@aol.edu**. Every marker is present and every `relation` is empty.
5. Both students are on the open class's `roster` and in `doc.students`, and no other class's roster changed.
6. **Importing the same file a second time changes nothing**: still two students, still two guardians each, no duplicate guardian card, and `preferred` still on the guardian it was on.
7. Importing a file whose parent email for Tom Smith has changed **updates that guardian in place** rather than adding a third — matched on email where the email is the same, on name where it is not.
8. A student whose record already carries a hand-typed `phone` and whose CSV phone cell is **empty** keeps the typed phone; the same student with a **different** non-empty CSV phone gets the CSV's.
9. **Importing over a student who has an IEP plan, two accommodations, medical text, a behaviour plan and a case manager leaves that `supports` block identical, field for field** — and a student the import creates gets `newSupports()`'s defaults and nothing else. *(The one acceptance line here that is about the most consequential data in the app; the import has no path to it and this is what says so out loud.)*
10. A student already in the year but in another class is **linked into the open class**, not copied: `doc.students` gains no record, and their contacts are updated on the one record both classes see.
11. A file with a `Student Name,Student Email,…` header row imports the same two students; the sample above, which has none, imports its first student rather than swallowing it.
12. A CSV written by `recordCsv()` in `src/attendance-report.js` — BOM, CRLF, quoted cells — is read back by this reader without a mangled first cell and without a stray `\r`.
13. A row whose parent phone holds three comma-separated numbers keeps all three: two in `phone` and `phone2`, the third appended to `phone2`.
14. A continuation row before any student row, a file that is not CSV, and an empty file each leave `doc.rev` unchanged and put a sentence on the dialog's error line.
15. The preview shows every student before anything is written, its name fields are editable, an edit is what gets committed, and a row toggled off writes nothing at all.
16. Choosing the **same file twice in a row** fires the preview both times.
17. The student editor shows and saves the new phone fields, and the guardian card shows and saves the second one.
18. `node tools/verify-shell.mjs` is green, including the 44px sweep over the new dialog and new assertions driving the parser over the fixture above.
19. 👤 On the teaching iPad, in the installed app, on the deployed build: the file input opens Files and a `.csv` in iCloud Drive is selectable, the preview scrolls and its toggles are thumb-hittable, and a real section's export imports with the right number of students.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

