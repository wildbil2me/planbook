# WO-1.10 — Home screen v0 · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.10-result.md` — as your last act, and return it in-band too.

**Why you have this.** Routed to Claude because this work order *establishes a convention every later
phase copies* — the card is explicitly a slot that Phases 2, 3, 4 and 6 accrete into, and `README.md`'s
standing obligations make "the home screen accretes" a permanent rule rather than a nice-to-have. It
also re-points `tools/verify-shell.mjs`, which is judgment about the verification harness, and it
carries the presentation-mode toggle into a new screen. The runner-up consideration set aside: the
Acceptance list is unusually mechanical for a Claude row, which is the Codex column's shape — but this
is new visual language on a 🚩 go-live blocker, and ties go to Claude.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.10 — Home screen v0

**Ship** 1 · **Status** ⬜ NOT STARTED · **Size** M · 🚩 · **Depends on** WO-1.6
**Closes roadmap** Phase 1 → "Home screen v0: every class in one tap."

**Why it exists.** Every class reachable in one tap is the owner's founding requirement. This screen
**accretes** through every later phase and becomes Phase 6's glance page — which is why it is built
now and grown, rather than built twice.

**Deliverables**
- All classes on one screen, each a card, each one tap from anything the class needs.
- The card is a slot, not a fixed layout: it renders a class name and reserves the space that
  Phase 2's today-state, Phase 3's ungraded count, and Phase 4's attention count will fill.
- Header: current term, teacher name, presentation-mode toggle, save indicator, backup nag.
- An honest empty state on a fresh document that leads to creating the first class.
- **Re-point `tools/verify-shell.mjs` at this screen.** Replacing `<main>` deletes the WO-1.2
  component shelf and with it `#aboutModal`, `[data-modal-open]`, and the `window.planbook`
  console seam — every fixture the script's modal, live-region, and preference checks depend on.
  They degrade to announced `SKIP`s rather than false passes, which is correct and still
  worthless: a run that is mostly skips proves nothing. Point them at a real modal and real
  controls in the same commit that removes the shelf. Read
  [`../verification-tooling.md`](../verification-tooling.md) first — the script is deliberately
  one file and stays one file.

**Out of scope** — anything that glances at data that doesn't exist yet. Do not stub fake counts.
Do not grow the verification script beyond re-pointing it; new kinds of check are a conversation,
not a refactor.

**Acceptance**
- [ ] Six classes fit on an iPad screen in portrait without scrolling, at 44px+ touch targets.
- [ ] Every class is exactly one tap from the home screen.
- [ ] A fresh document shows a real empty state, not five blank cards.
- [ ] Adding the Phase 2 today-state line requires touching only the card renderer.
- [ ] `node tools/verify-shell.mjs` runs against this screen with **no `SKIP` caused by a deleted
      shelf fixture**, and its check count has not fallen.

