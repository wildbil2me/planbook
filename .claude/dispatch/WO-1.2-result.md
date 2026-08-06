# Result — WO-1.2 · App shell & design frame

**Work order** WO-1.2 · **Phase** 1 · **Branch** `phase/1-shell-store-roster`
**Implemented** 2026-08-04 by `work-order-implementer` (Claude)
**Committed?** No. Working tree left dirty for the verifier, per the brief.

---

## 0. Summary

The interrupted run's draft was good — a faithful lift, not a hand-design, with the two traps
(inline colors, no dark mode) both survived intact. I audited every line of it against §4 of the
brief, found **one real defect** (a touch target that measured 19px on a coarse pointer) and **four
lift-fidelity divergences**, fixed those, and left the rest. Nothing was outside the Deliverables,
so nothing was deleted.

I then built a throwaway headless harness (bare Node, zero deps, Edge over CDP through Node's global
`WebSocket`) and drove the real page: **27 checks, 27 passing.** It lives in the session scratchpad,
not in the repo — see follow-up F4.

Five of the six Acceptance lines are **verified**. The sixth (line 5) is verified as far as a desk
can take it and **still owes a human on a real iPad**; I have not marked it passed.

---

## 1. Acceptance, line by line

### 1. Colors match `design/style-guide.md` literally, declared inline — no CSS variables. ✅ VERIFIED

- **Every hex audited mechanically.** `src/shell.css` contains 27 unique hex values. Each was
  grepped against `design/style-guide.md`; all 27 are present in the guide. Same audit run over
  `index.html` (the palette swatch row) — all present.
  ```
  #0097a7 #0d2137 #1a1a2e #1a3c5e #1a6b3a #2471a3 #27ae60 #2a2a6e #4a5fbb #5b6fcc
  #6b7a8d #8a9bb0 #8e44ad #a0aab8 #c0392b #d4ac0d #e0e4ea #e67e22 #e74c3c #eafaf1
  #eef0f4 #eef2ff #f0f2f5 #f8f9fb #fdeaea #fef5ea #fff
  ```
- **No CSS variables.** `grep -rniE "var\(--|--[a-z-]+ *:"` over `index.html` and `src/` → zero hits
  in shipped files. There is no `:root` block. The convention was left alone and the reason is
  written into `src/shell.css`'s header comment so the next pass doesn't tidy it.
- **Eyes on it.** Screenshots captured at 1280px, 1024px coarse, and 390px, plus the modal open at
  two of those. The navy gradient, `#f0f2f5` page, white 14px panels, wash chips and on-dark
  controls read as the same product as Roll Call!. The shelf carries a palette swatch row printing
  each hex next to its own color specifically so this line can be diffed by eye against §1.
- **Two substitutions from the starter template, both deliberate, both toward the guide:**
  - `starter-template.html` line 152 sets `.search-box input::placeholder { color: #b0bcc8 }`.
    `#b0bcc8` is **not in the style guide**. The draft used `#a0aab8` (guide §1, "disabled/empty").
    Kept — a hex that fails this acceptance line is a hex to replace, not lift.
  - `starter-template.html` line 28 has `:focus-visible { … border-radius: 3px }`. The guide §5 and
    this work order's Acceptance line 4 both state the rule without it, and a global `border-radius`
    on every focused element clips round things. The draft omitted it. Kept omitted.

### 2. No dark-mode rules exist anywhere: no `prefers-color-scheme`, no `[data-theme]`. ✅ VERIFIED

`grep -rniE "prefers-color-scheme|\[data-theme"` over `index.html`, `src/*.css`, `src/*.js`, `sw.js`,
`manifest.webmanifest` → **zero hits**, including in comments.

The draft handled the "comments that could later be uncommented" clause well and I kept its trick:
`src/shell.css`'s header states there is no dark mode *without naming either token*, and says so
explicitly —

