# WO-1.33 — the second fixture student fires no rules · implementation result

**Route** Claude (work-order-implementer), Opus tier
**Status written** ✅ DONE — 2026-08-28, by `node tools/wo-gate.mjs --tick WO-1.33`
**Mutation** applied, read and **reverted by name in the same shell command**; `git status --short`
and `grep -rn MUTATION src tools` are quoted in full at § 4 below.

---

## 0. The headline, because it changes how the Acceptance list reads

**This work order's premise was wrong, and the run says so in its own detail line.** WO-1.33 was
booked on *"the second fixture student … fires no rules at all, so a build that dropped the
`studentId` filter entirely would produce byte-identical output on this fixture. Every one of the
nineteen WO-5.1 checks would stay green."*

He fired **two**: `no-missing` and `attendance-window`, both praise, both falling straight out of the
nine clean scores and ten present meetings WO-5.1's own plant already gave him. Nothing had ever
printed it — the claim was reasoned from a fixture comment, not read off a run.

The consequence, measured rather than argued (§ 2, Acceptance line 2): cutting the `studentId` filter
turns **four** checks red, and one of the four is the **pre-existing** WO-5.1 `{{signals.list}}`
check. So the instrument was **not vacuous**. What it could not do was *say what it was proving* — the
only thing that moved was a joined string failing to equal another joined string, whose detail line
names no sentence, no student and no leak.

**The remedy the work order asked for is unchanged by that correction, and I built it as specified.**
What changed is one sentence of my reporting: the three new checks make the failure *legible and
deliberate* rather than *possible for the first time*. I did not re-scope the work order, and I did
not rewrite its "Why it exists" — the correction is recorded as an italic paren note under the work
order, in `tools/README.md`, in `TESTING.md` § WO-5.1, and in the harness comment at the point of
departure, which is where this repo keeps its scars.

---

## 1. What I built

One block of three `check()` call sites plus its fixture change, inserted **inside** the existing
§ *"the merge-field resolver (WO-5.1)"* in `tools/verify/merge-fields.mjs` — a fixture change and an
assertion, not a new section, exactly as **The shape to build** says. `src/` is untouched:
`git diff --stat src/` prints nothing.

Sequencing, which is the whole of the design:

1. `plant51` is **unchanged** — the second student still arrives with nine flat 80s. The existing
   plant check still reads `2 student(s), 9 assignment(s), 10 meeting(s), 4 entr(ies)`.
2. The existing sixteen-field draft check runs and its `subject`/`body` are captured into
   `beforeDraft`. **That is the "before" reading**, taken while he had nothing of his own.
3. A **second, explicit update** writes three of his nine existing score cells to `41` — under the
   `lowScoreBelow` line of 60 — which gives him `low-score-run` and, as a side effect, `grade-fell`.
4. The three new checks then ask, in order: does he really carry hits and does his own
   `{{signals.list}}` say them (line 1); is her sixteen-field draft byte-identical to `beforeDraft`
   (line 3, and the second Trap); and does any word of his reach her draft (line 2's instrument, and
   the first Trap).

**Why the hit is planted in step 3 and not in the plant:** it is the only arrangement in which
"byte-identical" is a *comparison of two readings taken in one run* rather than an assertion about a
build nobody executed. That is a decision the work order did not settle; it is argued in the comment
at the point of departure.

**Why three existing score cells and not a new row:** the third Trap. No new assignment, log entry,
attendance row, score bag or student — so the plant check's counts and the teardown's counts are the
numbers they always were.

---

## 2. Acceptance, line by line

### ☑ 1. The second fixture student carries at least one signal hit whose explanation string is unique in the repository

**Verified by run.** `final3.txt` (the definitive run on the delivered tree), line 1290:

```
PASS | the second fixture student carries signal hits of HIS OWN, and every sentence names him …
  :: {"firedBefore":["no-missing","attendance-window"],
      "firesNow":["grade-fell","low-score-run","no-missing","attendance-window"]}
```

The check asserts, in one condition: `low-score-run` is among his rules; he has at least one
sentence; **every** sentence contains his surname; his draft is not blocked; and his own
`{{signals.list}}` is exactly those sentences joined in the app's own `orderHits()` order.

On uniqueness, and stated precisely rather than favorably: the explanation strings are **composed at
run time** by `src/signals.js` from his name and his numbers, and are written into no file. The
searchable marker inside them is his surname `Wo51Orphan`, which `grep -rln "Wo51Orphan" .` (git
excluded) reported as occurring in **exactly one file in the repository —
`tools/verify/merge-fields.mjs`** — and in **no file the app serves**. That last clause is the one the
harness comment now claims, because this result file you are reading also contains the string, and a
claim about the whole repository would have been false the moment it was written. The claim that
matters is unaffected: nothing the resolver can read contains it.