**Traps** — Don't build the Phase 6 glance page here. Build the *frame* that accretes into it. The
roadmap is explicit: build the glance page before the things it glances at and you build it twice.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `tools/verify-shell.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Also open, because this work order cannot be done correctly without them:

- **`plans/verification-tooling.md`** — the work order tells you to read it *first*. `verify-shell.mjs`
  is deliberately **one file and stays one file**.
- **`src/README.md`** — the `src/` conventions every module here copies: plain ES modules, relative
  paths, `kebab-case.js`, one concern per file, named for the thing it owns (so: `home.js`, not
  `dashboard-utils.js`). It also restates the inline-colors and coarse-pointer rules.
- **`design/style-guide.md`** — every value on the new card comes from here. Colors inline.
- **`index.html`** — read its **top-of-file comment block** (lines 1–60) before you touch anything.
  It is the running log of what each work order added and what is *deliberately still absent*; line 10
  says in as many words that the shelf inside `<main>` "is temporary by intent … and WO-1.10's home
  screen replaces it." **Extend that comment block with a WO-1.10 paragraph in the same voice.** That
  is a convention six work orders deep, not optional garnish.
- **`src/classes.js`** — it owns the class tab row in `.header-bottom`, the open-class selection, and
  the `openClassId` / `openTermIds` preferences. Your cards and its tabs are two views of one
  selection; do not invent a second source of truth for which class is open.
- **`src/presentation.js`**, **`src/supports.js`** — the choke point WO-1.9 built. If anything on a card
  could ever carry support data, it asks `supportsVisible()`. It does not read the preference itself,
  and it does not add a per-screen conditional.
- **`src/shell.css`** — where the new screen's styles go, including the `@media (pointer: coarse)`
  block and the existing 640px block that the header's width budget depends on.
- **`src/save-indicator.js`**, **`src/backup.js`**, **`src/teacher.js`** — the save chip, the nag strip,
  and the teacher's details already exist and are already wired into the header.

---

## 2b. Five things about this specific work order, from the orchestrator

**1. Most of the "Header:" deliverable is already built. Audit before you add.** The header today
already carries the year button and picker, the backup panel button, the nag strip below it, the save
chip, the presentation toggle, the class tab row, the term nav, and the roster/classes/teacher buttons.
The work order's header list is *what must be true when you finish*, not a list of things to build. Go
find each of the five — current term, teacher name, presentation-mode toggle, save indicator, backup
nag — say in your report where each one lives, and add only what is genuinely missing. **Duplicating a
control that already exists is a failure, not a deliverable met.** Note in particular that the top row
has a measured width budget at 390px (see the comments at `index.html:150–164` and `:200–206`) —
`verify-shell.mjs` measures it on every run, so a new header control can fail the suite on overflow.

**2. Capture the `verify-shell.mjs` baseline check count BEFORE you delete the shelf.** Acceptance line
5 is "its check count has not fallen," which is unanswerable after the fact. Run the script on the
current tree first, record the number and the pass/skip breakdown, and put both in your report as the
before-and-after. This is the single easiest line on the list to fail by forgetting.

**3. The shelf fixtures the script depends on, concretely.** `verify-shell.mjs:430` sets
`const MODAL = '#aboutModal'` and requires **`>= 2` elements matching `[data-modal-open]`** on the page.
Right now the header supplies one (`index.html:174`, About) and the shelf supplies two more
(`index.html:373–374`). **Delete the shelf and that check skips.** The `window.planbook` seams
(`setPref`, `announce`, `store`, `backup`, `classes`) are *not* shelf-dependent — the script's own skip
messages say they are "expected once the WO-1.2 shelf is gone," so they should survive; confirm that
rather than assume it. Re-point the modal/focus-trap and live-region checks at a **real** modal with
**real** openers, which the app now has plenty of. Re-pointing is in scope; **new kinds of check are
not** — that is the work order's Out of scope line, and it means the fix is fixtures and selectors,
not new test surface.

**4. Decide what tapping a card actually does, and say so out loud.** Acceptance says "every class is
exactly one tap from the home screen," but the attendance and gradebook screens it will eventually
open do not exist yet, and Out of scope forbids stubbing fake counts or glancing at data that isn't
there. So the tap has to land somewhere **real today** — the obvious candidate is making that class the
open class, the same state `src/classes.js` already owns from the tab row. **A card that taps into a
dead placeholder screen fails this work order**, and so does a card that taps into nothing. State the
decision and its reasoning in your report; this is the one genuinely underdetermined thing in the
work order and the verifier will look for it.

**5. Acceptance line 4 is a structural claim, so make it structurally true.** "Adding the Phase 2
today-state line requires touching only the card renderer" means there is *one* function that renders a
card and the slots are already in the markup and CSS, reserving their space, rather than a layout that
will need reflowing when a second line arrives. Do not render a placeholder count, a dash, or a
skeleton where real data will go — reserve the space, leave it empty. Show the verifier the renderer and
name the one function. Note that WO-1.9's own acceptance carries a live caution about exactly this kind
of inheritance claim ("re-verify this claim at every later phase"); be honest about what holds today
versus what is qualified.

**One more, on the trap.** The Traps line is the whole risk here: *don't build the Phase 6 glance
page.* You will be tempted to make the cards look finished by putting something in the slots. Resist
it. An empty reserved slot is the correct output of this work order.

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
- Stay inside the work order's **Out of scope** line. Do not tick roadmap boxes, edit `plans/`, or
  touch `CHANGELOG.md` / `TESTING.md` — the teacher does maintenance, after the verifier reports.

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

1. Six classes fit on an iPad screen in portrait without scrolling, at 44px+ touch targets.
2. Every class is exactly one tap from the home screen.
3. A fresh document shows a real empty state, not five blank cards.
4. Adding the Phase 2 today-state line requires touching only the card renderer.
5. `node tools/verify-shell.mjs` runs against this screen with **no `SKIP` caused by a deleted shelf fixture**, and its check count has not fallen.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

