# WO-1.10 — Home screen v0 · implementation report

**Implementer** Claude (work-order-implementer) · **Date** 2026-08-05
**Branch** `phase/1-shell-store-roster` (worked on it, as instructed; nothing committed, nothing pushed)
**Verification** `node tools/verify-shell.mjs` → **209 checks · 209 passed · 0 failed · 0 skipped**, exit 0.
`node tools/wo-sweep.mjs` → **11 checks · 10 passed · 0 failed · 1 to review** (the pre-existing one), exit 0.

Nothing under `plans/` was touched. No roadmap or work-order box was ticked. `CHANGELOG.md` and
`TESTING.md` are untouched. No commit, no branch.

---

## 1. The four things the brief said the verifier would look for

### 1a. `verify-shell.mjs` check count, before and after

| | checks | pass | fail | skip | lines | lines/check | runtime |
|---|---|---|---|---|---|---|---|
| **Before** (clean tree at `a3c9316`) | **201** | 201 | 0 | 0 | 3,765 | 18.7 | 64s |
| **After** | **209** | 209 | 0 | 0 | 4,008 | 19.2 | 65s |

The before run was taken **first**, on the untouched tree, before the shelf was deleted — the full
transcript is in the scratchpad for this session, and the summary line above is quoted from it.

- **No check was retired.** Every shelf-coupled check was re-pointed, so the count did not fall.
- **Zero skips, before and after.** In particular there is no `SKIP` caused by a deleted shelf
  fixture, which is Acceptance line 5's actual demand.
- **+8 checks**, all new fixtures on measurements this file already makes (see §4 for what they are
  and §5 for the judgment call about adding any at all).
- **Density held**: 18.7 → 19.2 lines per check on +243 lines. `plans/verification-tooling.md`'s
  replacement control says the binding case is "400 lines and five checks"; this is 243 lines and 8
  checks, i.e. ~30 lines per new check including their comments, above the running average but not
  by the margin that document calls bloat. **Runtime 64s → 65s.** Both reported here because that
  document asks for them beside the count.

### 1b. Where each of the five header items lives — audited, three found, two moved or added