> (The tokens are spelled out in CLAUDE.md and src/README.md; they are deliberately not spelled out
> in any stylesheet, so that grepping a stylesheet for them returns nothing.)

**Disclosed so the verifier isn't surprised:** a repo-wide grep does return hits in prose —
`src/README.md:29`, `CLAUDE.md`, `design/style-guide.md`, `TESTING.md`. All four are pre-existing
WO-1.1/Phase-0 files stating the prohibition. None are mine and none are rules.

### 3. A modal opens, traps focus, closes on Escape and on backdrop click, and returns focus to the element that opened it. ✅ VERIFIED — all four, driven, not read

Exercised against the served page in headless Edge over CDP with real `Input.dispatchKeyEvent` and
`Input.dispatchMouseEvent`. Nine passing checks:

| Check | Result |
|---|---|
| modal opens on click | PASS |
| focus moved into the panel | PASS |
| opener recorded is the *second* opener, not the first on the page | PASS |
| `Tab` from the last focusable wraps to the first, inside the panel | PASS |
| `Shift+Tab` from the first wraps to the last | PASS |
| focus parked outside the panel is pulled back on `Tab` | PASS |
| `Escape` closes the modal | PASS |
| `Escape` returns focus to the button that opened it | PASS |
| backdrop click closes, and returns focus to *its* opener (a different button) | PASS |
| press inside the panel + release on the backdrop does **not** close | PASS |

The shelf deliberately ships **two** openers for the same modal plus a third in the header, so
focus-return is falsifiable rather than accidentally right: a broken implementation that always
returns focus to the first opener fails the third and ninth rows above.

**The one thing I rewrote here, and why it matters for line 3.** The draft did
`returnFocus: document.activeElement`. That is what Roll Call! does and it passes on desktop
Chrome/Edge — but **Safari, desktop and iPadOS both, does not focus a `<button>` when you tap it**,
so `document.activeElement` at open time is `<body>` and focus returns to nowhere. The iPad is the
device that decides go-live, so `openModal(overlay, opener)` now takes the opener explicitly,
`src/shell.js` hands it the matched `[data-modal-open]` element, and `activeElement` is only the
fallback for keyboard and console paths. `closeModal` also refuses to "return" focus to
`document.body`, since that is not a return.

⚠️ **Caveat I will not paper over:** the *reason* for that fix is a Safari behavior I could not
reproduce here — Edge is Chromium. What the harness proves is that the explicit-opener path works;
what it cannot prove is that Safari needed it. The fix is strictly more correct either way (the
opener is known at call time; inferring it is guesswork), but the Safari half is reasoned, not
observed. An iPad pass on Acceptance line 3 would settle it.

### 4. `:focus-visible { outline: 2px solid #5b6fcc; outline-offset: 2px; }` is global and no rule removes an outline anywhere. ✅ VERIFIED — both directions

- **Present, global, and exactly that.** `src/shell.css:61`. Verified at runtime by walking
  `document.styleSheets` for the `:focus-visible` selector and comparing longhands
  (`outline-width: 2px`, `outline-style: solid`, `outline-color: rgb(91, 111, 204)` = `#5b6fcc`,
  `outline-offset: 2px`) and asserting the rule declares **nothing else**. Longhands rather than a
  string compare because Chromium re-serializes the shorthand as `rgb(91,111,204) solid 2px` and a
  naive string compare reports a false failure on a correct rule.
- **Nothing removes an outline.** Two independent checks. (a) `grep -rniE "outline: *(none|0)"`
  over `index.html` and `src/` → zero hits. (b) A runtime recursive walk of every rule in every
  sheet, including rules nested inside `@media`, flagging any `outline`, `outline-width`, or
  `outline-style` that resolves to `none`/`0` → zero offenders.
- The draft earned credit here: `starter-template.html:151` ships
  `.search-box input { border: none; outline: none; … }` and the draft **dropped the `outline: none`
  rather than lifting it**, with a comment saying why (the box draws no focus affordance of its own,
  so losing the ring leaves a keyboard user blind). I kept that and the comment.

