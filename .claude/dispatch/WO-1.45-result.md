# WO-1.45 — result

**Implementer:** Claude Opus, 2026-09-24. Nothing committed. I did not run `--start`, `--release`, `--handoff` or `--tick`. The status stays `🤖 CLAIMED`, and all four Acceptance boxes are ticked by hand on the evidence below.

## What I built: stronger than a tripwire, and still not a proof

`tools/wo-sweep.mjs` **§ 25**, "the harness still routes every section through its containment". It sits above § 22, following § 23's precedent. It is one FAIL-or-PASS result, never a REVIEW. Its banner says in capitals that it is **"A TRIPWIRE ON THE SHAPE, NOT A PROOF OF THE BEHAVIOUR."** It asserts six things about the text of `tools/verify-shell.mjs`, and nothing else:

1. There is exactly one top-level `async function runSection(`, and its body can be bounded by counting braces over code lines. This is § 23's method.
2. `STATIC_SECTIONS` and `BROWSER_SECTIONS` each appear on a code line that also calls `runSection(`. **I covered the static loop too**, because a throw there loses all the checks, not just the browser half's.
3. There is no `.run(` call anywhere in the file outside that body. The bare loop trips this, and so do `forEach`, `Promise.all(...map(s => s.run(h)))`, and a second loop with no containment.
4. Inside the body there is exactly one `.run(`, it is awaited, and it sits after a `try {` and before a `catch`.
5. After the `catch` there is a `check(` with a literal `false`, and no `return` comes before it.
6. There is no `throw` in the body.

**What it cannot see.** This is written in the section banner, in the PASS detail line itself, in the `tools/README.md` row, and in the corrected README paragraph:
- whether a throw actually reaches the catch at runtime (an un-awaited promise inside a section, or a CDP callback);
- what the FAIL records (a wrong count, a misleading detail, or a record in a dead branch);
- `recoverPage()`'s honesty, a `null` recover in the browser loop, or the stop-and-name block;
- a `run` reached through an alias or destructuring;
- the exit code and the summary.

Only a `verify-shell.mjs` run with a throw planted in a section proves the containment works. WO-1.44 took that run once. The prose now says that anyone who edits `runSection()`, `recoverPage()` or the browser loop owes that run again.

Why I went further than the tripwire: the brief and the orchestrator notes showed that the text can answer more than "is it called". Mutation M2 (the catch records a pass), M3 (not awaited), M4 (rethrow), M8 and M9 (early return) all get past a bare `runSection(` grep. § 25 catches every one of them, and it can do that without leaving the grep half.

## Files changed

- `c:\dev\planbook\tools\wo-sweep.mjs`: § 25 added, +155 lines, nothing else touched.
- `c:\dev\planbook\tools\README.md`: three changes.
  - Row `wo-sweep.mjs`: the count goes from 42 to 43, and a § 25 clause is added in the row's own voice, including what it cannot see.
  - **Corrected a stale paragraph** in § "Driving a browser over CDP". Since WO-1.26 (`5aa97ec`, 2026-08-25) it had said *"A section that throws still kills the run. Nothing wraps `run(h)` in a `try`/`catch`, on purpose"*. WO-1.44 made that false on 2026-08-31. This is the paragraph a harness reader meets, so I rewrote it to describe the containment and § 25's limits, and kept a parenthetical recording what it used to say. I judged this inside Acceptance line 2, which asks for "where a reader … will meet it". It is not scope growth, but the verifier should know it was a deliberate call.
- `c:\dev\planbook\plans\work-orders\phase-1-shell-store-roster.md`: the four WO-1.45 Acceptance boxes are ticked. The status-line diff there was already present from `--start`.
- `tools/verify-shell.mjs`: **not changed**. Its sha1 is `927571e4…0546` before and after, and `git diff --stat tools/verify-shell.mjs` is empty.

## Commands run, with their results

- Baseline `node tools/wo-sweep.mjs`: EXIT=0, `42 checks · 39 passed · 0 failed · 3 to review`.
- After adding § 25, before touching the README: EXIT=1, `43 · 39 · 1 · 3`. The one failure was § 22 asking for the count to move to 43, as expected.
- Final `node tools/wo-sweep.mjs`: **EXIT=0, `43 checks · 40 passed · 0 failed · 3 to review`**.
  - § 25 PASS: `runSection() at tools/verify-shell.mjs:434-452 …`
  - § 22 PASS: `43 results emitted this run, matching tools/README.md:10`
  - § 22 ordering PASS: the census is still the last result-pushing call site.
  - The three REVIEWs are the same three as the baseline.
- Final `node tools/wo-gate.mjs --audit`: **EXIT=0**, with the final PASS line and the dashboard all ok. I ran it again after ticking the boxes: EXIT=0.
- `grep -rn MUTATION tools/ src/ index.html`: only two old prose hits, `tools/wo-gate.mjs:2502` and `src/shell.js:921`, both there before. `git diff | grep -c MUTATION` returns 0.
- LF only: `grep -c $'\r'` returns 0 for `tools/README.md` and for `tools/wo-sweep.mjs`. The numstat is only my own edits: README 16 lines added and 4 removed at first, 21 lines changed in the end, sweep +155.
- `node tools/verify-shell.mjs`: **not run**. This work order does not edit `verify-shell.mjs` or anything under `src/`, and § 25 reads only file text, so no Acceptance line depends on that run. The orchestrator notes say it is not required when the harness file is untouched. The brief's §4 boilerplate says "both must be green", so I am reporting the omission rather than hiding it.

