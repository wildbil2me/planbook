# WO-2.11 — The pass banner, and cancelling a pass issued by mistake · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.11-result.md` — as your last act, and return it in-band too.

**Routing decision.** Routed to **Claude at the Opus tier**, on the work order's own merits rather
than by fallback: this is a design-system lift from Roll Call! (`renderActivePassBanner()` and the
`✕ Cancel` card, `src/dashboard.html` ~3345/~3439/~5027) that needs taste about what transfers, and
its Traps are judgment rather than mechanics — *"do not implement cancel as Return with
`minutes: 0`"* is the smaller, cleaner-looking diff and it is the defect. The 🚩 go-live blocker mark
points the same way; ties and blockers go to Claude.

The runner-up I set aside: `cancelPass()` on its own is specified tightly enough for the Codex
column — a gated splice beside `closePass()`, mechanically checkable. But it ships inseparably with
the banner UI, the note field's shape rule, and the recorded presentation-mode decision, and routing
half a work order is not a route. No Codex probe was run, because this never entered the Codex
column.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.11 — The pass banner, and cancelling a pass issued by mistake

**Ship** 1 · **Status** ⬜ NOT STARTED · **Size** M · 🚩 · **Depends on** WO-2.8
**Closes roadmap** Phase 2 → "Cancel a pass issued by mistake, writing nothing to the log"
**Takes from WO-2.9** the banner card only — the elapsed timer, the overdue alerts and the history
view stay there. See *Why the banner comes with it*.

**Why it exists.** WO-2.8 shipped three issue buttons side by side in a 160px column and no way
back out of any of them. Found by the owner on 2026-08-07, in the first iPad sitting with the
finished feature — the same way hall passes themselves were found.

**What a misclick costs today**, which is why this carries 🚩 rather than waiting for WO-2.9:
[`../../src/passes.js`](../../src/passes.js) exports `openPass`, `closePass` and `reopenPass` and
nothing else. The only exit from an open pass is **Return**, which appends a permanent entry to
`passes` — a phantom trip, `minutes: 0`, for a student who never left the room. `passes` is
append-only, and `reopenPass()` refuses anything whose `endedBy` is not `dismissed`, so the app
cannot remove it afterwards. Phase 4 is specified to read pass data as a signal, so these
accumulate as real history in the record that feeds it.

### Why the banner comes with it

**There is no dropdown in Roll Call!, and an earlier draft of this work order said there was.**
Corrected 2026-08-07 against the source. What is actually there:

- The **grid cell** carries a bare `Return` and nothing else — `passOutHTML()`, `src/dashboard.html`
  ~5270, a single line.
- **Cancel lives on the active-pass banner card**: `✕ Cancel` beside `✓ Return`, ~3439, on a card
  that also holds the avatar, the name, the type chip, the time out, the elapsed clock and a note
  field. `cancelPass(si)` itself, ~3345, is four lines — `delete activePasses[si]`, repaint.
- Compact mode has its own `✕ Pass` beside Return, ~5027.

So in Roll Call! **you never cancel from the row you issued from.** That is the design, and it is
the answer to the constraint this work order was written around: the 160px column has no room for a
third target, and putting one there is how a thumb reaching for Return destroys a real trip's
minutes. The banner has room outright.

The owner chose this shape on 2026-08-07 over adding a control to the cell. What comes forward is
**the card and nothing else.** The elapsed timer stays in WO-2.9 deliberately — it carries the
iOS-suspend trap that WO-2.9's Traps section exists for, and cancel does not need it.

**Deliverables**
- **The active-pass banner**, per Roll Call!'s `renderActivePassBanner()`: one card per open pass,
  carrying the student's name, the pass type, and the time out. **No elapsed clock** — see above.
- **`✕ Cancel` on the card**, beside Return. It removes the entry from `openPasses` and **writes
  nothing to `passes`**.
- **`Return` on the card too**, as Roll Call! has it, so the banner is a complete surface rather
  than a place where half the actions live. The cell keeps its own Return; both call the same writer.
- **An `Add note…` field on the card**, as Roll Call! has it, and **`note` added to the pass
  record** — optional, absent where unused, the same shape rule the mark cell's `note` follows. It
  is typed while the student is out and **carried through `closePass()` into the `passes` entry**,
  which is what makes it worth anything: WO-2.9's history view renders it (Roll Call!'s
  `.sr-pass-note`), and a note that died on return would render nowhere.
  **Add the field now rather than in WO-2.9.** It is one optional string, and the alternative is
  retrofitting it onto pass records already written during a live term. No migration is needed —
  absent is a legal value — but [`../../docs/data-model.md`](../../docs/data-model.md) records it
  with the two collections.