| Item | Where it lives now | Built by |
|---|---|---|
| **Current term** | `#termNav` in `.header-bottom`, rendered by `src/classes.js`; the open term is `.q-btn.active` + `aria-current="true"` | **Found already built** (WO-1.6). Untouched. |
| **Presentation-mode toggle** | `#presentationBtn` in `.header-top`, plus `#presentationStrip` under the header | **Found already built** (WO-1.9). Untouched. |
| **Backup nag** | `#backupNag`, the amber strip below the header; `[data-backup-panel]` button inside it | **Found already built** (WO-1.5). Untouched. |
| **Save indicator** | `#saveIndicator`, now declared as the last child of `<header>` (`index.html`) | **Found built but re-homed.** It was inside the shelf's `.date-batch-bar`, so deleting `<main>` would have deleted it. `src/shell.css` pins it `position: fixed` to the top-right corner above the modal tier, so the move changes where it is *declared*, not where it is seen. |
| **Teacher name** | `#headerSubtitle` — the header's second line, which now reads `Ms Toomey · St John's High School` once she has entered it, and the app strapline until then. `src/teacher.js` `refreshHeaderIdentity()` | **The one genuinely missing item, and I added it.** Only the gear that *opens* her details existed. |

**Nothing was duplicated.** No second year control, no second backup button, no second presentation
toggle, no second term nav. The only new header element is the save chip's `<span>`, which is the
same element moved.

Two things about the teacher name, stated plainly because they are choices:

- **It replaces the strapline rather than adding a control.** `index.html:150–164` and `:200–206`
  record that the top row has no width left at 390px — WO-1.7 put the roster and teacher buttons on
  the *bottom* row for that reason and WO-1.9 measured 15px of slack before moving the whole title
  block out of the layout below 640px. A name that reuses a line already in the row costs zero
  width. `verify-shell.mjs`'s overflow checks at 1024×768, 768×1024 and 390×844 all still pass.
- **Below 640px the name is not visible at all**, because `.header-title` is `.sr-only` by then
  (a pre-existing WO-1.9 decision, reasoned out in `src/shell.css`). That is a phone; the iPad never
  reaches the rule. Recorded rather than worked around.

### 1c. What tapping a class card does today, and why

**It makes that class the open class** — the same state the header's tab row already owns, through
**the same `data-class-tab` hook**, the same route in `shell.js`, and the same `classes.selectClass()`.
The card is literally a second view of one selection; there is no second source of truth for which
class is open, and no second hook.

Why that was the right call:

- It lands somewhere **real today**. Out of scope forbids stubbing counts or glancing at data that
  doesn't exist; the attendance and gradebook screens a card will eventually open do not exist, so a
  second control on the card would be a tap into a placeholder — which the brief says fails this
  work order, as does a tap into nothing.
- Reusing `data-class-tab` is the strongest available answer to the brief's warning about a second
  source of truth: the tab and the card cannot disagree, because they are one route.
- The visible effect is real and immediate: the tapped card takes the interactive wash and
  `aria-current="true"`, the header tab goes active, `planbook_openClassId` moves, and everything
  the app already keys off the open class (roster, term nav) follows. `verify-shell.mjs` drives a
  real click on a card that is *not* already open and asserts all of that.
- **What a later phase changes:** the card renderer, not this decision. Phase 2's attendance screen
  becomes the card's destination by changing what `classCard()` builds, which is the same boundary
  Acceptance line 4 draws.

### 1d. The single card-renderer function Acceptance line 4 depends on

**`classCard(cls, isOpen)` in `src/home.js`** (the only place a card is built; `refreshHome()` calls
it in a `forEach` and does nothing else per card).

It appends two empty slot elements whose height is reserved in `src/home.css`:

- `.class-card-state` — `min-height: 18px` (20px coarse) — WO-2.x's today-state line.
- `.class-card-signals` — `min-height: 24px` (26px coarse) — WO-3.x's ungraded count and WO-4.x's
  attention count.

They contain **no text, no element, no dash, no zero, no skeleton**. Adding Phase 2's line is
`state.textContent = …` inside that one function. The reserved height is the load-bearing part: it
is what stops the first real datum from reflowing the grid and quietly breaking Acceptance line 1
from inside a work order that never opened this file.

**Honest qualification, in the spirit of WO-1.9's own caution about inheritance claims:** the claim
holds *today* for a text line or a chip dropped into either slot. It does **not** hold for a card
that needs a second *interactive* control — the card is a `<button>`, so a nested button would be
invalid markup, and the first phase that needs one converts the element to a `<span>` container with
the primary tap as a full-bleed button. That is still a change confined to `classCard()` and
`home.css`, which is why I took it, and it is written into the function's own comment so the next
reader does not discover it. Re-verify this line at every later phase.

---

## 2. Against the Acceptance list, one by one

### ☑ 1. Six classes fit on an iPad screen in portrait without scrolling, at 44px+ touch targets

**Measured, not asserted.** New check: *"six classes fit on an iPad screen in portrait without
scrolling, at 44px+ targets"*, at 768×1024, `mobile: true`, touch emulation on, after a reload, with
`matchMedia('(pointer: coarse)')` asserted first (its own gating check, per trap 3). Result:

```
6 cards in 3 column(s); last card ends at 476px of 1024px, page is 1024px tall;
0 under 44px; backup nag on screen = false, install banner hidden for the measurement = true
```

Six cards land in three columns, two rows, ending 476px down a 1024px viewport — no vertical scroll,
548px of headroom, and no card under 44px in either dimension.

**One liberty, stated rather than hidden:** the check hides `#installBanner` for the measurement and
puts it straight back. That banner is on screen exactly while Planbook is **not** installed, and
this acceptance line is about an installed app on an iPad — where iOS also does not evict the
storage, which is the banner's whole reason to exist. A headless browser can never be installed, so
leaving it up would have measured ~200px of a strip that cannot be present in the situation being
asserted. The **backup nag is left exactly as the run leaves it** and is reported in the detail,
because that one *can* be on an installed iPad and it is fair for it to have to fit. With 548px of
headroom either strip fits regardless.

**Not verified, needs human eyes / hardware:** whether the cards are *comfortable* to hit with a
thumb, and the real safe-area insets. 768×1024 is the classic iPad; I did the arithmetic for an
iPad mini (744 wide → still 3 columns) and an iPad Pro 11" (834×1194 → more room) but measured
neither. **Landscape is not asserted** — the acceptance line says portrait, and 1024×768 is only
checked for *horizontal* overflow, as before.

### ☑ 2. Every class is exactly one tap from the home screen

**Driven, not read.** New check: *"one tap on a card makes that class the open class, on the card AND
on the header tab"* — a real `Input.dispatchMouseEvent` on a card that is not already open, then
`getSelectedClassId()`, `getPref('openClassId')`, the card's `.open` class and the header tab's
`.active` class all read back. Result `{"selected":"c_b1","pref":"c_b1","cardMarked":true,"tabMarked":true,"marked":1}`.

