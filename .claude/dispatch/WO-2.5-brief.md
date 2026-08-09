# WO-2.5 — Keyboard & touch pass · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.5-result.md` — as your last act, and return it in-band too.

**Routing decision.** Routed to **Claude (Opus)** on its own merits, not by fallback — WO-2.5 is
absent from `ROUTING.md`'s Ship 1 pre-routed table (it was pulled into Ship 1 on 2026-08-08 and the
table was never extended), so this was derived fresh and lands in the Claude column on three
triggers at once: it is a 🚩 go-live blocker, two of its four Acceptance lines need eyes and
teacher-facing prose rather than a mechanical assertion, and its "Why it exists" is a judgment
change — the same deliverable held to a new standard. The runner-up I set aside: the coarse-pointer
audit is genuinely mechanical and reads Codex-shaped, but it is one deliverable of three and the
keyboard half is the one with a term riding on it.

**The one thing to hold onto while you build.** The work order says it plainly and it is the
easiest sentence in this brief to skim past: *a keyboard path that is merely present and correct
passes the acceptance list below and still fails the term.* The target user is greeting a room of
25–30 arriving students and not looking at the screen. Marking a full class should be a flow of
single keystrokes with the hand never leaving the keyboard and the selection advancing on its own —
not a sequence that requires looking up to confirm where focus went. If you find yourself choosing
between "correct" and "fast in a doorway," choose fast and say so in your report.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.5 — Keyboard & touch pass

**Ship** 1 · **Status** 🔨 IN PROGRESS · **Size** S · 🚩 · **Depends on** WO-2.1
**Closes roadmap** Phase 2 → "Keyboard path on desktop and 44px touch targets. Both, not either."

**Why it exists.** The roadmap says both, not either, because building for one device is how the
other one becomes unusable.

**Moved into Ship 1 and marked 🚩 on 2026-08-08, and the reason changes what this work order is.**
This was written when the model was *"attendance is marked on the iPad while students arrive and
reviewed on the laptop afterward,"* which made the keyboard path an affordance for the quiet half of
the job. That model is inverted for the first term: **the laptop is the device of record and the
keyboard path is how a live class gets marked while students walk in** — see WO-G1's decision
record, which turns on two devices being two databases and sync being Phase 7.

So the deliverable is unchanged and the **standard it is built to is not**. This is now on the
critical path CLAUDE.md names: *fast enough to do while students arrive*, for a class of 25–30, by
someone who is greeting a room rather than looking at a screen. A keyboard path that is merely
present and correct passes the acceptance list below and still fails the term. Mouse-clicking 25
rows one at a time is the failure this work order exists to prevent, and until it lands the
laptop-only decision is not safe to act on.

**Do not let this quietly become an iPad work order.** The touch and screen-reader deliverables stay
— the iPad remains a verification device and Phase 7 brings it back as a peer — but the keyboard
half is the one with a term riding on it, and it is the half with no hardware sitting of its own
behind it. Every 👤 line in Phase 2 was closed on the iPad.

**Deliverables**
- Desktop: row selection, `P`/`T`/`A`/`E`/`D` keys to mark, arrow keys to move, Escape to
  deselect. Shortcuts discoverable, not folklore.
- Touch: audit every control added in WO-2.1–2.4 against the `@media (pointer: coarse)` block.
- Screen-reader labels on the mark buttons — an icon-only `A` button needs `aria-label` and `title`.

**Acceptance**
- [ ] A full class can be marked from the keyboard without touching the mouse.
- [ ] No attendance control is under 44px on a coarse pointer.
- [ ] Keyboard focus is visible on every step and never lost after a mark.
- [ ] The shortcuts are documented somewhere in the UI, not only in this file.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**The surface you are modifying** — this is a pass over code that already exists, not a new screen:

- `src/attendance.js` (3,244 lines) and `src/attendance.css` (894 lines) — the WO-2.1 registry, and
  the primary target. It already has ~24 keyboard/aria-adjacent occurrences; read what is there
  before adding a parallel mechanism.
- `src/days-off.js`, `src/passes.js` — the WO-2.3 and WO-2.8 controls. The Deliverables say audit
  *every* control added in WO-2.1–2.4 against the coarse-pointer block, so these are in scope for
  the touch and aria halves even though the keyboard path is the registry's.
- `src/shell.css`, `src/shell.js`, `src/modal.js` — where a global focus rule and a help/shortcuts
  surface would live if that is the right home for them. `src/live-region.js` already exists; use it
  for announcing marks rather than building a second announcer.

**Conventions that are already decided, and that this work order is likely to trip over:**

- `design/style-guide.md:86` — *"Focus: global `:focus-visible { outline: 2px solid #5b6fcc;
  outline-offset: 2px; }` — never remove it, never style `:focus` bare."* Acceptance line 3 is
  about honoring this rule, not inventing a focus treatment. If a mark button's focus ring is
  invisible against its own background, fix the contrast, do not swap the mechanism.
- `design/style-guide.md:94-96` — the `@media (pointer: coarse)` block: `min-height: 44px`, icon
  buttons 44×44, *"Every new control must appear in this block."* Acceptance line 2 is an audit
  against this, and `node tools/verify-shell.mjs` measures it — a stylesheet reading is not evidence.
- **Roll Call! has the component you want for row selection.** `design/portable-components.md:152`
  in the reference repo: *"`.row-selected` row highlight (indigo wash + 3px left border) for
  keyboard navigation."* CLAUDE.md's standing rule is lift the design with the function — copy its
  measurements and colors, do not re-derive a selection treatment. The scar behind that rule is
  WO-2.11, re-cut the same day it shipped.
- The Roll Call! repo is at
  `C:\Users\WildB\OneDrive\Documents\Coding Projects\Attendance App` — `design/portable-components.md`
  and `design/style-guide.md` are the two worth opening.

**On Acceptance line 4 (shortcuts documented in the UI).** This is teacher-facing prose and a
discoverability decision, not a legend dumped somewhere. "Discoverable, not folklore" is the work
order's phrase. Whatever surface you choose, it must be reachable *from the keyboard* by someone who
does not already know the shortcuts — a help affordance only findable with a mouse fails its own
deliverable.

**Scope discipline.** This work order has no explicit *Out of scope* line, which is not permission
to widen it. It is a keyboard, touch, and screen-reader pass over existing attendance surfaces.
Refactoring the registry, changing mark semantics, or improving anything you find along the way
belongs in your report as a proposed follow-up work order — not in the diff.

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
  exceptions: **never tick a 👤 line** — it needs a real iPad and you do not have one — and leave the
  `CHANGELOG.md` entry to the teacher, who decides what a change means. Anything you do tick must be
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

1. A full class can be marked from the keyboard without touching the mouse.
2. No attendance control is under 44px on a coarse pointer.
3. Keyboard focus is visible on every step and never lost after a mark.
4. The shortcuts are documented somewhere in the UI, not only in this file.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

