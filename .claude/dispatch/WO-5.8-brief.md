# WO-5.8 — Several recipients, and one of them is primary · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-5-outreach.md`
**Report to** `.claude/dispatch/WO-5.8-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude **Opus**, on the work order's own merits. The deciding signal is
`ROUTING.md` § "Route to Claude" — the merge-field resolver is a named sensitive surface and this
row decides *what the primary is*, i.e. what `{{guardian.name}}` resolves against; § "Later phases"
also puts all of Phase 5 in the Claude column as a property of the work. The runner-up I set aside:
WO-5.14 already settled the header ruling and the state change is mechanically checkable, which is
the closest this comes to Codex — but Acceptance line 4 asks you to *decide* between choose-then-
block and genuinely unchoosable and rewrite a harness assertion accordingly, and that is judgment,
not spec-matching.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-5.8 — Several recipients, and one of them is primary

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-20 · **Size** M · **Depends on** WO-5.13, WO-5.14, WO-5.6

*(**Cut in four on 2026-09-20, the owner's call, before it was ever dispatched** — it was the last
`Size L` row in the directory, and one L is roughly a whole five-hour window against session-limit
deaths that cluster at 16–20M weighted units. The precedent is WO-6.4's cut of 2026-09-15
(`1bc04e0`): cut along the row's own deliverable seams before `--start`, and let `--start` of each
piece be the "is there a window" check. Three rows came out of it, and* **this row keeps its id, its
place in the running order and the picker** *— which is what keeps* [WO-8.13](phase-8-packaging.md#wo-813--the-about-modal-names-two-documents-and-not-the-licence)*'s
🎒 shelf resolving, since that cell names row 41 as the sitting that opens `index.html`.*
**Size dropped L → M.** *What went where:*
[WO-5.13](#wo-513--every-template-whatever-the-recipient) *took the audience-filter reversal —
Acceptance lines 3 and 7, and the* ⚠ *block that used to stand here —* **because it is independent
of multi-select and must land first**: *a filter that needs one audience cannot survive a draft that
has no single one.* [WO-5.14](#wo-514--the-compose-doors-take-a-list-and-which-header-the-others-ride-in)
*took the first half of line 4 and* **the argument this row said it owed** *— which header the
non-primary recipients ride in — because that is a ruling best made in the pure module before the
picker exists, rather than at the point in a build where the budget is thinnest.*
[WO-5.15](#wo-515--one-contact-several-audiences) *was booked out of the reading rather than out of
the Deliverables below, which never mentioned it: `writeContact({ audience })` is a scalar enum with
three readers, and a draft to two guardians and the counselor has no single value for it.*
**Expect the four pieces to cost more in total than one clean L** *— a verifier cold start and an
orchestrator each. The trade is blast radius, not efficiency.)*

**Why it exists.** One message often goes to more than one person — both guardians, or a guardian
and the counselor — and today that is one draft written twice. The owner, 2026-08-29: *"You should
be able to select more than one 'recipient' and all templates should be available regardless of
recipient. One should be 'primary.'"*

**The reversal this row used to carry is WO-5.13's now.** The ⚠ block arguing it stood here until
the cut; it is reproduced in full under [WO-5.13](#wo-513--every-template-whatever-the-recipient),
which is also where `TESTING.md` § WO-5.2 and § WO-5.3 are amended. **This row depends on it**, so
by the time the picker is built every template is already offered whatever the recipient is, and
`{{guardian.name}}` resolving against *somebody* is the only half of that argument left here —
which is what `primary` is for.

**Deliverables**
- Several recipients selectable at once from the list WO-5.3 already builds, with one marked
  **primary**.
- The primary is who the merge fields resolve against and who the message is addressed to; the rest
  ride as additional recipients, **in the header WO-5.14 ruled on**. *(That ruling was this row's to
  make until the cut. It is not re-opened here — read it, and build to it.)*
- The picker's own state: `recipientKey` is one string today (`src/outreach-view.js:312`) and every
  consumer downstream assumes one. It becomes a selection plus a primary.

**Acceptance**
- [ ] Two guardians and a counselor can be chosen for one draft, with exactly one primary at all
      times, and the primary changeable without losing the selection.
- [ ] `{{guardian.name}}` and every other merge field resolve against the primary, and the draft
      says who that is.
- [ ] Every chosen recipient reaches the compose URL, in the header WO-5.14 ruled on, and
      copy-to-self behaves as WO-5.3 proved. *(The second half of the line that read "The `mailto:`
      URL carries every chosen recipient" until the cut; the builders' half went to WO-5.14.)*
- [ ] A recipient with no address on file cannot be chosen, and says why — WO-5.3's rule, unchanged.
- [ ] Changing the recipients obeys WO-5.6's confirm rather than a second rule of its own.

**Traps** — The accommodation fence does not move: the picker still reads `students[].counselor` and
never `supports.caseManager`, and `AUDIENCES` is not widened to make a recipient list work.

**And one thing the fourth Acceptance line hides.** Today an addressless recipient is **choosable
and then blocked**, not unchoosable — `src/outreach.js:112-117` argues for that deliberately, and
the ban lands as a `reasons` entry of `kind: 'recipient'` (`src/outreach-view.js:488-496`) which
drives `ready = false`. **The harness clicks the addressless chip and asserts the block**
(`tools/verify/outreach.mjs:873`), and `phase-1-shell-store-roster.md:3619-3621` treats
choose-then-block as the rule this row leaves standing. If multi-select makes it genuinely
unchoosable, that `.click()` becomes a no-op and the check must be **rewritten, not re-asserted**.
Decide which, and say so at the point of departure.

Second: `tools/verify/outreach.mjs:356-366` asserts `recipients.length === 5` and five exact
`key:label:has|none` strings **in order**, plus `chips.length === 5`. Any change to row shape or
ordering breaks it positionally rather than by meaning.

Third: `model.recipients[].has` (`src/outreach-view.js:560`) is already in the model and read by
nothing in `src/` — only the harness reads it. It is the hook a disable would use, already there.

Fourth: WO-5.6's confirm is reached through `askBeforeRebuild()` (`src/outreach-view.js:1174-1201`),
and its lead sentence uses the chip's **position** and never the person (`:1244-1252`). That
survives a multi-select; check it rather than assume it.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/outreach-view.js`
  - `src/outreach.js`
  - `tools/verify/outreach.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Also open, because this row was cut out of a larger one three days ago and its siblings already
landed the rulings it must consume:

- **`plans/work-orders/phase-5-outreach.md` § WO-5.14** — ✅ DONE 2026-09-20. It already made the
  ruling your Deliverables say you must build to: the non-primary recipients ride in **Cc**, no
  Bcc, argued at `src/outreach.js` § "which header the non-primary recipients ride in", directly
  above `mailtoUrl()`. `draft.to` and `draft.cc` are **already lists** at all three builders
  (`mailtoUrl()`, `composeUrl()`, `draftText()`) and are **refused as strings**. Do not re-open the
  ruling, do not re-derive it, and do not make the builders accept a bare string again — the view
  makes the list in one place, and that place is what you are changing.
- **`plans/work-orders/phase-5-outreach.md` § WO-5.13** — ✅ DONE 2026-09-20. The audience filter
  is already gone: all four send-flow call sites pass `''`. `model.audience` **stays** and still
  feeds `writeContact()`. Do not restore the filter and do not delete `audienceOf()` —
  `wo-sweep.mjs` § 24 pins it by name.
- **`plans/work-orders/phase-5-outreach.md` § WO-5.6** — the confirm your fifth Acceptance line
  must obey, reached through `askBeforeRebuild()` (`src/outreach-view.js:1174-1201`).
- **`plans/work-orders/phase-5-outreach.md` § WO-5.15** — ⬜, **not yours**. `writeContact({
  audience })` is a scalar enum and a draft to two guardians plus the counselor has no single value
  for it. That is booked as its own row. When you hit it, leave today's behaviour standing and say
  so at the point of departure; do not widen this work order to fix it.
- **`TESTING.md`** — the § WO-5.3, § WO-5.13 and § WO-5.14 entries, for the prose shape your own
  entry should match.

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

## 5. Done means these 5 lines, reported against one by one

1. Two guardians and a counselor can be chosen for one draft, with exactly one primary at all times, and the primary changeable without losing the selection.
2. `{{guardian.name}}` and every other merge field resolve against the primary, and the draft says who that is.
3. Every chosen recipient reaches the compose URL, in the header WO-5.14 ruled on, and copy-to-self behaves as WO-5.3 proved. *(The second half of the line that read "The `mailto:` URL carries every chosen recipient" until the cut; the builders' half went to WO-5.14.)*
4. A recipient with no address on file cannot be chosen, and says why — WO-5.3's rule, unchanged.
5. Changing the recipients obeys WO-5.6's confirm rather than a second rule of its own.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

