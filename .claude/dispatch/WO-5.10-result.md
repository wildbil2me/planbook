# WO-5.10 — implementer's report

**Status left on the work order** 🔍 AWAITING VERDICT — 2026-09-14 (via `wo-gate.mjs --handoff`).
**Two of three Acceptance lines ticked. The second is open, and it is a ruling for the owner rather
than work left undone** — read § "The one decision the work order did not settle" before anything
else, because it is the only thing in this report a verifier cannot re-derive from the tree.

---

## What landed

**The model decides, the paint draws — and the paint had to be moved for the model's decision to
reach the glass.** That second half is the one thing the work order does not say, and it is not a
departure from it.

`outreachModel()` put `status: status` on `base`, the object it returns before it asks about the
projector. It now carries `status: ''` there, beside WO-5.7's `clipboard: ''` and with the reason
written at the same spot, and the real sentence goes on in the `Object.assign` at the foot — which
only a model that got past the projector ever reaches. That is the clipboard pattern exactly, and it
is what the Deliverable asks for.

**But the four lines that write `#outreachStatus` sat *after* `renderOutreach()`'s blocked branch
returns.** (The work order calls it `paintOutreach()`; the function is named `renderOutreach()` —
there is no `paintOutreach` in the file.) With the draw left where it was, a blocked paint returns
before ever touching the element, so an emptied model changes nothing in the DOM and Acceptance
line 1 fails outright: the stale sentence stays in the hidden form, which is the whole defect. So
the block was **moved above the branch**, unchanged, and is now unconditional — one read of
`model.status`, drawn in both branches, exactly as the Deliverable requires (*"the paint draws
`model.status` and must keep doing so"*).

What that is **not**: there is no `textContent = ''` in the blocked branch and no `status = ''`
anywhere in the paint. The Traps line is kept in full — the module variable is untouched by the
paint, and the status line has one opinion about presentation mode, the model's. `announce()` was
not touched.

Also: `sw.js` `CACHE` v115 → v116 (`src/outreach-view.js` is in `SHELL`).

## Against the Acceptance list, item by item

**1. Projector flip after a recipient switch leaves `#outreachStatus` empty and no guardian's name
in `#outreachModal.textContent` — [x] ticked.**
Verified by a new check in `tools/verify/outreach.mjs`, green on the delivered tree. The fixture
switches recipient first (`[data-outreach-to="guardian-1"]`), reads the sentence off the glass —
`"The draft was rebuilt for Wo53Guardian Two…"`, `hidden = false` — and *then* clicks the real
header toggle. After the flip:
`{"status":"","hidden":true,"model":"","blocked":true,"name":false,"address":false}`. The
before-reading is asserted too, so a fixture that quietly stopped writing a status would go red
rather than green. Non-vacuity is proved by M1 below.

**2. Flipping back does not resurrect the sentence — [ ] NOT ticked. Not met, and not by omission.**
See the next section. The harness reads it every pass and prints it without asserting it:
`status on the way back out = "The draft was rebuilt for Wo53Guardian Two…" (hidden = false)`.

**3. The mutation turns the new check red and leaves the existing projector check green — [x]
ticked. Run, not reasoned.**
M1: `status: status` restored on `base`, carrying a `MUTATION` comment, planted against a fully
staged tree. Result: `1354 checks · 1353 passed · 1 failed`, 441s, EXIT=1 — **exactly one red line,
the new check**, and the existing projector check printed `PASS` on the same run (log line 1425,
the red at 1427). The mutation's own reading is the disclosure in plain sight:
`projected: {"status":"The draft was rebuilt for Wo53Guardian Two…","hidden":false,"model":"…",
"blocked":true,"name":true,"address":false}` — `name: true` is a guardian's name inside
`#outreachModal.textContent` while presentation mode is on.

**The mutation was reverted before any prose was written**, by exact string replacement, and
confirmed three ways: `git diff` empty against the staged tree, `grep -rn MUTATION src/` returning
only the pre-existing `src/shell.js:874`, and the full staged diff read by eye.

## The one decision the work order did not settle

**Acceptance line 2 cannot be reached by the mechanism the Deliverables and the Traps line rule in,
and I kept the mechanism.**

`status` is a module variable. On a projector flip, **nothing in `src/outreach-view.js` runs except
the paint** — `flipPresentationMode()` in `src/shell.js` calls `outreachView.renderOutreach()` and
nothing else. So the only places that could *forget* the sentence are:

- the paint (`status = ''` in the blocked branch) — **forbidden in as many words by the Traps line**,
  which also concedes it "would pass the first two Acceptance lines"; or
- a new export called from `flipPresentationMode()` — a second file and outside the Deliverables.

With the sanctioned fix in, a flip ON empties the line and a flip OFF draws it again, because **what
the mode suppressed was the drawing rather than the work** — which is word for word what the
projector check immediately above mine has asserted about the draft, the chips and the boxes since
WO-5.3. I went with the ruling, ticked line 1, left line 2 blank, and wrote the finding into both
`plans/work-orders/phase-5-outreach.md` (a note under the Acceptance list) and `TESTING.md`.

Worth weighing before anyone closes it: **nothing is on the glass while the mode is on**, which is
the entire disclosure this work order exists to close. What returns on the flip back returns beside
the student's name, her guardian's address and the body of the message — the panel comes back whole.
Line 2 is tidiness, not exposure. Closing it costs either the Traps ruling or a hook in
`flipPresentationMode()`; both are the owner's call, and I made neither.

## Commands run, with their own output

| Command | Result |
|---|---|
| `node tools/verify-shell.mjs` (clean, first) | `1354 checks · 1354 passed · 0 failed · 0 skipped`, 42,182 lines, 31.2 lines per check, 442s, EXIT=0 |
| `node tools/verify-shell.mjs` (M1 mutation) | `1354 checks · 1353 passed · 1 failed`, 441s, EXIT=1 — the one red is the new check; the existing projector check PASS |
| `node tools/verify-shell.mjs` (delivered tree, final) | `1354 checks · 1354 passed · 0 failed · 0 skipped`, 42,182 lines, 31.2 lines per check, 440s, EXIT=0 |
| `node tools/wo-sweep.mjs` | `42 checks · 39 passed · 0 failed · 3 to review` — all three reviews pre-existing and byte-identical to the pre-change run |
| `node tools/wo-gate.mjs --audit` | PASS — every fragment, pointer, lock and dashboard row |
| `node tools/wo-gate.mjs WO-5.10` | `PASS | gates clear` |

The harness **did** run in this sandbox; all three runs are real, each waited to its exit, and the
figures above are read off the logs rather than predicted. The third run exists because a
comment-only edit landed in `src/outreach-view.js` after the first two, and "green on the delivered
tree" should mean the tree that is actually delivered. (The printed line figure counts the *harness*
files, not `src/`, which is why it did not move.)

