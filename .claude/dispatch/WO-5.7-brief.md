# WO-5.7 — Copy the draft to the clipboard · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-5-outreach.md`
**Report to** `.claude/dispatch/WO-5.7-result.md` — as your last act, and return it in-band too.

**Routed to Claude (Opus), not Codex.** The deciding signal is `plans/work-orders/ROUTING.md`
§ "Later phases, at a glance" — all of Phase 5 is Claude-only as a property of the work — reinforced
by Acceptance line 2, which puts presentation-mode suppression in scope, and that is a sensitive
surface this pipeline never delegates. The runner-up I set aside: Size S with four mechanically
checkable Acceptance lines reads Codex-shaped on the surface, but the sensitive surface is absolute
and the Traps line asks for a judgment call about departing from a repo convention, not a mechanical
check.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-5.7 — Copy the draft to the clipboard

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-12 · **Size** S · **Depends on** WO-5.3

**Why it exists.** `mailto:` opens the machine's **default** mail client, and a teacher whose real
mail is Gmail in a browser tab has no default worth opening. She can see a finished draft on screen
and no way to get it into the window where she actually writes email. The owner, 2026-08-29: *"A
'copy' button would be helpful… so someone using GMail could move it there since the button doesn't
open gmail."*

**It is not a workaround for a missing feature — it is the second honest door.** Sending as the
teacher would need a mail scope, which the architecture forbids for a reason that has not changed:
the consent screen reads "Send email as you." Between "open your desktop client" and "grant us your
mailbox" there is a third option costing no permission at all, which is to hand her the text.
*(Whether the app ever sends mail itself is a* **v2.0** *question, and the owner named it as one on
that day rather than leaving it implied.)*

**Deliverables**
- A control beside the handoff link that copies the recipient line, the subject and the body as one
  block of plain text, in a shape that pastes usefully into a compose window.
- It is subject to the same gate as the handoff: a blocked draft copies nothing, for the same reason
  it cannot be sent, and a projected screen copies nothing at all.
- It says it worked. A copy button that looks identical before and after is a button people press
  four times.

**Acceptance**
- [ ] The copied text carries the recipient, the subject and the body, and pastes into a compose
      window as readable text with its paragraph breaks intact.
- [ ] A blocked draft cannot be copied, and presentation mode disables the control with the rest of
      the flow.
- [ ] The teacher is told the copy happened, through `announce()` as well as on screen.
- [ ] Copying writes nothing to the document.
- [ ] The control clears 44px under a coarse pointer at 390px.

**Traps** — `navigator.clipboard` needs a secure context and is refused without a user gesture. The
app is HTTPS everywhere so the first half is satisfied, but a copy fired from anything other than
the tap itself fails on iOS. Do not fall back to a hidden `<textarea>` and `execCommand` without
saying so at the point of departure — it is deprecated, and this repo has no polyfills.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `src/outreach-view.js` — the screen you are adding to. Read its **file header** and the block at
  `#outreachOpen` (~line 101) before anything else: the handoff is an `<a href="mailto:…">` rather
  than a button **on purpose**, and a blocked draft is refused **structurally** by having no `href`
  at all. Your control is a `<button>` and cannot inherit that mechanism, so decide — and say at the
  point of departure — what the structural equivalent is for a button that must not fire.
- `src/outreach.js` — the model half. `mailtoUrl(draft)` already serialises the same four fields;
  read what it does with addresses and line endings before inventing a second serialiser. The module
  writes nothing to the document and says so; keep that true of whatever you add.
- `tools/verify/outreach.mjs` and `tools/verify/contact-log.mjs` — where this work order's harness
  section belongs. Do not write a third harness.
- `TESTING.md` § WO-5.3 — the manual shape this flow is already tested in.

**Three things this work order will not guess.**

1. **CRLF.** WO-5.3's mutation round found a deleted CRLF normalisation that produced a mangled
   paragraph in a real compose window and was invisible on screen. Acceptance line 1 says
   "paragraph breaks intact", and that is the trap it is pointing at. Whatever you decide, prove it
   rather than reason about it.
2. **The gesture.** `navigator.clipboard.write*` must be called from inside the tap's own handler —
   not after an `await`, not from a rebuild, not from a `setTimeout`. A copy that works on the
   laptop and fails silently on the iPad is the default outcome here.
3. **The `execCommand` fallback is a decision, not a detail.** The Traps line does not forbid it; it
   forbids adding it *silently*. If you add one, argue it at the point of departure and name that
   this repo has no polyfills. If you do not, say what a browser without the API gets instead.

**Acceptance line 4 — "copying writes nothing to the document" — is the one to mutation-prove.**
The module boundary that makes it true is the thing to assert, in the style `wo-sweep.mjs` § 17 uses
for `src/calendar-derived.js`: a grep that proves there is nothing in the file that *could* write, not
a fixture that proves today's path did not. Check whether that fits before assuming it does.

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

1. The copied text carries the recipient, the subject and the body, and pastes into a compose window as readable text with its paragraph breaks intact.
2. A blocked draft cannot be copied, and presentation mode disables the control with the rest of the flow.
3. The teacher is told the copy happened, through `announce()` as well as on screen.
4. Copying writes nothing to the document.
5. The control clears 44px under a coarse pointer at 390px.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

