# Brief — WO-1.2 · App shell & design frame

**Work order** WO-1.2 · **Phase** 1 (Shell, store, roster) · **Ship** 1 · **Size** M
**Route** Claude (`work-order-implementer`)
**Branch** `phase/1-shell-store-roster` — work on the phase branch, not a branch per work order.
**Dispatched** 2026-08-04

**Routing reason, for the record.** Cross-repo design lift from Roll Call! plus the inline-colors
trap; it also establishes the conventions every later Phase 1 work order copies. Mechanically
greppable acceptance lines made Codex a near-miss, but "colors match the style guide literally"
needs eyes and the inline-colors convention is exactly what a tidying pass destroys.

**Gate check, passed.** Depends on WO-1.1 → ✅ DONE 2026-08-04. Status was ⬜ NOT STARTED. Writes no
student data, so the WO-1.5-before-WO-1.6 ordering constraint does not bind here. Not 🔒 GATED.

**Re-dispatched 2026-08-04.** An earlier run against this brief was interrupted: it left uncommitted
work on disk (`index.html` modified; `src/shell.css`, `src/shell.js`, `src/modal.js`,
`src/save-indicator.js`, `src/live-region.js`, `src/prefs.js` untracked) and never wrote
`WO-1.2-result.md`, so there is no record of what it believed it had finished. Treat that code as an
**unverified in-flight draft, not as done work.** Audit it line by line against §4 below, finish or
correct what it got wrong, and delete anything that is outside the Deliverables. Do not assume it is
right because it is there. Say in your report which parts you kept, which you rewrote, and why.

---

## 1. The work order, verbatim

> ## WO-1.2 — App shell & design frame
>
> **Ship** 1 · **Status** ⬜ NOT STARTED · **Size** M · **Depends on** WO-1.1
> **Closes roadmap** Phase 1 → "Lift the frame from Roll Call!'s `design/starter-template.html`…"
>
> **Why it exists.** Every visible element in this app comes from the suite design system. Hand-
> designing a second visual language costs weeks and produces something that looks like a different
> product. Roll Call!'s `design/portable-components.md` exists precisely so this is a lift, not a
> design exercise.
>
> **Reference:** `C:\Users\WildB\OneDrive\Documents\Coding Projects\Attendance App` →
> `design/starter-template.html`, `design/portable-components.md`, and this repo's
> [`../../design/style-guide.md`](../../design/style-guide.md).
>
> **Deliverables**
> - Two-row header with the navy gradient
>   (`linear-gradient(135deg, #0d2137 0%, #1a3c5e 60%, #2a2a6e 100%)`), page background `#f0f2f5`,
>   white rounded panels at 14px radius with `0 1px 4px rgba(0,0,0,0.07)`.
> - The modal system: scrim `rgba(0,0,0,0.5)`, gradient modal header, `srIn` entrance, escape and
>   backdrop close, focus trapped.
> - Save indicator chip with its five states (saving / saved / error / syncing / retry) — wired to
>   nothing yet, driven by a stub.
> - `announce()` helper into an `aria-live` region; `.sr-only` utility.
> - The `@media (pointer: coarse)` block established with the 44px rule, plus the 1024px and 640px
>   breakpoints, in the declaration order the style guide names.
> - iOS chrome: viewport meta with `maximum-scale=1.0`, `apple-mobile-web-app-capable`,
>   `env(safe-area-inset-*)` padding, `overscroll-behavior-y: contain`, `touch-action: manipulation`
>   on tappables.
> - Rename everything to Planbook; `localStorage` prefix `planbook_`.
>
> **Out of scope** — any data, any real screen. This is chrome and a component shelf.
>
> **Acceptance**
> - [ ] Colors match `design/style-guide.md` literally, declared inline — no CSS variables.
> - [ ] No dark-mode rules exist anywhere: no `prefers-color-scheme`, no `[data-theme]`.
> - [ ] A modal opens, traps focus, closes on Escape and on backdrop click, and returns focus to
>       the element that opened it.
> - [ ] `:focus-visible { outline: 2px solid #5b6fcc; outline-offset: 2px; }` is global and no rule
>       removes an outline anywhere.
> - [ ] On an iPad, no control is under 44px and nothing sits under the safe-area inset.
> - [ ] No `planbook_` key holds anything but a UI preference.
>
> **Traps** — The style guide's "colors inline, not CSS variables" reads like a mistake and is not.
> Don't tidy it. Light theme only means the dark header *is* the light theme, not a dark variant.

### Phase-level rule that applies

From `plans/work-orders/phase-1-shell-store-roster.md`:

> **The ordering rule for this phase:** WO-1.5 (backup & restore) lands before WO-1.6 and everything
> after it. No feature that writes student data ships before the path that gets it back out.

---

## 2. Read these first, before writing anything

**In this repo (`c:\dev\planbook`):**

