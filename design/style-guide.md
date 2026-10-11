# Suite Style Guide

The visual language shared by every app in the suite. Values are quoted from
`src/dashboard.html` — copy them literally. Colors are defined inline (no CSS variables);
that is a deliberate convention, keep it unless the whole suite migrates at once.

**There is a rendered twin: [`style-guide.html`](style-guide.html).** This file is the
reference you read; that one is the reference you *look at* — every color as a clickable
swatch that copies its own hex, and the component shelf WO-1.2 shipped in `index.html`
and WO-1.10 took back out when the shelf left. It is a single self-contained page that
links no stylesheet, loads no font and fetches nothing, so it opens from `file://` and
**is meant to be copied out of this repo into a sibling app** — change the app name and
the favicon emoji. The one other app-specific thing in it is the three dialog kinds of § 5,
which are Planbook's, not yet the suite's: keep them, or strip them as § 5 says. Nothing
else is app-specific.

Which one to reach for: **this file settles what a value is, the HTML settles what it
looks like next to the others.** A wash that reads correctly in a table cell can still be
wrong against the strong tone beside it, and that is not a judgement a markdown table can
make. The two are kept in step by hand — if you change a value here, change it there, and
the HTML practises what it documents, so anything copied out of it is already a literal
value rather than a variable that needs a definition travelling with it.

## 1. Palette

### Chrome (dark surfaces)
| Role | Value |
|---|---|
| Header / setup-screen background | gradient `linear-gradient(135deg, #0d2137 0%, #1a3c5e 60%, #2a2a6e 100%)`; solid `#0d2137` for full-screen overlays |
| Modal header gradient | `linear-gradient(135deg, #0d2137 0%, #1a3c5e 100%)` |
| Active-alert banner background | `#0d1f2f` |
| On-dark text | `#fff`; secondary `rgba(255,255,255,0.5–0.6)`; hints `rgba(255,255,255,0.45)` |
| On-dark controls | bg `rgba(255,255,255,0.08)`, border `1.5px solid rgba(255,255,255,0.15–0.25)`, hover bg `rgba(255,255,255,0.16–0.18)` |

### Page (light surfaces)
| Role | Value |
|---|---|
| Page background | `#f0f2f5` |
| Panel / card background | `#fff`; subdued card `#f8f9fc` with border `#e0e4f0`; inset bar `#f8f9fb` |
| Primary text | `#1a1a2e` |
| Secondary text | `#6b7a8d`; muted labels `#8a9bb0`; disabled/empty `#a0aab8` |
| Hairlines | `#eef0f4` (panel dividers), `#f3f4f6` (table rows), inputs `#e0e4ea`, stronger `#d0d8e4` |

### Semantic accents — each has a strong tone + a pale wash used as its background
| Meaning | Strong | Wash | Border tint |
|---|---|---|---|
| Positive / present / confirm | `#27ae60` (hover `#219a52`) | `#eafaf1` | `#a3e4bc` |
| Interactive / selection / info | `#5b6fcc` (hover `#4a5fbb`) | `#eef0fb` / `#eef2ff` | `#b0bcf0` |
| Warning / tardy | `#e67e22` | `#fef5ea` | `#f5c98a` |
| Danger / absent | `#e74c3c` (deep `#c0392b`, alt `#dc2626`) | `#fdeaea` | `#f0b0b0` |
| Special state (e.g. dismissed) | `#7c3aed` (hover `#6d28d9`) | `#f3eaff` | `#c8a0f0` |
| Caution banner (offline/stale) | text `#8a6d1a`, border `#c9a83f` | `#fff8e6` | `#f0dfa8` |
| Warn badge | text `#c0700a` | `#fff3cd` | — |

**Rule:** interactive chips/buttons are wash-background + strong-color text (+ optional
1.5px tinted border). Solid strong-color fills are reserved for the *active/selected*
state and primary CTAs.

### Avatar palette
Ten fixed classes `.av0`–`.av9`, assigned by `id % 10`:
`#5b6fcc #27ae60 #e67e22 #e74c3c #8e44ad #0097a7 #c0392b #1a6b3a #2471a3 #d4ac0d`

## 2. Typography