### ☑ 2. Removing `{{signals.list}}`'s `studentId` filter turns the new assertion red; restoring it turns it green

**Verified by run, both directions.**

The mutation (`src/merge-fields.js`, the `signals.list` resolver):

```js
// before, and restored:
const mine = ctx.hits.filter((h) => h && ctx.student && h.studentId === ctx.student.id);
// mutated:
const mine = ctx.hits.filter((h) => h); /* MUTATION WO-1.33 — studentId filter deleted; revert with git checkout */
```

Mutated run (`mut.txt`): **`1197 checks · 1193 passed · 4 failed · 0 skipped`, exit 1.** The four:

1. *the second fixture student carries signal hits of HIS OWN* — red, because with the filter gone
   **his** `{{signals.list}}` picks up her sentences too, so it stops equalling his own hits.
2. *her sixteen-field draft is byte-identical either side of it* — red, and the detail line prints
   both drafts in full.
3. *NOT ONE WORD of his sentences reaches her draft* — red, detail line:
   `LEAKED: In WO-5.1 Outreach, Cal Wo51Orphan's grade fell 13.00 points … | … has 3 scores in a row
   under 60% … | … has nothing marked missing … | … attendance across the last 10 recorded meetings
   is 100.00% …`
4. the **pre-existing** WO-5.1 check *"`{{signals.list}}` … emits no plan reference"* —
   `{"rules":["behavior-window","grade-rose","high-score-run"],"matches":false,…}`. **This is the one
   that falsifies the work order's premise** (§ 0).

Restored: **`1197 checks · 1197 passed · 0 failed · 0 skipped`, exit 0** — run three times over
(`run2.txt`, `final.txt`, `final3.txt`).

**The mutation and its revert were a single shell command**: `node mutate.mjs && node
tools/verify-shell.mjs > mut.txt; git checkout -- src/merge-fields.js; git status --short; grep -rn
MUTATION src tools`. It was never held across a turn, and `git checkout` named the one file, never
`git checkout .`. Not one word of this report was written before the revert had run and been
verified.

### ☑ 3. The first student's sixteen-field draft resolves byte-identically to what it did before the fixture gained the hit

**Verified by run.** `final3.txt` line 1291:

```
PASS | and her sixteen-field draft is byte-identical either side of it — subject and body both …
  :: 850 characters, unchanged
```

Both halves are compared (`after.subject === beforeDraft.subject && after.body === beforeDraft.body`)
and `blocked === false` is asserted alongside, which is the sibling assertion the second Trap names.
The failure arm prints both drafts, so a future red says *what* moved.

### ☑ 4. The fixture teardown leaves nothing behind, and the foot check still reports zero of everything

**Verified by run.** `final3.txt` line 1307:

```
PASS | the WO-5.1 fixture came back off the document — class, two students, nine assignments, ten
attendance records, five log entries and every score bag …
  :: 0 class(es), 0 student(s), 0 assignment(s), 0 record(s), 0 log entr(ies) and 0 score bag(s)
     left behind; teacher name = "Ms Toomey" (wanted "Ms Toomey")
```

Unchanged from the pre-change tree, which is the point: the hit arrives by **overwriting three score
cells that already existed**, so the teardown counts exactly what it counted before.

### ☑ 5. `node tools/verify-shell.mjs` is green, and `tools/README.md`'s call-site count is recomputed by the sweep

**Both verified by run, on the delivered tree.**

```
1197 checks · 1197 passed · 0 failed · 0 skipped
35,697 lines · 29.8 lines per check · 408s
EXIT=0
```

```
node tools/wo-sweep.mjs
PASS | the recorded `check()` call-site count matches the harness
  :: 1182 `check()` call site(s) across 63 harness file(s), matching tools/README.md:1040 …
34 checks · 31 passed · 0 failed · 3 to review
```

The three REVIEWs are the three pre-existing ones (sensitive field names, due-date/late-missing,
mockup banner) — identical to the 34 · 31 · 0 · 3 `CLAUDE.md` records for the pre-change tree.

`tools/README.md`'s number was **recomputed by the sweep, never by arithmetic**: the sweep failed
first at *"the harness has 1182 `check()` call site(s) … up 3 on the 1179 recorded at
tools/README.md:1040"*, I wrote 1182 in, and it went green.

Also green after the changes: `node tools/wo-gate.mjs --audit` → PASS, and `--self-check` →
`24 of 24 plants were caught`.

**No 👤 line and no 📆 line exists in this work order**, so nothing here is owed to hardware or to the
calendar, and no box was left blank for that reason.

---

## 3. What I could not verify, and one measurement that is contaminated

- **Nothing needed a real iPad or human eyes.** This work order touches no screen, no stylesheet, no
  control, and no served file. There is no `@media (pointer: coarse)` obligation because no control
  was added.
