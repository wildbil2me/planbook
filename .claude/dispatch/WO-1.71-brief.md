# WO-1.71 — the header keeps what is used in class, and the rest goes behind a gear · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.71-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, at **Opus** (no model override), on its own merits: this is a design-system lift
from Roll Call! (the orange header rule, `.toggle-switch`) under a drawn mockup, it re-sorts a header
every later work order copies (WO-1.72 and WO-1.73 both build on it), and its Traps are judgment, not
mechanics. Codex was set aside without a probe — the first Acceptance line wants eyes, the last is 👤,
and the M-sized harness surgery across six-plus `tools/verify/` files is not a fully specified spec.

**Session-limit risk is elevated on this dispatch.** `--start` reported the rolling window already at
the p25 death mark. Two consequences for you: (1) **if you insert a mutation to prove a check, revert
it before you write a single line of prose about it**, and put the literal word `MUTATION` in it so a
recovering session's `grep -rn MUTATION` finds it; (2) write the result file incrementally — a
skeleton early with what is decided, filled as you go — rather than all at the end.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.71 — the header keeps what is used in class, and the rest goes behind a gear

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-10 · **Size** M · **Depends on** — · **Blocks** WO-1.72, WO-1.73
**Closes roadmap** *(no box. Owner-directed, 2026-10-09.)*

**Booked 2026-10-10**, owner-directed, out of a conversation held on 2026-10-09 while WO-2.60 was in
flight. The header's two rows were sorted at WO-1.7, WO-1.9 and WO-2.29 by *a switch for the whole app
goes on top, a way into the open class goes below*, and the sort has drifted: the second row's own
comment says its icons are *"all of them about the class that is open"* and the comment on the fourth
says they are *"about no single class"*. The owner's test replaces it — **used in class, or set and
forget**. Presentation is flipped mid-period and stays; the alert sound is a preference, and the
roster is never opened during class — after class for an incident, or at the start of a semester.

**Surface.** [`design/mockups/settings-hub.html`](../../design/mockups/settings-hub.html), frames 0,
A, B, E and F, styled in [`design/mockups/proposed-settings.css`](../../design/mockups/proposed-settings.css)
§ SETTINGS HUB, with `design/mockups/README.md` § "The header and Settings". **Lift the section rather
than re-deriving it**, and amend its banner in the same sitting.

**Rulings, the owner's, 2026-10-09 and 2026-10-10**
1. **Top row, in this order: Backup · Sync · Presentation · Year · About.** The alert-sound button
   leaves the header. Sync keeps WO-7.5's other rulings — hidden until opted in, not laid out below
   640px, About wearing its badge there — until WO-1.73 measures whether it can stand on its own.
2. **Second row: tabs and terms, then one gear**, `title` and `aria-label` *Settings*. Roster and
   contacts, Classes and terms, Your details and Message templates leave the header.
3. **The orange rule.** `.header` gains `border-bottom: 2px solid #e67e22`, on every screen and on no
   dialog. It is Roll Call!'s, where it is the collapsed `#activePassBanner`'s border showing through
   at zero height (its `src/dashboard.html` ~321); here it is the header's own, and the comment at the
   rule says it is lifted on purpose.
4. **The gear opens Settings**: the stock `.modal-panel`, titled *Settings*, holding *Your classes*
   (Roster and contacts · Classes and terms), *Outreach* (Message templates · Your details) and *Hall
   passes* (Sound alerts). Each door closes the hub and opens what exists today, unchanged.
5. **The roster door names the open class** — *"English III · students, guardians and supports"* —
   from `getSelectedClass()`, the class the dialog will open on. From *All classes* that is the last
   class visited, as the header icon does today. A class switcher inside the roster dialog is likely
   later and is not this work order.
6. **Sound alerts is Roll Call!'s switch**, `.toggle-switch`, in a row that is its own `<label>`.
   Checked means the sound is on. Over there it is the first row of that app's Settings.
7. **Your details gets a person icon.** Its cog-like glyph beside a real gear reads as a second
   settings button.
