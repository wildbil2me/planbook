# WO-2.38 — nothing exercises the anti-vacuity guard, so it can rot behind a green run · result

**Route** Claude (work-order-implementer) · **Reported** 2026-08-17
**Work order** `plans/work-orders/phase-2-attendance.md` (WO-2.38, Status left at `🤖 CLAIMED — 2026-08-17`)

---

## The decision the row was booked for: where these checks live

**They live in `tools/verify-shell.mjs`, inside the file whose guard they test, and they ride the
ordinary run rather than a `--self-check` flag.** Written where the next reader meets it, three
places: the section's own header comment in `tools/verify-shell.mjs` (the long form), a new dated
section in `plans/verification-tooling.md` § *"The check on `verify-shell.mjs`'s own guard rides the
ordinary run, 2026-08-17 (WO-2.38)"*, and the ledger entry in `tools/README.md`.

The tension was resolved rather than picked past, in two steps:

1. **Not a sibling file.** `plans/verification-tooling.md`'s boundary table already says *one file — no
   `tools/lib/`, no second harness, no plugin seam*, and § *"The check on `wo-gate.mjs` is a flag
   inside `wo-gate.mjs`"* settles this exact case: a check on a tool lives **in** the tool. A sibling
   here would need the two reads **exported** — that is the shared seam the rule exists to prevent —
   and a sibling with its own copy of the reads is the second hand-maintained copy WO-2.36 refused for
   counts. The "needs no browser" objection is answered by the file itself: the precache read and both
   key blocks already run before a browser is launched. That file is the one harness, not the browser
   half of two.
2. **Not behind a flag, and that is where it parts from `wo-gate.mjs` — on the subject, not on
   taste.** That flag copies `plans/` to a temp directory and plants violations: it writes, it is
   slow, it has a precondition that can stop it for reasons unrelated to the script. This is string
   operations on text the run has already read — milliseconds, no writes, no fixture but the tree. A
   flag would make it opt-in, and **an opt-in guard against rot is the fault this row exists to fix.**

**The rule left for WO-2.40 to follow** (stated in `plans/verification-tooling.md` in those words):
*the self-test belongs in the file it tests — never a sibling, never behind an export — riding that
file's ordinary run when it is cheap and side-effect-free, and standing behind a flag when it must
write, spawn or wait.* Two shapes, one rule; the flag is the exception that has to earn itself.
`codex-invoke.mjs` spawns and has no always-on report, so a flag there follows this reasoning rather
than merely copying wo-gate's answer.

**Run-budget consequence, as the brief predicted:** the in-process design cost one whole-harness run
(260s) for Acceptance line 4 plus sub-second scratch runs for lines 1–3, not 19 harness runs.

---

## Against the Acceptance list, one by one

### 1. Every arm of both `vacuity` arrays is shown firing on an input that should trip it, and the failure text names the right anchor. Run, not reasoned. — **met**

**19 arms, 19 cases, all fired in the full run**, each printing its expected anchor beside the arm's
actual text. Not "fourteen-odd": **8** in the scores block, **11** in the marking block including the
`MARK_KEYS` declaration arm that sits outside the `if / else if` chain.

Scores block (8): panel id renamed · `index.html` truncated inside the panel · a second class on every
`scores-key` span · every bare `<kbd>` given an attribute · `handleScoreKey` renamed · `src/scores.js`
truncated inside it · a `}` spliced 50 bytes in · a second space in every `key === '…'`.

Marking block (11): `KEYS_MODAL` renamed · the modal id renamed in `index.html` alone · a second class
on the `<dl>` · truncated inside it · a second class on every row · a second class on every glyph
`<kbd>` · the class-view guard requoted · truncated below the guard · a `});` spliced 50 bytes below
it · the binding regexes blinded · `MARK_KEYS` renamed.

Each case asserts **exactly one** arm fired *and* that its text carries the anchor. Sample lines from
the run:

```
PASS | the anti-vacuity guard fires, and blames the right anchor, on a `}` in the first column 50
bytes into handleScoreKey() … :: expected an arm naming `the handleScoreKey() slice is`, got: the
handleScoreKey() slice is 50 byte(s), too short to be that function
PASS | … on the marking modal's id renamed in index.html alone … :: expected an arm naming
`index.html has no `id="attendanceKeysModal"``, got: index.html has no `id="attendanceKeysModal"` —
src/shell.js opens a modal the markup does not carry, or one of the two spellings was renamed alone
```

Several mutations are **valid HTML that renders identically** (a second class on a span, an attribute
on a `<kbd>`), which is the realistic shape of this rot: nobody breaks the markup, they tidy it.

### 2. A correct retirement trips no arm and leaves the check green, driven through the new path — **met**

Both blocks, in the same run:

- `X` out of `handleScoreKey()` **and** its legend row deleted: `9 key(s) bound [Enter ArrowDown
  ArrowUp ArrowRight ArrowLeft Backspace Delete L M] against 7 legend row(s) carrying
  [↵ ⇥ ↑ ↓ ← → L M ⌫]` — no arm, nothing unmapped/missing/stray.
- `D` out of `MARK_KEYS` **and** the Dismissed row deleted: `8 key(s) bound [ArrowDown ArrowUp Escape
  ? P T A E] against 7 legend row(s) carrying [↓ ↑ P T A E Esc ?]` — the exact 8-and-7 WO-2.36's
  retired floor rejected, now asserted every run instead of remembered.

Both driven through `readScoresKeys()` / `readMarkingKeys()` on in-memory copies; nothing written to
disk. Each case also asserts the key **was** bound on the real tree first, so a mutation that removed
nothing cannot report a green retirement — without that clause this would be the most convincing
place in the section to pass on emptiness.

### 3. Deleting an arm, or inverting one of its conditions, turns something red — **met, by doing both**

Proved on truncated scratch copies of the harness (`tools/_wo238-probe*.mjs`, head of the file through
the self-check section so no browser is needed), **deleted afterwards; `git status` shows no stray
files.**

- **Arm deleted** — `else if (!glyphs.length) …` removed from the scores block: **2 red.**
  `FAIL | … on every bare <kbd> in index.html given an attribute … :: NO ARM FIRED, and the guard
  therefore passed on emptiness — the arm that should have named `no `<kbd>` inside those rows` has
  been deleted, inverted, or made unreachable by an arm above it` and, beside it,
  `FAIL | every arm of both `vacuity` arrays has a case above … :: 18 arm(s) pushed in
  tools/verify-shell.mjs against 19 case(s) above`.
- **Condition inverted** — `if (panelAt < 0)` → `if (panelAt >= 0)`: **10 red**, led by the real
  score-grid check on an untouched tree — `NOTHING TO COMPARE … index.html has no `id="scoresKeys"``
  — with the cases below reading `A DIFFERENT ARM FIRED`.

The arm/case count check is what catches the other direction (an arm added later with no case), so the
two lists cannot silently disagree.

### 4. `node tools/verify-shell.mjs` passes whole and `git diff --stat -- src/ index.html` is empty — **met**

**Run locally in this environment — not a "could not run".** Two full runs:

- After the code was complete: `824 checks · 824 passed · 0 failed · 0 skipped`, 22,141 lines, 26.9
  lines per check, **261s**, `EXIT=0`.
- On the delivered tree, after the comment re-points below: `824 checks · 824 passed · 0 failed · 0
  skipped`, 22,141 lines, 26.9 lines per check, **260s**, `EXIT=0`. The docs quote this one.

`node tools/wo-sweep.mjs` on the delivered tree: `20 checks · 18 passed · 0 failed · 2 to review`,
both REVIEWs the standing pair (sensitive field names outside `src/backup.js`; due-date beside
`late`/`missing`), naming the same files they named before this landed.

`git diff --stat -- src/ index.html` is **empty**, checked after each mutation experiment as well as at
the end. No mutation is ever written to disk — every one is a `String.replace`/`slice` on text already
in memory. `sw.js`'s `CACHE` needed no bump: no `SHELL` file changed, and the sweep's pairing check
says so.

### 5. The check count in `tools/README.md` moved in step — **met**

