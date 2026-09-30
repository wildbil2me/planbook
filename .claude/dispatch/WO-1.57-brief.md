# WO-1.57 — a section that throws hands the next one whatever emulation it had changed · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.57-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, at **Opus** (no model override). The deciding signal is the proof budget plus the Claude column: the Acceptance demands one clean full run and at least four planted runs (touch throw, touch throw with restore removed, sync-button throw, sync-button throw with removal taken out) at ~4.4+ min each, which is past Codex's 20-minute cap before any reading; and the work order is in the Claude column on its own merits anyway — its Traps are judgment (`recoverPage()` must never throw; no per-file `finally`; keep WO-1.56's `finally`) and it owes `TESTING.md` prose. Set aside: the code change itself is small and mechanical, which alone would read Codex/Sonnet-shaped.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.57 — a section that throws hands the next one whatever emulation it had changed

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-29 · **Size** S · **Depends on** WO-1.56 — the audit this acts on
**Closes roadmap** *(no box. A harness defect with no live symptom yet.)*

**Booked 2026-09-27**, owner-directed, from WO-1.56's verdict. `TESTING.md` § WO-1.56 read the 39
files in `tools/verify/` that call `Emulation.setTouchEmulationEnabled`. **21 of the 38 it did not
fix leave touch emulation in a different state after a throw** than after a normal exit, because
every restore is a plain later `send` and only two files have a `finally`, neither touching
emulation. Most of the 21 change the viewport in the same window, and six more files diverge on the
viewport alone. `recoverPage()` in `tools/verify-shell.mjs` reloads the page and **a reload resets
no CDP emulation**, so whatever the section had changed is handed to the next one. In today's run
order nine of the 21 hand it to a section that reads the pointer without setting it. The audit gives
the list and says plainly that it traced where the setting goes and ran nothing. So today it costs
nothing unless a section throws. When one does, the checks after it can be measured on the wrong
device with nothing to say so, which is the moment a run most needs to be believed.

**Deliverables**
- **After a throw, put emulation back to what the failed section started with**, before
  `recoverPage()` reloads. Touch emulation and device metrics both. Not one fixed baseline for every
  section: 29 of the 67 browser sections set no touch at all and run on whatever they inherit, so
  "the state this section received" is the only baseline that means the same thing for all of them.
  Recording it by wrapping `send` for `Emulation.*` calls is the audit's suggestion, not a ruling.
