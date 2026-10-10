# WO-1.72 — a dialog opened from Settings has a way back to it · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.72-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, at **Opus** (no model override) — routed on its own merits: it is a design lift from a mockup with an owner's ruling attached, and it touches `src/modal.js`'s stack and focus return, where the Traps name two ways to get it subtly wrong. Runner-up set aside: Size S and mostly mechanical markup would read as Codex-eligible, but the opener-flag lifecycle and the focus handoff are judgment, and the route was already decided Claude Opus by the earlier run of this dispatch.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.72 — a dialog opened from Settings has a way back to it

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-10 · **Size** S · **Depends on** WO-1.71 · **Blocks** nothing
**Closes roadmap** *(no box. Owner-directed, 2026-10-10.)*

**Booked 2026-10-10**, owner-directed, out of the same conversation as WO-1.71. The setup weeks are
the case: Classes and terms, then the roster, then the templates, in one sitting — and with WO-1.71
alone each one ends at the page, and the next starts at the gear.

**Surface.** [`design/mockups/settings-hub.html`](../../design/mockups/settings-hub.html), frames D
and E, styled in [`design/mockups/proposed-settings.css`](../../design/mockups/proposed-settings.css)
§ SETTINGS BACK.

**Rulings, the owner's, 2026-10-10**
1. **"‹ Settings" in the dialog's header**, before its title, in `.modal-close`'s on-dark fill. It
   closes the dialog and reopens the hub. **✕ and Done still close all the way.**
2. **Only when the dialog was opened from the hub.** The `+` tab, the class manager's rows and the
   grades screen's *Categories* button open the same dialogs, and from there it would be a way back
   to somewhere the teacher never was.
3. **Message templates gets none.** It is a view, not a dialog; its way out is the class tabs, as now.

**Ruled — the owner, 2026-10-10, at dispatch** *(this block was* Open — the owner's ruling, at
dispatch *until then)*. **First level only.** The button is drawn on the three dialogs the hub opens
directly and nowhere else; it does not survive a second hop — Roster → Edit student, Classes and
terms → Categories — because the inner dialogs already return to the one that opened them. So the
opener flag clears on every close, as the Traps say, and nothing has to outlive an inner dialog's
open and close on the modal stack.

**Deliverables**
- **`index.html`**: the button in the headers of the three dialogs the hub opens — `#rosterModal`,
  `#teacherModal` and the Classes and terms dialog — hidden in the markup.
- **`src/shell.js`** (or `src/modal.js`, if the answer is a general one): the hub records that it is
  the opener; the button is shown only then and hidden on every other way in.
- **`src/shell.css`**: § SETTINGS BACK lifted, with its coarse rule.
- **The harness**: the button drawn from the hub and absent from the `+` tab and the Categories
  button; back reopens the hub with focus on the door that was used; ✕ closes everything.
- **`design/mockups/proposed-settings.css`'s banner** and its `README.md` section amended.
- **`TESTING.md` § WO-1.72**, the `CHANGELOG.md` entry, and **`CACHE` in `sw.js` bumped.**

**Acceptance**
- [ ] Opened from Settings, Roster, Classes and terms and Your details draw "‹ Settings"; opened any
      other way, they do not.
- [ ] "‹ Settings" closes the dialog and reopens the hub with focus on the door that opened it; ✕ and
      Done close the dialog and leave the hub closed.
- [ ] Under a coarse pointer the button is at least 44px tall.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. `CACHE` in `sw.js` is bumped.
- [ ] `TESTING.md` § WO-1.72 carries these lines verbatim with the evidence for each.
- [ ] 👤 On the iPad, after a force-quit: Settings → Classes and terms → ‹ Settings → Roster →
      ‹ Settings → Your details → Done, and the `+` tab's dialog with no back button.

