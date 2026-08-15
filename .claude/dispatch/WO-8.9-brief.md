# WO-8.9 — the sweep cannot see `_headers` · implementation brief

**Route** Codex
**Work order** `plans/work-orders/phase-8-packaging.md`
**Report to** `.claude/dispatch/WO-8.9-result.md` — as your last act, and return it in-band too.

**Routing decision.** Routed to **Codex**: this is a size-S grep added to `tools/wo-sweep.mjs`, a
tool made entirely of greps, with the assertion fully written down in the work order (`_headers`
exists, and pins `/sw.js`, `/index.html` and `/` to `no-cache`) and four acceptance lines that are
mechanically checkable by deleting or mutating a file and re-running the sweep. The exec-time probe
passed (`SMOKE OK`, exit 0) so no fallback applied. The runner-up consideration set aside: the
"failure text must say what a green here does not mean" deliverable is prose, which normally pulls
toward Claude — but the work order dictates what it has to say and names `verify-deploy.mjs` as the
thing to point at, so it is transcription rather than judgment.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-8.9 — the sweep cannot see `_headers`

**Ship** 2 · **Status** 🤖 CLAIMED — 2026-08-15 · **Size** S · **Depends on** —
**Closes roadmap** Phase 8 → *(no box. Tooling, not app — the same call as WO-2.19 through WO-2.22
and WO-8.8. Booked 2026-08-12, out of WO-8.8's follow-ups.)*

**Why it exists.** `_headers` can be deleted from this repository and committed with every check
green. `wo-sweep.mjs` gates the files it reads on `^(index\.html|sw\.js|manifest\.webmanifest|src/)`
and `\.(css|html)$`; an extensionless root file matches neither, so the sweep has never had an
opinion about it. **This is the half of WO-8.7's verifier finding that WO-8.8 deliberately declined**,
recorded there as "the smaller half" — correctly, because the whole finding was that the deployment
was invisible and that is the one WO-8.8 answered.

**WO-8.8 narrowed this without closing it.** `verify-deploy.mjs` now reads `Cache-Control` off the
wire, so a deleted `_headers` would show up as a red check — **but only when a human runs it**, and it
gates nothing by design. Between deleting the file and the next by-hand run, every tool in this
repository is green about a shell and a service worker that are no longer pinned. The gap is small
and it is real, and the fix belongs in the grep-shaped tool rather than the network-shaped one.

**Deliverables**
- **A check in `tools/wo-sweep.mjs`** — a grep, in the tool that is made of greps — asserting that
  `_headers` exists, and that it still pins the three paths it names to `no-cache`.
- **Its failure text says what a green here does not mean.** A passing check proves the file asks for
  the right thing, and nothing whatever about whether the host honours it — that is exactly the false
  comfort WO-8.8 was written against, and this check must not quietly re-offer it. Point at
  `verify-deploy.mjs` by name as the thing that reads the answer.
- **`tools/README.md`'s recorded check count** moves with it. `wo-sweep.mjs` §11 asserts that count
  against reality, so a change that forgets it turns the sweep red on itself.

**Out of scope** — anything that makes a network request; any assertion that the header *binds*, which
is `verify-deploy.mjs`'s job and cannot be answered from disk; widening the sweep's file gate in
general, which is a bigger change with its own blast radius. Fix the one file, not the pattern.

**Acceptance**
- [ ] Deleting `_headers` turns `wo-sweep.mjs` red. *(Today it stays green — that is the defect.)*
- [ ] Changing `/sw.js`'s pin from `no-cache` to `max-age=14400` — the WO-8.7 fault, written into the
      file rather than imposed by the zone — turns it red.
- [ ] The sweep is green on a clean tree, and its check count agrees with `tools/README.md`.
- [ ] The failure text names `verify-deploy.mjs` as what proves the header actually binds.

**Traps** — **This is not a second `verify-deploy.mjs`.** It reads a file on disk; it must not fetch
anything, and the sweep must keep working on a plane. **Do not widen the file gate to fix one file** —
the regex is load-bearing elsewhere and a broadened pattern pulls in every dotfile and config at the
root. **Do not let it imply the deployment is checked.** The whole reason this work order is small is
that the large version of it already shipped as WO-8.8.

---

## 2. Read these first, before writing anything

- `AGENTS.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `tools/README.md`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Also open these — this work order is short but every one of them is load-bearing:

- **`_headers`** at the repository root — the file under test. It is extensionless, heavily
  commented, and pins exactly three paths. Read its comments before writing a regex: the syntax is
  a path pattern on its own line with its headers **indented** underneath, and `#` starts a comment.
  Your check must not be fooled by a pin that has been commented out.
- **`tools/verify-deploy.mjs`** (WO-8.8) — the network-shaped tool this check must defer to. You are
  not duplicating it; you are naming it in your failure text as the only thing that can answer
  whether the header binds. Skim enough of it to describe it accurately.
- **`tools/wo-sweep.mjs` §11** — the self-check that asserts the recorded `check()` call-site count
  against the harness, plus its sibling rule that there is **one `check()` call per line**. Both
  will turn the sweep red on you if you add a check and forget `tools/README.md`, or if you write
  two `check()` calls on one line. Read §11's own comments; it explains what it is counting.
- **`tools/README.md`** — the recorded count lives here, in both the table row and the
  `wo-sweep.mjs` section. Move every place the number appears, not just the first one you find, and
  describe the new check where the others are described.
- **`plans/verification-tooling.md`** — the precondition rule: a check that could not have caught
  the thing it exists for is not evidence. Acceptance lines 1 and 2 are exactly that rule applied,
  so run those two fixture cases for real (mutate, run the sweep, watch it go red, restore) and
  report the actual output rather than reasoning about it.

**One environment note.** `verify-shell.mjs` drives headless Edge over CDP and has historically been
unable to run inside a sandboxed agent. If it will not start for you, say so plainly as an
environment report rather than a result — it will be re-run locally before anything is ticked. Do
not work around it, and do not write a substitute harness. `wo-sweep.mjs` has no such problem and
must be green.

**Restore the tree.** Acceptance lines 1 and 2 require you to delete or edit `_headers` temporarily.
Put it back byte-for-byte and confirm `git status --short` is clean of it before you report.

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

1. Deleting `_headers` turns `wo-sweep.mjs` red. *(Today it stays green — that is the defect.)*
2. Changing `/sw.js`'s pin from `no-cache` to `max-age=14400` — the WO-8.7 fault, written into the file rather than imposed by the zone — turns it red.
3. The sweep is green on a clean tree, and its check count agrees with `tools/README.md`.
4. The failure text names `verify-deploy.mjs` as what proves the header actually binds.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