### 5. On an iPad, no control is under 44px and nothing sits under the safe-area inset. 👤 **NOT VERIFIED — the iPad check is still owed.** Desk-side evidence below.

Stating this plainly because the brief asks me to: **no iPad has been near this.** What follows is
everything a desk can establish, and it is not the same thing.

**What I verified desk-side, by measurement rather than by reading the stylesheet:**

- The harness emulates a coarse pointer properly — `matchMedia('(pointer: coarse)').matches === true`
  is asserted before anything is measured, so the numbers below come from the touch pass actually
  applying. (`Emulation.setEmulatedMedia`'s `features` list does *not* reach `pointer`; it needs
  `setTouchEmulationEnabled` + `mobile: true` device metrics. The first run of this harness silently
  measured the desktop pass and looked fine, which is the trap here.)
- With that active, every interactive element on the page was enumerated
  (`button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])` — 23 elements) and
  measured with `getBoundingClientRect()`. **Zero under 44px.**
- The modal was then opened and its controls re-measured for real rather than from declared
  `min-height`: `.modal-close` 44×44, `.class-action-btn.primary` 44 tall. Zero offenders.
- `env(safe-area-inset-*)` padding asserted present on `body` (bottom), `.header` (top),
  `.header-top`, `.header-bottom` and `.main` (left/right, via `max(20px, env(…))` so the gutter
  never shrinks below the design value). The 640px block re-declares the insets rather than
  overwriting them with a bare `padding`, which is the usual way this regresses.
- `overscroll-behavior-y: contain` on `body`; `touch-action: manipulation; user-select: none` on the
  grouped tappable selector; `-webkit-overflow-scrolling: touch` on `.hdr-class-tabs` and
  `.modal-overlay`.
- No horizontal overflow at 390px (`scrollWidth 390 === innerWidth 390`).

**The one real defect this measurement caught**, and the reason the pass was worth building: the
draft's coarse block had `.search-box { min-height: 44px }` but left the box's 7px vertical padding
alone, so the box was 44px tall around a **19px input**. Tapping the strip above or below the text
hits the wrapper `<div>`, does nothing, and the teacher taps twice. Fixed by moving the padding
horizontal-only at coarse and putting `min-height: 44px` on the `<input>` itself, so the caret lands
on the first tap. A stylesheet review would have called that line compliant; the measurement did not.

**What still needs a human on an iPad:** whether `env(safe-area-inset-*)` resolves non-zero and the
header actually clears the status bar / home indicator in a home-screen install (the insets are 0 in
every desktop emulator, so this is a declaration check here and nothing more); whether 44px *feels*
like 44px under a thumb; whether the horizontally scrolling `.hdr-class-tabs` rubber-bands correctly
with `overscroll-behavior-y: contain` on the body; and whether Safari's real focus behavior matches
the reasoning in line 3 above. `TESTING.md` should carry this line with its 👤.

### 6. No `planbook_` key holds anything but a UI preference. ✅ VERIFIED

**Keys this work order writes: none.** Enumerated exhaustively:

| Key | Holds | Written by |
|---|---|---|
| — | — | — |

`src/prefs.js` is the only code in the repo that touches `localStorage` (grep-confirmed: all six
`localStorage` mentions outside comments are in that file). It exports `PREFIX = 'planbook_'` and a
`PREF_DEFAULTS` map that is **deliberately empty today** — the shell has no preference to remember.
`setPref()` refuses any key not declared in `PREF_DEFAULTS`, `console.error`s about it, and returns
`false`. So the acceptance line is enforced by construction rather than promised: adding a key
requires first adding it to a map whose name says what belongs in it.

Verified at runtime: `setPref('roster', [{name:'Student'}])` returned `false`, wrote nothing, and
after a full session that exercised every control on the page,
`Object.keys(localStorage).filter(k => k.startsWith('planbook_')).length === 0`.