- **A `cancelPass()` in the model**, beside `closePass()` and deliberately not a variant of it —
  cancel is not a close with a flag. `closePass()` writes history; this one is the only writer that
  removes an open pass without leaving a record, and it says so at the definition.
- **The banner is scoped to the class on screen** — `openPassesFor(doc, classId)`, not
  `openPassesIn(doc)`. Both exist in the model and this is the deliberate choice between them,
  made by the owner on 2026-08-07: passes are issued for one room at a time, and a banner carrying
  another period's students is noise on the screen you are standing in front of. A pass left open
  in an earlier class is **not** invisible — its own row keeps its Return button and its time out in
  that class's grid, which is the surface the owner confirmed on the iPad reads as a reminder. The
  cross-class case, if it ever wants one, belongs to WO-2.9's overdue alerts.
- **44px under `(pointer: coarse)`**, per the standing obligation.

**Presentation mode is deliberately NOT handled here**, and the reasoning is recorded because the
card is exactly the shape of thing a later session will flag. The card names a student beside a
coloured type chip reading `Bathroom` / `Nurse` / `Quick` (confirmed from a screenshot of Roll Call!
running, 2026-08-07), and `Nurse` beside a named child on a projected wall is health-adjacent
information of the kind [`../../CLAUDE.md`](../../CLAUDE.md) puts in the never-disclose set.

**The owner's call, 2026-08-07, and the argument for it:** presentation mode is a parent-teacher
night tool — reviewing a student's record with a guardian, not running a live class. Passes are
issued during class. The two do not overlap, so there is no card on the wall to hide.

