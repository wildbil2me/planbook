# AGENTS.md

**Read [`CLAUDE.md`](CLAUDE.md) first — it is the real briefing.** This file exists because Codex
and other agents look for `AGENTS.md` by name; everything of substance is in `CLAUDE.md`, and the
two must never drift apart. If you change a rule, change it there.

Planbook is a local-first PWA gradebook for classroom teachers. No account, no backend, no
dependencies.

## The rules that get broken by accident

- **No dependencies, no framework, no bundler, no linter, no test framework.** No `package.json`,
  ever — not "just for scripts." Anything scripted lives in `tools/*.mjs` under bare Node.
- **Colors inline, not CSS variables.** This reads like a mistake and is not. Don't tidy it.
- **No dark mode.** No `prefers-color-scheme`, no `[data-theme]`, anywhere.
- **44px minimum** for every control, in the `@media (pointer: coarse)` block.
- **`localStorage` prefix `planbook_`, UI preferences only** — never student data. Student data
  lives in IndexedDB.
- **Accommodation, medical, and plan data never leaves the roster.** No merge field resolves it, no
  log line prints it, no export emits it. The one exception is the JSON backup, whose own UI says so.
- **`drive.file` is the only OAuth scope.** Not `spreadsheets`, not a mail scope. Outreach goes out
  via `mailto:`.
- **No backend, no Apps Script.** Both were considered and rejected; `CLAUDE.md` has the reasoning.

## Data invariants

- **`late` and `missing` are teacher-marked, never inferred from a due date.** Blank means ungraded
  and affects nothing. A grade must never change because a date rolled over.
- **Empty categories redistribute their weight.**
- **Taken · dropped · not-taken-yet are three states, not two.** Everything counts *recorded
  meetings*, never calendar days. There is deliberately no schedule model — see
  [`plans/rotating-schedule.md`](plans/rotating-schedule.md).

Full schema and grade math: [`docs/data-model.md`](docs/data-model.md).

## If you were dispatched with a work order

Stay inside its **Deliverables** and honor its **Out of scope** line. Do not tick roadmap boxes,
edit anything under `plans/`, or touch `CHANGELOG.md` / `TESTING.md` — the teacher does maintenance
once the work has been verified, and no agent has the authority to tick a box.

A separate verifier reads your work cold against the **Acceptance** list, so report honestly:
what you did, what you could not satisfy, and anything you were unsure about. Claiming an acceptance
line you did not actually meet costs you a correction round, not a pass.

**`node tools/verify-shell.mjs` may not run where you are.** It drives headless Edge over CDP, which a
sandboxed agent usually cannot do. If it fails to start, say **"could not run"** and say why — that is
an environment report, not a result, and the teacher re-runs it locally before any box is ticked.
Never infer a pass from a harness you could not execute.

**Never tick a 👤 line.** Those need a real iPad, a thumb, or the live SIS, and you have none of them.