---

## 2. Files created or changed

| Path | State |
|---|---|
| `c:\dev\planbook\index.html` | **Modified** — WO-1.1 placeholder replaced |
| `c:\dev\planbook\src\shell.css` | **New** |
| `c:\dev\planbook\src\shell.js` | **New** |
| `c:\dev\planbook\src\modal.js` | **New** |
| `c:\dev\planbook\src\save-indicator.js` | **New** |
| `c:\dev\planbook\src\live-region.js` | **New** |
| `c:\dev\planbook\src\prefs.js` | **New** |
| `c:\dev\planbook\.claude\dispatch\WO-1.2-result.md` | **New** — this file |

**Deliberately untouched**, confirmed by `git status`: `sw.js`, `manifest.webmanifest` (WO-1.3's,
still WO-1.1 placeholders), `plans/**`, `TESTING.md`, `CHANGELOG.md`, `src/README.md`,
`design/**`, and everything in the Roll Call! repo (read-only throughout). No `package.json`
anywhere — `git ls-files | grep package` is empty. No checkbox anywhere was ticked.

---

## 3. The `src/` split I chose, and why

Six modules plus one stylesheet. `index.html` loads exactly two files:
`<link rel="stylesheet" href="src/shell.css">` and `<script type="module" src="src/shell.js">`.

| File | Owns | Lines |
|---|---|---|
| `shell.css` | The whole visual language | ~360 |
| `shell.js` | Boot + one delegated click listener; the only module `index.html` loads | ~87 |
| `modal.js` | Open/close, the focus trap, the stack, backdrop dismissal | ~155 |
| `save-indicator.js` | The five states, their text and voice, the stub cycle | ~71 |
| `live-region.js` | `announce()` | ~26 |
| `prefs.js` | The **only** code allowed to touch `localStorage` | ~55 |

**Why split rather than one file.** `src/README.md` already committed to plain ES modules and gave
the reason Roll Call! is one file (`file://` blocks module imports; Planbook is served over HTTPS and
has no such constraint). The split cost nothing here — no bundler, no import map, six relative
imports — and it pays immediately: `prefs.js` being its own 55-line file is what makes "the only code
that touches localStorage" a *checkable* claim rather than a habit, which is exactly Acceptance
line 6. Same for `modal.js` and line 3. I am not filing a decision record against the split;
`src/README.md` stands as written.

**Why one stylesheet rather than six.** Splitting CSS per module means two files eventually style
the same class and the touch pass stops being auditable. `shell.css`'s header states the convention
for what comes next: a screen that needs its own styles gets `src/<screen>.css`, loaded after this
one, styling **only its own class names**, with its own `@media (pointer: coarse)` block at its end —
and two stylesheets never style the same class.

**Conventions I set because nothing existed yet.** Named here because they are what every later
Phase 1 work order will copy, and because `src/README.md` asks for the ones that get re-litigated to
be written down:

1. **Handlers by delegation from declarative `data-*` hooks; never `onclick=""`.** This one is not
   taste. Roll Call! uses inline `onclick` throughout and it works there because that app is one
   file with everything on `window`. In ES modules an inline attribute evaluates in global scope and
   cannot see a module's exports, so `onclick="openModal('x')"` throws *at click time* — the worst
   place to find out. One document-level listener; hooks are `data-modal-open`, `data-modal-close`,
   `data-save-state`, `data-save-cycle`, `data-announce`, `data-pill-group`. Delegation also means
   rows rendered later from the year document need no re-binding.
2. **Semantics in HTML, behavior in JS.** `role="dialog"`, `aria-modal`, `aria-labelledby`,
   `aria-label`/`title`/`aria-hidden` all live in `index.html`; `modal.js` only moves focus and
   toggles `.hidden`.
3. **One `aria-live` region for the whole app**, reached only through `announce()`. The save chip
   carries no `role="status"` on purpose — doubling the channels announces twice.
