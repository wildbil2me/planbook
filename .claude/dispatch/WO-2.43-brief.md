# WO-2.43 — three more pointers in tools/README.md miss by little enough to be believed · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.43-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude, Opus tier. The deciding signal is that this row *produces prose* and
its *Traps are about judgment rather than mechanics* — two of `ROUTING.md`'s Claude bullets: the
deliverable is a phrasing in WO-2.39's established anchor idiom, and the nine historical numbers at
`:1454`/`:1461-62` look wrong on sight and must be left exactly as they are. The runner-up
consideration I set aside: at size XS with a single-hit-grep acceptance and `wo-sweep.mjs` as the
check, this reads mechanically checkable enough for Codex — but the Codex column's *conventions
already exist to follow* bullet fails on the one convention that matters here, because a
spec-following runner would read the job as "make the numbers right," which is precisely what the
Deliverables forbid. Not in the Ship 1 pre-routing table (**Ship** —), so there is no pre-route to
agree or disagree with. No Codex probe was run; the route never reached the Codex column.

**The orchestrator re-measured before dispatching, as the work order's dated note demands — and they
have moved a second time.** WO-2.44 landed above all three since the note was written. As of this
brief, measured on a clean tree at `602a6b5`:

| The row's table says | Its own +43 note says | **Where it actually is now** |
|---|---|---|
| `tools/README.md:1608` | `:1651` | **`:1672`** — `` `src/grade-engine.js:35-36` `` |
| `tools/README.md:1611` | `:1654` | **`:1675`** — the `scoreCell()` sentence, citing `` `:41-42` `` |
| `tools/README.md:1767` | `:1810` | **`:1831`** — `` `tools/README.md:783` `` |
| Traps' target `:830` | `:873` | **`:847`** — *"…made almost none. Three things about it are worth knowing."* |

Take those as a starting position, not as gospel: **your own edits will move the third one again**,
which is what the Traps' "resolve `:830` last" is about. Re-resolve every anchor by grep after your
final edit, and report the grep, not the number. Four measurements of the same three lines inside one
day is this row's entire thesis about hardcoded numbers in prose.

The confirmed referents in `src/grade-engine.js` (read-only — do not touch this file): the
`classId`/`termId` filters are at `:44-45`, and `scoreCell()`'s `studentId` lookup is at `:51-52`,
both exactly as the work order's table claims.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.43 — three more pointers in tools/README.md miss by little enough to be believed

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-17 · **Size** XS · **Depends on** nothing · **Blocks** nothing
**Closes roadmap** *(no box. Documentation, not app — the same call WO-2.39 and WO-2.41 made.)*

**Not a go-live blocker.** Booked 2026-08-17 out of WO-2.39's spot-check, which measured the remaining
debt rather than assuming it. **These three are the part of that measurement worth acting on**; the
rest is either historical by its own admission or scoped as a record of a reading, and WO-2.39's note
in § 11 says which is which.

**Why it exists.** WO-2.39's four references missed by thousands of lines, which is at least a *loud*
kind of wrong — a reader who lands eight hundred lines from anything relevant knows something is
broken. These three miss by 9, 10 and 47, into short files, and land on real code:

| At | Cites | Lands on | What the sentence is about |
|---|---|---|---|
| `tools/README.md:1608` | `src/grade-engine.js:35-36` | the tail of a comment and `numberOrZero()` | the `classId`/`termId` filters, at `:44-45` |
| `tools/README.md:1611` | `src/grade-engine.js:41-42` | `assignmentsFor()`'s signature | `scoreCell()`'s `studentId` lookup, at `:51-52` |
| `tools/README.md:1767` | `tools/README.md:783` | *"…made almost none. Three things about it are worth knowing."* | the call-site sentence, at `:830` |

