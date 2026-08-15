# WO-3.20 — one date formatter, and a name that means one thing · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.20-result.md` — as your last act, and return it in-band too.

**Routing decision.** Routed to **Claude, at Opus**, because two of the three Deliverables are
*rulings* rather than edits — what the two surviving non-`Mon D` formatters are called, and what an
empty or malformed date returns "decided once, not inherited" — which is `ROUTING.md`'s "establishes
a convention" trigger: the shared module is what every future gradebook screen will import in good
faith. The runner-up I set aside: by shape this is WO-2.13 again, a behaviour-neutral refactor whose
acceptance is grep-plus-byte-identical-output, and a Codex run would very likely produce correct
code. I set that aside because correct code that renames the exported `attendance.js` symbol on its
own taste settles, in passing, the exact question this work order exists to take deliberately.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.20 — one date formatter, and a name that means one thing

**Ship** 2 · **Status** 🤖 CLAIMED — 2026-08-15 · **Size** S · **Depends on** WO-3.15, WO-3.16
**Blocks** nothing · **Closes roadmap** *(no box. Internal consistency; nothing a teacher sees changes,
which is the acceptance criterion rather than a caveat.)*

*(WO-3.13 was on this line and came off it on 2026-08-15, when it was struck. It was never going to
reach `✅ DONE`, which is the only status the gate accepts, so leaving it here would have held this
work order shut permanently — and quietly, since a gate reports the dependency and not the reason
nobody intends to satisfy it.)*

**Booked 2026-08-13, out of WO-3.6's close**, which added the third byte-identical copy of the same
eight lines and said so at the copy rather than paying it. The count in that result file was low. There
are **five** `function shortDate` in `src/`, in three different formats:

| File | Output | On an empty or bad date |
|---|---|---|
| `src/assignments.js`, `src/scores.js`, `src/past-due.js` | `Sep 4` | `''` |
| `src/days-off.js` | `Thu, Sep 4` | the raw string |
| `src/attendance.js` — **exported** | `9/4` | the raw string |

**Why it exists.** *The duplication is the boring half; the name is the trap.* `src/attendance.js`
**exports** a `shortDate` that formats `9/4`, and `src/attendance-report.js` imports it correctly. Any
future gradebook screen that reaches for a date formatter finds that export first, in good faith, and
renders `9/4` in a column beside one that says `Sep 4` — and nothing in the harness or the sweep would
fail, because both are correct dates. `src/attendance-report.js`'s own header prose already argues this
case for the printed page: *a printout that has left the building and disagrees with the screen* is the
failure. The same argument applies one file over and has not been applied.

The three identical copies are the cheap part. Each carries a comment explaining why it is not an
import; two copies was a defensible convention and five is a formatter waiting to disagree with itself.

**Deliverables**
- **One `Mon D` formatter, exported from one place**, replacing the three identical copies. A leaf
  module with no imports of its own — the suite has no bundler and a cycle here would be paid at load
  time on every screen.
- **A ruling on the other two, in a sentence each.** `days-off.js`'s `Thu, Sep 4` and
  `attendance.js`'s `9/4` are different formats for good reasons and may well stay — but **they may
  not keep the same name**. Either they compose from the shared formatter or they are renamed to say
  what they produce. The deliverable is that no two functions called `shortDate` return different
  strings for the same input.
- **The empty-date behaviour is decided once**, not inherited. Three copies return `''` and two return
  the raw input; one of those is wrong on some screen right now.

**Out of scope** — every other formatter (`plainDate`, `dayAbbr`, `percentText`), the attendance
family's internals, and any change to what any screen displays. **This work order is behaviour-neutral
by construction**; if a date on any screen changes, it has failed.

**Scheduling note.** This sits **after** WO-3.15 and WO-3.16 rather than before them, and the
dependency is real. Both open the score-grid files, and consolidating a set that is still growing
means doing it twice. *(This read "after WO-3.13, WO-3.15 and WO-3.16" and "all three" until
2026-08-15, when WO-3.13 was struck. The set stopped growing that day, which is the one thing the
strike does for this work order.)* It is also deliberately behind WO-1.16 in the running order: a five-file refactor
that changes nothing a teacher sees has no business landing in the week the term opens.

**Acceptance**
- [ ] `grep -rn "function shortDate" src/` returns **one** definition of the `Mon D` formatter, and no
      two surviving functions of that name return different strings for the same input.
- [ ] Every date on every screen is character-for-character what it was before this work order —
      asserted on the assignment list, the score grid, the past-due prompt and review, the days-off
      list, the attendance grid and both printed reports.
