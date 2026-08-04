# Dispatch brief — WO-1.1 Repo skeleton & docs spine

**Work order:** WO-1.1 · **Phase file:** `plans/work-orders/phase-1-shell-store-roster.md`
**Route:** Claude (`work-order-implementer`) · **Dispatched:** 2026-08-03
**Size** S · **Depends on** nothing · **Blocks** everything

---

## 1. The work order, verbatim

### WO-1.1 — Repo skeleton & docs spine

**Ship** 1 · **Status** ⬜ NOT STARTED · **Size** S · **Depends on** nothing · **Blocks** everything
**Closes roadmap** Phase 1 → "Start `TESTING.md` and `CHANGELOG.md`"

**Why it exists.** The maintenance protocol demands a testing checklist and a changelog from the
very first ticked box, so they cannot wait for Phase 8. Git isn't initialized yet either, and the
first commit is the cheapest one to get the conventions right in.

**Deliverables**
- `git init`; integration branch `main`; first phase branch `phase/1-shell-store-roster`.
- File layout, flat and buildless: `index.html`, `sw.js`, `manifest.webmanifest`, `src/`,
  `design/`, `docs/`, `plans/`, `tools/`. No `package.json`, no `node_modules`.
- `TESTING.md` — sections keyed to phases, an environment header (desktop browser + a real iPad),
  and the Phase 1 checks as they arrive. Model it on Roll Call!'s `plans/TESTING.md`.
- `CHANGELOG.md` — Keep-a-Changelog shape, `## [Unreleased]` at the top, first entry written.
- `.gitignore` — at minimum OS cruft and any local scratch. Nothing to ignore from a build, by design.

**Out of scope** — any app code, any styling. This is the container.

**Acceptance**
- [ ] `git log` shows a first commit on `main` and a phase branch cut from it.
- [ ] `TESTING.md` exists with an environment section naming iPad Safari explicitly.
- [ ] `CHANGELOG.md` exists with `## [Unreleased]` and one real entry.
- [ ] No dependency manifest of any kind exists in the repo.

**Traps** — Don't create a `package.json` "just for scripts." That is how a bundler arrives six
weeks later. Anything scripted lives in `tools/*.mjs` and runs under bare Node.

### Phase-level rules that apply (from the same file, verbatim)

> **Phase goal:** the app installs, holds data, survives everything, and can hand that data back.
>
> Branch: `phase/1-shell-store-roster`. Read `../ROADMAP.md` Phase 1 and
> `../../docs/data-model.md` before starting anything here.
>
> **The ordering rule for this phase:** WO-1.5 (backup & restore) lands before WO-1.6 and everything
> after it. No feature that writes student data ships before the path that gets it back out.

---

## 2. Read these first, in this order

1. `c:\dev\planbook\CLAUDE.md` — the real briefing. Architecture and the reasoning you must not undo.
2. `c:\dev\planbook\AGENTS.md` — the rules that get broken by accident.
3. `c:\dev\planbook\plans\ROADMAP.md` — especially **Maintenance protocol** (lines ~30–41),
   **Phase 1**, and **Cross-cutting rules** (~line 388). The maintenance protocol is what `TESTING.md`
   and `CHANGELOG.md` have to serve; read it before you shape either file.
4. `c:\dev\planbook\plans\work-orders\README.md` — status vocabulary, size vocabulary, the
   **Standing obligations** list at the bottom.
5. `c:\dev\planbook\design\style-guide.md` — not to implement (that's WO-1.2) but so `TESTING.md`'s
   Phase 1 section asks the right questions.
6. **Reference repo, read-only:**
   `C:\Users\WildB\OneDrive\Documents\Coding Projects\Attendance App\plans\TESTING.md` — the model
   for shape and voice. Also its `CLAUDE.md` for the documentation register this project wants:
   every gotcha carries the scar that produced it.
7. `c:\dev\planbook\docs\data-model.md` — skim; it tells you what Phase 1 will actually be testing.

**Do not write to the reference repo.** It is a live classroom app.

---

## 3. Constraints block — verbatim from `ROUTING.md` → "What every Codex brief must carry"

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
- Stay inside the work order's **Out of scope** line. Do not tick roadmap boxes, edit `plans/`, or
  touch `CHANGELOG.md` / `TESTING.md` — the teacher does maintenance, after the verifier reports.

### One scoped exception to the last bullet, and only one

`TESTING.md` and `CHANGELOG.md` **are the deliverables of this work order.** Create them. That is
the exception and it does not extend one inch further:

- **Do not** tick any roadmap box in `plans/ROADMAP.md`.
- **Do not** change any work order **Status** line from `⬜ NOT STARTED`.
- **Do not** edit the dashboard in `plans/work-orders/README.md`.
- **Do not** edit anything else under `plans/`.
- In `TESTING.md`, every check you write is an **unchecked** `- [ ]`. Nothing has been run on an
  iPad. Leaving them unchecked is the honest state and the project's rule.
- In `CHANGELOG.md`, the first entry describes the repo skeleton — this work order — and nothing
  it does not yet do.

---

## 4. Notes on the deliverables

**Git.** `git init` in `c:\dev\planbook`. Integration branch must be named `main` (set it
explicitly; don't rely on the default). One commit containing the whole skeleton, short imperative
summary per suite convention. Then cut `phase/1-shell-store-roster` from it. Verify with
`git log --oneline --all` and `git branch -a` before you report. If `user.name` / `user.email` are
unset globally, set them **locally for this repo only** (`wtoomey@stjohnshigh.org`) rather than
touching global config.

**File layout.** The work order names files that must exist. `index.html`, `sw.js`, and
`manifest.webmanifest` are **placeholders** at this stage — WO-1.2 builds the shell, WO-1.3 builds
the manifest and service worker for real. A placeholder that is honest about being one is correct
here; a half-built shell is out of scope and will collide with WO-1.2. Empty directories don't
survive git, so `src/` and `tools/` need something in them — a short `README.md` saying what belongs
there is preferable to a `.gitkeep`, because it also documents the layout convention that everything
after this copies.

**`TESTING.md` shape.** Sections keyed to phases (1 through 8) so later work orders append rather
than restructure. Environment header naming a desktop browser and a real iPad, with a place to record
the **iPadOS version** — WO-1.3's acceptance requires that recorded, so leave the slot ready.
Phase 1's section starts with WO-1.1's own four acceptance lines and grows from there. State plainly
that there is no automated suite and that this is a decision, not an omission.

**`CHANGELOG.md` shape.** Keep-a-Changelog, `## [Unreleased]` at top, no version released yet.

**Voice.** Suite voice: say what happened and what to do next. Plain teacher language, no marketing
register. Roll Call!'s `CLAUDE.md` and `plans/TESTING.md` are the calibration.

---

## 5. What "done" means — report against exactly this

- [ ] `git log` shows a first commit on `main` and a phase branch cut from it.
- [ ] `TESTING.md` exists with an environment section naming iPad Safari explicitly.
- [ ] `CHANGELOG.md` exists with `## [Unreleased]` and one real entry.
- [ ] No dependency manifest of any kind exists in the repo.

For each line: met / not met / needs a human on real hardware. A verifier reads your work cold
against this list and has no Write access, so an overclaimed line costs a correction round rather
than a pass. Report what you did, what you could not satisfy, and anything you were unsure about —
plus every file path you created or changed.