Supporting check: *"every active class has exactly one card on the home screen, in the tab bar's own
order"* — 6 cards for 6 active classes, ids matching `doc.classes` order, names matching, and zero
elements injected into the grid (one of the six is named `Honors Bio <b>lab</b>`, so this is also the
`textContent`-not-`innerHTML` assertion).

**Falsifiability confirmed by breaking it:** I removed `afterClassChange()` from the tap route and
re-ran; the check went `FAIL` with `cardMarked: false`. Restored.

### ☑ 3. A fresh document shows a real empty state, not five blank cards

**Driven.** New check: *"a fresh document shows a real empty state on the home screen, not blank
cards"*, riding the harness's existing empty-year fixture (a real year switch to a year with no
classes). Result: `cards = 0, empty state shown = true, lead = "No classes yet.", 249 characters of
explanation, way to the first class = true`.

Both halves are asserted, because a grid that renders nothing and an empty state that says nothing
are the same picture: zero cards **and** the grid hidden **and** the empty state shown **and** a
sentence of real length on screen **and** a `[data-class-manage]` control in it, in a visible
container. It also asserts the *other* variant stays hidden: there is a year open here, it just has
nothing in it, and saying "no school year open" would be a worse lie than saying nothing.

The empty state's button carries `data-class-manage` — the class manager's existing hook — so this is
a third door onto one route, not a second way of creating a class.

### ☑ 4. Adding the Phase 2 today-state line requires touching only the card renderer

**Made structurally true, and measured as far as a measurement can go.** New check: *"each card
reserves the space Phase 2, 3 and 4 fill and puts nothing in it yet"* — per card, both slot elements
present, `textContent` empty, `children.length === 0`, and measured height > 0. Result: `42px
reserved, empty` on all six.

Falsifiability confirmed by breaking it: I set `state.textContent = '—'` and re-ran; the check went
`FAIL` printing `42px reserved, HOLDS "—"`. Restored.

The renderer is named in §1d, with the one qualification on the claim.

### ☑ 5. `verify-shell.mjs` runs against this screen with no `SKIP` caused by a deleted shelf fixture, and its check count has not fallen

**201 → 209 checks, 0 skips both before and after.** What was re-pointed:

- **The modal / focus-trap / live-region block.** It drove `#aboutModal` through `[data-modal-open]`,
  and two of the three openers were shelf buttons ("Open from here" / "…instead") whose only job was
  to make focus-return falsifiable. It now drives **`#classesModal`** through
  **`header [data-class-manage]`** — the "+"/"Add a class" tab at the end of the header's class strip
  and the gear beside it. Two *real* openers, on screen on every launch, in different containers
  (one inside a horizontal scroller), both going through the same `openModal(id, opener)`. Every one
  of the eleven checks in that block still passes.
  - Scoped to `header` deliberately: `[data-class-manage]` now appears three times, and the third is
    the home screen's empty-state button inside a `.hidden` container. `querySelectorAll` counts
    hidden elements, so an unscoped selector would have handed `clickSel` a 0×0 element and the click
    would have landed in the viewport's top-left corner — the viewport-coordinate trap arriving
    through the fixture. The opener count also now counts **visible** openers only, for the same
    reason.
- **The `[data-modal-open]` use in the touch section is deliberately left alone** and commented: it
  clicks the header's About button, which is a real control that carried the hook all along. One
  opener is enough for a *measurement*; it was focus *return* that needed two.
- **The `window.planbook` seams survived — confirmed, not assumed.** They are not shelf-dependent, so
  the six skip branches never fire. Their skip *messages* said "(expected once the WO-1.2 shelf is
  gone)", which is now false, so all six were corrected to say the seam is kept deliberately and its
  absence would be a defect. See §3 for the decision behind keeping it.
- **No check was deleted or weakened.** No new *kind* of check: the additions are geometry under an
  emulated coarse pointer, and DOM/document state read through the existing seam after a real click
  — the two things this file already does throughout. It is still one file, with no `tools/lib/`, no
  config, no second harness.

---

## 3. Decisions the work order did not settle, and which way I went