- **The "before" run's LINE figure is not a before figure, and I will not report it as one.** I
  started the pre-change `verify-shell.mjs` run and then edited the fixture while it was still going.
  `ownLines` is read off the disk **in the summary**, after the last check, so that run printed
  `35,697 lines` — the *edited* file's length. Its **check count is unharmed** (`1194 checks · 1194
  passed · 0 failed · 0 skipped`, 407s, exit 0) because ESM modules are imported at process start,
  so what ran was the pre-change tree. The honest pre-change length is **35,593**, taken from `git`
  and independently corroborated by `TESTING.md` § WO-5.1, which records 35,593 for the same tree. I
  have written this trap into `tools/README.md` beside the count, because the next person doing a
  before/after measurement will hit it.
- **`firedBefore`'s two incidental rules are reported, not asserted.** The check asserts
  `low-score-run` — the hit I planted — by name, so the fixture cannot go quiet without going red.
  It does **not** assert `no-missing` and `attendance-window`; they are printed in the detail line
  every run. Asserting them would be asserting a threshold default from a fixture, which is the
  wrong place to pin one.

---

## 4. The two commands the brief asked for, verbatim

```
$ git status --short
 M TESTING.md
 M plans/work-orders/README.md
 M plans/work-orders/phase-1-shell-store-roster.md
 M tools/README.md
 M tools/verify/merge-fields.mjs