- **After a throw, also remove every page-start script the failed section had installed and not
  yet removed**, before `recoverPage()` reloads. *(Widened 2026-09-29, owner-directed, out of
  WO-5.17's verdict.)* A reload keeps every `Page.addScriptToEvaluateOnNewDocument` script, so it
  keeps running in every section after the failed one, just as leftover emulation does. The case
  that found it: `verify/sync-button.mjs` installs a fake Google sign-in library (line ~87) and two
  fake-clock scripts, and it removes them only at its foot (~1308, ~1346, ~1448). A throw anywhere
  before that leaves every later section loading a fake `google.accounts`. The same `send` wrapper
  can record the identifiers. Nothing asserts this today, and neither does the emulation half. Page
  memory such as `window.__drive` is not part of this, because the reload already clears it.
- **Say in `TESTING.md` § WO-1.57 how the state is captured and restored**, and what is out of reach
  (for example emulation set some other way than through `send`, if any section does that).
- Nothing under `src/` moves, and none of the 21 section files is edited.

**Acceptance**
- [ ] A throw injected inside a temporary touch window in one of the nine sections the audit names
      (`classes-terms.mjs` → `categories-weights.mjs` is the suggested pair) leaves the next section
      reading the same `matchMedia('(pointer: coarse)').matches`, `navigator.maxTouchPoints` and
      `innerWidth` as it does on a normal run. Recorded in `TESTING.md` § WO-1.57, and **the injected
      throw is reverted before anything else is written** (`AGENTS.md`).
- [ ] Mutation-proved: the same injected throw with the restore taken out of the recovery path
      leaves the next section reading a different value.
- [ ] A throw injected in `sync-button.mjs` after its fake sign-in is installed leaves the next
      section loading no fake: `window.google` reads the same as on a normal run. It is mutation-proved
      the same way, and recorded and reverted as the first line says.
- [ ] The whole harness is green on the real clock, the check list is unchanged in names and order,
      and no check changes state apart from WO-7.12's named check if it is still open.
- [ ] `node tools/wo-sweep.mjs` is green, including § 25's reading of `runSection()`'s shape.

**Traps** — **Do not remove WO-1.56's `finally` from `date-zero-key.mjs`**. It is the fix at the
point of the defect, and this is the net under every other section, not a replacement for it.
**`recoverPage()` must still never throw**. Its own comment says why: a throw out of the recovery
from a throw is the one failure that stops the run silently, and a CDP call that fails while
restoring goes in the same `catch`. **Do not fix the 21 files one `finally` at a time**. The audit
ruled that out, and the next new section would bring the defect back. **A failed section's leftover
fixture data** (WO-1.56's limit: `c_wo147` left in the document) is out of scope. It is a different
family, and the planted runs showed no check changing because of it.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `tools/verify-shell.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

  - `TESTING.md` § WO-1.56 (line ~2257) — the audit: the 21 + 6 files, the nine that hand state to a pointer-reading section, and the planted-throw method this work order repeats. Match its record shape for § WO-1.57.
  - `tools/verify/classes-terms.mjs` (touch window ~line 1134) and `tools/verify/categories-weights.mjs` — the suggested pair.
  - `tools/verify/sync-button.mjs` — fake sign-in ~87, two fake clocks, removals ~1308/~1346/~1448.
  - `tools/wo-sweep.mjs` § 25 (~line 2934) — reads `runSection()`'s shape by brace count; read its anchors before editing that body. Its comment says **anyone who edits `runSection()`, `recoverPage()` or the browser loop owes a planted-throw run** — your Acceptance runs pay that; say so in the record.
  - `AGENTS.md` § "If you were dispatched with a work order" — mutation markers (`MUTATION WO-1.57`), revert before writing anything else.

**Orchestrator notes — traps you would not guess from the work order:**
- **Sections destructure `send` from `h` inside `run(h)`** (`const { send, … } = h`), so a wrapper installed on `h` before each section is seen by the section. But harness helpers (`load`, `dateResetOn`, `evalJs` …) close over the **module-level** `send` in `verify-shell.mjs` (~line 594), not `h.send`. Decide deliberately where you record, and state in `TESTING.md` which calls are and are not seen.
- **The harness itself installs run-wide page-start scripts** before the sections (`CATCH_AUDIO_CONTEXTS` ~859, `SHIFT_PAGE_CLOCK` ~898 under `--today`). A recovery that removes those breaks every later section and, under `--today`, the shifted clock. Only scripts added *during the failed section and not yet removed* may go.
- CDP cannot be asked the current emulation state; the baseline has to come from tracking what was set. "Not set" is a real baseline and restoring it means the clear call (`clearDeviceMetricsOverride` / touch `enabled:false`), not an invented default.
- `Page.addScriptToEvaluateOnNewDocument` returns an `identifier`; removal is `Page.removeScriptToEvaluateOnNewDocument`. A section that already removed its own script must not be removed twice into a thrown error that escapes.
- Every restore call goes inside `recoverPage()`'s (or runSection's recover path's) catch — a failing CDP call there must not throw out. Keep § 25 green; if its anchors move, that is its FAIL telling you, not a thing to edit around.
- **The check list must be unchanged in names and order** — do not add a permanent `check(` for this (it would also move `wo-sweep` § 11's recorded count in `tools/README.md`). The proof lives in planted runs recorded in `TESTING.md`, as WO-1.56's did.
- **Runs:** `verify-shell.mjs` has no single-section flag; every run is a full run. Budget ~5 full runs; `grep -rn MUTATION tools/` must be empty before you write the result file.
- Tick the Acceptance lines you prove; do not touch `CHANGELOG.md` (draft it in the result).

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

## 5. Done means these 5 lines, reported against one by one

1. A throw injected inside a temporary touch window in one of the nine sections the audit names (`classes-terms.mjs` → `categories-weights.mjs` is the suggested pair) leaves the next section reading the same `matchMedia('(pointer: coarse)').matches`, `navigator.maxTouchPoints` and `innerWidth` as it does on a normal run. Recorded in `TESTING.md` § WO-1.57, and **the injected throw is reverted before anything else is written** (`AGENTS.md`).
2. Mutation-proved: the same injected throw with the restore taken out of the recovery path leaves the next section reading a different value.
3. A throw injected in `sync-button.mjs` after its fake sign-in is installed leaves the next section loading no fake: `window.google` reads the same as on a normal run. It is mutation-proved the same way, and recorded and reverted as the first line says.
4. The whole harness is green on the real clock, the check list is unchanged in names and order, and no check changes state apart from WO-7.12's named check if it is still open.
5. `node tools/wo-sweep.mjs` is green, including § 25's reading of `runSection()`'s shape.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