4. **`window.planbook` is a console seam, not an API.** It exists because WO-1.2 ships no store, so
   the five save states and the live region are otherwise unreachable. Later work orders import the
   modules directly; nothing in the app should ever read `window.planbook`, and it goes when the
   shelf goes. Said in the file, at the seam.
5. **Section-banner comments** (`/* ── HEADER ── */`) in the stylesheet, matching Roll Call!'s, so
   `portable-components.md`'s line references stay findable across both repos.
6. **Comment density matches Roll Call!'s `CLAUDE.md` house style**: every non-obvious line carries
   the scar that produced it. That is a deliberate match to the reference implementation, which the
   root `CLAUDE.md` names as a model.

---

## 4. What I kept vs. rewrote from the interrupted draft

**Kept, after auditing — roughly 90% of it.** The draft was a real lift, not a paraphrase: values
traced back to `starter-template.html` line by line, the `srIn` keyframes byte-identical to
`dashboard.html:803`, `announce()` a faithful port including the scar (a live region set to text it
already contains announces nothing, so an identical repeat is cleared first and the write deferred a
tick), and `showSaveState` matching `dashboard.html:3871`'s shape. It also got the three judgment
calls right that I would have had to make myself: dropping `outline: none`, replacing the
off-guide `#b0bcc8`, and dropping Roll Call!'s sixth save state `queued` (it means "waiting on the
Apps Script outbox"; Planbook writes to the device it runs on, so a write that has not landed has
*failed*, not queued — and reintroducing it would be reintroducing the outbox `CLAUDE.md` rules out).
`index.html`'s markup, `live-region.js`, `save-indicator.js` and `prefs.js` are unchanged.

**Rewrote or corrected — seven changes:**

1. **`modal.js` — explicit opener.** `openModal(overlay, opener)`; `src/shell.js` passes the matched
   element. The Safari reasoning is in §1 line 3 above and in the file's header comment.
2. **`modal.js` — `closeModal` no longer "returns" focus to `document.body`.** Focusing `<body>` is
   the browser's default, not a focus return; leaving focus alone at least preserves Tab position.
3. **`modal.js` — deleted the unused `closeTopModal` export.** The Escape handler calls `closeModal`
   directly. An exported-but-uncalled function in the first module of a repo sets a bad precedent.
4. **`shell.css` — coarse-pointer search input.** The 19px-input-in-a-44px-box defect. §1 line 5.
5. **`shell.css` — `.modal-actions` re-aligned to its source.** The draft had it as
   `justify-content: flex-end; margin-top: 18px`, which is Roll Call!'s **`.config-actions`**
   (`dashboard.html:721`, the settings-modal tier). Its actual `.modal-actions`
   (`dashboard.html:651`) is `display: flex; gap: 8px; margin-bottom: 4px` — left-aligned. Shared
   class names are what make a fix portable between the two apps, so a class that looks the same and
   behaves differently is worse than a class that looks different. Restored to the source
   declaration plus a top margin, with the reason in the file. **This is the one place I chose
   fidelity over what I'd have designed** — a right-aligned dialog footer is the more conventional
   choice, and "lift, don't redesign" wins.
6. **`shell.css` — `.modal-overlay { overflow-y: auto }` + `.modal-panel { margin: auto }`.**
   An addition to the lift, flagged as such in the file. Centering a too-tall flex child clips its
   top edge with no way to scroll to it; an iPad in landscape has ~704px of usable height, which any
   modal with a form in it will exceed. `margin: auto` is the standard fix. Zero visual change to
   the current modal.
7. **`shell.css` + `index.html` — `.modal-section-label` is now used.** It was defined and unused.
   Rather than delete a documented piece of the modal system, I used it in the About modal and added
   `.modal-body p + .modal-section-label { margin-top: 16px }`. Roll Call! spaces this with an inline
   `style="margin-top:18px"` at each use site (`dashboard.html:1394`); a rule says it once.

