# WO-5.3 — Send flow · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-5-outreach.md`
**Report to** `.claude/dispatch/WO-5.3-result.md` — as your last act, and return it in-band too.

**Routing.** Claude at **Opus** tier, on this work order's own merits: it touches a named sensitive
surface (`src/merge-fields.js`'s `blocked` contract, the accommodation fence, and an audience picker
sitting one field away from `supports.caseManager`) and it produces teacher-facing prose — the
truncation warning and the honest statement of what `mailto:` cannot confirm. `ROUTING.md`
§ "Later phases, at a glance" independently names all of Phase 5 Claude-only as a property of the
work. Set aside: the percent-encoding half of the Traps is mechanically checkable and genuinely
Codex-shaped, but it cannot be severed from the surface it serves, and the harness runs this
Acceptance demands (~4.4 min each) leave no room under the 20-minute runner cap anyway.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-5.3 — Send flow

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-28 · **Size** M · **Depends on** WO-5.2
**Closes roadmap** Phase 5 → "Audience picker", "Copy to self", "`mailto:` handoff", "Editable
before sending."

**Why it exists.** `mailto:` instead of a mail scope is an architectural commitment, not a
shortcut: a mail scope reads "Send email as you" on the consent screen, and the teacher's own sent-
mail record — which is what a school asks for when it asks — stays intact this way.

**Deliverables**
- Audience picker: guardian 1 / guardian 2 / counselor / admin, reading contacts already on the
  roster from WO-1.7.
- **Copy to self, on by default**, using the teacher email from settings.
- `mailto:` handoff opening the teacher's own client with subject and body populated.
- **Editable before sending. Always.** A generated message going out unread is the failure mode that
  ends trust in the feature.
- Entry points from the signal card and from the student record.

**Out of scope** — sending mail ourselves, in any form, ever. No SMTP, no API, no scope.

**Acceptance**
- [ ] The draft opens in the default mail client on desktop and on iPad with subject and body intact.
- [ ] A long body survives the handoff, or the app warns before truncation. *(`mailto:` length
      limits are real and client-specific — find the practical ceiling and document it.)*
- [ ] Copy-to-self is on by default and lands in the teacher's sent folder after sending.
- [ ] Every draft is editable in-app before handoff.
- [ ] No Google scope is requested anywhere in this flow.
- [ ] A blocked draft (unresolved field) cannot reach the handoff.
- [ ] A concern template and a praise template written for the same audience are offered
      **separately** in the picker — read through `templatesFor(doc, tone, audience)` with both
      arguments, never audience alone. *(**This line is WO-5.2's first Acceptance line finishing
      here, and it is not a re-homed box** — no `**Owes**` pointer, because nothing was moved and
      that box closed honestly. It reads "…and are offered separately **at send time**," and at send
      time there was no send flow: what WO-5.2 could close is that the collection holds the pair and
      hands them back apart, which its harness proves on four numbers including a `concern/admin` → 0
      that a tone-only filter would pass. The other half had no owner — none of the five lines above
      re-asks it — so it was booked here by WO-5.2's verifier on 2026-08-28 rather than left to the
      reader who eventually notices the picker offering one template for two tones.)*

**Traps** — Line breaks and non-ASCII characters in `mailto:` bodies need correct percent-encoding,
and getting it wrong produces a mangled email a teacher sends without noticing. Test with an
apostrophe, an em dash, and a multi-paragraph body.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- **`src/templates.js`** — the model WO-5.2 built for you. `templatesFor(doc, tone, audience)` is
  the picker's read and the seventh Acceptance line names it by signature: **call it with both
  arguments**, never audience alone. `AUDIENCES`, `TONES`, `audienceLabel()` are there too. Read its
  file header — it says in as many words that it is a module rather than part of the editor
  *because this work order has to ask what is on offer while standing on the signal card*.
- **`src/merge-fields.js`** — `resolveDraft(request)` returns `{ subject, body, errors, blocked }`.
  Its header states the division: **`blocked` is that module's whole say in the send; you own the
  button.** Do not re-derive the rule, do not add a second resolver, and do not index anything by a
  token.
- **`src/templates-view.js`** and **`src/templates.css`** — the screen and sheet WO-5.2 shipped, and
  the convention yours copies. `src/shell.css` § UNRESOLVED is the block strip / `.mf-token`
  styling, written for two surfaces: WO-5.2's live preview and **your send flow**. Lift it, don't
  re-cut it.
- **`design/mockups/outreach.html`** + **`design/mockups/proposed-phase5.css`** — the drawing.
  Note what it says at line ~13 and ~515: it draws WO-5.2 and stops, and it hands you the block
  strip's reasoning (*a failure that appears only on failure is an error banner; one always present
  is a report*). A drawing is not a work order — where it is silent, decide and say why at the
  point of departure.