**No before-run was taken** — the 1352 comparison in `tools/README.md` and `TESTING.md` is
arithmetic against WO-5.12's recorded figure, and both files now say so.

## Files changed

- `c:\dev\planbook\src\outreach-view.js` — `status: ''` on `base`; `status: status` in the
  `Object.assign`; the `#outreachStatus` draw moved above the blocked branch; a note at
  `applyRecipient()` (see below).
- `c:\dev\planbook\sw.js` — `CACHE` v115 → v116.
- `c:\dev\planbook\tools\verify\outreach.mjs` — two checks added inside § *"the send flow
  (WO-5.3)"*, directly after the two existing projector checks, which are byte-identical.
- `c:\dev\planbook\tools\README.md` — call-site count 1342 → 1344 (the sweep's own figure, not
  arithmetic) and a WO-5.10 paragraph after WO-5.12's.
- `c:\dev\planbook\TESTING.md` — new § WO-5.10 between § WO-5.9 and § WO-5.11: what changed, the
  mutation table, the three boxes, and the open line with its reasoning.
- `c:\dev\planbook\plans\work-orders\phase-5-outreach.md` — boxes 1 and 3 ticked, box 2 left open
  with a note, status → 🔍 AWAITING VERDICT via `--handoff`.

## Two things I did that were not in the Deliverables, both small

1. **The second harness check.** It puts the recipient back where the rest of the section expects it
   — the Gmail ceiling check above pays the mail door the same courtesy — and it is the surface that
   prints the Acceptance-2 reading. Without a restore, every later check in that section would read
   a draft blocked by a recipient with no address. It asserts only the restore.
2. **A four-line comment at `applyRecipient()`.** The comment there already claimed the status line
   "is drawn inside the panel presentation mode empties and is cleared with it" — **that was false
   when written and is the promise this work order makes true**. The note says so and points at both
   ends of the fix. No behaviour, no new claim.

## Not verified, and why

- **Nothing on hardware.** No 👤 line exists on this work order and I ticked none. The status line is
  the same `<p class="roster-hint">` in the same place at the same size, so there is no measurement
  or touch target to read — but I have not seen it on an iPad, and if anyone does look, force-quit
  first and expect `v116` on the build line.
- **`verify-deploy.mjs` was not run.** It reads the live origin; nothing here is deployed.

## Proposed follow-ups (not done, not booked)

- **The Acceptance-2 question**, stated above. If the owner wants the sentence gone for good, the
  cheap shape that respects the Traps line is a named export on `src/outreach-view.js` called from
  `flipPresentationMode()` beside `renderOutreach()` — a caller clearing flow state, which is what
  `resetOutreach()` already is. That is an XS work order, not a widening of this one.
- **`recordHandoff()`'s sentence is the other one that names a person** ("…logged on Ada …'s
  record"). It is covered by the same one-line fix and by the same open line 2 — but no fixture in
  the run reaches a projector flip *after a handoff press*, because pressing the handoff is confined
  to the two checks at the foot of the file. A check that presses the handoff and then flips would
  close that half by measurement rather than by argument. I did not write it: the work order names
  one check and says what it must do.

## Changelog draft (the teacher's to write or discard)

> **Fixed** — The one line on the draft panel that presentation mode did not empty. Switching
> recipient, or handing a draft off, leaves a sentence under the buttons that names a guardian or a
> student; flipping the projector on hid that sentence without clearing it, so it was still in the
> page. It is now emptied with everything else on the panel, decided by the same model that empties
> the rest rather than by a second rule of its own.
