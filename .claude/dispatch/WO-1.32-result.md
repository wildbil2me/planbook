# WO-1.32 — the sweep proves the name and not the shape · implementation result

**Route** Claude (work-order-implementer), Opus tier
**Work order** `plans/work-orders/phase-1-shell-store-roster.md` § WO-1.32 (line 2978)
**Status written** ✅ DONE — 2026-08-28, by `node tools/wo-gate.mjs --tick WO-1.32`
**Boxes** 6 of 6 ticked. No 👤 and no 📆 on this work order, so nothing is owed to hardware or to a date.

---

## The mutation is out

`grep -rn MUTATION src/ tools/` returns **eight hits, none of them in `src/merge-fields.js`** and
none of them mine — `src/shell.js:661`, `tools/README.md:1511`,
`tools/verify/keys-legend-guards.mjs:71, 204, 251, 256`, `tools/verify/score-grid.mjs:1674`,
`tools/wo-gate.mjs:1867`, all pre-existing prose about mutation testing in files this work order
never opened. `grep -c MUTATION src/merge-fields.js` prints **0**.

Four mutations were pasted in and taken out one at a time. Everything was `git add -A`-staged before
the first of them, so each `git checkout -- src/merge-fields.js` restored the staged file rather than
discarding unstaged work (`plans/dispatch-retro.md`'s WO-5.1 scar, and the standing note about
mutation tests clobbering unstaged edits). `git diff HEAD -- src/merge-fields.js` on the delivered
tree is **fourteen lines of header prose and nothing else** — no line of executable code in that file
moved.

---

## Against the Acceptance list, one by one

### 1. ✅ WO-5.1's actual mutation turns § 20 red, naming the line and the rule

Pasted verbatim from `plans/dispatch-retro.md:216-222` — the recorded corpse of WO-5.1's killed
dispatch — into the `if (!field)` arm of `resolveText()`:

```js
const root = { student: ctx.student, guardian: ctx.guardian, doc: ctx.doc };
const walked = name.split('.').reduce((o, k) => (o === null || o === undefined ? o : o[k]), root);
if (walked !== null && walked !== undefined && String(walked).trim()) return String(walked);
```

`node tools/wo-sweep.mjs` went to `34 checks · 30 passed · 1 failed · 3 to review`, with § 20 under
`FAILED`:

> `src/merge-fields.js:573 makes a DYNAMIC PROPERTY READ — ``[k]`` reads a property whose key is a
> value — and a dynamic property read is exactly what a whitelist is supposed to make impossible: the
> token gets to choose what is read, so every name the FIELDS list refuses is reachable again and the
> fence has become a filter. THIS IS THE WO-5.1 HOLE, not a style rule — … The line: const walked =
> name.split('').reduce((o, k) => (o === null || o === undefined ? o : o[k]), root); · 3 finding(s) in
> all, on line(s) 573 …`

`sed -n '573p' src/merge-fields.js` under the mutation was exactly that `const walked = …` line, so
**the cited number is the source file's own line number** and the quoted text is the line (with
`'.'` shown as `''`, because the string stripper has already run — that is stated in the section's
comment). Three findings on one line: the subscript, the split and the fold each trip
independently, which is why the mutation cannot be half-reverted into a pass.

### 2. ✅ The file as it stands today passes, with `FIELDS.filter(…)[0]` and both array literals intact

`node tools/wo-sweep.mjs` on the delivered tree, § 20 detail, read verbatim:

> `16 resolvable field(s), matching docs/data-model.md § Outreach templates name for name and in
> order; no support identifier, no writer and no dynamic property read in 221 line(s) of stripped
> code, and no store import; all 7 bracket subscript(s) are integer literals and there is no split,
> fold, eval, Function or Reflect.get among them; 9 refusal word(s) covering all 6 of WO-5.1's roots,
> none of them overlapping the whitelist`

The seven subscripts are the file's `…filter(…)[0]` lookups at source lines 202, 206, 210, 228 (twice),
294 and 472, all with an integer key. `const FIELDS = [`, `const REFUSED_WORDS = [`, `['behavior']`,
`[req.hit]` and every bare `[]` are untouched and are not read as subscripts, because the matcher
fires only in **member position** — after an identifier, a `)` or a `]`. The two regex character
classes that survive the crude stripper (`[^{}]` in `TOKEN`, `[^a-z]` in `refusalFor()`) sit after
`(` and `/` and so are likewise not subscripts. That limit is stated at the check rather than
claimed away.

### 3. ✅ `eval(`, `new Function(` and `Reflect.get(` each fail the same claim

Three further mutations, applied and reverted one at a time, each into the same `if (!field)` arm.
Each turned § 20 red on its own, quoting the line:

| mutation | § 20 said |
|---|---|
| `const walked = eval('ctx.' + name);` | `src/merge-fields.js:571 makes a DYNAMIC PROPERTY READ — it calls eval() — …` |
| `const walked = new Function('c', 'return c.' + name)(ctx);` | `src/merge-fields.js:571 makes a DYNAMIC PROPERTY READ — it builds a function out of text — …` |
| `const walked = Reflect.get(ctx.student \|\| {}, name);` | `src/merge-fields.js:571 makes a DYNAMIC PROPERTY READ — it calls Reflect.get(), which is a bracket subscript wearing a method name — …` |

All three are one claim, not three: they land in the same `dynamic[]` list and produce the same fault
string, so a reader who trips any of them is told the same thing.

### 4. ✅ The fault message names what the shape defeats

Quoted in full under item 1. It says a dynamic property read *"is exactly what a whitelist is supposed
to make impossible"*, spells out the consequence (*"the token gets to choose what is read, so every
name the FIELDS list refuses is reachable again and the fence has become a filter"*), names the incident
in capitals (*"THIS IS THE WO-5.1 HOLE, not a style rule"*), says what was actually disclosed
(`{{student.supports.medical}}` resolving to the roster string while claim 2 stayed green), gives the
repair (*"Answer by exact string over the whitelist and index nothing"*), and quotes the offending line.

### 5. ✅ The header sentence at line 30 is true of the sweep, and says which claim carries it

`src/merge-fields.js` line 30 onwards now credits § 20 with **two** claims and names them: claim 2 is
the NAME, claim 5 is the SHAPE, with the shape spelled out. A parenthesis under it records that the
paragraph was five days ahead of the check and why that mattered. This is the only change to
`src/merge-fields.js` in this work order, per its Out of scope line.

### 6. ✅ The sweep is green on a clean tree, and the call-site count is recomputed by the sweep

`node tools/wo-sweep.mjs` on the delivered tree (no mutation present):

```
34 checks · 31 passed · 0 failed · 3 to review
```

The three REVIEWs are the three that were there before this work order (sensitive field names outside
`src/backup.js`; due-date and late/missing on the same line; a mockup banner disagreeing with the
build) — unchanged in count and in content.

The call-site count was **recomputed by the sweep, not by arithmetic** — its own check printed:

> `PASS | the recorded ``check()`` call-site count matches the harness :: 1179 ``check()`` call
> site(s) across 63 harness file(s), matching tools/README.md:1040 — call sites, not executed checks;
> the gap is named there`

`tools/README.md` needed **no edit**: this work order adds no `check()` call site anywhere. § 20 is
one `check()` and stays one `check()` — the fifth claim is a fifth clause in the same call, which is
what the brief asked for ("a fifth claim inside the existing § 20 block — not a § 21, not a new file").

---

## Both verification commands, from output I read

```
node tools/verify-shell.mjs     EXIT=0
  1194 checks · 1194 passed · 0 failed · 0 skipped
  35,593 lines · 29.8 lines per check · 407s

node tools/wo-sweep.mjs         34 checks · 31 passed · 0 failed · 3 to review
```

`verify-shell.mjs` was run **twice to completion**, both times in the foreground and both times waited
out (407s each): once after the harness change and once again on the final tree, because the second
sitting of documentation edits touched `docs/data-model.md`, which several harness sections cite. Both
runs printed the numbers above and exited 0. No check was added to `verify-shell.mjs`: this work order
builds a grep, and a browser cannot assert the absence of a shape in a file. That is the division of
labour § 20's own comment sets out, not a gap.

Also run, green: `node tools/wo-gate.mjs --self-check` (`PASS | 24 of 24 plants were caught`),
`node tools/wo-gate.mjs --audit` (`PASS | every fragment matches exactly one roadmap box …`), and
`node tools/wo-gate.mjs WO-1.32` before building (`PASS | gates clear for WO-1.32`).

---

## Files changed

| file | what |
|---|---|
| `tools/wo-sweep.mjs` | § 20: the fifth claim, its prose, its fault message, its own non-vacuity anchor; the stripper's block-comment handling; the pass detail |
| `src/merge-fields.js` | the header paragraph at line 30 — prose only, no executable line moved |
| `sw.js` | `CACHE` `planbook-shell-v99` → `v100`, because `src/merge-fields.js` is in `SHELL` |
| `docs/data-model.md` | § Outreach templates: the sentence describing what § 20 asserts now names the shape half too |
| `plans/ROADMAP.md` | Phase 5's merge-field box: same sentence, same repair |
| `plans/dispatch-retro.md` | the WO-5.1 scar said *"nothing asserts it"* — now dated and corrected, with the recovery rule explicitly left standing |
| `plans/work-orders/phase-1-shell-store-roster.md` | six boxes ticked; status → ✅ DONE (by `--tick`) |
| `plans/work-orders/README.md` | row 33's Suggested cell → ✅ 2026-08-28; Phase 1 row and dashboard (by `--tick`) |
| `.claude/dispatch/WO-1.32-brief.md`, `-status.md`, `-result.md` | the dispatch record |