**Traps** — **Where the dialog came from is a fact about this opening, not about the dialog.** A flag
left set by the last hub opening draws the button on the next `+` tap; clear it on every close.
**`src/modal.js` keeps a stack** — reopening the hub from inside a dialog is a close and an open,
never a dialog over a dialog.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `design/mockups/proposed-settings.css`
  - `design/mockups/settings-hub.html`
  - `src/modal.js`
  - `src/shell.css`
  - `src/shell.js`
  - `tools/verify-shell.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `src/shell.js` § `openSettings()` / `leaveSettings()` (~line 2361) — WO-1.71's handoff. A door
  inside the hub closes the hub and hands the **gear** (`#settingsBtn`) on as the opener; a door
  outside the hub (the `+` tab, a harness `.click()` on a hook) comes back unchanged. That split is
  where "opened from the hub" is already known — build on it rather than inferring it again.
- `src/modal.js` — `openModal`, `closeModal`, `dismissModal`, `setCloseGuard`, and the comment that
  nothing outside the module reaches into the stack.
- `index.html` — `#settingsModal` (~2569), `#classesModal` (~2709, this is "Classes and terms"),
  `#rosterModal` (~3684), `#teacherModal` (~4187).
- `CHANGELOG.md` top entries (WO-1.71's is the model).

**Traps the orchestrator adds — things you would not guess from the work order:**
- **The mockup's `.modal-back` is 28px and has no coarse rule.** The Deliverables line says "with its
  coarse rule" and Acceptance 3 wants 44px: you write that rule, in `src/shell.css`'s
  `@media (pointer: coarse)` block (~line 2003), and say in the banner amendment that it was added at
  the lift rather than lifted.
- **Focus on back has two parts.** The reopened hub's opener must still be the gear (so ✕ on the hub
  returns focus to the gear as it does now), and focus must then land on *the door that was used* —
  not the hub's first focusable. Watch the order: closing the inner dialog restores focus to its
  opener before the hub opens.
- **First level only, as ruled.** Inner dialogs (Roster → Edit student, Classes and terms →
  Categories) never draw the button. Find out whether those inner dialogs stack *over* the outer one
  or replace it; if the outer one closes and reopens, the flag is gone by design and the button does
  not come back — that is the ruling, not a bug. Say in your report which shape each one is.
- **Clear on every close** — ✕, Done, Escape, overlay tap, back itself. Harness the sequence the
  Traps fear: hub → Roster → ✕, then the `+` tab / Categories button → no button.
- **CHANGELOG.md**: the work order lists the entry as a deliverable and § 3 says leave it to the
  teacher. Resolve it this way: **draft the entry in your result file**, do not write it into
  `CHANGELOG.md`; it is committed in the maintenance step.
- **If you insert a mutation to prove a check, revert it before writing anything else**, and
  `grep -rn MUTATION` over your files before reporting (AGENTS.md).
- `sw.js`: bump `CACHE` by one from what is there now (WO-1.71 left v179 or later — read it).

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
- Write `TESTING.md` § <your work order>, every time: its Acceptance lines copied verbatim and the
  evidence for each. **It is a deliverable, not a permission** — the brief's § 5 names the heading,
  docs-only and process work owe one too (only a gate, whose boxes live in `gates.md`, does not), and
  `wo-gate.mjs --tick` refuses ✅ DONE without it.
- You may tick the boxes your own run closed, and update `plans/` and the rest of `TESTING.md` as
  you go. Two
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

## 5. Done means these 6 lines, reported against one by one

1. Opened from Settings, Roster, Classes and terms and Your details draw "‹ Settings"; opened any other way, they do not.
2. "‹ Settings" closes the dialog and reopens the hub with focus on the door that opened it; ✕ and Done close the dialog and leave the hub closed.
3. Under a coarse pointer the button is at least 44px tall.
4. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. `CACHE` in `sw.js` is bumped.
5. `TESTING.md` § WO-1.72 carries these lines verbatim with the evidence for each.
6. 👤 On the iPad, after a force-quit: Settings → Classes and terms → ‹ Settings → Roster → ‹ Settings → Your details → Done, and the `+` tab's dialog with no back button.

**Write `TESTING.md` § WO-1.72 — it is a deliverable, not a permission.** Add `### WO-1.72 — a dialog opened from Settings has a way back to it` under `## Phase 1 — Shell, store, roster`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-1.72` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

