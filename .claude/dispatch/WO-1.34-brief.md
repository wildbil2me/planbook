# WO-1.34 — claim 5 reads member position, and three spellings walk around it · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.34-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude, **Opus** tier. The deciding signal is that this is the structural
fence around the merge-field resolver — a never-delegate surface — and half the deliverable is a
*sentence* (`src/merge-fields.js:37`'s "on any input") that has to be made true or narrowed, which is
prose judgment rather than a regex edit. Runner-up set aside: Codex, since the mechanical core is a
widening of one pattern in a tooling script with fully mechanically checkable Acceptance and no UI —
but ROUTING § "Route to Claude" bullet 1 does not bend for shape. This is Opus on the work's own
merits, not a Sonnet fallback.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.34 — claim 5 reads member position, and three spellings walk around it

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-28 · **Size** S · **Depends on** WO-1.32 · **Blocks** nothing
**Closes roadmap** Phase 1 → *(no box. Tooling, not app — the same call WO-1.26 through WO-1.33
made. Booked 2026-08-28, owner-directed, found by WO-1.32's verifier the hour claim 5 landed.)*

**Why it exists.** `wo-sweep.mjs` § 20 claim 5 forbids a dynamic property read in
`src/merge-fields.js`, and it finds one by scanning **member position, one stripped line at a time**:
`/[A-Za-z0-9_$)\]][ \t]*\[([^\]\n]*)\]/`. That is deliberately narrow — it is what keeps the file's
own array literals, its `['behavior']` and its two regex character classes out of the fault — and the
narrowness is exactly the surface area. **Three spellings resolve a property by a token-named key and
pass the scanner green**, verified against the live regex rather than reasoned about:

| Spelling | Why it passes |
|---|---|
| `root?.[name]` | the character before the `[` is `.`, which is not in the member class |
| `const { [name]: got } = root` | a computed key in a destructuring pattern or an object literal sits after `{`, `,` or a space |
| `root\n  [name]` | the scanner reads one trimmed line at a time, so a `[` that opens its own line has nothing before it |

**This is narrow, not vacuous, and the difference is the reason this is an S rather than an alarm.**
Seven distinct mutations go red today, WO-5.1's actual one among them, and `grep -rn '?\.' src/*.js`
returns **nothing** — optional chaining is not this codebase's style, and neither is a computed key.
No spelling here is one somebody writes by accident.

**What makes it worth an hour anyway is a sentence, not a risk.** `src/merge-fields.js:37` says the
two greps *"prove there is nothing here that could resolve one **on any input**"*. Three spellings
falsify that as written, and this repository's whole argument for a structural check over a fixture
is that the structural one holds on any input. **Either the check gets wide enough for the sentence
or the sentence gets narrowed to the check** — a header that overclaims is the failure mode WO-1.32
was booked to fix, arriving one layer up.

**The shape to build.** Three edits, in rising order of cost, and the first two are lines rather than
designs:

- **Optional chaining into the member class.** `?.` between the identifier and the `[` — an array
  literal never follows `?.`, so this cannot false-positive.
- **A computed key is its own pattern.** `]` followed by `:` catches a destructuring pattern and an
  object literal's computed key in one, and nothing in this file is a bracket group followed by a
  colon.
- **The line-at-a-time read is what actually has to change.** Scan the stripped source **whole**,
  allowing newlines between the identifier and the `[`, and map the match offset back to a line
  number so the fault still cites `src/merge-fields.js:<line>`. That line number is WO-1.32's own
  deliverable and may not regress to an offset or a guess.

**Traps**

- **Today's file must stay green, and the exemptions it relies on are not all the same kind.** Seven
  integer-literal subscripts, two array literals, `['behavior']`, and **two regex character classes**
  — `[^{}]` in `TOKEN` and `[^a-z]` in `refusalFor()` — which pass only because a `[` after `/` or
  `(` is not in member position. A whole-file scan that crosses newlines must not start reaching
  them: check what precedes the `[`, never merely that something does.
- **Do not answer this with a tokeniser.** § 20's stripper is crude and says so at its own head; the
  fix for an overclaiming sentence is not a JavaScript parser in a grep tool, and a dependency to
  get one is forbidden outright.
- **Every spelling in the table above must go red on its own**, and each must go red for a reason
  the fault message names — the WO-1.32 fault text explains what a dynamic read *defeats*, and a new
  family that prints "matched" has undone that.
- **The non-vacuity anchor stays.** Zero bracket subscripts found is still a fault; a widened scanner
  that stopped matching `FIELDS.filter(…)[0]` would be silently green.
- **`src/merge-fields.js` is a `SHELL` entry.** Any edit to it — including the sentence at line 37 —
  bumps `CACHE` in `sw.js`. It is at `planbook-shell-v100` as of WO-1.32.

**Acceptance**
- [ ] `root?.[name]`, `const { [name]: got } = root`, and a subscript whose `[` opens its own line
      each turn § 20 **red** on their own, each naming the line.
- [ ] The file as it stands passes, with all seven integer-literal subscripts, both array literals,
      `['behavior']` and both regex character classes intact.
- [ ] WO-5.1's own mutation and the three one-liners WO-1.32 closed — `eval(`, `new Function(`,
      `Reflect.get(` — still fail, and the fault still cites a line number that is the line number of
      the file a reader opens.
- [ ] The non-vacuity anchor still fires: a scanner that finds no bracket subscript at all is a fault.
- [ ] `src/merge-fields.js:37`'s "on any input" is true of the check as it now stands, or says which
      spellings it does not cover — and if that file was touched, `CACHE` in `sw.js` moved.
- [ ] `node tools/wo-sweep.mjs` is green on a clean tree and `tools/README.md`'s call-site count is
      recomputed by the sweep.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/merge-fields.js`
  - `tools/README.md`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Also open, in this order:

- `tools/wo-sweep.mjs` § 20 — the whole banner comment **and** the block under it. The banner is the
  argument; claim 5's own sub-comment (`─── claim 5: no dynamic property read (WO-1.32) ───`) states
  what member position buys and why the two regex character classes survive. If you widen the
  scanner, that comment is part of what you are editing — a stale explanation next to a changed
  pattern is the WO-1.32 failure mode arriving one layer up.
- `src/merge-fields.js` lines ~30–45 — the "on any input" paragraph and the parenthetical under it.
- `tools/README.md` — the recorded `check()` call-site count. WO-3.26 shipped a red sweep because
  that number went stale on work being *done*. If your edits change the count, recompute it.
- `sw.js:37` — `const CACHE = 'planbook-shell-v100'`. Only if you touch `src/merge-fields.js`.

**Three things worth knowing before you start, that the work order states but a reader can skid past:**

1. **The three spellings in the table were verified against the live regex, not reasoned about.**
   Do the same in reverse: prove each of your new patterns red *by running the sweep against a
   planted spelling*, and revert every plant before you write anything else. `plans/dispatch-retro.md`
   records a dispatch killed holding an unreverted mutation in this exact file — the tree it left
   behind resolved `{{student.supports.medical}}` to the roster string while every document said
   ✅ DONE. Stage or diff before you finish; `grep -rn MUTATION` over what you touched.
2. **The third edit is the one with real cost.** Scanning the stripped source whole means you must
   map a match offset back to a **line number of the file a reader opens**. WO-1.32 bought that line
   number by blanking block comments line-for-line rather than collapsing them; a regression to an
   offset or a `split('
')` guess undoes its deliverable.
3. **"Check what precedes the `[`, never merely that something does."** A whole-file scan that
   crosses newlines will reach `[^{}]` in `TOKEN` and `[^a-z]` in `refusalFor()` if the member class
   is loosened rather than extended. Those two must stay out of the fault, and so must the file's
   array literals.

**Out of scope, explicitly:** any other § of `wo-sweep.mjs`, any behavioural change to
`src/merge-fields.js` (its *code* is correct — only its line-37 sentence is in play), and a
tokeniser or parser of any kind. If the right fix looks like it needs one, stop and say so in your
result file as a proposed follow-up; do not build it.

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
  exceptions: **never tick a 👤 or 📆 line** — one needs a real iPad you do not have, the other a date
  that has not arrived — and leave the `CHANGELOG.md` entry to the teacher, who decides what a change
  means. Anything you do tick must be
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

## 5. Done means these 6 lines, reported against one by one

1. `root?.[name]`, `const { [name]: got } = root`, and a subscript whose `[` opens its own line each turn § 20 **red** on their own, each naming the line.
2. The file as it stands passes, with all seven integer-literal subscripts, both array literals, `['behavior']` and both regex character classes intact.
3. WO-5.1's own mutation and the three one-liners WO-1.32 closed — `eval(`, `new Function(`, `Reflect.get(` — still fail, and the fault still cites a line number that is the line number of the file a reader opens.
4. The non-vacuity anchor still fires: a scanner that finds no bracket subscript at all is a fault.
5. `src/merge-fields.js:37`'s "on any input" is true of the check as it now stands, or says which spellings it does not cover — and if that file was touched, `CACHE` in `sw.js` moved.
6. `node tools/wo-sweep.mjs` is green on a clean tree and `tools/README.md`'s call-site count is recomputed by the sweep.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