Nothing committed and nothing pushed — the brief did not say to.

---

## Decisions the work order did not settle, and which way I went

**1. A block comment is now blanked line for line instead of collapsed to a space.** The shared
stripper replaced each `/* … */` with a single `' '`, which collapses a multi-line comment onto one
line and shifts every line number after it. In a file that is two thirds comment, that meant the
`src/merge-fields.js:N` in § 20's own fault messages pointed hundreds of lines off — and Acceptance
line 1 asks the new fault to **name the line**. I changed the replacement to strip the comment's
non-newline characters and keep its newlines, so a cited number is the number a reader opens the file
to (verified: line 573 under the mutation is exactly the mutated line). This also corrects claim 2's
line numbers as a side effect. It costs nothing the plausibility guard was measuring — the stripped
length moves only by the comment's line count, 0.23 of the file against a 0.9 ceiling — and the change
is argued at the point of departure in § 20's header.

**2. A quoted-string subscript fails the claim, not just a computed one.** The work order says "the
subscript is not a literal", and a quoted key is technically a literal. I allow **integer literals
only**. The reasoning is at the check: this module answers by `===` over an array and has no use for
a property read by key at all, and `doc['students']` is one edit from `doc[name]`. The file contains
no quoted subscript today, so this costs nothing now and is the tighter of the two readings. If a
later work order genuinely needs one, it should argue for it rather than inherit permission silently.

**3. `.split(` and `reduce(` are flagged unconditionally in this one file**, not only when they
appear together. The work order's phrasing ("`reduce(` used to walk one") could be read as a
two-condition rule; a single condition is stricter, simpler to reason about, and each one goes red on
the mutation independently. The file's own header says there is no arithmetic in it at all, which is
what makes an unconditional `reduce(` rule landable here and nowhere else.

**4. The check name is unchanged.** "the merge-field resolver whitelists, and has no path into a
support block" is now more true than it was, and renaming it would move a string that `tools/` prose
and past run logs quote.

**5. Three cross-references outside the work order were repaired, and one deliberately was not
weakened.** `docs/data-model.md`, `plans/ROADMAP.md` and `plans/dispatch-retro.md` each described
§ 20 as asserting names only; the retro's said in as many words that the header's stronger sentence
*"is the claim that would have failed, and **nothing asserts it**"*, which stopped being true today.
I amended all three minimally. In the retro I added, explicitly, that this **changes nothing about
the recovery rule**: claim 5 is a claim about one file, every other module here indexes by computed
keys legitimately, and `grep -rn MUTATION` is still the first move on a dead dispatch. Undoing that
sentence would have been the trap — a narrow check reading as a general one.

---

## Temptations declined, and things left undone

- **Widening the check to `src/`.** Named in Traps and refused. It would fire on `src/signals.js`,
  `src/roster.js`, `src/grade-engine.js` and most of the rest, and a check that noisy gets switched
  off. It is a claim about the one file whose thesis is that it does not do this.
- **Touching `tools/verify/merge-fields.mjs`.** Out of scope; that is WO-1.33, already booked as
  row 34. Row 33's cell in the running order previously said the two "pair naturally … same sitting";
  I updated it to say row 34 did **not** ride along, so nobody reads a debt as paid.
- **Modelling regex literals in the stripper.** The section's comment already says it does not, and
  claim 5 inherits that limit rather than pretending to close it — stated at the check, with the
  specific consequence named (a character class sitting directly after an identifier would be misread
  as a subscript). Closing it properly means a tokeniser, which is a different work order.
- **A `TESTING.md` section.** This work order adds no screen, no control and no human-readable
  behaviour; there is nothing for a person to check on a device. WO-1.26's `TESTING.md` entry is a
  pointer about where harness checks go, not a checklist, and no equivalent is owed here.
- **The `CHANGELOG.md` entry**, left to the teacher by rule. Draft, if it is wanted:

  > **Verification** — `wo-sweep.mjs` § 20 gained a fifth claim: the merge-field resolver contains no
  > dynamic property read. It checked forbidden *names* before, and the path walk that shipped through
  > WO-5.1's killed dispatch — every accommodation and medical field resolving to the roster string —
  > named nothing, so the sweep was green over it. The forbidden thing was a shape. It now fails on a
  > bracket subscript whose key is not a literal, on a split or a fold, and on `eval`, `new Function`
  > and `Reflect.get`, and it says at the line that this is the WO-5.1 hole rather than a style rule.

## What I could not verify

Nothing on this Acceptance list needs a real iPad, a human eye or a calendar date, and I claim no
reading I did not take. Two honest limits on what the new claim proves, both stated at the check
itself rather than only here: it does not model regular-expression literals (inherited from the
shared stripper), and it is a claim about `src/merge-fields.js` alone — it says nothing about any
other file in the repository, by design.