- [ ] An empty date, a malformed date and a real date each produce one documented answer, and the
      choice is written down at the definition rather than implied by three call sites.
- [ ] `verify-shell.mjs` is green with no check rewritten to accommodate a changed string. **A check
      edited to match new output is this work order failing**, not passing.
- [ ] No import cycle: the shared module imports nothing from `src/`.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/assignments.js`
  - `src/attendance-report.js`
  - `src/attendance.js`
  - `src/days-off.js`
  - `src/past-due.js`
  - `src/scores.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Also open these, and the reason for each:

- **`src/README.md` § "The convention"** — it names the new file for you by exclusion:
  *"`kebab-case.js`, one concern per file, named for the thing it owns (`store.js`, `roster.js`,
  `attendance.js`), **not for its layer** (`utils.js`, `helpers.js`)."* A shared formatter is the
  single most likely file in this project to get called `utils.js`, and the convention forbids it.
  *(That file's opening line still reads "Empty today. WO-1.2 puts the first file here." It is stale.
  **Do not fix it here** — note it in your result as a proposed follow-up.)*
- **`sw.js`, the `SHELL` array and the `CACHE` string.** You are adding a file to `src/`, and its own
  header states rule 2 in as many words: *"Add the file to SHELL and bump CACHE in the same commit
  that creates it."* A module missing from `SHELL` works in every test you run and is missing the
  first time a teacher opens the app on a plane. Note the apostrophe warning in that same header
  before you write a comment anywhere near the array.
- **The five definitions themselves**, with the comment block above each — `src/assignments.js:274`,
  `src/scores.js:296`, `src/past-due.js:229`, `src/days-off.js:150`, `src/attendance.js:671`. **Those
  comments are the reasoning this work order is ruling on**, not background. Each argues the local
  copy is deliberate — `src/assignments.js:270` says *"A local copy rather than an import … so these
  are two formats rather than one function with a flag."* That argument is still correct about
  `days-off.js` and `attendance.js` and is now overruled for the three identical ones. A comment left
  standing that defends a copy which no longer exists is prose asserting something false; rewrite
  those, and say in your result which you rewrote, which you kept, and why. `.claude/dispatch/WO-3.19-result.md`
  is the precedent for how that accounting reads.
- **`src/attendance.js`'s `parseISO()`** — the long form of the scar every one of the five copies
  cites. Your new module may import nothing from `src/`, so it carries its own field-by-field parse.
  **Do not simplify it to `new Date(iso)`**: the spec reads a bare `'2026-09-08'` as UTC midnight,
  which is one timezone away from being the day before.

**One trap the work order predicts and does not know has already sprung.** *"Why it exists"* warns
that a future gradebook screen reaches for the `attendance.js` export in good faith and renders `9/4`
beside a `Sep 4`. Look at `src/grades-report.js:114` and `:379`: it imports `shortDate` from
`./attendance.js` and formats **assignment due dates** with it on the printed grades report. Whether
that is a defect is not yours to decide here — Acceptance line 2 says *both printed reports* are
character-for-character unchanged, and **Out of scope** forbids changing what any screen displays. So
`grades-report.js` keeps emitting exactly what it emits today, whatever you rename around it. Write it
up as a proposed follow-up work order in your result and leave it alone. Resist this one specifically:
it will look like the whole point of the work order, and fixing it is the one way to fail every
acceptance line at once.

**How to prove line 2 rather than argue it.** Capture the rendered dates before you touch anything —
a `git stash`-and-compare, a scripted before/after over the six surfaces, whatever you can actually
run — and report the comparison as evidence. "I reasoned it through" does not close that line. And
per line 4: if a `verify-shell.mjs` check goes red, the code is wrong, not the check.

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

## 5. Done means these 5 lines, reported against one by one

1. `grep -rn "function shortDate" src/` returns **one** definition of the `Mon D` formatter, and no two surviving functions of that name return different strings for the same input.
2. Every date on every screen is character-for-character what it was before this work order — asserted on the assignment list, the score grid, the past-due prompt and review, the days-off list, the attendance grid and both printed reports.
3. An empty date, a malformed date and a real date each produce one documented answer, and the choice is written down at the definition rather than implied by three call sites.
4. `verify-shell.mjs` is green with no check rewritten to accommodate a changed string. **A check edited to match new output is this work order failing**, not passing.
5. No import cycle: the shared module imports nothing from `src/`.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