?? .claude/dispatch/WO-1.33-brief.md
?? .claude/dispatch/WO-1.33-status.md
```

`src/merge-fields.js` is **absent from that list**, which is the revert. `git diff --stat src/` prints
nothing at all.

```
$ grep -rn MUTATION src tools
src/shell.js:661:  A CLASS MUTATION ADDED LATER ADDS ITS LINE HERE. The cost of forgetting is a home screen showing
tools/README.md:1543:pre-WO-2.35 regexes could not see — `const WO235_MUTATION_KEYS = ['S']`, membership-tested below the
tools/verify/keys-legend-guards.mjs:71: * AND EVERY MUTATION IS ASSERTED TO HAVE APPLIED. A `replace()` whose needle has moved is a no-op:
tools/verify/keys-legend-guards.mjs:204:      broke ? 'THE MUTATION MATCHED NOTHING, so this case proved nothing rather than failing '
tools/verify/keys-legend-guards.mjs:251:      broke ? 'THE MUTATION MATCHED NOTHING, so this case proved nothing rather than failing '
tools/verify/keys-legend-guards.mjs:256:          + (gone ? '' : 'THE MUTATION LEFT `' + c.key + '` IN PLACE on one side or the other. ')
tools/verify/score-grid.mjs:1674:          SHORTCUT — IT WAS THE FIRST DRAFT HERE AND THE MUTATION PROVED IT VACUOUS. `.scores-key` is
tools/wo-gate.mjs:1867:// the pen. What proves this precondition still bites is MUTATION — delete the fold here, watch it go
```

All eight are pre-existing prose about mutation testing in unrelated files; none is in
`src/merge-fields.js` or in `tools/verify/merge-fields.mjs`. (`tools/README.md:1543` is the WO-2.35
line that used to sit at `:1511`; it moved because my paragraph was inserted above it. Its content is
untouched — `git diff tools/README.md` shows only insertions plus the one count line.)

---

## 5. Files changed

| File | What |
|---|---|
| `C:\dev\planbook\tools\verify\merge-fields.mjs` | **+107 / −3.** The three new `check()` sites, their fixture update and their comment block; and the ORPHAN plant comment amended to point forward at them instead of claiming he stays unremarkable |
| `C:\dev\planbook\tools\README.md` | The `check()` call-site sentence 1179 → **1182**, recomputed by the sweep; a WO-1.33 entry in the running list, with the mutation reading and the premise correction; and the `ownLines` trap from § 3 |
| `C:\dev\planbook\TESTING.md` | An italic paren note at the foot of § WO-5.1: that section is **twenty-two** call sites now, not nineteen, and the "fires no rules" premise it left behind is corrected |
| `C:\dev\planbook\plans\work-orders\phase-1-shell-store-roster.md` | Five Acceptance boxes ticked; status → ✅ DONE (by `--tick`); an italic paren note recording the premise correction and the design decision |
| `C:\dev\planbook\plans\work-orders\README.md` | Row 34's cell rewritten to the outcome; the Phase 1 dashboard row 28 → 29 and the total 119 → 120 (both written by `--tick`) |

Not touched, by rule: `CHANGELOG.md` (draft below, for the teacher to rewrite), any 👤 line, and
`src/` — nothing in the app changed.

`CLAUDE.md` and `AGENTS.md` were **deliberately left alone**. This adds no command, no convention and
no status a cold reader starts from; the one generalisable lesson (a fixture's own arithmetic is a
reading, not a premise) is recorded where it happened. If the owner disagrees, the paragraph to lift
is the one in `tools/README.md`, and `AGENTS.md` gets it in the same sitting.

---

## 6. Decisions the work order did not settle

1. **Where the hit is planted.** In a second update *after* the sixteen-field reading, not in
   `plant51`. Only this ordering makes "byte-identical" a comparison. The cost is one extra
   `store.update()` mid-section; the benefit is that Acceptance line 3 is measured rather than
   asserted.
2. **Which rule fires.** `low-score-run`, via three of his nine **existing** score cells set to 41.
   Rejected: a new behavior log entry (would move the plant check's `behavior === 4`), missing flags
   (would break the sibling check that asserts his `{{missing.count}}` resolves to `0` and his
   `{{missing.list}}` blocks), and absences (would have cost his `attendance-window` hit and told me
   less). Six of nine scores are untouched so his grade stays above the concern line — a smaller
   change that says the same thing.
3. **The sentences are recomputed page-side in the second `evalJs`, not interpolated from the
   first.** An explanation is engine-composed text; putting it inside a template literal is putting a
   string nobody controls where a backtick would end the program. The file's own plant comment warns
   about exactly this.
4. **The work order's title and "Why it exists" were left as written.** They are the record of what
   was believed when it was booked. Retitling is the owner's call; the correction is a note.

---

## 7. Proposed follow-ups — named, not done

- **The same defect class, one level up.** The thing that actually went wrong here is that a
  *premise about a fixture* was written down without ever being printed. Other sections almost
  certainly hold per-student or per-class filters whose fixtures cannot express the failure. A
  cheap version: every fixture that plants exactly one student behind a filtered read is a candidate.
  Worth one work order; it is not this one.
- **`tools/README.md`'s "Call sites and executed checks are permanently unequal" paragraph is
  stale.** It still opens `It is 808 − 824 = −16 on this tree`. The current gap is −15 (1182 sites,
  1197 results) and has not been brought forward since WO-2.38. I named the current gap in my own
  entry and did **not** rewrite that historical paragraph — it is a running narrative and editing it
  is a work order of its own.
- **WO-5.1 moved the count 1160 → 1179 with no entry of its own** — the only move in that list
  without one. My paragraph names where 1179 came from in passing; somebody who wants the full
  entry (sites, executed results, delivered-tree reading) still owes it.
- **WO-1.34 was not touched**, as instructed. `wo-sweep.mjs` § 20 claim 5's scanner is unchanged.

---

## 8. `CHANGELOG.md` draft — for the teacher to rewrite or discard

> **Verification.** The merge-field harness can now express the failure it was written to prevent.
> `{{signals.list}}` filters signal sentences to the student the draft is about; the second fixture
> student had nothing to say, so the section could tell that the filter had gone but could not name
> what leaked. He now carries sentences of his own, the other student's whole sixteen-field draft is
> asserted byte-identical either side of him gaining them, and his sentences and his surname are
> searched for across every resolved field rather than in one. Deleting the filter turns four checks
> red instead of one, and three of them say which sentence travelled.

---

## 9. Runs, in order, all of them read to exit

| # | Tree | Result |
|---|---|---|
| 1 | pre-change (fixture edited mid-run — see § 3) | `1194 checks · 1194 passed · 0 failed · 0 skipped`, 407s, exit 0 |
| 2 | with the three new checks | `1197 checks · 1197 passed · 0 failed · 0 skipped`, 406s, exit 0 |
| 3 | **mutated** — `studentId` filter deleted | `1197 checks · 1193 passed · 4 failed · 0 skipped`, **exit 1** |
| 4 | reverted | `1197 checks · 1197 passed · 0 failed · 0 skipped`, 408s, exit 0 |
| 5 | after a comment-only correction | `1197 checks · 1197 passed · 0 failed · 0 skipped`, 409s, exit 0 |
| 6 | **delivered tree, byte for byte** | `1197 checks · 1197 passed · 0 failed · 0 skipped`, 35,697 lines, 29.8 lines per check, **408s, exit 0** |

Runs 5 and 6 exist because I corrected comment prose in the harness after run 4, and a run whose
file changed underneath it is not a run of the delivered tree. Run 6 is the one cited in
`tools/README.md` and `TESTING.md`. Every figure above was read out of the run's own summary after
it exited; none is predicted.

`node tools/wo-sweep.mjs` — `34 checks · 31 passed · 0 failed · 3 to review`, the three pre-existing.
`node tools/wo-gate.mjs --audit` — PASS. `node tools/wo-gate.mjs --self-check` — 24 of 24.
