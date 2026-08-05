# WO-1.7 — Roster & contacts · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.7-result.md` — as your last act, and return it in-band too.

**Routing decision.** This work order was pre-routed to **Codex** and derived to Codex again: every
student, guardian, counselor, and teacher field is enumerated verbatim in `docs/data-model.md`, all
five Acceptance lines are mechanically checkable, and the sensitive surface (`supports`) is
explicitly deferred to WO-1.8. The runner-up consideration was Claude, on the strength of the 🚩
go-live blocker and the teacher-facing preview and duplicate-warning copy. **It re-routed to Claude
at dispatch time** because the exec-time smoke probe failed: `codex exec` exited zero having written
nothing — `codex-windows-sandbox-setup.exe: program not found`, `apply_patch` failed twice. That is
the runner's third such failure, not a change in the rubric. Nothing else in this brief changes.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.7 — Roster & contacts

**Ship** 1 · **Status** ⬜ NOT STARTED · **Size** M · 🚩 · **Depends on** WO-1.6
**Closes roadmap** Phase 1 → "Roster: paste `Last, First`; guardian, counselor, and email fields."

**Why it exists.** The school's SIS has no usable export, so rosters are pasted. That is the
supported path, not a fallback — don't design around a sync that cannot exist. Contacts live on the
roster because Phase 5's audience picker reads them from here.

**Deliverables**
- Paste box accepting `Last, First` per line, tolerant of `First Last`, extra whitespace, tabs, and
  a trailing blank line. Preview before commit; say how many will be added.
- Student fields per [`../../docs/data-model.md`](../../docs/data-model.md): first, last, nickname,
  gradYear, email, notes.
- Guardians (repeatable): name, relation, email, phone, language, preferred flag.
- Counselor: name, email.
- Add, edit, remove, and move a student between classes. A student belongs to the document; classes
  hold roster id lists.
- Teacher settings: name, school, email, admin email, default-cc flag.

**Out of scope** — `supports` / accommodations (WO-1.8), the Roll Call! importer (WO-2.7).

**Acceptance**
- [ ] Pasting 25 names produces 25 students with names split correctly, and the preview matched.
- [ ] Re-pasting the same list warns about duplicates rather than silently doubling the roster.
- [ ] A student added to two classes is one student record with one set of contacts.
- [ ] Removing a student from a class does not delete the student from the other class.
- [ ] Guardian, counselor, and student emails round-trip through save and reload.

**Traps** — `Last, First` and `First Last` both appear in real paste sources. Detect per line, and
show the split in the preview so a wrong guess is caught before it commits, not after.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `docs/data-model.md`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- **`src/classes.js` (1056 lines) — the convention this module must match.** WO-1.6 built classes
  and terms CRUD against the same store and the same modal system. Read it before you design
  anything: how it lists, how it opens an editor, how it validates, how it announces to the live
  region, how it names its CSS. Roster and contacts should look like a sibling of that file, not a
  second dialect. Its four iPad defects (date popover, tab compression, `scrollLeft` reset on
  rebuild, `flex: 1` collapsing a strip to zero width) are recorded at
  `plans/work-orders/phase-1-shell-store-roster.md` above WO-1.7 — do not reintroduce them.
- **`src/store.js` — the only door to the document.** Mutate through `update(mutate)`; ids come from
  `newId(prefix)` (`s_` for students). Do not reach into IndexedDB and do not invent a second id
  scheme. `students` is a **document-level array**; `classes[].roster` is a list of **ids**. That
  split is what makes Acceptance lines 3 and 4 true, so honor it structurally rather than by
  de-duplicating after the fact.
- `src/modal.js`, `src/live-region.js`, `src/save-indicator.js`, `src/prefs.js` — the existing
  primitives. Use them; do not hand-roll a second modal or a second announcer.
- `src/shell.js`, `index.html`, `src/shell.css` — where a new screen registers and where its styles
  go. Colors inline in markup, not CSS variables; the sweep enforces this.
- **`src/backup.js`** — Acceptance line 5 is a round-trip, and backup/restore is a sensitive surface
  you must not redesign. Confirm students and contacts survive it; if the backup copy needs a word
  changed, say so in your report rather than rewriting the FERPA-adjacent prose.
- `tools/verify-shell.mjs` and `tools/wo-sweep.mjs` — read them before adding checks, so your new
  checks match the existing idiom.
- Roll Call! `design/style-guide.md` and `design/portable-components.md` at
  `C:\Users\WildB\OneDrive\Documents\Coding Projects\Attendance App` — for the form and list
  patterns only. Roll Call! has no roster-paste flow to copy, so the paste box and preview are new;
  build them out of components already in this repo rather than inventing a look.

**One judgment note the work order implies but does not spell out.** The paste preview is the whole
defense named in **Traps**: a per-line `Last, First` vs `First Last` guess is going to be wrong
sometimes ("Van Dyke, Mary" and "Mary Van Dyke" are both real), so the preview must show the split
it chose — first and last as separate, visible values — and let the teacher fix a line before
commit, not after. A preview that only shows a count has not implemented the trap.

---

## 3. Constraints — non-negotiable, and each one has already cost someone a day

These are inlined verbatim into every brief on both routes, so that what was asked is on the record
independently of what any agent remembered to read:

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
- Stay inside the work order's **Out of scope** line. Do not tick roadmap boxes, edit `plans/`, or
  touch `CHANGELOG.md` / `TESTING.md` — the teacher does maintenance, after the verifier reports.

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

1. Pasting 25 names produces 25 students with names split correctly, and the preview matched.
2. Re-pasting the same list warns about duplicates rather than silently doubling the roster.
3. A student added to two classes is one student record with one set of contacts.
4. Removing a student from a class does not delete the student from the other class.
5. Guardian, counselor, and student emails round-trip through save and reload.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

