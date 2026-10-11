# WO-1.78 — the style guide's rendered twin does not show the three dialog kinds · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.78-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, at Opus (no tier override). The deciding signal is that this is a design-system
document a sibling suite app copies, and labelling a Planbook departure inside it is a judgment call
whose Acceptance ("agree with it") is read by eye (ROUTING.md § Claude: design-system lift,
teacher-facing docs). The runner-up was Codex — XS, literal values fully stated — set aside on that.

**The owner's choice, given at dispatch on 2026-10-11: option 2, "The kinds in full."**
`design/style-guide.html` draws the three panels at their widths — `modal-confirm` 480, `modal-form`
640, `modal-report` 900 — **labelled as Planbook's**, so a sibling app copying the page copies them
too. The other two options are declined; do not fall back to a note.

**`TESTING.md` § WO-1.78 already exists** — the orchestrator wrote its heading and the paragraph
recording that choice, at the foot of Phase 1 just above `## Phase 2 — Attendance`. **Extend that
section; do not add a second heading.** Add the four Acceptance lines verbatim with evidence under it.

**What to watch for.**
- The `.md` § 5 table (line ~106, "Dialogs: three kinds…") is the reference; the `.html` must state the
  same widths, the same fallback (`.modal-panel` 480) and the same "width, never `max-width`" rule
  (`max-width: 95vw` stays the cap). The phone block (line ~440, `.modal-panel { width: 95vw; }`) must
  still win over the kinds — the `.md` places the kinds above the phone block; do the same in the twin.
- The `.md`'s "kept in step by hand" sentence (line 18) stays true after this; if the `.md` anywhere
  says the twin shows one modal or omits the kinds, change it in the same sitting.
- "Labelled as Planbook's" means a reader of the page can tell these three are Planbook's departure from
  the suite's single 480 modal, not a suite rule — said in the page's own voice, at the point of
  departure.
- The existing modal specimen (`#sgModal`, line ~1270, its body text "480px wide…") and its open/close
  script must keep working; if you add specimens, keep the guide's own script inline and fetch nothing.
- `verify-shell.mjs` does not open `design/` — the § 4 harness is not this work order's evidence beyond
  the sweep. Checking line 2 (file://, no `<link rel=stylesheet>`, no fetch/`src=`/`url(` to a network
  resource) is a grep and a read; say exactly what you ran. Run `wo-sweep.mjs` (§ 19 reads mockups;
  check whether any section reads `design/style-guide.html`).
- Commit nothing; the orchestrator's session does not commit either.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.78 — the style guide's rendered twin does not show the three dialog kinds

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-11 · **Size** XS · **Depends on** WO-1.77
**Closes roadmap** *(no box. Owner-directed, 2026-10-11.)*

**Booked 2026-10-11**, owner-directed, out of WO-1.77's verdict. WO-1.77 put three dialog kinds into
`design/style-guide.md` § 5 — `modal-confirm` 480, `modal-form` 640, `modal-report` 900, with
`.modal-panel`'s 480 as the fallback. Its rendered twin, `design/style-guide.html`, still shows one
modal at "480px wide" (its § 5 card and the `.modal-panel` rule it practises). The `.md` says the two
are kept in step by hand, and this time they were not. **The implementer left it alone on purpose**:
the twin is meant to be copied into a sibling suite app, and the kinds are a Planbook departure, not
a suite rule.

**The question is the owner's, at dispatch.** One of:
- **A note only** — the twin keeps the suite's single 480 modal and gains one line saying Planbook
  sizes its dialogs by kind, pointing at the `.md` § 5. Nothing a sibling app copies changes.
- **The kinds in full** — three panels drawn at their widths, labelled as Planbook's. A sibling app
  copying the page then copies them too.
- **Nothing** — the `.md`'s "kept in step" sentence is narrowed to say a Planbook-only rule lives in
  the `.md` alone.

**Acceptance**
- [ ] The owner's choice is recorded in `TESTING.md` § WO-1.78, and `design/style-guide.html` and
      `design/style-guide.md` agree with it.
- [ ] `style-guide.html` still opens from `file://`, links no stylesheet and fetches nothing.
- [ ] `node tools/wo-sweep.mjs` is green.
- [ ] `TESTING.md` § WO-1.78 carries these lines verbatim with the evidence for each.

**Traps** — **The twin's values are literal, not variables**, and it practises what it documents:
anything added is written the way a sibling app would copy it. **It is not in `SHELL`**, so no
`CACHE` bump is owed. Nothing in `src/` moves.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `design/style-guide.html`
  - `design/style-guide.md`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `TESTING.md` § WO-1.77 — what the three kinds are and how they were measured; the `.html` should not
  contradict it.
- `src/shell.css` `.modal-confirm` / `.modal-form` / `.modal-report` — the rules being documented. Read
  only; nothing in `src/` moves.

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

## 5. Done means these 4 lines, reported against one by one

1. The owner's choice is recorded in `TESTING.md` § WO-1.78, and `design/style-guide.html` and `design/style-guide.md` agree with it.
2. `style-guide.html` still opens from `file://`, links no stylesheet and fetches nothing.
3. `node tools/wo-sweep.mjs` is green.
4. `TESTING.md` § WO-1.78 carries these lines verbatim with the evidence for each.

**Write `TESTING.md` § WO-1.78 — it is a deliverable, not a permission.** Add `### WO-1.78 — the style guide's rendered twin does not show the three dialog kinds` under `## Phase 1 — Shell, store, roster`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-1.78` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

