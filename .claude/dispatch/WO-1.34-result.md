# WO-1.34 — claim 5 reads member position, and three spellings walk around it · result

**Implementer** Claude (work-order-implementer), Opus tier · 2026-08-28
**Brief** `.claude/dispatch/WO-1.34-brief.md`
**Status written** ✅ DONE (by `node tools/wo-gate.mjs --tick WO-1.34`, all 6 Acceptance lines ticked)

---

## Files changed

| File | What |
|---|---|
| `tools/wo-sweep.mjs` | § 20 claim 5: whole-source scan, `?.` in the member class, a fourth family for a computed key, offset→line mapping; banner and claim-5 sub-comment rewritten with it (+103 / −22) |
| `src/merge-fields.js` | header comment only — claim 5's enumeration widened, "on any input" narrowed to the shapes the check actually holds, and a WO-1.34 parenthetical naming the spelling it does not cover (+17 / −3). **No code line changed.** |
| `sw.js` | `CACHE` `planbook-shell-v100` → `planbook-shell-v101` (paired with the `SHELL` edit above) |
| `plans/work-orders/phase-1-shell-store-roster.md` | six Acceptance boxes ticked, landing note added, status → ✅ DONE |
| `plans/work-orders/README.md` | dashboard recomputed by `--tick` (Phase 1 29→30, total 120→121) |

`CHANGELOG.md` not touched — draft below, for the teacher.
No scratch file was left in `tools/` or anywhere in the repo; the plant/revert harness lives in the
session scratchpad outside the tree.

---

## Acceptance, line by line

### 1. `root?.[name]`, `const { [name]: got } = root`, and a `[` opening its own line each turn § 20 red on their own, each naming the line — **MET**

Proved by running, not by reading the regex. Each plant is applied, the sweep run, and the file
restored **inside one process** (the WO-5.1 window is the width of one `execSync`), and each carries
a `/* MUTATION */` marker while it is in the tree. Each was planted alone. `FIELDS` stands in for the
work order's `root` so the planted file still parses; the shape under test is unchanged.

First, the premise, against the **unwidened** check — all three passed green, which is what this work
order exists for:

```
=== plant: optional-chain === PASS | the merge-field resolver whitelists … all 7 bracket subscript(s) are integer literals …
=== plant: computed-key   === PASS | …
=== plant: own-line       === PASS | …
```

(Each also showed `1 failed` — that failure is § 9, *every SHELL file change is paired with a CACHE
bump*, an artifact of touching a `SHELL` file with the plant in place. It is not § 20.)

Then against the widened check, on the delivered tree:

```
=== plant: optional-chain in src/merge-fields.js ===
FAIL | the merge-field resolver whitelists, and has no path into a support block  :: src/merge-fields.js:494
  makes a DYNAMIC PROPERTY READ — `?.[name]` reads a property whose key is a value, and an optional chain
  in front of a subscript is still a subscript — … The line: const probe = FIELDS?.[name];
34 checks · 30 passed · 1 failed · 3 to review
=== restored byte-identical: true · MUTATION marker present after restore: false ===

=== plant: computed-key in src/merge-fields.js ===
FAIL | … src/merge-fields.js:494 makes a DYNAMIC PROPERTY READ — `[name]:` is a COMPUTED KEY — a
  destructuring pattern or an object literal naming a property with a value, which hands the token the
  same choice a subscript does — … The line: const { [name]: got } = FIELDS;
34 checks · 30 passed · 1 failed · 3 to review
=== restored byte-identical: true · MUTATION marker present after restore: false ===

=== plant: own-line in src/merge-fields.js ===
FAIL | … src/merge-fields.js:495 makes a DYNAMIC PROPERTY READ — `[name]` reads a property whose key is a
  value — … The line: const probe = FIELDS ⏎ [name];
34 checks · 30 passed · 1 failed · 3 to review
=== restored byte-identical: true · MUTATION marker present after restore: false ===
```

The cited numbers are real lines of the planted file: `function fieldNamed(name) {` is at
`src/merge-fields.js:493`, the plant is inserted directly under it, so :494 is the planted line and
:495 is the continuation line the `[` opens. Each finding names its own reason in the fault text
(three different `why` strings), not "matched".

