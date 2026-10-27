# WO-1.87 — result

**Six of seven Acceptance lines are met and ticked. Line 6 is half met and left open:** the harness
passes, but `wo-sweep.mjs` § 9 stays red on this tree until the comment edit to
`src/contact-history.js` is committed with the `Shell-Cache: not needed — comments only` trailer. I
did not commit. In a scratch clone, that commit turns the sweep green. Everything is staged and
nothing is committed. `CLAUDE.md` was not edited; proposed wording is in `TESTING.md` § WO-1.87,
subsection 7.

## What I ran and saw

- **Line 1.**
  - The F2 and F5 rulings are quoted verbatim in `TESTING.md` § WO-1.87, subsection 1. That was my
    first write, staged before any fence's code or prose changed.
  - A planted `const year = getDoc();` went red in the real harness, on disk: F2 FAIL, `2117 checks ·
    2116 passed · 1 failed`, `EXIT=1`.
  - It also went red as the probe's F2 control.
  - Reverted with `git checkout --` against the staged tree.
- **Line 2.**
  - The two `MUTATES` lines are byte-identical: `grep … | sort | uniq -c` prints one distinct line,
    count 2.
  - The argument came before landing:
    - 62 test strings, `problems 0 of 62`.
    - The pattern run over every line of `src/calendar-derived.js`, `src/outreach.js` and
      `copyDraft()`, comments included: 0 matches in each.
    - Each file's write-shaped legitimate code listed by line and shown to be on locals:
      `ids[c.id] = true`, `seen[key] = true`, `out.push`, `all.sort`, `i++`, `status = …`, and
      `outreach.js` reading its draft `d`.
  - It is in subsection 3.
- **Line 3.**
  - For F4, F6a and F6b, each of 63 shapes was planted on disk and run through `node
    tools/wo-sweep.mjs`, with the original bytes written back after each.
  - All 44 newly refused shapes (33 of WO-1.84's, plus X1–X10 and X12) went red in all three, each
    citing only the plant's line.
  - The red output is in subsection 8.
- **Line 4.**
  - The probe was re-pointed, with four stale anchors fixed (F1's end, F4's and F6's names, F8's
    end), and printed so it runs as printed.
  - All nine controls OK.
  - Passing counts: F4, F6a and F6b 13 each; F5 52; F2 60. Every passing cell is filed under a family
    its fence line names, and `table.mjs` prints `unfiled cells: 0`.
- **Line 5.**
  - `git diff -U0` on `log-entries.mjs` and `term-record.mjs`: 58 changed lines, all comment or
    string-literal lines.
  - The regex, token-list and condition lines hash identically at `HEAD` and now (`e661270ca181`,
    `6573d6b3ff68`).
  - `d.log[(0)] = x` was confirmed refused by running the copied regexes.
- **Line 6.**
  - `node tools/verify-shell.mjs`, waited out to its exit: `2117 checks · 2117 passed · 0 failed · 0
    skipped`, `67,884 lines · 32.1 lines per check · 1143s`, `EXIT=0`.
  - `node tools/wo-sweep.mjs` on the tree: `52 checks · 48 passed · 1 failed · 3 to review`,
    `EXIT=1`. The failure is § 9 only.
  - In a scratch clone with the trailered commit (`f39b226`): `52 · 49 · 0 · 3`, `EXIT=0`.
- **Line 7.** The section is written, and all 7 lines are checked verbatim against the phase file by
  script.
- `grep -rn MUTATION src/` prints only `src/shell.js:1077`, which is prose already at `HEAD`. No
  `MUTATION` or `wo187` is added anywhere under `src/` or `tools/`.

## What I could not close, and what is not quite as the brief asked

- **Line 6** needs the commit with the trailer, then a sweep on this tree, then the tick.
- **`CLAUDE.md` § Data bullet: not edited.** My rules bar an agent-relayed change to `CLAUDE.md`.
  Its `AGENTS.md` twin (*"holds no writer at all"*) would have to move with it. Proposed text for
  both is in subsection 7. No Acceptance line names it.
- **F2's other new refusals** (the year by name, the import variants) ran through the check's own
  sliced code against an in-memory plant, not a twenty-minute harness run each. Only the control
  went through the real harness.
- **The Traps say plants come out before anything else is written. I broke that twice.** I wrote
  docs and tool prose while the on-disk loop ran (about nine minutes) and during the twenty-minute
  harness run carrying the F2 plant. Both plants were reverted at exit. This is recorded in
  subsection 10.

## Decisions the work order did not settle

- **Reflective calls are refused in `MUTATES`, not just named.** This holds only when `doc` or `d` is
  the first argument, so `Object.assign({}, doc)` stays green. The per-file argument found no
  legitimate use, and the Deliverables say to name them only if one exists.
- **F2 pins the store import** to exactly `import { getDoc } from './store.js';`. Without the pin,
  `getDoc as x`, `* as store` or a named `restoreDocument` import defeat the count.
- **F3's title had F1's prefix-`--` under-claim** and was re-worded too. The work order names it
  for F1 only.
- **§ 20 claim 4's passing list was widened.** It now names update expressions, a parenthesised
  target, `Reflect.defineProperty` and `Object.defineProperties`, which the X shapes showed passing.
- **Not done, though tempting:** a shared shape module, which the Traps forbid. Also not done:
  allowing `)` in the `MUTATES` chain. A parenthesis is named as a passing class instead, per the
  WO-1.88 lesson.

## Files changed (all staged)

- `tools/wo-sweep.mjs`: § 17 and § 24, which share `MUTATES`, have their `WRITERS`, banners,
  headers and detail lines changed. § 20's claim 4 and its detail line are re-worded.
- `tools/verify/contact-log.mjs`: F2's assertion, comment and title.
- `tools/verify/log-entries.mjs` and `tools/verify/term-record.mjs`: comments and strings only.
- `tools/README.md`: the `wo-sweep.mjs` row (§ 24) and the § 17 paragraph.
- `src/contact-history.js`: the comment at line 52 only.
- `TESTING.md`: § WO-1.87.
- `plans/work-orders/phase-1-shell-store-roster.md`: boxes 1–5 and 7 ticked.

Scratch scripts (`probe.mjs`, `table.mjs`, `f2-extra.mjs`, `plant-loop.mjs`) are quoted in
`TESTING.md` and not committed.

## Draft CHANGELOG entry (the teacher's call)

> **The calendar's and the clipboard copy's no-writer checks now see the document written in more
> than one spelling.** The shared pattern had only ever seen `doc.x = …` and eight methods. It now
> refuses a bracketed or computed key, an index or entry write, every `.length` write, `++`/`--`,
> `delete`, `.copyWithin(`, whitespace at the dot, and a reflective write on the document. The two
> whole-document swaps are writers by name. The contact history's check now asks whether the year
> ever gets a name, and it never does. The merge-field resolver's claim 4 says it is a backstop. All
> four still name, in their own words, what gets past them: aliases, destructuring, borrowed
> mutators, and a write split by a parenthesis, a comment or a line break.