## Mutations

Method: each mutation was planted in `tools/verify-shell.mjs` from a byte-exact backup in the scratchpad, the sweep was run, and the backup was copied back straight away, before anything else was written. I did not use `git checkout`. Every planted line carried the word `MUTATION`. After the final revert the sha1 matched the original.

| # | Planted | § 25 result |
|---|---|---|
| M1b | **The whole routed browser loop replaced by the bare `for (const s of BROWSER_SECTIONS) await s.run(h)`. This is the Acceptance line 1 restoration** | **FAIL**: "no code line … names `BROWSER_SECTIONS` and calls `runSection(`" and ":887 — a `.run(` call outside `runSection()`" |
| M1a | Bare loop added, with the routed loop kept but made dead (`i < 0`) | FAIL, on the `.run(` outside the body at :887 |
| M2 | The catch's `check(…, false,` changed to `true` | FAIL: "holds no `check(` with a literal `false`" |
| M3 | `await` removed from `s.run(h)` | FAIL: ":437 … is not awaited" |
| M4 | `throw e;` added in the catch | FAIL: ":449 — a `throw` inside `runSection()`" |
| M5 | Static loop made bare | FAIL: "no code line … names `STATIC_SECTIONS` …" |
| M6 | The recorded count replaced by `0` | **PASS**. This is a documented blind spot, planted to show it |
| M7 | `recoverPage()` always returns `true` | **PASS**. This is a documented blind spot |
| M8 | `catch (e) { return true;` ahead of the record | FAIL: "can `return` before it reaches its `check(…, false, …)`". M8 first passed the draft check; I added the no-early-return clause because of it |
| M9 | `if (!e) return true;` ahead of the record | FAIL, same message |
| M10 | `BROWSER_SECTIONS.forEach((s) => s.run(h))` added beside the routed loop | FAIL: ":456 — a `.run(` outside" |

## Acceptance, line by line

1. **Red on a planted bare loop, reverted after.** Ticked. Evidence: M1b (and M1a) above, sweep EXIT=1 with § 25 FAIL. The file was reverted and its sha1 matches.
2. **What it does not prove is written down.** Ticked. It is in § 25's banner (the "WHAT A GREEN RESULT HERE DOES NOT MEAN" list), in the PASS detail line printed on every green run ("Not proof that it works: …"), in the `tools/README.md` row, and in the corrected README paragraph ("**A green § 25 is not evidence the containment works**"). M6 and M7 show the named blind spots really are blind.
3. **Inside the grep half.** Ticked. § 25 uses `fs.readFileSync`, `commentLines` and `report` only. There is no `execFileSync`, no spawn and no browser, and every clause answers from the text of `tools/verify-shell.mjs`.
4. **Sweep green, `--audit` green, count moved.** Ticked. Sweep EXIT=0 at `43 · 40 · 0 · 3`, § 22 matching README:10, and `--audit` EXIT=0. "Clean tree" here means the working tree holds only this work order's deliverables, uncommitted.

There are no 👤 or 📆 lines.

## Decisions the work order did not settle

- **Section number 25.** 23 and 24 were already taken. It sits above § 22, as § 23 and § 24 do.
- **Covering the static loop.** I did. The argument for it is the same one, a size larger.
- **One result, not several.** I followed § 23's `faults[]` shape, which keeps the count move at +1.
- **The `return` clause is textual, not control flow.** Its limit is stated in the banner: a `return` inside a nested callback ahead of the record would redden it falsely, and none exists today.

## Temptations I declined, and possible follow-ups

- Proving the containment behaviourally would take a standing planted-throw run inside `verify-shell.mjs`, for example a self-test section that throws on purpose and asserts the FAIL line and the count. That is harness work, it would move `verify-shell.mjs`'s count, and the Traps put it out of this work order. If it is wanted, it needs its own work order.
- `CLAUDE.md` and `AGENTS.md` both describe the containment and neither mentions § 25. I did not touch them.

## Draft CHANGELOG entry (for the teacher to decide on)

> **The section containment in the browser harness is now fenced, by shape (WO-1.45).** `wo-sweep.mjs` § 25 goes red if `verify-shell.mjs` stops routing either section list through `runSection()`, or if that function stops awaiting the section, stops recording a FAIL in its catch, returns early or rethrows. A healthy harness and an uncontained one both print the same green total, so until now nothing could tell them apart. It is a tripwire on the text, not proof: whether a throw reaches the catch and what the FAIL records are only shown by a run with a planted throw, which anyone who edits the containment still owes. The same sitting corrected `tools/README.md`, which had gone on saying "a section that throws still kills the run" for three weeks after WO-1.44 made that false. The sweep is 43 checks.