805 → **808** call sites at `tools/README.md:830` (the sentence `wo-sweep.mjs` greps), and the sweep is
green on it: `808 `check()` call site(s) … matching tools/README.md:830` plus `808 call-site line(s) …
none holding a second `check(``. Three sites produced **22** executed results — two are loops (19
mutation cases, 2 retirements) and the third is the arm/case count — so the executed total moved 802 →
**824** and the gap is **808 − 824 = −16**, the largest either way in the file's history. A full ledger
entry in the established form sits beside WO-2.36's, and the gap paragraph's leading number was
brought to this tree (it still read `713 − 710 = 3`, stale since WO-3.8; its history sentence is kept
verbatim).

**The four wrong `:NNN` pointers in `tools/README.md` were read past and left exactly as they are** —
`:10773`, `:12532`, `:17574`, `:1869`. WO-2.39 owns them.

### 👤 lines

**None, as instructed, and none invented.** Nothing here needs an iPad: it is tooling and prose, no
app file changed, and no screen changed. No 👤 line was added to the Acceptance list.

---

## Files changed

- `c:\dev\planbook\tools\verify-shell.mjs` — the two key blocks' reads factored into
  `readScoresKeys(html, scoresSrc)` and `readMarkingKeys(html, shellSrc)` (text in, facts out, no file
  access, the `check()` calls and their wording moved verbatim into a caller block each); new self-check
  section with the 19-arm table, the 2 retirements, the arm/case count, and the `where these live`
  reasoning; six in-file cross-references re-pointed for the lines my insertion moved.
- `c:\dev\planbook\plans\verification-tooling.md` — new dated section recording the decision and the
  rule WO-2.40 should follow.
- `c:\dev\planbook\tools\README.md` — call-site count 805 → 808; new ledger entry; gap paragraph's
  leading number brought to this tree; one `:363-369` pointer re-pointed to `:370-376`.
- `c:\dev\planbook\TESTING.md` — new `### WO-2.38` section with four ticked lines and the evidence;
  two `tools/verify-shell.mjs:NNN` references re-pointed.
- `c:\dev\planbook\plans\work-orders\phase-2-attendance.md` — the five Acceptance boxes ticked with
  evidence in parentheses. **Status left at `🤖 CLAIMED — 2026-08-17`** as instructed.

`src/`, `index.html` and `sw.js`: **untouched.** No `CHANGELOG.md` entry written — draft below.

---

## Decisions the work order did not settle, and which way I went

1. **One `check()` per arm, or a table and a loop?** Chose **tables and loops** — 3 call sites, 22
   executed results. The run still prints one line per arm, which is what "shown firing" asks for; the
   harness already has loop-driven checks and the ledger has language for them; and the arm/case count
   assertion only makes sense against a table. The cost is the −16 gap, which is named in the ledger
   rather than left to be rediscovered.
2. **Added a 22nd check nobody asked for: the arm count against the case count.** Without it, the arms
   and the cases are two hand-maintained lists that agree until somebody edits one — the same objection
   this row raises against the guard upstairs. It is also half the proof of Acceptance line 3.
3. **Each case asserts *exactly one* arm fired**, not merely that the expected one is present. That
   caught nothing during development, but it is what makes an arm becoming unreachable behind an arm
   above it a red line rather than a shrug.
4. **Re-pointed the in-file `:NNN` cross-references my own insertion moved** (`:281-333` → `:288-340`,
   `:363-369` → `:370-376`, `:291-292` → `:298-299`, `:371-422` → `:378-429`, in `verify-shell.mjs`,
   plus the two in `TESTING.md` and one in `tools/README.md` that name them). WO-2.36 did exactly this
   for its own growth in its own commit, and WO-2.39's four are a different set in a different file. If
   the verifier reads this as scope creep, it is three lines of `sed` to revert — but leaving pointers
   my insertion broke would be shipping the defect WO-2.36's thesis is about.
5. **The factoring produced two functions, not one parameterised helper.** Merging is `Out of scope`
   and WO-2.34's one-check-or-two decision stands; each function is exactly the block it came from.

## Out-of-scope temptations declined, and one new finding

- **The four wrong `tools/README.md` pointers** — left alone (WO-2.39), as the row says twice.
- **A fifth stale pointer, found on the way past and left alone:** `tools/verify-shell.mjs` block B
  carries *"`markKeys` is read FILE-WIDE out of src/shell.js (`:611`)"*. Nothing at `:611` in either
  file is that read (before this row it was the harness's own `:622`, and `src/shell.js:611` is
  unrelated code; `src/shell.js`'s `MARK_KEYS` is at `:1617`). I could not establish which was meant, so
  I did not guess and did not renumber it — it is the same judgment call WO-2.39 exists for, in a
  second file. **Worth adding to WO-2.39's table.**
- **The `MARK_KEYS`-declared-while-unused residue** (WO-2.35's question) — untouched, neither better
  nor worse. The new arm/case check says nothing about it, correctly.
- **The `REFUSED` arms are not exercised.** WO-2.38 asks only for the `vacuity` arms, and I stayed
  there. The factoring already returns `refused`, so a follow-up row would be a table of four cases per
  block and no new plumbing. Proposed, not done.
- **Merging the two blocks** — declined; explicitly out of scope.

## What I could not verify

- **Nothing needing an iPad or human eyes arose**, so there is nothing owed to a device here. No screen,
  stylesheet, control or copy changed.
- The two harness runs and the sweep were run **by me, locally, in this environment**, and I read their
  output; the numbers above are quoted from it, not predicted. Both runs are on this tree, and the
  delivered `verify-shell.mjs` is byte-for-byte the file the 260s run executed.

## Draft `CHANGELOG.md` entry — the teacher's to write or discard

> **Harness.** The two ⌨ Keys legend checks now test their own anti-vacuity guard on every run.
> WO-2.36 replaced six hardcoded floors with nineteen anchors asserted by name, and on a healthy tree
> every one of them was dead code — a guard that agreed with everything because nothing ever ran it.
> Each block's read now takes the documents as text, so the run drives all nineteen arms against
> mutated copies in memory, checks that a correctly retired key still trips none of them, and counts
> the arms against the cases written for them so a new arm cannot arrive unexercised. Nothing is ever
> written to `index.html` or `src/`. 824 checks, all passing.
