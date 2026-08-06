# Brief — WO-1.4 Year document store

You are implementing **one work order** in the Planbook repo (`c:\dev\planbook`), on the branch
`phase/1-shell-store-roster`. Build exactly what is below. Do not widen it.

---

## 1. The work order, verbatim

### WO-1.4 — Year document store

**Ship** 1 · **Status** ⬜ NOT STARTED · **Size** M · 🚩 · **Depends on** WO-1.3
**Closes roadmap** Phase 1 → "IndexedDB store: one year document, load-on-open, save-on-change,
`rev` increment."

**Why it exists.** The whole year is one JSON document of a few megabytes — it loads into memory in
well under a second, so every query is a plain array operation and there is no query layer to build.
It is also what makes whole-document last-writer-wins sync sound rather than lazy.

**Reference:** `docs/data-model.md` — the document shape is settled, implement it as written.

**Deliverables**
- IndexedDB wrapper: one object store keyed by year, one record per year document.
- `newYearDocument()` producing a valid empty document with `schemaVersion: 1`, a generated `docId`
  and `deviceId`.
- Load-on-open, save-on-change with debounce; every save bumps `rev` and sets `updatedAt`.
- The save indicator from WO-1.2 wired to real save state, including the error state.
- A migration hook keyed on `schemaVersion` — empty today, present so that adding one later isn't
  a refactor.
- Year switching: create a new year, list years, open one. The roster turns over every year and
  nothing may assume a fixed class list.

**Out of scope** — sync, conflict handling, anything touching Drive. Phase 7.

**Acceptance**
- [ ] A change persists across a full reload, and across an app relaunch on iPad.
- [ ] `rev` increases by exactly one per save; two rapid edits inside the debounce window are one
      save and one `rev`.
- [ ] A save failure surfaces the error state on the indicator and does not silently swallow.
- [ ] Two year documents coexist; switching between them shows the right data.
- [ ] A document written before a schema bump loads through the migration hook without loss.

**Traps** — Don't split the document into multiple object stores for "efficiency." The single-
document shape is the sync design; splitting it quietly removes the property that makes sync
correct. Debounce saves, but flush on `visibilitychange` — iOS kills backgrounded tabs.

---

## 2. Read these first, in this order

| File | Why |
|---|---|
| `AGENTS.md` | The rules that get broken by accident. It points at `CLAUDE.md`; read that too. |
| `CLAUDE.md` | The architecture and the reasoning you must not undo. |
| `docs/data-model.md` | **The spec.** The document shape is settled — implement it as written, field for field. Note especially "Why one document instead of rows in a database" and the four shape decisions. |
| `src/README.md` | The `src/` convention: plain ES modules, `kebab-case.js`, one concern per file, named for the thing it owns (`store.js` is named there as an example). |
| `src/shell.js` | The boot module and the only one `index.html` loads directly. It states the delegation convention (`data-*` hooks, never inline `onclick`) and carries a `window.planbook` console seam with a comment explaining when it goes. Its `DOMContentLoaded` handler has a loading screen that exists *specifically* so the WO-1.4 store has somewhere to load behind. |
| `src/save-indicator.js` | The chip you are wiring. Five states, `showSaveState(state)`. Its header comment names WO-1.4 as the thing that "replaces the stub below with real save state", and `demoSaveCycle()` is the stub. |
| `src/prefs.js` | The only code allowed to touch `localStorage`. `setPref` refuses undeclared keys by design. If WO-1.4 needs a UI preference (e.g. which year is open), add it to `PREF_DEFAULTS` with a comment saying why it is a UI fact and not student data. |
| `src/modal.js`, `src/live-region.js` | The modal system and `announce()`, for the year-switching UI. Lift, don't redesign. |
| `index.html` | The shell and the component shelf. |
| `design/style-guide.md` | Colors, spacing, touch targets. Colors go inline. |
| `tools/README.md` → the `verify-shell.mjs` section | **Read before writing any verification code.** It documents four CDP traps that every agent so far has rediscovered from scratch. |
| `tools/verify-shell.mjs` | The existing verification harness. **Do not write a second one.** |
| `plans/verification-tooling.md` | Why the script is deliberately one file and stays one file. |

**On `tools/verify-shell.mjs`:** it is the one harness. If WO-1.4 needs a check it cannot make, say
so in your report as a proposed follow-up — do not write a throwaway script and do not grow the
harness into a framework. Extending it in the spirit of what is already there (an added check that
fits the existing shape) is fine; a new tool is not.

**On serving locally:** a service worker will not register from `file://`. `tools/serve-https.mjs`
exists for this and sends `no-store` on everything. `localhost` is a secure context; a LAN address
is not — this cost WO-1.2 a false pass.

---

## 3. Constraints — non-negotiable, from `plans/work-orders/ROUTING.md`

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

### Additional standing rules that apply to this work order specifically

- **One object store, one record per year document.** The Traps line is the whole sync design. Do
  not normalize, do not split `students` / `scores` / `attendance` into their own stores, do not add
  an index "for efficiency." The document loads whole and is written whole.
- **A score cell is always an object**, never a bare number — if you seed or shape anything under
  `scores`, honor that.
- **There is no schedule model.** Do not add one to the empty document. See
  `plans/rotating-schedule.md` if tempted.
- **Preserve the reasoning in existing files.** `src/README.md`, `src/shell.js`,
  `src/save-indicator.js`, and `src/prefs.js` all carry comments explaining decisions that have
  already been argued once. Improving, tidying, or shortening them is a failure of the work order
  however clean the result looks. `save-indicator.js`'s comment about the deliberately-absent
  `queued` state is the clearest example: it is not an omission to fix.
- **`demoSaveCycle()` and the `window.planbook` seam.** `save-indicator.js` says the stub is
  "deleted when WO-1.4 wires the real thing." Use judgment: the component shelf still exists and
  `tools/verify-shell.mjs` may depend on the shelf's fixtures. If removing the stub would break a
  verify-shell check, leave it and say so in your report rather than breaking the harness. WO-1.10
  owns the shelf's removal.
- **Report honestly.** A separate verifier reads your work cold against the Acceptance list. Claiming
  a line you did not meet costs a correction round, not a pass. Say plainly which lines you verified
  by running something, which you reasoned about, and which need a real iPad.

---

## 4. What "done" means

Report against this list, line by line, saying **how** you know:

1. **A change persists across a full reload, and across an app relaunch on iPad.** The reload half is
   yours to demonstrate. The iPad relaunch half needs a real device — flag it as a manual check with
   the exact steps a teacher would follow.
2. **`rev` increases by exactly one per save; two rapid edits inside the debounce window are one save
   and one `rev`.** This is mechanically checkable. Show how.
3. **A save failure surfaces the error state on the indicator and does not silently swallow.**
   Demonstrate a forced failure reaching `showSaveState('error')`. Note that `error` and `retry` also
   go through `announce()` by design.
4. **Two year documents coexist; switching between them shows the right data.**
5. **A document written before a schema bump loads through the migration hook without loss.** The
   hook is empty today — show that the path exists and runs, not that a migration was written.

Plus the Traps, which are not on the Acceptance list but are what the work order is protecting:

- One object store, one record per year. No splitting.
- Saves debounce **and flush on `visibilitychange`** — iOS kills backgrounded tabs, and an unflushed
  debounce there is lost grades.

---

## 5. Where to write your report

Your report is the audit trail. It records what came back, as distinct from what was asked for.
State: what you built and where (file paths), the Acceptance list line by line with evidence, what
you could not satisfy, anything you were unsure about, and anything you think should be a follow-up
work order rather than something you widened this one to include.