**The residual case, named rather than hidden:** nothing expires a stale pass (WO-2.8, deliberately
— inventing a return time is the same sin as inventing a tardy's `at`). A pass forgotten in period 7
is still open at a 6pm conference. If the banner is ever drawn on a projector, that is how. The fix
if it happens is three lines, because the card only has to ask
[`../../src/supports.js`](../../src/supports.js) like every other surface — the work is knowing to,
which is what this paragraph is for.
**Out of scope** — presentation-mode handling for the card, per the decision recorded above. The
elapsed clock, the two overdue alerts, and the pass history view, all of
which stay in WO-2.9 and are why that work order still exists. Cancelling a pass that has already
been returned: that entry is history, the append-only rule protects it, and correcting it is a job
for the history view. An undo for the `D` coupling's dismissal-close, which has its own retraction.

**Acceptance**
- [ ] Issuing a pass and cancelling it leaves `passes` **byte-identical** to before the tap, and
      `openPasses` back to its prior length. Verified in the document, not the UI.
- [ ] A cancelled pass frees its slot against the per-class cap of three immediately.
- [ ] Cancel and Return cannot be confused at speed on glass. 👤
- [ ] Cancelling creates no attendance record and changes no attendance mark — the same silence
      WO-2.8's acceptance line 6 measures.
- [ ] A pass returned normally still writes exactly one entry. Cancel does not weaken Return.
- [ ] A note typed on the card survives the Return and is on the entry in `passes`. A pass with no
      note carries no `note` key at all.
- [ ] A note on a **cancelled** pass goes wherever the pass goes — nowhere.
- [ ] The banner shows one card per open pass **in the class on screen**, and disappears entirely
      when that class has none — including when another class still does. Returning or cancelling
      from the **card** updates the row's cell, and from the **cell** updates the card.
- [ ] The banner costs the registry no day columns — it is above the grid, not beside it. The
      portrait width budget is already tight and WO-2.12 is spending it.

**Traps** — **`passes` is append-only, and this work order is the one exception being added to
that rule, so it must not become two.** The rule protects trips that happened; a tap that sent
nobody anywhere is not one, and that is the whole argument. The failure mode to avoid is a
`cancelPass()` general enough to delete a *returned* entry — at which point the append-only claim
in [`../../docs/data-model.md`](../../docs/data-model.md) is no longer true of anything and
Phase 4's signal is reading a mutable log. Gate it on the pass being **open**, the way
`reopenPass()` is gated on `endedBy === 'dismissed'`.

And **do not implement cancel as Return with `minutes: 0`.** It reads as the smaller change and it
is the defect: a zero-minute trip is exactly the phantom record this exists to prevent, just
written deliberately.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `docs/data-model.md`
  - `src/passes.js`
  - `src/supports.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**The reference implementation, and the specific lines this work order was written against.** Read
these before designing the card — the work order's "Why the banner comes with it" section was
corrected against the source on 2026-08-07 after an earlier draft invented a dropdown that does not
exist. Do not repeat that; read the source.

- `C:\Users\WildB\OneDrive\Documents\Coding Projects\Attendance App\src\dashboard.html`
  - `cancelPass(si)` ~3345 — four lines, `delete activePasses[si]` and repaint. That brevity is the
    point: cancel is a removal, not a close with a flag.
  - `renderActivePassBanner()` ~3439 — the card. Note what it carries and what you are told to drop:
    **no avatar is required and no elapsed clock is permitted** (the clock stays in WO-2.9 with its
    iOS-suspend trap). Name, type chip, time out, `✓ Return`, `✕ Cancel`, note field.
  - `passOutHTML()` ~5270 — the grid cell's bare `Return`. It stays bare; the cell does not grow a
    third target.
  - Compact mode's `✕ Pass` ~5027 — context for how the pair reads when space is short.
- `C:\Users\WildB\OneDrive\Documents\Coding Projects\Attendance App\design\style-guide.md` and
  `design\portable-components.md` — lift the card, the chip and the button pair from here rather
  than hand-designing. Colors inline, no CSS variables, and that is deliberate; do not tidy it.

**Sibling conventions in this repo that this must match rather than reinvent.**

- `src/passes.js` — the whole module. `openPassesFor(doc, classId)` (line ~128) is the accessor the
  work order names; `openPassesIn(doc)` (~112) is the one it deliberately rejects. `closePass()`
  (~195) is the writer the card's Return must call — the same one the cell calls, not a copy.
  `reopenPass()` (~254) shows the gating pattern the Traps section tells you to imitate: refuse
  anything not in the expected state, at the definition, with the reason written down.
  `atCap()` / `MAX_OPEN_PASSES` (~132, ~92) are what acceptance line 2 is about.
- `src/attendance.js` — where the registry renders, and where the banner has to sit **above** the
  grid. `noteOf(cell)` (~363) and the write path around ~1109–1119 are the exact shape rule the pass
  `note` must follow: **set the key when the trimmed string is non-empty, `delete` it otherwise**, so
  an unused note leaves no key at all. Acceptance line 6 checks precisely that.
- `src/attendance.css` — the banner's styles belong here with the rest of the registry, and every new
  control needs its 44px entry in the existing `@media (pointer: coarse)` block.
- `src/store.js` — `MIGRATIONS`. You should not need one; `note` absent is a legal value, and the
  work order says so. If you find yourself writing a migration, stop and say why in your report.
- `docs/data-model.md` — record `note` with the two pass collections, and be careful with the
  append-only sentence. It is being given **one** exception and the document should describe that
  exception exactly, not soften the rule into "mostly append-only."

**A note on scope.** Presentation mode is out, by an owner decision with the argument recorded in the
work order. Do not add it, and do not remove or "improve" the paragraph explaining why it is absent —
that paragraph exists specifically so a later session does not re-litigate it.

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

## 5. Done means these 9 lines, reported against one by one

1. Issuing a pass and cancelling it leaves `passes` **byte-identical** to before the tap, and `openPasses` back to its prior length. Verified in the document, not the UI.
2. A cancelled pass frees its slot against the per-class cap of three immediately.
3. Cancel and Return cannot be confused at speed on glass. 👤
4. Cancelling creates no attendance record and changes no attendance mark — the same silence WO-2.8's acceptance line 6 measures.
5. A pass returned normally still writes exactly one entry. Cancel does not weaken Return.
6. A note typed on the card survives the Return and is on the entry in `passes`. A pass with no note carries no `note` key at all.
7. A note on a **cancelled** pass goes wherever the pass goes — nowhere.
8. The banner shows one card per open pass **in the class on screen**, and disappears entirely when that class has none — including when another class still does. Returning or cancelling from the **card** updates the row's cell, and from the **cell** updates the card.
9. The banner costs the registry no day columns — it is above the grid, not beside it. The portrait width budget is already tight and WO-2.12 is spending it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