- Font stack: `'Segoe UI', system-ui, sans-serif` everywhere; every `<button>`/`<input>`
  gets `font-family: inherit`. Reports meant to be pasted into email use
  `Arial, Helvetica, sans-serif`.
- Base size `14px` on `body`; UI text runs small: 13px controls/body, 12px secondary,
  11px chips/labels, 10px uppercase section labels, 9px micro-badges.
- Headings are small and bold, not large: page/panel/modal titles are 15–16px / 700.
  Full-screen (dark) titles 20–22px / 700.
- Section labels: 10px, 700, `#8a9bb0`, `letter-spacing: 0.8px`, uppercase.
- Weights: 600 names/labels, 700 buttons/titles, 800 stats and big numbers. Timers and
  stat numbers get `font-variant-numeric: tabular-nums`.

## 3. Shape, depth, spacing

- Radii: 6px small controls · 7–8px buttons/inputs/cards · 10px feature cards · 14px
  panels and modal panels · 16px hero modal · 20px pill filters · 50% avatars/dots.
- Borders on light surfaces are `1.5px solid` (hairline dividers are 1px).
- Shadows: panel `0 1px 4px rgba(0,0,0,0.07)` · header `0 2px 12px rgba(0,0,0,0.3)` ·
  modal `0 8px 32px rgba(0,0,0,0.25)` · hero modal `0 12px 48px rgba(0,0,0,0.28)`.
- Overlay scrims: `rgba(0,0,0,0.5)` (0.55 for the hero modal).
- Spacing rhythm: 20px panel padding and page gutters; 12–16px within groups; 4–8px gaps
  between sibling controls; `.main { max-width: 1300px; margin: 0 auto; }`.
- Global reset: `* { box-sizing: border-box; margin: 0; padding: 0; }`.

## 4. Motion

Small and fast; no library. `transition: all 0.15s` (or named props) on interactive
elements; 0.1s on micro-interactions. Press feedback `transform: scale(0.95)` on `:active`.
Hover-grow on round dot-buttons `scale(1.15)` + shadow. Entrances: 0.18s ease
opacity+scale (`@keyframes srIn`). Loading: 0.8s `spin` for spinners, 1.4s `shimmer` for
skeletons. Collapsible banners animate `max-height` + `padding` over 0.3s.

## 5. States

- Hover: darken solid buttons one step; on-dark controls brighten their white alpha;
  outline buttons take the accent color on border+text.
- Active/selected: solid accent fill + white text (`.pill.active`, `.q-btn.active` inverts
  to white bg + navy text on the dark header; `.cls-tab.active` goes `#1a1a2e`).
- Disabled: `opacity ~0.35–0.5`, `cursor: not-allowed`, washed colors.
- Focus: global `:focus-visible { outline: 2px solid #5b6fcc; outline-offset: 2px; }` —
  never remove it, never style `:focus` bare.
- Save indicator states (chip): saving=orange wash, saved=green wash, error=red wash,
  syncing/queued=indigo wash, retry=orange wash. Icons: ⏳ ✓ ✕ ↻ ⏸.

### Dialogs: three kinds, and the kind is the width (WO-1.77)

*(Under § 5 because that is where the work order put it, and because Roll Call!'s own modal tiers
are its `design/portable-components.md` § 5. Read this before writing a new dialog.)*

Every `.modal-panel` wears **exactly one** kind beside it, in its markup, so the next person to
open the file can see what the dialog is. **The kind names what the dialog is, not how wide
somebody wanted it** — decide the kind from the content, and the width follows.

| Kind | Width | What decides it |
|---|---|---|
| `modal-confirm` | 480px | A question and its buttons, or a few lines of prose with one action. A confirm at 640 is a sentence across a laptop. |
| `modal-form` | 640px | Fields side by side, rows of names, or prose longer than a paragraph. Prose much past ~80 characters a line reads worse, and at 480 it wraps too soon. |
| `modal-report` | 900px | A record, a sheet or a grid of classes — wide enough for a table. |

- **Width, never `max-width`.** Each kind is a `width`. A `max-width` above `.modal-panel`'s 480
  never comes into play, which is how four dialogs that asked for 900 shipped at 480 (WO-2.59).