| File | Why |
|---|---|
| `CLAUDE.md` | The architecture and the reasoning you must not undo |
| `design/style-guide.md` | **The primary spec for this work order.** Copy values literally |
| `src/README.md` | The `src/` conventions WO-1.1 set: plain ES modules, `kebab-case.js`, one concern per file, and why this repo is flatter than Roll Call! |
| `index.html` | Currently a WO-1.1 placeholder whose comment header tells you exactly what WO-1.2 owns vs. what WO-1.3 owns. Replace it |
| `TESTING.md` | The checklist shape. Your Acceptance lines belong here — see the constraint below about who edits it |
| `plans/work-orders/README.md` | Standing obligations, esp. the `@media (pointer: coarse)` rule |

**In Roll Call! (`C:\Users\WildB\OneDrive\Documents\Coding Projects\Attendance App`) — read-only, do not modify:**

| File | Why |
|---|---|
| `design/starter-template.html` | The frame to lift. This is the source, not an inspiration |
| `design/portable-components.md` | Which components transfer and how. Lift, don't redesign |
| `design/README.md` | How the design system is meant to be used |
| `design/execution-guide.md` | Declaration order and assembly conventions |
| `CLAUDE.md` | Context on the predecessor. Note what NOT to take: `src/bridge.gs`, JSONP, the GET-only outbox, Sheets storage — all `file://`/Apps Script workarounds that do not apply here |

**A judgment call this work order asks you to make.** Roll Call! is one big `src/dashboard.html`
because it opens from `file://`, where ES modules are blocked. Planbook is served over HTTPS and
`src/README.md` commits to plain ES modules in `src/`. So the lift is of the *visual language and
component behavior*, not the single-file shape. Split sensibly (e.g. a shell/modal/announce module
or two) and keep it small — but if you conclude splitting costs more than it pays, `src/README.md`
asks for a decision record rather than a quiet revert. Say so in your report either way.

---

## 3. Constraints — from `ROUTING.md` → "What every Codex brief must carry", verbatim

These are inlined for the Claude route too. They cost nothing and they are what stops the
expensive mistakes.

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

**Note on the last bullet, specific to this work order.** Do not tick anything and do not edit
`plans/`, `CHANGELOG.md`, or `TESTING.md`. WO-1.2's Acceptance lines will be moved into `TESTING.md`
by the orchestrator after the verifier reports. Draft the lines in your report if you like; don't
write them into the file.

**Two more that are specific to WO-1.2's Out of scope line:**

- **No data, no real screen.** No IndexedDB, no year document, no roster, no classes. The save
  indicator is driven by a stub — a function you can call from the console or a demo control that
  cycles the five states. Wiring it to a real store is WO-1.4.
- **No manifest link, no service worker registration.** WO-1.3 owns those. The `manifest.webmanifest`
  and `sw.js` files already exist as WO-1.1 placeholders; leave them alone. The iOS *meta tags*
  (`apple-mobile-web-app-capable`, viewport, safe-area) ARE yours — the work order names them.

---

## 4. What "done" means

Report against exactly these six lines. For each, say verified / not verified / needs a human on an
iPad, and name the evidence.

1. **Colors match `design/style-guide.md` literally, declared inline — no CSS variables.**
   Every hex you write should be findable in the style guide. No `--custom-property` color
   declarations, no `var(--…)`.
2. **No dark-mode rules exist anywhere: no `prefers-color-scheme`, no `[data-theme]`.**
   Greppable. Zero hits, including in comments that could later be uncommented.
3. **A modal opens, traps focus, closes on Escape and on backdrop click, and returns focus to the
   element that opened it.** All four behaviors. The focus return is the one most often skipped.
4. **`:focus-visible { outline: 2px solid #5b6fcc; outline-offset: 2px; }` is global and no rule
   removes an outline anywhere.** Greppable both ways: the rule is present, and `outline: none` /
   `outline: 0` appear nowhere.
5. **On an iPad, no control is under 44px and nothing sits under the safe-area inset.** 👤 This one
   needs a real iPad. Desk-side you can show that every interactive selector appears in the
   `@media (pointer: coarse)` block with a 44px minimum and that `env(safe-area-inset-*)` padding is
   applied — say that, and say plainly that the iPad check is still owed.
6. **No `planbook_` key holds anything but a UI preference.** Enumerate every key you write and what
   it holds.

Also report:

- Every file you created or changed, as an absolute path.
- The `src/` split you chose and why (see the judgment call in §2).
- Anything you wanted to do that was outside the Deliverables — as a **proposed follow-up work
  order**, not as work you did. Never widen a work order.
- Draft `TESTING.md` lines and a draft `CHANGELOG.md` entry, as text in your report only.

**Write your report to `.claude\dispatch\WO-1.2-result.md` as your final act.** That file is half
the audit trail — the brief records what was asked, the result records what came back.