*(2026-08-17, hours after booking: **every number in the table above is now wrong by exactly +43, and
this row's own subject is why.** WO-2.40 landed 45 insertions and 2 deletions at `tools/README.md:116`
the same afternoon, so the three references are at `:1651`, `:1654` and `:1810`, and the Traps' `:830`
target is at `:873`. The table is left as measured against `adb4fe6~1` rather than corrected, because
correcting it would make this note the third wrong number in a row about wrong numbers — **find all
three by text, not by line**: `grep -n "grade-engine.js:35-36" tools/README.md` for the first, the
`scoreCell()` sentence four lines below it for the second, `grep -n 'README.md:783' tools/README.md`
for the third, and `grep -n "made almost none" tools/README.md` for the target it should have named.
**Re-measure before dispatching, and expect WO-2.44 to shift them again** — its prose lands near
`tools/README.md:64`, above all three, which is why it goes first. One thing this shift makes sharper
than the row could: the `:783` self-reference was **correct as a number** the day it was typed, and a
hardcoded number in prose does not move with the text, so it now misses by 43 the sentence it was only
ever landing on by accident. A pointer that is right today and silently wrong tomorrow is the whole
case for the text anchor, made by this row's own file while the row sat unstarted.)*

**`:1611` is the one to look at.** `assignmentsFor()` is named in the same paragraph as `scoreCell()`,
so the pointer lands the reader on the *other* function the sentence mentions — plausible, adjacent,
and wrong, which is the shape that does not get caught. A three-thousand-line miss is reported by the
reader; a ten-line miss into a neighbouring function is absorbed as *"I must have misread this."*

**The third is free.** A file citing its own line number is the one case where the text anchor costs
nothing: the sentence it means is **already quoted verbatim by `wo-sweep.mjs` § 11**, so the anchor is
a string a standing check is already maintaining.

**Deliverables**
- **All three re-anchored to the target's own text**, in WO-2.39's idiom: a single-hit grep, plus a
  dated note of the number it used to be. Not corrected numbers — `src/grade-engine.js` is 270 lines
  and will move again, and WO-2.39's § 11 paragraph is the standing rule now.
- **Nothing else in the file re-audited.** WO-2.39 already reported all twelve; this row acts on three
  and leaves the nine WO-2.19-tree numbers alone, which its own note explains.

**Out of scope** — the nine numbers at `tools/README.md:1454` and `:1461-62`, which are a measurement
of the WO-2.19 tree and correct as history; the quoted failure text at `:1392`, which is a record of a
reading; the self-declaring reference at `:1252`. **All four categories are already documented as
staying numbers** — re-pointing any of them is undoing WO-2.39, not extending it. Also out of scope:
`:NNN` references in `src/` and in `TESTING.md`.

**Acceptance**
- [ ] All three references name their referent in the target file's own words, each a single-hit grep,
      re-resolved **after** the last edit this row makes.
- [ ] The old numbers survive as dated notes; no pointer was deleted.
- [ ] Nothing in the four out-of-scope categories changed — say so, with the diff as the evidence.
- [ ] `node tools/wo-sweep.mjs` green (§ 11's `tools/README.md:830` assertion included), and
      `git diff --stat -- src/` empty.

**Traps** — **Line numbers move while you work**, and this row's own edits to `tools/README.md` move
the self-reference: resolve `:830` last. **Do not "fix" the nine historical numbers**, however wrong
they look — WO-2.39 recorded the temptation and refused it, and the paragraph above them already says
they measure another tree. **`src/grade-engine.js` is app code and stays untouched**; the fix is in the
prose that points at it.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/grade-engine.js`
  - `tools/README.md`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**The idiom you are matching is already in this file — copy it, do not invent one.** WO-2.39 left
worked examples of a text-anchored pointer plus a dated note of the number it used to be. Two to read
before your first edit:

- `tools/README.md` around **`:1826-1829`** — *"grep the harness for `doc.students.push(person('wo38-s1',
  'Ashdown'` — one hit; cited as `tools/verify-shell.mjs:17574` until WO-2.39, by then thousands of
  lines short of it)"*. That is the shape: the grep string, the hit count, then the retired number with
  the date it was retired at.
- `tools/wo-sweep.mjs` **§ 11**, the ALLOWLIST bullet at **`:604-608`** — the same move made in a
  comment, and it states the reason out loud: the number *"lived in two files that had to be corrected
  in step or read as disagreeing, so neither ever was."*

Also read `tools/wo-sweep.mjs` § 11's closing paragraph (**`:626-628`**) before you touch the third
reference. It explains that § 11 reads its number out of `tools/README.md` **by the sentence rather
than by a marker comment**, and that rewording that sentence turns the check RED loudly. That is why
the work order calls the third anchor "free" — the string is already maintained by a standing check —
but it is also the one way this row can break the sweep. Anchor to that sentence; do not reword it.

Two scope notes worth restating because they are the easy mistakes here:

- **`node tools/verify-shell.mjs` is in § 4 below as a matter of form. This row changes no app code**,
  so the meaningful gate is `node tools/wo-sweep.mjs` plus an empty `git diff --stat -- src/`, which is
  what Acceptance line 4 actually names. If the browser harness cannot run in your sandbox, say so
  plainly as an environment report rather than a result — do not treat it as a failure of this row.
- **`plans/work-orders/phase-2-attendance.md` is yours to tick** (the Acceptance boxes your run
  closed, per § 3's last bullet). `CHANGELOG.md` is not. There are no 👤 lines in this row.

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

## 5. Done means these 4 lines, reported against one by one

1. All three references name their referent in the target file's own words, each a single-hit grep, re-resolved **after** the last edit this row makes.
2. The old numbers survive as dated notes; no pointer was deleted.
3. Nothing in the four out-of-scope categories changed — say so, with the diff as the evidence.
4. `node tools/wo-sweep.mjs` green (§ 11's `tools/README.md:830` assertion included), and `git diff --stat -- src/` empty.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