Two **controls** were run for the same reason, and must stay green — they do:

```
=== plant: safe-array (an array literal opening its own line after a `(`) === PASS | … 34 checks · 31 passed · 0 failed
=== plant: safe-ternary (`name ? [name] : []`)                            === PASS | … 34 checks · 31 passed · 0 failed
```

### 2. The file as it stands passes, with all seven integer-literal subscripts, both array literals, `['behavior']` and both regex character classes intact — **MET**

The sweep on the delivered tree:

```
PASS | the merge-field resolver whitelists, and has no path into a support block  :: 16 resolvable field(s),
  … no support identifier, no writer and no dynamic property read in 221 line(s) of stripped code, and no
  store import; all 7 bracket subscript(s) in member position are integer literals, 0 computed key(s) name a
  property with a value, and there is no split, fold, eval, Function or Reflect.get among them; …
```

The count alone would not settle *which* seven, so I ran the old per-line pattern and the new
whole-source pattern side by side over the same stripped source and diffed the findings:

```
OLD per-line subscripts (7):        NEW whole-source subscripts (7):
  210 [0]  214 [0]  218 [0]           210 [0]  214 [0]  218 [0]
  236 [0]  236 [0]  302 [0]           236 [0]  236 [0]  302 [0]
  480 [0]                             480 [0]
identical: true
NEW computed keys (0): (none)
exempt line 180: const REFUSED_WORDS = ['', '', …      exempt line 320: const FIELDS = [
exempt line 261: : (req.hit ? [req.hit] : []);         exempt line 464: … entriesOfKind(…, [''])   ← ['behavior']
exempt line 504: const TOKEN = /\{\{([^{}]*)\}\}/g;    exempt line 511: … .replace(/[^a-z]/g, '');
```

(Those line numbers are of the file *before* my header edit, which added 14 comment lines above them;
the sweep's own run after the edit reports the same seven.) The two regex character classes, both
array literals, `['behavior']` and the line-261 ternary all stay out of the fault: the member class
in front of the bracket was widened by `?.` and by whitespace, never loosened to "anything".

### 3. WO-5.1's own mutation and `eval(` · `new Function(` · `Reflect.get(` still fail, citing a real line — **MET**

```
=== plant: wo-5.1 ===        FAIL | … src/merge-fields.js:494 … `[k]` reads a property whose key is a value …
   (planted line: const walked = name.split('.').reduce((o, k) => o[k], FIELDS);)
=== plant: eval ===          FAIL | … src/merge-fields.js:494 … it calls eval() …
=== plant: new-function ===  FAIL | … src/merge-fields.js:494 … it builds a function out of text …
=== plant: reflect-get ===   FAIL | … src/merge-fields.js:494 … it calls Reflect.get(), which is a bracket
                                    subscript wearing a method name …
each: 34 checks · 30 passed · 1 failed · 3 to review · restored byte-identical: true
```

:494 is the planted line in every case (`fieldNamed` at :493). Line numbers now come from counting
newlines in front of a match offset rather than from a row index, which is why the banner comment
gained a sentence saying WO-1.32's line-for-line comment blanking is load-bearing twice over.

### 4. The non-vacuity anchor still fires — **MET**

Planted in `tools/wo-sweep.mjs` itself: `SUBSCRIPT` replaced with a pattern that can never match
(`/ never /g`), the real one parked on an unused const behind a `/* MUTATION */` marker.

```
=== plant: blind-scanner in tools/wo-sweep.mjs ===
FAIL | the merge-field resolver whitelists, and has no path into a support block  :: no bracket subscript of
  any kind was found in src/merge-fields.js — the file holds several `…filter(…)[0]` lookups, so the pattern
  that reads them has stopped matching and the no-dynamic-property-read claim is being made over nothing
  rather than being satisfied
34 checks · 30 passed · 1 failed · 3 to review
=== restored byte-identical: true · MUTATION marker present after restore: false ===
```

### 5. `src/merge-fields.js`'s "on any input" is true of the check, or names what it does not cover — and `CACHE` moved — **MET, by doing both halves**

I widened the check for the three spellings **and** narrowed the sentence, because the sentence
cannot be made true by any grep over a crude comment strip and the Traps line forbids the parser that
would settle it. The enumeration now reads *"no bracket subscript whose key is not an integer literal,
wherever in the file the `[` sits and whether or not a `?.` stands in front of it, no computed key,
no split, no fold, no `eval`, no `new Function`, no `Reflect.get` … the two greps prove that none of
those shapes is here on any input"* — a claim about the shapes, which is exactly what the check
holds. A new parenthetical under it names the three closed spellings and the honest remaining hole:

> `Object.entries(root).find(([k]) => k === name)[1]` passes today, because the destructured `[k]` is
> not in member position and the surviving subscript is an integer literal.

The same example is in § 20's banner, so a reader of either file meets it. **The sentence the work
order calls `src/merge-fields.js:37` now sits at :38** (the paragraph spans 34–39), because the edit
added two lines above it — worth knowing before grepping for the old line number.

`CACHE` moved `planbook-shell-v100` → `planbook-shell-v101` (`sw.js:37`), and § 9 reports it:
`PASS | every SHELL file change is paired with a CACHE bump :: planbook-shell-v101 is not in any
commit yet — the bump is uncommitted, which is the rule being followed`.

### 6. `node tools/wo-sweep.mjs` green, and `tools/README.md`'s call-site count recomputed by the sweep — **MET**

```
34 checks · 31 passed · 0 failed · 3 to review
PASS | the recorded `check()` call-site count matches the harness  :: 1182 `check()` call site(s) across 63
  harness file(s), matching tools/README.md:1040 — call sites, not executed checks; the gap is named there
PASS | one `check()` call per line in the harness  :: 1182 call-site line(s) across the harness …
```

The three REVIEW items are the same three as on the pre-dispatch tree (sensitive names outside
`src/backup.js`, due-date/late-missing colocation, the mockup-banner mismatch) — nothing I changed
added or removed one. The count is 1182 and did not move: nothing here touches `verify-shell.mjs` or
`tools/verify/`, so no README edit was needed. The sweep is what says so, not arithmetic.

---

## Everything else that was run

```
node tools/verify-shell.mjs     → 1197 checks · 1197 passed · 0 failed · 0 skipped
                                  35,697 lines · 29.8 lines per check · 406s · exit 0
node tools/wo-sweep.mjs         → 34 checks · 31 passed · 0 failed · 3 to review
node tools/wo-gate.mjs --audit  → PASS | every fragment matches exactly one roadmap box …
                                  overall row 58/81 · rows sum 58/81
node tools/wo-gate.mjs --self-check → PASS | 24 of 24 plants were caught.
```

`verify-shell.mjs` was backgrounded and **waited on**; the numbers above are from its finished log
and its exit code, not from a run still in flight.

**Mutation hygiene.** Every plant was reverted inside the process that made it and asserted
byte-identical on the way out. Final state:

```
$ grep -rn "MUTATION" src/merge-fields.js tools/wo-sweep.mjs sw.js \
      plans/work-orders/phase-1-shell-store-roster.md plans/work-orders/README.md
(no matches — exit 1)
   [the same grep widened to plans/work-orders/*.md returns one hit, phase-2-attendance.md:3452,
    which is pre-existing prose about WO-2.35's own mutation proof and none of my doing]
$ git diff | grep "^+.*MUTATION"
(no matches — exit 1)
$ git diff --numstat
2   2   plans/work-orders/README.md
26  7   plans/work-orders/phase-1-shell-store-roster.md
17  3   src/merge-fields.js
1   1   sw.js
103 22  tools/wo-sweep.mjs
```

The only added lines containing `?.[name]`, `const { [name]: got }` or `[k]` are inside the
Acceptance list and two block comments — verified by reading the `+` lines of the diff.

---

## Decisions the work order did not settle

1. **The computed-key pattern is anchored on the `{` or `,` in front of the bracket, not on `]`
   followed by `:`.** The work order's shape-to-build says *"`]` followed by `:` … nothing in this
   file is a bracket group followed by a colon."* That is not so:
   `src/merge-fields.js:261` is `: (req.hit ? [req.hit] : []);` — a **ternary**, whose `]` is
   followed by ` : `. A bare `]\s*:` pattern turns today's file red on a line that reads no property
   at all, which fails Acceptance 2. So the pattern is `/[{,]\s*\[([^\]\n]*)\]\s*:/` — a computed key
   is a bracket group after a `{` or a `,` and before a `:`, which is what a destructuring pattern
   and an object literal both look like and what a ternary never does. Both intended spellings still
   go red (proved above) and the ternary stays green (control plant `safe-ternary`). The departure
   and its reason are written at the point of departure, in claim 5's sub-comment, and again in the
   work order's landing note.
2. **Integer keys are still exempt in both new families.** `root?.[0]` and `{ [0]: x }` do not fire,
   for claim 5's existing reason: a literal key is not the token choosing. Only non-integer keys are
   findings.
3. **The computed-key family has no standing non-vacuity anchor and the comment says so out loud.**
   The subscript scanner has one (the file's seven `…filter(…)[0]` lookups, so zero found is a
   fault); there is no computed key anywhere in `src/merge-fields.js` to anchor the second pattern
   on, and inventing a decoy would be worse. It is proved by mutation only, and claim 5's comment
   states that limit rather than borrowing the subscript count's confidence.
4. **The fault text for a straddling finding.** A finding can now cross a newline, so the citation is
   the line the `[` is on — where a reader's eye needs to land — and "The line:" prints the stripped
   lines the match covers, joined with ` ⏎ ` (`const probe = FIELDS ⏎ [name];`). The alternative,
   printing only the `[`-line, prints `[name];` alone and explains nothing.

## Nothing was left undone, but three temptations were declined

- **`plans/work-orders/phase-1-shell-store-roster.md:3037–3044` (WO-1.32's landing note) and
  `CHANGELOG.md:60–70` both describe claim 5 as reading "member position, one line at a time" and
  those three spellings as passing.** Both are dated records of what was true when WO-1.32 landed,
  both name WO-1.34 as the booking, and WO-1.34's own landing note now sits directly below the first
  of them saying all three are closed. I left them alone: they are another work order's history, and
  the CHANGELOG is the teacher's. **If they should read as history rather than as state, that is a
  one-line edit each and it is the teacher's call.**
- **A tokeniser.** Not built, not started, not needed — the three spellings fall to two regex edits
  and a whole-source scan.
- **Any other § of `wo-sweep.mjs`**, and any behavioural change to `src/merge-fields.js`. Its code
  is byte-identical; only the header comment moved.

## What I could not verify

- **Nothing here needs an iPad or human eyes.** This work order has no 👤 and no 📆 line, adds no
  control and no screen, and changes no rendered pixel — `src/merge-fields.js` has no screen at all.
  The `CACHE` bump means an installed app will fetch the new shell, which is the rule being followed
  rather than something to read on hardware.
- **The sweep was run on a tree with uncommitted changes** (mine). "Green on a clean tree" is met in
  the sense that matters — no mutation, no scratch file, 0 failed — but nothing is committed, per
  the brief.

---

## Draft CHANGELOG entry — for the teacher, not written by me

> **§ 20's claim 5 now reads the whole file, and the header stopped overclaiming.** The check that
> forbids a dynamic property read in the merge-field resolver scanned member position one line at a
> time, and three spellings walked around it: `root?.[name]`, a computed destructuring key, and a
> `[` that opens its own line. None is a shape this codebase writes, so this was never a live hole —
> what it was, was a *sentence*. `src/merge-fields.js` claimed the greps prove nothing there could
> resolve a support field **on any input**, and three spellings said otherwise. Both ends were
> answered: the scanner now reads the stripped source whole, with the member class widened by `?.`
> and by newlines and a fourth family for a computed key, still mapping every finding back to a real
> line number — and the header now names the shape a grep over a crude strip still cannot see,
> instead of claiming all of them. A header that overclaims is the failure WO-1.32 was booked to fix,
> and it got no exemption one layer up.

---
---

# WO-1.34 — correction round · 2026-08-28

**Implementer** Claude (work-order-implementer), Opus tier — same session lineage, second pass
**Trigger** the verifier's ❌ on Acceptance line 5, plus two non-blocking items it raised
**Round-1 report is above and is left untouched**, including the parts this round supersedes: its
Acceptance-5 claim was wrong and the record of it being wrong is the point.

## The verdict, restated so the fix can be checked against it

The verifier planted two spellings of *the very shape line 5's enumeration named* and both passed
green:

| Plant | Why round 1 missed it |
|---|---|
| `return root[` ⏎ `    name] \|\| null;` | the gap **in front** of the `[` was widened to `\s*` (crossing newlines); the **key class** was left at `[^\]\n]*`, still newline-forbidding |
| `return { ...root }[name] \|\| null;` | `}` was not in the member class `[A-Za-z0-9_$)\]]` |

Both are bracket subscripts whose key is not an integer literal. The first is in member position,
hard against its identifier, so the paragraph's own explanation did not excuse it. **The tick was
ahead of its evidence and the ❌ is correct.**

## 1. Which remedy, and why

**Both, and that is not hedging — they answer two different halves.** The verifier offered a choice:
widen the check, or drop the universal for a sentence naming what is covered. I did both, because
after widening the check the sentence *still* could not be universal, and the round-1 mistake was
precisely believing that widening bought the right to keep a universal.

- **Widened the check** for both plants, because both fall to a character class and a bounded key —
  no tokeniser, no parser, and today's file does not move (see § 3).
- **Rewrote the sentence positively**, because the round-1 wording — *"no bracket subscript whose key
  is not an integer literal, **wherever in the file the `[` sits**"* — is the same universal claim in
  a smaller box. It retired *"on any input"* and then re-pitched it one layer down, and **that is the
  gap the verifier's two plants walked through.** A universal with an exception hung off the end is
  not a narrower claim; it is the same claim with a footnote, and a reader believes the sentence.

So `src/merge-fields.js`'s header now reads as a **list of spellings covered**, states the limit as a
limit, and tells the reader what to conclude:

> **Claim 5** is the SHAPE, and it is a LIST OF SPELLINGS rather than a claim about every way
> JavaScript can read a property. What it asserts is absent from this file's code, by name: a bracket
> subscript in member position whose key is not an integer literal — after an identifier, a `)`, a
> `]` or a `}`, through an optional `?.`, and with a newline allowed on either side of the `[` — a
> computed key in a destructuring pattern or an object literal, a split, a fold, `eval`,
> `new Function`, `Reflect.get`. […] What they do not prove — and a grep over a crude comment strip
> cannot — is that no other spelling gets past. `Object.entries(root).find(([k]) => k === name)[1]`
> reads a property by a token-named key and passes § 20 today […] `Object.values`, a `for…in` that
> compares and returns, and a `Map` built out of the object are the same story. So read claim 5 as
> *these spellings are absent*, never as *no dynamic read is possible*.

The phrase *"on any input"* survives nowhere in that file. What replaced its job is *"none of THOSE
spellings is in this file whatever it comes to contain"* — which keeps the structural-over-fixture
argument (it holds over the file's future contents) without claiming coverage of shapes it does not
scan. The same treatment went into `tools/wo-sweep.mjs` § 20: claim 5's one-line summary now says it
is **a LIST rather than a universal** and points at the paragraph that names what is off it, and a
new banner paragraph records both verifier plants and the lesson.

**The code change.** Two patterns and one span:

```js
- const SUBSCRIPT = /[A-Za-z0-9_$)\]](?:\s*\?\.)?\s*\[([^\]\n]*)\]/g;
- const COMPUTED_KEY = /[{,]\s*\[([^\]\n]*)\]\s*:/g;
+ const SUBSCRIPT = /[A-Za-z0-9_$)\]}](?:\s*\?\.)?\s*\[([^\]]*)\]/g;
+ const COMPUTED_KEY = /[{,]\s*\[([^\]]*)\]\s*:/g;
```

`}` joins the member class; the key is bounded by its own `]` rather than by end-of-line. A `flat()`
helper collapses a straddling key's whitespace for the fault text, and each finding now carries a
`to` line so `spanText()` prints the whole match rather than stopping at the `[`. **The rule the
Traps line states is intact:** the gap in front of the bracket still crosses only *whitespace*, and
the class in front of it is still the member class — widened by one character, never loosened to
"anything".

## 2. Re-planted, and shown going red

Thirteen plants, each applied and reverted **inside one `execSync` window**, each carrying a
`/* MUTATION */` marker while in the tree, each asserted byte-identical on the way out. Verbatim from
the run (fault text truncated at the reason; full text names the WO-5.1 hole as before):

```
=== plant: optional-chain ===       FAIL :: src/merge-fields.js:505 … `?.[name]` reads a property whose
                                    key is a value, and an optional chain in front of a subscript is
                                    still a subscript        34 checks · 30 passed · 1 failed · 3 to review
=== plant: computed-key ===         FAIL :: src/merge-fields.js:505 … `[name]:` is a COMPUTED KEY …
=== plant: own-line ===             FAIL :: src/merge-fields.js:506 … `[name]` reads a property whose key
                                    is a value …
=== plant: newline-in-brackets ===  FAIL :: src/merge-fields.js:505 … `[name]` reads a property whose key
                                    is a value …          ← the verifier's first plant
=== plant: after-brace ===          FAIL :: src/merge-fields.js:505 … `[name]` reads a property whose key
                                    is a value …          ← the verifier's second plant
=== plant: wo-5.1 ===               FAIL :: src/merge-fields.js:505 … `[k]` reads a property whose key is
                                    a value …
=== plant: eval ===                 FAIL :: src/merge-fields.js:505 … it calls eval() …
=== plant: new-function ===         FAIL :: src/merge-fields.js:505 … it builds a function out of text …
=== plant: reflect-get ===          FAIL :: src/merge-fields.js:505 … it calls Reflect.get(), which is a
                                    bracket subscript wearing a method name …
=== plant: blind-scanner ===        FAIL :: no bracket subscript of any kind was found in
                                    src/merge-fields.js — the file holds several `…filter(…)[0]` lookups,
                                    so the pattern that reads them has stopped matching …
```

Every one: `restored byte-identical: true · marker gone: true`. `function fieldNamed(name) {` is at
`src/merge-fields.js:504` on the delivered tree, the plant goes directly under it, so **:505 is the
planted line and :506 is the continuation line the `[` opens** — the citations are real lines of the
planted file, which is Acceptance 3's second clause.

The straddling faults print the span, not a fragment:

```
newline-in-brackets  cite src/merge-fields.js:505   The line: const root = FIELDS; return root[ ⏎ name] || null;
after-brace          cite src/merge-fields.js:505   The line: const root = { }; return { ...root }[name] || null;
own-line             cite src/merge-fields.js:506   The line: const probe = FIELDS ⏎ [name];
```

Round 1's `spanText(s.from, s.line)` would have stopped **before** the `]` on the newline-in-brackets
plant; `spanText(s.from, s.to)` is the fix and it is why `own-line`'s text is unchanged (its span
already ended at the `[` line).

**Three controls, which must stay green and do** — `34 checks · 31 passed · 0 failed · 3 to review`
on each:

```
=== plant: safe-array ===            an array literal opening its own line after a `(`
=== plant: safe-ternary ===          `name ? [name] : []`
=== plant: safe-multiline-array ===  a bare `[` … `]` spanning three lines   ← added this round,
                                     because a key free to cross newlines is exactly what could have
                                     started swallowing a multi-line array literal
```

## 3. Exemptions, re-checked by diff rather than by count

A count of seven proves nothing about *which* seven, so I ran the round-1 pattern and the widened
pattern over the same stripped source and compared the findings directly:

```
OLD sub 7                NEW sub 7
  235 ")[0]"               235 ")[0]"
  239 ")[0]"               239 ")[0]"
  243 ")[0]"               243 ")[0]"
  261 ")[0]"               261 ")[0]"
  261 "l[0]"               261 "l[0]"
  327 ")[0]"               327 ")[0]"
  505 ")[0]"               505 ")[0]"
OLD ck 0                 NEW ck 0
```

Identical, all integer literals. Neither `}` in the member class nor a newline-tolerant key reaches
`REFUSED_WORDS`'s array literal, `const FIELDS = [`, `['behavior']`, `[^{}]` in `TOKEN` or `[^a-z]`
in `refusalFor()` — those sit after `=`, `,`, `:`, `?`, `/` or `(`, none of which is in the member
class. The sweep's own PASS line says the same on the delivered tree: *"all 7 bracket subscript(s) in
member position are integer literals, 0 computed key(s)…"*.

**The ternary is at `src/merge-fields.js:286`, not 275** — my own header edit this round moved it
again.

## 4. The stale citation, and why it is now cited by function

`tools/wo-sweep.mjs` said the ternary "is on line 261". Round 1 moved it to 275 — which was **already
wrong when I wrote it**, because I fixed the number before making the header edit that moved it
again, and did not re-check. That is the second rot of the same number inside one work order.

So I did not fix the number. **I removed it**, and the comment now names the ternary by its function
with a note saying why:

> …because `req.hit ? [req.hit] : []` is a ternary and not a key, and it is in `contextOf()` in the
> file this runs over. NAMED BY ITS FUNCTION AND NOT BY ITS LINE ON PURPOSE: it was cited as line 261
> here and rotted twice inside WO-1.34 alone, once when the fix added header lines above it and again
> when the correction round added more. A comment that cites a line it does not compute is a fault
> message's own failure mode arriving in prose — grep for the ternary instead.

**This is a decision the correction round did not settle and I went past its letter** — it said "fix
the stale 261 citation", and I removed the citation instead. The reason: a hand-written line number
in prose has no recomputation path, and this one demonstrated its own half-life twice in one day
inside the very banner that argues wrong line numbers teach distrust. `contextOf()` is greppable and
does not move when comments are added above it. **Say so if you want the number back.**

`plans/work-orders/phase-1-shell-store-roster.md`'s landing note got the same treatment, plus the
correction round written into it and the `:494`/`:495` plant citations corrected to `:505`/`:506`.

## 5. The README running-order row

`plans/work-orders/README.md` row 35 was still carrying WO-1.34's pre-build *Suggested* prose. It now
matches the completion-record shape rows 33 and 34 use — `✅ **2026-08-28** — all six boxes, no 👤 and
no 📆, …` — and records that it closed **one correction round later, with five spellings rather than
the three it was booked for**, naming both verifier plants and the reason the first fix missed them.

## 6. `CACHE` still pairs

`sw.js:37` is `const CACHE = 'planbook-shell-v101'`, unmoved this round, which is correct: one bump
covers both rounds' edits to the same `SHELL` file, and it is still uncommitted. § 9 of the sweep
agrees on the delivered tree (it is inside the 31 passed).

---

## Everything re-run this round, with what it printed

```
node tools/wo-sweep.mjs             → 34 checks · 31 passed · 0 failed · 3 to review
                                      (the same three REVIEW items as before: sensitive names outside
                                       src/backup.js, due-date/late-missing colocation, the mockup
                                       banner mismatch — none of them mine)
node tools/wo-gate.mjs --audit      → PASS | every fragment matches exactly one roadmap box …
                                      overall row 58/81 · rows sum 58/81
node tools/wo-gate.mjs --self-check → PASS | 24 of 24 plants were caught.
node tools/verify-shell.mjs         → 1197 checks · 1197 passed · 0 failed · 0 skipped
                                      35,697 lines · 29.8 lines per check · 407s · EXIT=0
node tools/wo-gate.mjs WO-1.34      → PASS | gates clear for WO-1.34 (with the standing
                                      NOTE that it is already ✅ DONE)
```

`verify-shell.mjs` was backgrounded and **waited on until it exited**; the summary above and the
`EXIT=0` are read out of its finished log, not predicted from a run in flight.

**Mutation hygiene, final state:**

```
$ grep -rn "MUTATION" src/ tools/wo-sweep.mjs sw.js \
      plans/work-orders/phase-1-shell-store-roster.md plans/work-orders/README.md
src/shell.js:661:  A CLASS MUTATION ADDED LATER ADDS ITS LINE HERE. …
      ← pre-existing prose in a file this dispatch has never touched; nothing else

$ git diff | grep -c "^+.*MUTATION"
0

$ git diff --numstat            (both rounds together, against HEAD)
3    3   plans/work-orders/README.md
44   7   plans/work-orders/phase-1-shell-store-roster.md
30   5   src/merge-fields.js        ← header comment only; no code line changed either round
1    1   sw.js
136  25  tools/wo-sweep.mjs
```

The plant/revert harness lives in the session scratchpad, outside the repository. Nothing was left in
`tools/`.

## Acceptance, re-reported for this round

| # | Line | This round |
|---|---|---|
| 1 | the three booked spellings go red, each naming the line | **MET** — re-run, `:505 · :505 · :506`, three distinct `why` strings |
| 2 | today's file passes; seven subscripts, both array literals, `['behavior']`, both regex classes intact | **MET** — old/new finding sets diffed identical, and three green control plants |
| 3 | WO-5.1's mutation and the three one-liners still fail, citing a real line | **MET** — re-run, all four red at `:505`, which is the planted line under `fieldNamed` at `:504` |
| 4 | the non-vacuity anchor still fires | **MET** — `blind-scanner` plant in `wo-sweep.mjs` itself trips *"no bracket subscript of any kind was found"* |
| 5 | *"on any input"* true of the check, **or** says which spellings it does not cover | **MET this round** — the universal is gone from both files; the header enumerates the covered spellings positively and names `Object.entries(…).find(([k]) => …)[1]`, `Object.values`, `for…in` and `Map` as off the list. `CACHE` v101 pairs. **Round 1 ticked this ahead of its evidence and the ❌ was right.** |
| 6 | sweep green, call-site count recomputed by the sweep | **MET** — `34 · 31 · 0 · 3`; the count is 1182 and unmoved (nothing here touches `verify-shell.mjs` or `tools/verify/`), and the sweep's own PASS line is what says so |

**What I could not verify:** nothing new. This work order still has no 👤 and no 📆 line, adds no
control and renders no pixel; `src/merge-fields.js` has no screen. The sweep and the harness were run
on a tree with my uncommitted changes and nothing else — no plant, no scratch file.

**Boxes:** all six were already `[x]` from round 1. I did not re-tick or un-tick; line 5's tick is
now true, and the landing note records that it was not when it was made.

## Note for the record — a temptation declined

`CHANGELOG.md:60–70` and WO-1.32's own landing note still describe claim 5 as reading "member
position, one line at a time". Both are dated records of what was true when WO-1.32 landed and both
name WO-1.34 as the booking. Left alone again, for round 1's reason: they are another work order's
history, and the CHANGELOG is the teacher's.

## Draft CHANGELOG entry, revised — for the teacher, not written by me

> **§ 20's claim 5 now reads the whole file, and the header stopped overclaiming — twice.** The check
> that forbids a dynamic property read in the merge-field resolver scanned member position one line
> at a time, and three spellings walked around it. Widening it for those three was the easy half. The
> instructive half was the sentence above it: `src/merge-fields.js` claimed the greps prove nothing
> there could resolve a support field **on any input**, and the first fix retired that phrase only to
> re-pitch it one size smaller — *wherever in the file the `[` sits*. Two more spellings walked
> through the smaller claim, and its own verifier found them. Both are closed now, and the header no
> longer claims a universal at all: it lists the spellings the check covers and names the ones a grep
> over a crude comment strip cannot see. A universal with an exception hung off the end is not a
> narrower claim; it is the same claim with a footnote, and a reader believes the sentence. None of
> this ever touched the fence — the fence is the whitelist, and these greps are only what stops it
> being walked around quietly.
