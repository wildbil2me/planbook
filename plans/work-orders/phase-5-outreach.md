# Phase 5 work orders — Outreach

**Phase goal:** from "this student needs a conversation" to a sent message, without leaving the app
or granting a mail scope.

Branch: `phase/5-outreach`. After Phase 4, because **a draft is worthless if the list of who to
write to is wrong.**

Merge fields are specified in [`../../docs/data-model.md`](../../docs/data-model.md) § Outreach
templates. Two rules dominate this phase, and both are about what must never leave the app:

- **No merge field ever resolves accommodation, medical, or plan data.**
- **An unresolved merge field never renders blank.**

---

## WO-5.1 — Merge-field resolver

**Ship** — · **Status** ⬜ NOT STARTED · **Size** M · **Depends on** WO-3.4, WO-4.1
**Closes roadmap** Phase 5 → "An unresolved merge field never renders blank" and "No merge field
ever resolves accommodation, medical, or plan data."

**Why it exists.** A template system makes an IEP disclosure a one-keystroke mistake unless it is
impossible by construction. An email to an administrator that happens to quote a 504 plan is a
disclosure incident. And separately: "Dear ," going home is worse than sending nothing.

**Deliverables**
- Resolver over one student at send time, supporting exactly the documented fields:

  | Field | Resolves to |
  |---|---|
  | `{{student.first}}` `{{student.last}}` `{{student.nickname}}` | Name parts |
  | `{{guardian.name}}` | The recipient guardian |
  | `{{class.name}}` `{{teacher.name}}` | Context |
  | `{{grade.percent}}` `{{grade.letter}}` | Current weighted grade |
  | `{{grade.delta}}` | Change over the signal's window — the praise workhorse |
  | `{{missing.count}}` `{{missing.list}}` | Missing work |
  | `{{attendance.percent}}` `{{attendance.absences}}` `{{attendance.tardies}}` | Term totals |
  | `{{signals.list}}` | Why this student surfaced, in plain sentences |
  | `{{behavior.recent}}` | Recent behavior log entries |

- **A refusal list, enforced at the resolver, not at the template editor.** Any path reaching
  `supports`, `medical`, `behaviorPlan`, `plan`, `caseManager`, or `reviewDate` is refused — it does
  not render, and it raises a named error. `{{signals.list}}` and `{{behavior.recent}}` are
  explicitly filtered too, since either could otherwise carry a plan reference through.
- Unresolved fields render **visibly intact** (`{{guardian.name}}` stays on screen) and block the
  send with a named error saying which field and which student.
- Numbers come from WO-3.4 and WO-2.4, never recomputed here — two grade implementations will
  disagree eventually, and the email is the copy that's wrong.

**Acceptance**
- [ ] A template containing `{{supports.accommodations}}` (or any refused path) refuses with a named
      error and renders nothing sensitive. Verify every path in the refusal list individually.
- [ ] `{{signals.list}}` for a student with an accommodation-derived signal emits no plan reference.
- [ ] A student with no guardian on file blocks the send naming the missing field; the draft is not
      sendable in that state.
- [ ] `{{grade.percent}}` matches the gradebook exactly for the same student and term.
- [ ] `{{grade.delta}}` matches the delta shown on the praise signal that produced the draft.
- [ ] An unknown field name is refused, not silently blanked.

**Traps** — Whitelist the resolvable paths; do not blacklist the forbidden ones. A blacklist fails
open the moment someone adds a field to the data model.

---

## WO-5.2 — Templates

**Ship** — · **Status** ⬜ NOT STARTED · **Size** M · **Depends on** WO-5.1
**Closes roadmap** Phase 5 → "Templates with merge fields" and "Separate concern and praise
templates."

**Why it exists.** A good praise message reads nothing like a good concern message — same length,
opposite structure. One template set that tries to be both produces a praise email that sounds like
a warning.

**Deliverables**
- `templates[]` per the data model: `{ id, name, audience, tone, subject, body }` with
  `tone: "concern" | "praise"` and `audience: guardian | counselor | admin | student`.
- Editor with a live preview resolved against a chosen real student, so a broken field is caught at
  authoring time rather than at send time.
- A field palette listing exactly what's resolvable — which doubles as documentation of the refusal
  list, by omission.
- Starter templates for both tones and each audience, written in the suite's voice: friendly-
  utilitarian, sentence case.

**Acceptance**
- [ ] A concern template and a praise template can exist for the same audience and are offered
      separately at send time.
- [ ] The live preview shows unresolved fields visibly, exactly as the send flow will.
- [ ] The field palette contains no refused path.
- [ ] Templates survive a backup round-trip.

---

## WO-5.3 — Send flow

**Ship** — · **Status** ⬜ NOT STARTED · **Size** M · **Depends on** WO-5.2
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

**Traps** — Line breaks and non-ASCII characters in `mailto:` bodies need correct percent-encoding,
and getting it wrong produces a mangled email a teacher sends without noticing. Test with an
apostrophe, an em dash, and a multi-paragraph body.

---

## WO-5.4 — Contact log & history

**Ship** — · **Status** ⬜ NOT STARTED · **Size** S · **Depends on** WO-5.3, WO-4.5
**Closes roadmap** Phase 5 → "Log the contact (append-only) and show contact history per student."

**Why it exists.** The log is what WO-4.5's cooldown reads. Without it the signal lists are
identical every week and the whole Phase 4 investment decays.

**Deliverables**
- On handoff, append to `log[]` with `kind: "contact"`, the audience, subject, body, and **the
  signal rule that prompted it** — the cooldown keys on `student + rule`.
- Contact history on the student record and on the signal card, newest first.
- Append-only, same as WO-4.4.
- Handle the honest gap: `mailto:` cannot confirm the message was actually sent. Log it as
  *drafted*, and let the teacher mark it sent — or state plainly in the UI that the log records the
  handoff, not delivery.

**Acceptance**
- [ ] A contact appears in the student's history immediately after handoff.
- [ ] The logged rule id is what WO-4.5's cooldown matches on, and suppression follows.
- [ ] Log entries are never edited or deleted.
- [ ] The UI is honest about what "logged" means given `mailto:` cannot confirm delivery.
- [ ] Contact history is presentation-mode safe — a projected history of behavior contacts is a
      disclosure.