8. **Templates live behind Settings.** WO-5.2 put the door in the header on the ground that *"a
   message a hundred guardians read is not a setting"*; the owner's test above replaces that reason,
   and `index.html`'s comment over the door is rewritten to say so rather than left arguing the old one.

**Deliverables**
- **`index.html`**: the top row reordered and the sounds button gone; the second row's four icons
  replaced by the gear; a Settings dialog with the doors and the switch. **Each door carries the hook
  its header icon carried** — `data-roster-manage`, `data-class-manage`, `data-teacher-panel`,
  `data-templates-open` — so `src/shell.js` routes them as it does today. The comments over both rows
  rewritten for the new sort, citing this work order.
- **`src/shell.js`**: the gear opens the hub; a door closes the hub before its own dialog or view
  opens. Nothing else in the routing moves.
- **`src/alert-sound.js`**: `refreshSoundChrome()` drives the switch's `checked` instead of the header
  button's icon, fill and `aria-pressed`; `toggleAlertSounds()` and its announcement are unchanged. The
  comment that justifies *no strip under the header* by *"the muted icon is on the glass either way"*
  is rewritten: from this build it is not, and what remains on the glass is the tinted card and the
  announced sentence — the owner's call, recorded where the premise used to be.
- **The roster door's hint** is painted with the open class's name whenever the hub opens, by asking
  `getSelectedClass()` — not by a second resolution of the preference.
- **`src/shell.css`**: § SETTINGS HUB lifted; the orange rule on `.header`.
- **The harness**: `tools/verify/sync-button.mjs` (its `laidButtons` count and order assume Year
  first and Sync last-before-About), `touch-targets.mjs`, `horizontal-overflow.mjs`,
  `attendance-passes.mjs` (it reaches `#soundsBtn`), `templates.mjs`, `roster-contacts.mjs`, and any
  check that clicks a header icon by position rather than by hook. A new section for the hub: the gear
  opens it, every door reaches its target, the roster door names the open class from *All classes* and
  from inside a class, and the switch flips `soundsOn()` both ways.
- **`design/mockups/proposed-settings.css`'s banner, its `README.md` section and its `index.html`
  entry** amended to say the section landed.
- **`TESTING.md` § WO-1.71**, the `CHANGELOG.md` entry, and **`CACHE` in `sw.js` bumped.**

**Acceptance**
- [ ] The top row draws Backup, Sync (opted-in devices), Presentation, Year and About, in that order,
      and no sounds button; the second row draws the tabs, the terms and one *Settings* gear; a 2px
      `#e67e22` rule sits under the header on the home view and on every class screen, and on no
      dialog.
- [ ] The gear opens *Settings*; each of the four doors opens the dialog or view its header icon
      opened at v177, for the same class, and the hub is closed behind it.
- [ ] The roster door names the class `getSelectedClassId()` resolves to, from *All classes* and from
      inside a class, and the roster dialog opens on that class.
- [ ] The switch reads and writes the same preference the header button did: off, then on, then a
      reload, and `soundsOn()` and the switch agree at every step. An overdue pass with the sound off
      is still announced and still tints its card.
- [ ] At 390×844 under a coarse pointer the page has no horizontal overflow, and every control in both
      header rows and in the hub is at least 44px.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. `CACHE` in `sw.js` is bumped.
- [ ] `TESTING.md` § WO-1.71 carries these lines verbatim with the evidence for each.
- [ ] 👤 On the iPad, after a force-quit, upright and lying down: read both header rows and the orange
      rule; open Settings from *All classes* and from a class and read the roster door's class; open
      each door; flip Sound alerts off and on.