**Nothing was deleted for being out of scope.** I checked: the component shelf is explicitly in
scope (the Out of scope line reads "This is chrome and a component shelf"), and the draft correctly
omitted the parts of `portable-components.md` that WO-1.2 does not name — no skeletons, no stale
banner, no sticky alert banner, no print scaffold, no config-modal tier, no setup-flow screens
beyond `#loadingScreen`, and no `.att`/`.lc-*` attendance semantics (§9, "not portable").

---

## 5. How the desk-side verification was done

A throwaway harness: a bare-Node static server plus headless Edge driven over CDP through Node's
global `WebSocket`. Zero dependencies, no `package.json`. **27 checks, 27 passing.** It is in the
session scratchpad, not the repo — adding a tool is outside this work order's Deliverables. See
follow-up F4; if the tool is wanted I can hand the file over.

Two harness bugs are worth recording because they will bite the next person who tries this, and
because both first presented as *app* defects:

- **Headless Chromium with no visible frame does not advance CSS transitions or animations.**
  `getComputedStyle` and `getBoundingClientRect` return start-of-animation values. The save chip
  therefore read back as the *previous* state's color (a perfect off-by-one that looks exactly like
  a `showSaveState` bug), and `.modal-close` measured 42.24px — which is 44 × 0.96, the `srIn`
  keyframe's opening scale, and which looks exactly like a failed touch target. Both are artifacts.
  The harness now injects `*, *::before, *::after { transition: none !important; animation: none
  !important; }` before measuring.
- **`Emulation.setEmulatedMedia`'s `features` list does not reach `pointer: coarse`.** It needs
  `setTouchEmulationEnabled` plus `mobile: true` device metrics. The harness now asserts
  `matchMedia('(pointer: coarse)').matches` *before* it measures anything, because the failure mode
  is silent: it measures the desktop pass and reports green.

Both are the kind of thing that turns a manual pass into a false claim, which is why they are here
and not just in a commit message.

---

## 6. Proposed follow-up work orders — noted, not done

Each of these was a temptation. None were acted on.

- **F1 · Print scaffold.** `design/style-guide.md` §8 and `portable-components.md` §7 specify
  `#printHeader`, `@media print` chrome-hiding, and the `body[data-modal-print]` single-modal print
  mode. WO-1.2's Deliverables do not name print, and print is where accommodation data leaks by
  accident, so it wants its own work order with its own containment check rather than a free ride
  here. Phase 3 or 4, before any report surface exists.
- **F2 · Skeleton loaders.** `.skel` shimmer + variants (`portable-components.md` §6). Nothing to
  skeleton until WO-1.4 has a store that can be slow. Pairs naturally with WO-1.4.