**A. `window.planbook` outlived the shelf.** Every comment in `shell.js` and
`plans/verification-tooling.md` said the console seam would go when the shelf went. It did not, and
this is the biggest judgment call in the change. Roughly three quarters of the run reads the app's
answers through it — which class and term are open, what a document holds, what `supports.js`
answers, what came back out of IndexedDB. Deleting it means the harness carries its own copy of
"resolve the stored id against the document", its own name parser and its own visibility rule, each
of which can agree with itself and disagree with the app — the exact failure each seam entry exists
to prevent. The alternative was not a smaller seam, it was a suite of announced `SKIP`s, which is
what this work order exists to prevent. **What I removed instead**: the entries whose only caller
was the shelf (`showSaveState`, `demoSaveCycle`). The rule I kept and restated loudly: *nothing in
the app may read `window.planbook`.* The reasoning is written out at length at the foot of
`src/shell.js` — `plans/verification-tooling.md` says the opposite in two places and only the teacher
can change that document.

**B. The card is a `<button>`, and its children are `<span>`s.** A `<button>`'s content model is
phrasing content, so `<div>`/`<p>` inside would be invalid markup that happens to render. See §1d for
the one case that forces a restructure later, and where that note lives.

**C. `src/home.css` is a new file, not lines added to `shell.css`.** `src/shell.css`'s own header sets
that convention for "the work orders that follow this one" — one file per screen, styling only its own
class names, its own coarse block, loaded after the shell. Everything in `shell.css` so far is shell
or modal; this is the first actual screen, so this is the first time the rule applies. It is obeyed
literally: no selector in `home.css` names anything `shell.css` styles, and its coarse block covers
all nine of its own selectors.

**D. `initials()` and `avatarClass()` are now exported from `classes.js`.** `roster.js` keeps its own
pair and its comment says why (a different shape over a different id space). Here the shape and the
id space are identical, so duplicating would mean a class reading "P3" on the card and "PE" in the
manager, in a different colour. One truth per class.

**E. The home screen is deliberately absent from `flipPresentationMode()`'s redraw list**, and
`home.js` never asks `supports.js` its visibility question. Nothing on a card comes out of a
student's `supports` block — a class name and a colour are not a student's file. Both the omission
and the condition under which it stops being true (WO-4.x quoting a behavior note into the signals
slot) are written into `home.js`'s header comment and into `flipPresentationMode()` itself. WO-1.9's
acceptance asks for exactly this to be re-verified at every later phase.

**F. Class mutations redraw the home screen from `shell.js`, at eight call sites.** `home.js` imports
`classes.js` for the read point its header comment exists to provide, so `classes.js` cannot import
back without closing a loop this repo has refused twice. I considered a registered callback
(`classes.onClassBarRefresh(home.refreshHome)`) that would have made it one wiring line — and
rejected it, because `shell.js` states out loud that it is where this app declares the order things
happen in, and an agent inventing an event bus is not a convention worth setting here. The cost is a
hand-maintained list, which is the same weakness WO-1.9's acceptance flags; the mitigation is one
named function, `afterClassChange()`, with "A CLASS MUTATION ADDED LATER ADDS ITS LINE HERE" in its
comment. **Flagging this as a real, if small, fragility rather than claiming it away.**

**G. `sw.js` gained a trap comment paid for the honest way.** The precache check reads `SHELL` by
matching single-quoted strings out of the array text, so an apostrophe in a comment *inside* the
array pairs with the next one and swallows every entry between them. My first run reported all 15
modules missing from the precache. The comment moved above the array and the array now carries a
`WRITE NO APOSTROPHE INSIDE THE ARRAY BELOW` warning with the symptom named.

---

## 4. What I built, deleted, and left alone

**New files**
- `c:\dev\planbook\src\home.js` — `refreshHome()`, `classCard()`, `renderEmpty()`. Renders only; writes nothing.
- `c:\dev\planbook\src\home.css` — the grid, the card, the two reserved slots, the empty state, plus its own coarse and 640px blocks.

**Changed files**
- `c:\dev\planbook\index.html` — `<main>` replaced whole; `src/home.css` linked; `#saveIndicator` moved into `<header>`; `#headerSubtitle` commented; **WO-1.10 paragraph added to the top-of-file comment block** (in the same voice, naming what is in the slots, what went with the shelf, and that the panel subtitle is written to be deleted).
- `c:\dev\planbook\src\shell.js` — `home` imported; `afterClassChange()` and `afterRestore()` added and chained at boot, on a year switch, on a restore, and at eight class-mutation routes; `data-save-state` / `data-save-cycle` / `data-announce` routes removed with their hook-list entries; the `window.planbook` block rewritten.
- `c:\dev\planbook\src\shell.css` — the seven `.shelf-*` / `.swatch` rules deleted (the rule above them promised they would go with the shelf), plus `.shelf-note` from the coarse block, replaced there by `.panel-title p`; `#saveIndicator`'s and `.date-batch-bar`'s comments corrected.
- `c:\dev\planbook\src\teacher.js` — `refreshHeaderIdentity()`; the strapline fallback captured from the markup rather than duplicated; the name and school fields refresh the header as they are typed.
- `c:\dev\planbook\src\classes.js` — `initials()` and `avatarClass()` exported, with the reason.
- `c:\dev\planbook\src\save-indicator.js` — `demoSaveCycle()` removed (its own comment said WO-1.10 would); the consequence recorded: `syncing` now has no caller until Phase 7.
- `c:\dev\planbook\sw.js` — `src/home.css` and `src/home.js` added to `SHELL`, `CACHE` bumped v11 → v12, the stylesheet and apostrophe traps documented.
- `c:\dev\planbook\tools\verify-shell.mjs` — re-pointed as in §5; +8 checks; one comment added about why the touch section still uses `[data-modal-open]`.