- **An override is a class of the dialog's own, worn beside its kind, with a comment saying why.**
  The departure is then visible next to what it departs from. If a form needs 700, that is an
  override, never a reason to call it a report. There is one today: the Grade sheet,
  `modal-report grades-report-panel`, at 980 for a term's worth of assignment columns.
- **The fallback is `.modal-panel`'s own 480.** A dialog someone forgets to classify draws as a
  confirm — the narrowest and least surprising width. That is a safety net, not the rule:
  `tools/verify/dialog-kinds.mjs` fails a panel with no kind or with two, before deploy.
- **The kinds sit above the phone block** in `src/shell.css` and are restated in its
  `pointer: coarse` block. `(max-width: 640px)` still puts every panel at `95vw` on a phone, and
  `.modal-panel`'s `max-width: 95vw` caps every kind and the override in a narrow window.
- **A wider panel is not a fixed form.** A form at 640 can leave its fields at 480's widths, and a
  panel with an empty right half has not been helped. Read a dialog at its kind's width before
  calling it done.

This departs from Roll Call! knowingly. Roll Call! had four sizes — standard 480, Settings 660,
student report 640, report 700 — and no rule for when a dialog got more room; here every dialog
was the standard 480 until a teacher found one too narrow, six of them one work order at a time.
640 is the width this app had already ruled twice (the roster, the attendance keys), and 900 the
one its records already measured.

**The rendered twin draws all three, labelled as Planbook's** (WO-1.78, the owner's choice of
2026-10-11). `style-guide.html` carries the three rules beside `.modal-panel`, restates them in its
touch pass, and opens a specimen of each from § 6 *Components* under the label *Dialog kinds —
Planbook's, not yet the suite's* — so a sibling app copying the page copies the kinds too, and can
tell they are this app's departure from the suite's single 480 modal rather than a suite rule. An
app that keeps the single modal deletes those six lines, the page's *Dialog kinds* section in its § 6,
the `#sgModalForm` and `#sgModalReport` specimens, and the confirm specimen's `modal-confirm`
class and first paragraph — the suite's 480 modal and its two openers stay as they were — and
every sentence and comment that names them.

## 6. Responsive & touch

Breakpoints, in the order the stylesheet declares them:
- `@media (pointer: coarse)` — **the touch pass.** Every interactive control gets
  `min-height: 44px` (icon buttons 44×44), font sizes bump ~1–2px, hover-only affordances
  become always visible. Every new control must appear in this block.
- `@media (max-width: 1024px)` — tablet: search stretches, pill row wraps, grids drop a column.
- `@media (max-width: 640px)` — phone: page padding 10px, modals `width: 95vw`,
  two-column grids, bars wrap.
- `@media (orientation: portrait) and (max-width: 1024px)` — portrait-tablet grid tweak.

iOS/iPad specifics: viewport meta with `maximum-scale=1.0`, `apple-mobile-web-app-capable`,
`env(safe-area-inset-top/bottom)` padding on header/body, `overscroll-behavior-y: contain`,
`-webkit-overflow-scrolling: touch` on scrollers, and `touch-action: manipulation;
user-select: none` on every tappable class (one grouped selector at the top of the sheet).

## 7. Accessibility

- `aria-label` + `title` on every icon-only button; `aria-pressed` on toggles;
  `role="group"` + label on filter pill rows; `.sr-only` utility for visually hidden text.
- Live announcements go through an `announce()` helper into an `aria-live` region
  (save failures, offline queueing).
- Emoji used as decoration get `aria-hidden="true"`.
- Icons are inline Feather-style SVGs: `viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"`,
  16×16 on desktop (18×18 on touch). No icon font, no image files.

## 8. Light theme only — and print

There is **no dark mode** in suite apps: no theme toggle, no `[data-theme]` rules. Don't
write dark variants for new elements. (The dark chrome surfaces above are part of the
light theme.)

Print: `@media print` hides app chrome; a hidden `#printHeader` becomes visible to title
the printout; a `body[data-modal-print]` attribute flips the page to print a single modal.

## 9. Voice

Friendly-utilitarian, teacher-facing. Sentence case everywhere except the uppercase micro
section labels. Emoji are functional signposts (📋 ⚠ 🚫 ✓ ↩), used sparingly in chrome and
banners, never decorating body text. Errors say what happened and what to do next
("The bridge did not respond within 15 seconds. Check your connection and try again.").