- **F3 · The fourth breakpoint.** `design/style-guide.md` §6 names
  `@media (orientation: portrait) and (max-width: 1024px)` as a portrait-tablet **grid** tweak. The
  shell has no grid, so the block would be empty. It belongs to whichever work order introduces the
  first multi-column grid (WO-1.10's home screen, most likely). Flagged because a verifier reading
  §6 against the stylesheet will notice three blocks where the guide names four, and that is
  correct rather than an omission.
- **F4 · A repo-resident headless harness, `tools/verify-shell.mjs`.** The one I built proves things
  a checklist can only assert — that the coarse pointer actually engaged, that `Tab` really wraps,
  that no interactive element measures under 44px, that focus really lands back on the opener. It
  is bare Node with zero dependencies and drives the same Edge the teacher already has. **It is
  explicitly not a test framework** and I want to be careful about that: `plans/b-hygiene.md` and
  this repo's `CLAUDE.md` rule out linters and test frameworks, `plans/ROADMAP.md` names
  `TESTING.md` plus a headless demo pass as the 1.0 gate, and Roll Call!'s own
  `design/execution-guide.md` §7 says "verify by driving the built demo in headless Edge/Chromium
  over CDP" — so a single `.mjs` under `tools/` is arguably the suite's *existing* convention rather
  than a new dependency. Either way it is the teacher's call and it is not this work order's.
  Worth weighing before Phase 8's accessibility pass: Roll Call!'s headless run found 66 unlabelled
  buttons in an area already ticked done.
- **F5 · Body scroll lock and `inert` while a modal is open.** `aria-modal="true"` handles the
  screen-reader side, but the page behind a modal still scrolls on a wheel/touch drag, and the
  background is still reachable by an AT virtual cursor in browsers that don't honour `aria-modal`.
  Roll Call! has neither, so adding them here would diverge from the suite unilaterally. Wants a
  decision that covers both apps.
- **F6 · The rest of the setup-flow grammar.** `portable-components.md` §3's connect/wizard/picker
  screens share one visual language with `#loadingScreen`, which is the only one this work order
  needed. WO-1.6 (classes & terms) is the first thing that needs a first-run wizard; the other three
  screens' styling should land with it rather than sitting unused now.

---

## 7. Decisions the work order didn't settle, and which way I went

1. **Does `prefs.js` belong in WO-1.2 at all, given "no data"?** Yes. The Deliverables name
   "`localStorage` prefix `planbook_`", and without a module the prefix appears nowhere in the code
   and Acceptance line 6 has no artifact behind it. It is 55 lines, writes nothing, and its
   `PREF_DEFAULTS` gate is what turns line 6 from a promise into something the code cannot violate
   silently. **Risk I'm naming:** a verifier could read an empty `PREF_DEFAULTS` as dead code. It is
   the enforcement point, and WO-1.3's install-banner dismissal is its first entry.
2. **`.modal-actions` alignment** — fidelity to the source over the more conventional right-aligned
   footer. §4 item 5.
3. **The `#loadingScreen` stays** even though there is nothing to load, so WO-1.4's store has
   somewhere to load *behind*. It hides on `DOMContentLoaded` rather than `load` (waiting for `load`
   waits for images and fonts the shell doesn't have). Consequence worth knowing: if the module
   fails to parse, the loading screen never lifts. Roll Call! behaves the same way.
4. **`apple-mobile-web-app-status-bar-style: default`**, lifted from `starter-template.html:7`.
   WO-1.3 owns theme colors and the install path and may want `black-translucent` instead, which
   changes whether content runs under the status bar and therefore whether
   `env(safe-area-inset-top)` does anything. Left as the starter has it; flagged for WO-1.3.
5. **The shelf's contents are temporary and say so** in `index.html`'s header comment, in
   `shell.css`'s `── COMPONENT SHELF ──` banner, and on the page itself ("Nothing on this page is
   wired to anything"). WO-1.10 replaces `<main>`; when the last shelf row goes, seven CSS rules go
   with it. Named in both files so that removal is a deletion rather than an archaeology problem.

---

## 8. Draft `TESTING.md` lines — text only, **not written to the file**

To be appended under `## Phase 1` after the WO-1.1 subsection, per that file's "Append; don't
restructure." Wording is WO-1.2's Acceptance verbatim, with the 👤 the file's own legend requires.

```markdown
### WO-1.2 — App shell & design frame

- [ ] Colors match `design/style-guide.md` literally, declared inline — no CSS variables.
- [ ] No dark-mode rules exist anywhere: no `prefers-color-scheme`, no `[data-theme]`.
- [ ] A modal opens, traps focus, closes on Escape and on backdrop click, and returns focus to
      the element that opened it.
- [ ] `:focus-visible { outline: 2px solid #5b6fcc; outline-offset: 2px; }` is global and no rule
      removes an outline anywhere.
- [ ] On an iPad, no control is under 44px and nothing sits under the safe-area inset. 👤
- [ ] No `planbook_` key holds anything but a UI preference.
```

**A note the teacher may want to add when ticking**, since it is the part that earns its keep later:
lines 1, 2, 4 and 6 were verified by grep and by a headless run on 2026-08-04 and are cheap to
re-run. Line 3 was verified headless in Chromium; its focus-return path was written for a Safari
behavior (Safari does not focus a `<button>` on tap) that Chromium cannot reproduce, so it wants one
iPad confirmation. **Line 5 has had no iPad near it at all** — desk-side it is established that every
interactive element measures ≥44px under an emulated coarse pointer and that `env(safe-area-inset-*)`
is declared on `body`, `.header`, `.header-top`, `.header-bottom` and `.main`, but the insets resolve
to 0 in every emulator, so the home-screen-install check is untouched.

## 9. Draft `CHANGELOG.md` entry — text only, **not written to the file**

To go under `## [Unreleased]` → `### Added`, above the WO-1.1 entry (newest first).

```markdown
- **App shell and design frame** (WO-1.2). The suite's visual language, lifted from Roll Call!'s
  `design/starter-template.html` and `design/portable-components.md` rather than designed again:
  two-row navy-gradient header, `#f0f2f5` page, white 14px-radius panels, the wash/strong chip
  grammar, ten-color avatar palette, and the inset toolbar. The modal system — scrim, gradient
  header, `srIn` entrance, Escape and backdrop close, focus trapped and returned to whichever
  control opened it. The save-indicator chip with its five states (saving · saved · error ·
  syncing · retry), driven by a stub until WO-1.4 gives it a store. An `announce()` helper into a
  single `aria-live` region, and the `.sr-only` utility. The `@media (pointer: coarse)` touch pass
  with its 44px floor, plus the 1024px and 640px breakpoints in the order `design/style-guide.md`
  §6 declares them. iOS chrome: viewport `maximum-scale=1.0`, `apple-mobile-web-app-capable`,
  `env(safe-area-inset-*)` padding, `overscroll-behavior-y: contain`, and
  `touch-action: manipulation` on every tappable class.

  `src/` gets its first code: `shell.css`, and the modules `shell.js`, `modal.js`,
  `save-indicator.js`, `live-region.js`, `prefs.js`. Handlers are delegated from declarative
  `data-*` hooks rather than inline `onclick` — an inline attribute evaluates in global scope and
  cannot see an ES module's exports, so Roll Call!'s idiom would throw at click time here.
  `prefs.js` is the only code permitted to touch `localStorage`; it owns the `planbook_` prefix and
  refuses any key not declared as a UI preference, which is what keeps student data in IndexedDB by
  construction rather than by discipline. It declares no keys yet.

  Roll Call!'s sixth save state, `queued`, is deliberately absent: it means "waiting on the Apps
  Script outbox", and Planbook writes to the device it runs on, so a write that has not landed has
  failed rather than queued.

  `<main>` holds a component shelf rather than a screen — every piece of the frame, so it can be
  seen and touched before there is data. Nothing on it is wired to anything and WO-1.10 replaces it.
  Still deliberately absent: the manifest link and service-worker registration (WO-1.3), IndexedDB
  and the year document (WO-1.4).
```

---

## 10. For the verifier, in one place

- **Working tree**: `index.html` modified; six new files under `src/`. Nothing else. Not committed.
- **To run it**: any static server from the repo root, then open `/index.html`. A module script will
  not load from `file://`.
- **The one line I am not claiming**: Acceptance 5. Desk-side evidence is in §1; the iPad is owed.
- **The one claim resting partly on reasoning rather than observation**: the Safari half of
  Acceptance 3's focus return (§1 line 3, caveat).
- **Greps that should return zero**, over `index.html` and `src/`:
  `prefers-color-scheme` · `\[data-theme` · `var\(--` · `outline: *(none|0)` · `rel="manifest"` ·
  `serviceWorker` (the last two appear only inside `index.html`'s comment explaining that WO-1.3
  owns them).
