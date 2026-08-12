# WO-2.24 — nothing in the tree notices if the shared date reset is deleted · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.24-result.md` — as your last act, and return it in-band too.

**Routing decision.** Routed to **Claude at Opus tier, on its own merits** — no Codex probe run,
because the fallback question never arose. The deciding signal is that the Traps here are pure
judgment rather than mechanics: this work order asks for a check that is *nearly identical* to the
one WO-2.23's Traps forbid, and it grades whether the implementer can hold and articulate that
distinction — and WO-2.23 itself burned **five** verification rounds where every single failure was
in comment prose and none was in code. The runner-up consideration I set aside is real and would
normally win: this is `S`-sized, spec-complete, no-UI tooling with mechanically checkable acceptance
lines, which reads squarely Codex — but the specific failure mode on the table is *a check that
cannot fail*, and a green-on-a-broken-tree guard is exactly the artifact this work order exists to
eliminate, not to add a second one of.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.24 — nothing in the tree notices if the shared date reset is deleted

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-12 · **Size** S · **Depends on** WO-2.23 — this guards the rule
that work order added · **Blocks** nothing
**Closes roadmap** *(no box. Tooling, not app — the same call WO-2.14, WO-2.15, WO-2.18, WO-2.19,
WO-2.20, WO-2.21 and WO-2.22 made.)*

**Not a go-live blocker, and in no ship.** Added 2026-08-10 out of WO-2.23's verification, which
named the hole in as many words and correctly declined to close it from inside a work order about
something else.

**Why it exists.** WO-2.23 put one rule in `src/shell.css`'s BASE section —
`input[type="date"] { -webkit-appearance: none; appearance: none; }` — and seven date fields across
four screens depend on it. **Delete that rule and `node tools/verify-shell.mjs` still prints
563 checks · 563 passed · 0 failed.** The harness's one computed-`appearance` assertion reads
`.assign-field-date`, which keeps its own identical copy in `src/assignments.css` for WO-3.17's
reasons; the five fields that depend on the shared rule *alone* — the term editor's two, the days-off
form's two, and the student editor's plan *Review date* — live behind `.hidden` dialogs the harness
never opens, so nothing measures them and nothing ever has.

**The deletion this invites is a reasonable-looking one.** A reader who finds the same two
declarations in two sheets, checks that the tests stay green, and removes the "duplicate" from
`shell.css` has done what the evidence in front of them supports. Five fields silently revert to
native-drawn, the defect WO-2.23 fixed comes back on three screens, and the tree is green. The
duplicate is the *safe* copy to keep — `shell.css` may not name a class another sheet owns, so the
shared rule cannot mention `.assign-field-date`, which means the copy in `assignments.css` is the one
that cannot be the survivor.

**Why this is not the check WO-2.23's Traps forbid, and the distinction is the whole work order.**
That ban is on a **height** check: Chrome under an emulated coarse pointer honours `min-height` on a
date input either way, so a check written for the *defect* passes on the broken tree and tells the
next reader a rule is guarded when it is not. A **computed `appearance`** check is a different claim
and fails cleanly — no rule, `appearance: auto`, red. The harness already makes exactly this
assertion for WO-3.17 on `.assign-field-date`; this extends the assertion it has to the fields it
cannot currently see. **Say this in the check's own message**, because the next reader will arrive
holding the Trap and needs to know why this one is allowed.

**Deliverables**
- **`verify-shell.mjs` asserts computed `appearance: none` on a `.term-date` in the term editor, on a
  `.term-date` in the days-off form, and on the student editor's `.student-date`** — the three
  surfaces that today depend on the shared rule alone. This means opening those dialogs in the
  harness, which nothing does yet.
- **Deleting the BASE rule turns the run red.** Prove it by deleting it, running, and restoring —
  and record the observed failure text in the work order's result, because a guard nobody has watched
  fail is a guard nobody has tested.
- **The check's message states what it does and does not cover**: the reset's presence in the
  cascade, never the rendered height, which is device-only and stays 👤 forever.
- **`TESTING.md` § WO-2.23's "why no check was booked" note gains a pointer to this work order**, so
  the two read as one decision rather than as a reversal. That note stays true — no check was booked
  *for the defect*, and this one is not that.

