# WO-1.11 — Back up every year in one tap · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.11-result.md` — as your last act, and return it in-band too.

**Why you have this.** Routed to Claude by rule, not by tie-break: `ROUTING.md` names backup and
restore as a never-delegate surface, and this work order reaches into the restore validation path
that WO-1.5 got verified. The runner-up consideration I set aside is that the deliverables are
mechanically small and bounded — one control, a loop, a per-year stamp — which on size alone would
read as a Codex row; what disqualifies it is that the work order hands you an architectural decision
to make first, and it makes it about the most destructive path in the app.

**The one thing that would make this work order a failure even if every line of code is correct:**
a button that says it backs up every year and writes fewer than it stamped. Read the Traps section
twice.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.11 — Back up every year in one tap

**Ship** — · **Status** ⬜ NOT STARTED · **Size** S · **Depends on** WO-1.5
**Not a go-live blocker.** Added 2026-08-04, out of WO-1.5's verification.

**Why it exists.** WO-1.5's download backs up the **open** year, because the open document is what
`getDoc()` returns. That is right for one year and wrong at a rollover: a teacher who has started
2027-2028 while still holding 2026-2027 for reporting she has not finished takes a backup, sees the
date update, and reasonably reads it as "Planbook is backed up." One of her two years is on disk.

Two halves of this were closed on 2026-08-04 rather than deferred, because they were the silent
half: `planbook_lastBackupAt` is now **per-year**, so downloading one year no longer clears the nag
for another, and the backup panel names any year on the device that has never been downloaded. What
is left is the convenience — and the convenience is what makes it actually get done.

**Deliverables**
- A second control on the backup panel that writes out every year on the device, shown only when
  there is more than one.
- The last-backup timestamp stamped for **each** year the button actually wrote.
- Panel copy that says how many years it covers, and the nag left alone — it stays a per-year strip.

**The decision this work order has to make first**, because it reaches into restore and restore is
the most destructive thing the app does:

- **One file holding an array of year documents** — one tap, one artifact, and restore has to learn
  a second top-level shape and decide what "replace" means for three years at once. That is a real
  change to the validation path WO-1.5 got verified, and it wants its own acceptance lines.
- **Or one file per year, downloaded in sequence** — restore stays exactly as it is, and every file
  is a file WO-1.5 already reads. The cost is iOS Safari, which is unreliable about several
  programmatic downloads from a single gesture and may prompt per file.

The second is the smaller change and keeps the recovery path single-shaped; it is the one to try
first, and the iPad decides whether it survives. Do not widen restore without saying so out loud.

**Out of scope** — Drive, scheduled backups, and restoring a single class or student out of a file.
The unit of recovery is the year, deliberately (`docs/data-model.md`).

**Acceptance**
- [ ] With two years on the device, one tap produces a readable backup of both.
- [ ] The control is absent with only one year, and no teacher who never rolls over ever sees it.
- [ ] Each year written gets its own `lastBackupAt` stamp; the nag is down for both afterwards.
- [ ] Restore still accepts every file this produces, and the WO-1.5 refusal checks still pass
      unchanged.
- [ ] 👤 On an installed iPad: every file lands in Files, and the run is not silently truncated to
      the first year by Safari's download handling.

**Traps** — A "back up everything" button that quietly writes one year is worse than no button,
because it answers the question the nag was asking. If sequential downloads are cut short on iOS,
say so on screen rather than stamping the years that never landed.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `docs/data-model.md`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Also open, because this work order is an extension of an already-verified surface rather than a new
one — the existing code is the spec for the half you are not changing:

- **`src/backup.js` in full, before you touch it.** It is the file you are extending. Every comment
  block in it is a decision record; several say out loud why the thing you are about to add was
  deferred to WO-1.11. In particular:
  - `buildBackup()` (~line 143) builds from `getDoc()`. That coupling is exactly what this work
    order breaks — note it takes the year from the *document*, not from the screen, and the comment
    in `downloadBackup()` (~line 219) says why: "never the year on screen … would stop being one
    the moment anything backs up a year it does not have open." That moment is this work order.
  - `backupTimes()` / `lastBackupFor()` / `recordBackupFor()` (~lines 162–175) are the per-year
    timestamp seam, already built. Stamp through `recordBackupFor()`, once per year actually
    written. Do not stamp ahead of the write.
  - `yearsNeverBackedUp()` and `refreshOtherYearsLine()` (~lines 182, 565) are the half that landed
    on 2026-08-04. The work order says the nag stays a per-year strip and is left alone — that
    includes this line and `refreshBackupNag()`. If your new control makes the existing prose wrong
    or redundant, that is panel copy to reconcile, and it is in scope; changing what the nag asks
    about is not.
  - The `<a download>` + blob mechanism in `downloadBackup()` (~lines 194–217) carries two iPadOS
    scars: `<a download>` over a blob URL is the one thing that works in an installed PWA, and the
    URL is revoked on a later turn because Safari cancels the download otherwise. Reuse it. Do not
    invent a second download path, and be careful that a sequential loop does not revoke early or
    collapse the per-file timing.
- **`src/store.js`** — `readStoredDocument(year)` (line 536) already exists, is already imported by
  `backup.js`, and reads a year without opening it. That is the seam for reading the other years;
  you should not need `openYear()`, and switching the open year to take a backup would be a visible
  side effect a teacher did not ask for. Note what `readStoredDocument` does *not* do: it is a raw
  `get`, so it does not migrate. Decide deliberately what a stored year at an older
  `SCHEMA_VERSION` should produce, and say what you decided — `migrateDocument` and `normalizeYear`
  are both already imported into `backup.js`.
- **`src/prefs.js`** ~lines 60–80 — `PREF_DEFAULTS.lastBackupAt` and the comment on why it is a map
  and not one id. UI preferences only; never student data.
- **`tools/verify-shell.mjs`** — already drives `readStoredDocument` over multiple years around
  line 1951, and already has the WO-1.5 restore-refusal fixtures. Extend those; Acceptance line 4
  is "the WO-1.5 refusal checks still pass **unchanged**", so if you find yourself editing an
  existing refusal fixture to make it pass, stop and report that instead.
- **`docs/data-model.md`** — the unit of recovery is the year. That is the sentence the Out of scope
  line is pointing at.

**On the decision the work order asks you to make first.** It tells you which to try first — one
file per year, downloaded in sequence, so restore stays single-shaped — and it tells you the cost:
iOS Safari may truncate or prompt per file, and that is settled by a human on an iPad (Acceptance
line 5), not at your desk. Take the steer. If you conclude the sequential path cannot work, do not
quietly implement the array-of-documents shape instead — the work order says that variant "wants its
own acceptance lines," which means it is a conversation, not an implementation choice. Report it as a
proposed follow-up and stop.

**Two things to keep straight, since a desk browser will lie to you about both.** Chrome over CDP
will happily accept a dozen programmatic downloads in a row; iPadOS Safari is the platform in
question and you cannot test it. So (a) whatever evidence you gather for Acceptance line 1, state
what it proves and on what browser, and (b) build the failure path the Traps section demands — if
the run is cut short, the years that never landed must not be stamped, and the panel must say so.
An honest "I could not test the truncation path end-to-end on the real platform" is worth more here
than a green check.

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

1. With two years on the device, one tap produces a readable backup of both.
2. The control is absent with only one year, and no teacher who never rolls over ever sees it.
3. Each year written gets its own `lastBackupAt` stamp; the nag is down for both afterwards.
4. Restore still accepts every file this produces, and the WO-1.5 refusal checks still pass unchanged.
5. 👤 On an installed iPad: every file lands in Files, and the run is not silently truncated to the first year by Safari's download handling.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