**Traps** — **The doors keep the hooks.** About fifteen harness files open these dialogs with
`.click()` on `[data-class-manage]` or `[data-roster-manage]`, which works on a button inside a closed
dialog; renaming a hook breaks them all for no gain, and the `+` tab already carries
`data-class-manage` for the same reason. **The opener a dialog returns focus to is the door that
opened it, inside a closed hub** — `openModal(id, opener)` takes it as given. Hand the gear in as the
opener, or close the hub first, so that ✕ on Roster puts focus somewhere a teacher can see. **Do not
re-resolve the open class** for the door's hint: `getSelectedClassId()` already resolves a stale id
to the first class, and a second resolution here is how the door and the dialog name different
classes. **`#headerRightControls` is revealed by `src/classes.js`** on its existing condition; the
gear inherits it, so on a device with no class yet the gear is as hidden as the four icons were —
read that before deciding it is a bug. **This changes a screen a teacher uses every period**: the
rows' heights and the 390px fit are measured, not assumed.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `design/mockups/README.md`
  - `design/mockups/proposed-settings.css`
  - `design/mockups/settings-hub.html`
  - `src/alert-sound.js`
  - `src/classes.js`
  - `src/shell.css`
  - `src/shell.js`
  - `tools/verify-shell.mjs`
  - `tools/verify/sync-button.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- Also open:
  - `index.html` ~lines 380–530 — both header rows (`#soundsBtn` ~400, `#headerRightControls` ~475)
    and the comments over them that this work order rewrites.
  - `src/modal.js` — `openModal(id, opener)` and its stack; the hub is a stock `.modal-panel`.
  - `src/sync-button.js` and `docs/` mention of WO-7.5 ruling 2 — Sync's hidden-below-640px rule and
    About's badge **stay** (WO-1.73 decides them, not you).
  - Roll Call!'s `design/portable-components.md` (~line 118) and `design/starter-template.html`
    (~line 267) for `.toggle-switch`, at
    `C:\Users\WildB\OneDrive\Documents\Coding Projects\Attendance App\` — read-only, frozen.
  - `TESTING.md`, any recent `### WO-` heading, for the shape of the section you owe.

**Traps the work order does not spell out:**
- `grep -rn "hdr-icon-btn\|soundsBtn\|data-sounds-toggle" tools/` before you start, not after — the
  Deliverables list of harness files is a floor, not the whole set; any check that counts header
  buttons or reaches one by position goes red.
- Shared hooks can shift a selector's target: the `+` tab keeps `data-class-manage` too, so a
  harness `querySelector('[data-class-manage]')` may now match a door inside the closed hub **first**
  in document order. Check which element such a selector returns before trusting a green run.
- `sw.js` `CACHE` bump is required (`index.html` is SHELL entry one); a new CSS file, if you make one,
  must also be added to `SHELL`. Prefer lifting into `src/shell.css` as the work order says.
- Ticking: you may tick Acceptance lines you have evidence for; **never the 👤 line**.

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

## 5. Done means these 8 lines, reported against one by one

1. The top row draws Backup, Sync (opted-in devices), Presentation, Year and About, in that order, and no sounds button; the second row draws the tabs, the terms and one *Settings* gear; a 2px `#e67e22` rule sits under the header on the home view and on every class screen, and on no dialog.
2. The gear opens *Settings*; each of the four doors opens the dialog or view its header icon opened at v177, for the same class, and the hub is closed behind it.
3. The roster door names the class `getSelectedClassId()` resolves to, from *All classes* and from inside a class, and the roster dialog opens on that class.
4. The switch reads and writes the same preference the header button did: off, then on, then a reload, and `soundsOn()` and the switch agree at every step. An overdue pass with the sound off is still announced and still tints its card.
5. At 390×844 under a coarse pointer the page has no horizontal overflow, and every control in both header rows and in the hub is at least 44px.
6. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. `CACHE` in `sw.js` is bumped.
7. `TESTING.md` § WO-1.71 carries these lines verbatim with the evidence for each.
8. 👤 On the iPad, after a force-quit, upright and lying down: read both header rows and the orange rule; open Settings from *All classes* and from a class and read the roster door's class; open each door; flip Sound alerts off and on.

**Write `TESTING.md` § WO-1.71 — it is a deliverable, not a permission.** Add `### WO-1.71 — the header keeps what is used in class, and the rest goes behind a gear` under `## Phase 1 — Shell, store, roster`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-1.71` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