**Deliberately left alone, with reasons**
- `.date-batch-bar`, `.batch-btn`, `.search-box` in `shell.css` now have **no instance in the app**.
  `shell.css`'s own comment promised exactly seven `.shelf-*` rules would go and named none of these;
  `.date-batch-bar` is documented as WO-2.1's, and `.search-box` is the component whose defect
  created the harness. Both facts are now written into the file. Re-lifting them from Roll Call!
  later costs more than the dead rules do.
- `.empty-state` is now instanced for real by the home screen, so the shelf's last specimen became a
  live component rather than dead CSS.
- The About modal's "This build" paragraph does not mention the home screen. It says nothing false.
  Editing it is copy work the work order did not ask for.

---

## 5. Temptations declined, and one proposed follow-up

**Declined, noted here rather than acted on:**

1. **A roster count on the card** ("24 students"). It is *real* data — WO-1.7 shipped it — so it is
   not a fake count. I left it out anyway: the Traps line says don't make the cards look finished,
   and a count nobody asked for in a slot reserved for something else is the glance page arriving
   early. It is one line in `classCard()` whenever someone decides it belongs.
2. **A second control on the card** — a "Roster" button per card, one tap to the roster of that class.
   Declined: the header already has that control for the open class, and the brief calls duplicating
   an existing control a failure.
3. **Tidying `.date-batch-bar` / `.search-box` out of `shell.css`.** See above.
4. **A registered-callback redraw seam** to replace the eight-site list. See §3F.
5. **Mentioning the home screen in the About modal.** See above.

**Proposed follow-up work order (a real gap, not actionable here):**
`tools/wo-sweep.mjs`'s coarse-block check reads `git diff HEAD -- src/*.css`, which **cannot see an
untracked new stylesheet**. It reported "1 new selector(s), all covered" — that one is `.panel-title`
in `shell.css`; all nine of `home.css`'s selectors were invisible to it. Nothing is wrong with the
app (every one of them *is* in `home.css`'s own coarse block, verified by hand and by
`verify-shell.mjs`'s measurement), but the check will go quietly vacuous for every per-screen
stylesheet from here on. The fix is one line in `wo-sweep.mjs` — include untracked `src/*.css` files
whole — and it is a change to a harness, which this work order's Out of scope line makes a
conversation rather than a refactor. **I did not `git add` the new files to make the check see them**,
because staging is not mine to decide.

**Also worth the teacher's attention:** `plans/verification-tooling.md` says in two places that
`window.planbook` goes at WO-1.10 and that the checks depending on it degrade to skips. That is now
wrong in the way described in §3A. I did not edit it, because `plans/` is off limits to me — it
needs a sentence recording that the seam was kept and why.

---

## 6. What I could not verify — owed to a human on a real iPad

- **Thumb reachability and comfort** of the cards, and whether three columns of card is the right
  density on glass rather than in a measurement.
- **Safe-area insets.** The precondition (`viewport-fit=cover`) is checked and passes; the resolved
  values need hardware. The home screen adds no new `env()` declaration, so nothing new is at risk.
- **Non-768 iPads.** Measured at 768×1024 only; the mini and the Pro are arithmetic, not measurement.
- **Landscape vertical fit.** Not part of the acceptance line and not asserted.
- **Whether the empty slots read as "not built yet" rather than "failed to load"** to the teacher.
  The panel subtitle is my answer to that and it is unverified prose — it is the single most likely
  thing on this screen for her to want reworded.
- **Anything through the service worker.** The run drives a served page, never an installed app; the
  new `SHELL` entries are correct by inspection and by the precache check, not by an offline walk.
- **`syncing` on the save chip** now has no caller in the app. Verified by grep, not by watching it.
