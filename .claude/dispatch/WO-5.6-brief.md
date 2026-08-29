# WO-5.6 — A draft survives a change of mind · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-5-outreach.md`
**Report to** `.claude/dispatch/WO-5.6-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude, Opus. `ROUTING.md` names all of Phase 5 Claude-only as a property of
the work, and this flow stands on two sensitive surfaces at once — the merge-field resolver it calls
and the presentation-mode refusal it lives behind. The runner-up I set aside: at size S with
mechanically checkable Acceptance lines this reads Codex-shaped on four of the five bullets, but the
sensitive-surface bullet in the Claude column is absolute and does not trade against size, so no
Codex probe was run.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-5.6 — A draft survives a change of mind

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-29 · **Size** S · **Depends on** WO-5.3

**Why it exists.** Changing the template, the tone or the recipient rebuilds the draft from
`resolveDraft()` and **throws away whatever the teacher had typed**, with no warning and no undo.
WO-5.3 chose to re-resolve on those three changes deliberately — the alternative was a flow that
re-resolved on every keystroke and overwrote her edits continuously, which is worse — but it never
asked what should happen to work already done. The owner found the answer the expensive way on
2026-08-29: *"Don't blank the template automatically on changing anything — put a confirm button up
so work isn't lost."*

**This is the smallest of the four and the one worth doing first.** The other three add capability;
this one stops the app destroying something a teacher wrote.

**Deliverables**
- A change to template, tone or recipient that would discard **edited** text asks first, names what
  it is about to do, and does nothing until the teacher says so.
- An **unedited** draft rebuilds silently, as it does today. A confirm on every tap of a tone pill
  while nothing has been typed is a dialog that teaches people to dismiss dialogs.
- So the flow has to know whether the draft has been touched since it was resolved — a comparison
  against the resolved text, not a keystroke flag, so that typing a word and deleting it again
  leaves the draft unedited.

**Acceptance**
- [ ] Typing in the body, then changing the template, asks before rebuilding; cancelling leaves the
      typed text exactly as it was.
- [ ] Confirming rebuilds the draft from the new template, as today.
- [ ] An untouched draft rebuilds with no prompt at all, on all three controls.
- [ ] Typing a character and removing it again counts as untouched.
- [ ] The document is not written at any point — this flow still holds `rev` still, per WO-5.3.

**Traps** — The subject and the body are two boxes and either can be edited; a confirm that watches
only the body loses a rewritten subject silently, which is the same bug one field further along.
**Build this before WO-5.8**: several recipients change what "changing the recipient" means, and
that work order extends this rule rather than inventing a second one.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

### The files this lands in

- **`src/outreach-view.js`** is where all of it happens. Its header (lines 1–95) is the argument you
  are extending, not background — § "THE DRAFT IS RESOLVED ONCE PER CHOICE, AND EDITED FROM THERE"
  is the ruling WO-5.3 made and this work order completes. Read it before you write.
- The three doors are `setOutreachTone()`, `setOutreachRecipient()` and `setOutreachTemplate()`
  (all near the foot of the file). Each already calls `buildDraft()` and then sets a `status` line
  ending *"Anything you had typed is gone."* Today that sentence is honest reporting of a loss; when
  you are done it should only ever describe a rebuild the teacher agreed to or one that cost her
  nothing. Fix the wording in all three or in none.
- `buildDraft()` is the one resolve, and its comment says so. It is the natural place to record what
  was resolved — the comparison the third Deliverable asks for needs a snapshot taken there.
- `editOutreachField()` writes `draft.subject` / `draft.body` and nothing else. That is your other
  end of the comparison.
- The close path near line 600 resets `subject`, `tone`, `recipientKey`, `templateId`, `draft`,
  `errors`, `built`, `status`. Anything you add to module state resets there too — a stale snapshot
  surviving a close makes the next student's untouched draft look edited.

### The convention for the ask

This app does not use `window.confirm()`. `src/classes.js` § "delete, and what it costs" carries the
argument in as many words: *"OK to delete Period 3?" is a question a tired teacher answers yes to*,
so a real dialog that names what it destroys is the pattern. `src/templates-view.js` (≈ line 884)
already names this exact defect as one it declined to ship. Match the app's existing modal
plumbing — `openModal` / `closeModal` from `src/modal.js` — rather than inventing a second kind of
dialog. Whatever you draw takes the 44px coarse-pointer floor and gets a focus path back.

### Traps beyond the work order's own

- **Both boxes, not one.** The work order says it; the failure is quiet, so restate it in the code.
  A subject rewritten and a body untouched is an edited draft.
- **The unedited case has to stay silent on all three controls**, including a tone tap that changes
  which templates are on offer and therefore which template is selected. That reselection is a
  rebuild too — do not let it slip past the check in one direction or trip it in the other.
- **A cancel must leave *everything* as it was**, not just the text: the tone pill, the recipient and
  the template select must all still read what they read before the tap, or the screen and the draft
  disagree about which template the body came from. The three setters currently mutate module state
  *before* calling `buildDraft()`.
- **No write to the document, at any point** — Acceptance line 5, and WO-5.3 proved it. If you assert
  it in the harness, note that `update()` only *schedules* a save and `rev` advances ~800ms later;
  WO-5.3's own check had a blind spot there and now awaits `flush()`.
- **Presentation mode draws no form at all**, so there is no draft to protect and nothing new to
  suppress. Neither new sentence may name a student.
- `tools/verify/outreach.mjs` already exists (934 lines) — extend it, do not start a second file.

### Scope

Deliverables and Acceptance only. Several recipients is WO-5.8 and it extends this rule; leave room
for it, build none of it. If the right thing is outside the Deliverables, say so in your result file
as a proposed follow-up.

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

1. Typing in the body, then changing the template, asks before rebuilding; cancelling leaves the typed text exactly as it was.
2. Confirming rebuilds the draft from the new template, as today.
3. An untouched draft rebuilds with no prompt at all, on all three controls.
4. Typing a character and removing it again counts as untouched.
5. The document is not written at any point — this flow still holds `rev` still, per WO-5.3.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