**Out of scope** — any height or touch-target assertion on a date field (that is the forbidden check,
and `@media (pointer: coarse)` measurement is WO-2.21's ground); any change to the reset itself or to
`.assign-field-date`'s deliberate duplicate; and any change to what the two harnesses print or how
they count, which is WO-2.19's and WO-2.22's.

**Acceptance**
- [ ] `node tools/verify-shell.mjs` asserts computed `appearance` on all three surfaces named above,
      and the run is green on the tree as it stands.
- [ ] With `input[type="date"]` deleted from `src/shell.css`'s BASE section, the run **fails**, and
      the failure names which field and which sheet. The result file quotes the failure text.
- [ ] The check's message distinguishes itself from the height check WO-2.23's Traps forbid, in its
      own words rather than by reference.
- [ ] `tools/README.md`'s check count and `TESTING.md` are updated from a run rather than by
      arithmetic, per WO-2.19.
- [ ] `node tools/wo-sweep.mjs` prints what it printed before, but for the check count.

**Traps** — **The dialogs are not on screen at rest.** WO-2.21 is the scar: the 44px sweep was
measuring a screen that was not the one on screen. Open the dialog, assert the element is actually
rendered, and do not let a `display: none` node answer the question — a computed `appearance` read
off a hidden node is the same class of lie. **And do not fold in the height.** It will be tempting,
because the harness will finally have these fields open in front of it. The height on desktop Chrome
says nothing about the height on iOS, which is the entire reason WO-2.23 exists.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/assignments.css`
  - `src/shell.css`
  - `tools/README.md`
  - `tools/verify-shell.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**Read the model before you write the extension.** `tools/verify-shell.mjs` **already makes exactly
the assertion you are being asked to extend** — do not invent a second idiom for it:

- **The existing computed-`appearance` check is at `tools/verify-shell.mjs:13792`**, with its
  reasoning in the block comment starting near **line 13440** (read from ~13453, *"WHAT THE DESK CAN
  AND CANNOT SEE"*). That comment already draws your distinction for the assignment editor: the
  reset check is *"the closest a laptop gets to the mechanism — it says the declaration is live on
  the right element, not that iOS obeys it,"* and it exists *"so that a later 'tidy' of that one
  line goes red somewhere rather than nowhere."* That is the same argument your three new checks
  make; the geometry read it hangs off is at ~13546–13567. Match the house voice, but write your
  message in **your own words** — Acceptance line 3 grades exactly that, and *"see line 13792"*
  fails it.

**All three dialogs are already driven somewhere in this harness — find the existing opener rather
than writing a fourth way in:**

- **Term editor** — `#termList .term-date` is already read at `tools/verify-shell.mjs:2471`, and
  again around 2496–2565. The dialog is already open at that point in the run.
- **Days-off form** — driven from ~`tools/verify-shell.mjs:9610–9645`; the two date fields are
  `#daysOffFrom` and `#daysOffTo` (set by value at ~9625), and the modal is `#daysOffModal`, tested
  open/shut via `classList.contains('hidden')`.
- **Student editor plan panel** — the *Review date* is `supportsReviewDate`; the panel is opened and
  shut repeatedly around `tools/verify-shell.mjs:5142–5316`, which is also where the existing code
  shows you how it asserts a panel is genuinely *shown* (`hidden === false`, `expanded === 'true'`)
  rather than merely present. **That assertion pattern is the answer to this work order's first
  Trap** — reuse it, do not approximate it.

**Where the rule under guard lives:** `src/shell.css:59–78` is the BASE-section comment naming all
seven fields and all three classes; the coarse-block counterparts are at `src/shell.css:1293` and
`1425`. The deliberate duplicate you must **not** touch is `src/assignments.css:241–255`, whose own
comment explains why it exists and why copying it onto `.term-date` was rejected — read it, because
it is the other half of the argument your check's message has to be consistent with.

**On the student editor specifically:** you are reading a computed style off a date input on the
plan panel. That is fine. Reading, logging, or printing the *value* in that field is not — no check
message, no failure detail, and no console line may emit plan, medical, or accommodation data. Note
that the harness's existing student-editor checks around 5145 and 5274 deliberately assert on those
fields' *emptiness/presence*, not their content; stay on that side of the line.

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

## 5. Done means these 5 lines, reported against one by one

1. `node tools/verify-shell.mjs` asserts computed `appearance` on all three surfaces named above, and the run is green on the tree as it stands.
2. With `input[type="date"]` deleted from `src/shell.css`'s BASE section, the run **fails**, and the failure names which field and which sheet. The result file quotes the failure text.
3. The check's message distinguishes itself from the height check WO-2.23's Traps forbid, in its own words rather than by reference.
4. `tools/README.md`'s check count and `TESTING.md` are updated from a run rather than by arithmetic, per WO-2.19.
5. `node tools/wo-sweep.mjs` prints what it printed before, but for the check count.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