- **`src/signals-view.js` `cardActions()`** (~line 1078) — your first entry point, already drawn as
  a **disabled** `Draft an email` button with `title = 'Outreach arrives with Phase 5.'`. The
  comment above it and `index.html` (~line 2540) both say the door was built so the card's shape
  would not have to change. Open it; do not redraw the card.
- **`src/detail.js`** — the student record, your second entry point.
- **`src/teacher.js`** — `teacher.email`, `teacher.adminEmail`, `teacher.defaultCc`. Read its header
  before you design copy-to-self: it already argues the `mailto:`-over-scope position and why the
  default matters.
- **`docs/data-model.md`** — § The document for `students[].guardians[]` (an **array**),
  `students[].counselor {name,email}`, `teacher.adminEmail`; § the merge-field table at ~line 625.

---

## 2b. Six traps specific to this one

1. **The counselor is `students[].counselor`, NOT `supports.caseManager`.** They are two different
   people in this schema and one of them is on the accommodation fence. An audience picker that
   reaches into `supports` for an email address is the disclosure this project exists to prevent.
2. **"Guardian 1 / guardian 2" is four picker options over four *audiences*, and they are not the
   same list.** `guardians[]` is an array; `AUDIENCES` has one `guardian` value. Decide how a
   recipient choice maps onto the `audience` a template is filed under, and write the ruling down
   where you make it. Do not widen `AUDIENCES`.
3. **You do not write the contact log.** `src/merge-fields.js` line ~130 says WO-5.3 writes a
   `contact` entry — that line is **stale**, and WO-5.4's Deliverables own it explicitly
   ("On handoff, append to `log[]`…", plus the `ruleId` the cooldown keys on). Stay inside your
   **Out of scope**. If you believe the boundary is wrong, say so in your result as a proposed
   follow-up; do not act on it.
4. **`mailto:` length has no single answer, and the Acceptance asks you to find and document the
   practical ceiling** — it is client- and OS-specific. Measure what you can, state what you
   reasoned, and put the number somewhere a later reader finds it. A warning before truncation is
   the deliverable; silent truncation is the failure.
5. **Encoding: `encodeURIComponent`, and prove it.** Test with an apostrophe, an em dash, and a
   multi-paragraph body — the work order names all three. `
` vs `
` in a `mailto:` body is
   the part that goes wrong quietly.
6. **A blocked draft cannot reach the handoff** — read `blocked` off `resolveDraft()`, one call,
   and let the disabled control and the strip say the same thing the preview already says.

**Presentation mode.** WO-5.2 ruled that the mode suppresses **one column** on the templates screen
rather than closing it, because the editor names nobody and the preview names a child. Your flow
names a child throughout. Decide what the mode does here, apply the existing rule rather than
inventing a third, and argue it at your own point of departure.

**Prove the claims worth mutating.** For each structural claim you add to `tools/wo-sweep.mjs` or a
new `tools/verify/*.mjs`, break the thing on purpose, watch the check go red, and put it back — a
mutation reasoned about is not a mutation proved. **Revert every mutation before you write anything
else**, and `grep -rn MUTATION` over your own files as your last act before reporting. If you add
checks, `tools/README.md` records the count and a stale number turns the sweep red.

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

## 5. Done means these 7 lines, reported against one by one

1. The draft opens in the default mail client on desktop and on iPad with subject and body intact.
2. A long body survives the handoff, or the app warns before truncation. *(`mailto:` length limits are real and client-specific — find the practical ceiling and document it.)*
3. Copy-to-self is on by default and lands in the teacher's sent folder after sending.
4. Every draft is editable in-app before handoff.
5. No Google scope is requested anywhere in this flow.
6. A blocked draft (unresolved field) cannot reach the handoff.
7. A concern template and a praise template written for the same audience are offered **separately** in the picker — read through `templatesFor(doc, tone, audience)` with both arguments, never audience alone. *(**This line is WO-5.2's first Acceptance line finishing here, and it is not a re-homed box** — no `**Owes**` pointer, because nothing was moved and that box closed honestly. It reads "…and are offered separately **at send time**," and at send time there was no send flow: what WO-5.2 could close is that the collection holds the pair and hands them back apart, which its harness proves on four numbers including a `concern/admin` → 0 that a tone-only filter would pass. The other half had no owner — none of the five lines above re-asks it — so it was booked here by WO-5.2's verifier on 2026-08-28 rather than left to the reader who eventually notices the picker offering one template for two tones.)*

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

