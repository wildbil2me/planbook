# WO-5.14 — result

**Implementer** Claude (Opus), 2026-09-20. **Brief** `.claude/dispatch/WO-5.14-brief.md`.
**Status on the row** left at `🤖 CLAIMED — 2026-09-20`; the orchestrator's `--handoff` moves it.
**No commit, no push** — the brief did not ask for either.

## The ruling

**Cc.** The primary rides alone in To; every other recipient of the same message — the second
guardian, the counselor, the teacher's own copy — rides in Cc; **no Bcc** was introduced, so no new
field. The argument is written at its own section in `src/outreach.js`, headed *"which header the
non-primary recipients ride in (WO-5.14)"*, directly above `mailtoUrl()` — the file in which a
header is a header (the three serialisers are the only code that writes `cc=` or `Cc:`). It is a
*why* comment, in four steps: what each header discloses (To/Cc hide nothing from anybody and differ
in what they say; Bcc hides asymmetrically); whose address is actually at stake (a counselor's or
admin's is institutional, a guardian's is already the school's; the one real disclosure — two
guardians who are not one household — is a question of whether they belong on one message at all,
which a header cannot answer and Bcc would only make invisible, and which the flow already answers
with two messages); why not Bcc even so (a counselor copy exists so the guardian knows the counselor
is in the loop; Bcc'ing one is telling a third party about a family's business under a header the
family cannot see); why not several in To (the body says "Dear Ms Okafor", a To line naming three
people is a header disagreeing with its own first line). Last paragraph: **the builders cannot see
the ruling** — `to` and `cc` are both lists, which addresses go in which is the caller's, and a
reader who reverses it changes two lines in the view and touches no encoder. The view's call site and
`draftText()`'s header point at the section rather than restating it. WO-5.8 builds to: primary in
`to`, its other recipients **join** `cc`.

## What landed

- `C:\dev\planbook\src\outreach.js`
  - `addressList(value, field)` — new. `undefined`/`null` → `[]`; any non-array → `TypeError`
    naming `draft.to`/`draft.cc`; elements trimmed and blanks dropped. Argued against the file's own
    `arrayOf()` tolerance at the point of departure (a draft object is not a document).
  - `encodeAddress()` → `encodeAddresses(list)` — **map then join**, literal comma, `@` restored per
    address, `%2C` never restored. RFC 6068 § 2 cited.
  - `mailtoUrl()`, `composeUrl()` (Gmail + Outlook), `draftText()` — all read `to`/`cc` through
    `addressList()`; empty-header rule now `cc.length`. `draftText()` writes `Name <primary>` for
    `to[0]` only, further To addresses bare after a comma, `Cc:` comma-joined; the admin
    address-as-name case still writes the address once. `name` stays a scalar, argued in the
    section header.
  - The ruling section (above). One paragraph added to the `MAILTO_CEILING` block saying addresses
    are in the same budget and nothing is recounted. File header names WO-5.14.
  - **Untouched, verified by the diff:** `encodeField()` (CRLF), `encodeComposeField()` (LF),
    `MAILTO_CEILING`, `overCeiling()`, `ceilingFor()`, `MAIL_DOORS`. No new export, so
    `wo-sweep.mjs` § 24's `ANSWERS` list needed no change.
- `C:\dev\planbook\src\outreach-view.js` — `outreachModel()`: `toList = [to]`,
  `ccList = cc.on && cc.ok ? [cc.email] : []`, handed to both `composeUrl()` and `draftText()`;
  comment says this is the one place the string becomes a list and points at the ruling. One
  sentence added to the ceiling-warning comment (`model.length` is the whole URL, so every address
  is in the number; no separate count).
- `C:\dev\planbook\sw.js` — `CACHE` v122 → v123 (both `src/outreach*.js` are in `SHELL`).
- `C:\dev\planbook\tools\verify\outreach.mjs` — the `draftText()` edge fixture moved to the list
  shape (`to:['a@b.test']`, `cc:[]`); **six new `check()` sites** in a WO-5.14 block directly after
  it, all direct calls through `window.planbook.outreach`, none in a loop, none a failure arm; file
  header paragraph added. Every DOM-read check in the section is byte-identical.
- `C:\dev\planbook\tools\README.md` — count sentence 1413 → 1419; a WO-5.14 entry after WO-4.6's
  with the run figures.
- `C:\dev\planbook\TESTING.md` — new § WO-5.14 after § WO-5.13: what changed, the ruling, the
  ceiling claim, both tool results, the three-mutation table, the three Acceptance lines with
  evidence.
- `C:\dev\planbook\plans\work-orders\phase-5-outreach.md` — the three Acceptance boxes ticked with
  evidence in italics; a **Built 2026-09-20** line. Status left `🤖 CLAIMED`.

## Commands run, with what they printed

| Command | Result |
|---|---|
| `node tools/wo-sweep.mjs` (before any edit) | `42 checks · 39 passed · 0 failed · 3 to review`; call-site 1413 matching |
| scratch smoke of the module under bare Node (roster import stubbed in a scratch copy) | every shape right; all 8 string hand-ins refused with `TypeError draft.<field> must be a list of addresses, not string` |
| `node tools/verify-shell.mjs` (first attempt) | **died at import** — `SyntaxError: missing ) after argument list` at `outreach.mjs:1910`: a backtick I put in a page-side comment closed the template literal. Fixed; then a second defect found by `node --check`: `const refused` collided with a local at line 792 → renamed `stringRefused`. |
| `node --check` on all three edited `.js`/`.mjs` | OK |
| `node tools/verify-shell.mjs` (delivered tree) | `1428 checks · 1428 passed · 0 failed · 0 skipped`, 44,769 lines, 31.4 lines per check, 504s, `EXIT=0` — read from the log after the exit line was written |
| `node tools/wo-sweep.mjs` (after README edit) | `42 checks · 39 passed · 0 failed · 3 to review`; call-site 1419 matching `tools/README.md:1213`; the three to-review items unchanged |
| `node tools/wo-gate.mjs WO-5.14` | `PASS \| gates clear` (with the expected CLAIMED / interrupted-draft notes) |
| `node tools/wo-gate.mjs --audit` | PASS |
| `git diff \| grep MUTATION` | 0 hits; `grep -rn "MUTATION M" src tools` → only pre-existing prose in `keys-legend-guards.mjs` |

## Mutation round — three, in scratch copies, never the working tree

Each copy made by an exact single-occurrence string replacement (aborts otherwise), run in parallel.

| # | Mutation | Predicted | Result |
|---|---|---|---|
| M1 | `encodeAddresses()`: join first, then encode (the `%2C` shape) | the two multi-address URL checks red, nothing else | `1428 · 1426 passed · 2 failed`, exit 1 — exactly those two |
| M2 | `addressList()`: a string quietly wrapped as `[value]` | the string-refused check red, nothing else | `1428 · 1427 passed · 1 failed`, exit 1 — exactly that one |
| M3 | view: `const toList = to` (a bare string handed in again) | `outreachModel()` throws on the first ready draft; § outreach and § contact-log contained per WO-1.44 | `1349 · 1347 passed · 2 failed`, exit 1 — both sections "threw after 2 of its own checks … TypeError: draft.to must be a list", 79 checks named as lost |

All three copies live under the session scratchpad; nothing was ever planted in `C:\dev\planbook`.

## Acceptance, line by line

1. **All three doors carry several addresses, correctly encoded; copy-to-self as WO-5.3 proved** —
   **ticked.** Evidence: the two new URL checks (`to = wo514primary@…,wo514second%2Btag@…`,
   `cc = wo53counselor@…,wo53teacher@…`, `%2C present = false`, same on Gmail and Outlook, each part
   decoding back to the fixture list) plus M1 red on both. Copy-to-self: WO-5.3's `cc=` toggle check
   and WO-5.12's Gmail `cc` check are unchanged and green through the view's one-element list.
2. **Header chosen, argument written where the code makes it** — **ticked.** Cc; the section in
   `src/outreach.js` above `mailtoUrl()`. A ruling is prose, so no check closes the *argument*; the
   harness proves the shape it rests on (`cc` a list at all three doors, clipboard `Cc:` joined).
3. **Ceiling counts every address; warns rather than truncates** — **ticked.** `1962 alone → 2433
   with six addresses, over = true, carried 6/6, ceilingFor gmail = null`; `overCeiling()` is
   unchanged and reads the whole URL, which is what the view's `length` reads. WO-5.3's long-draft
   and WO-5.12's no-ceiling-under-Gmail checks unchanged and green. *Caveat, stated plainly:* the
   view cannot build a multi-address URL until WO-5.8, so the *warning sentence* with several
   addresses in it is proved by construction (`url.length`) and by the builder fixture, not by a
   DOM read.

No 👤 and no 📆 line on this work order. Nothing needs the iPad; the app's behaviour is unchanged on
every screen.

## Decisions the work order did not settle

- **`to` is a list even though the ruling puts one address in it.** Deliberate: RFC 6068's `to` is
  a list, and a scalar `to` beside a list `cc` would bake the ruling into a signature. Reversing the
  ruling costs two view lines and no encoder — said in the ruling's last paragraph.
- **A string is a throw, not a wrap and not a silent `[]`.** Argued at `addressList()` against the
  file's own tolerance posture; M3 shows the failure is loud on the laptop rather than silent.
- **Absent `cc` (`undefined`) is `[]`.** An absence is not a second shape of the field; it is the
  header left out, which `mailtoUrl()` has always done. The view still passes `[]` explicitly.
- **Blanks inside a list are dropped.** A trailing comma is a malformed list; asserted.
- **The comma is literal on the https doors too** (not `%2C`): both compose pages read
  `to=a@x,b@y` as two recipients, and one string for three doors is one fewer thing to disagree on.
- **The ceiling fixture's margin is 38 characters** (1,962 vs 2,000) with one recipient. It is
  deterministic (no clock, no environment), so it holds; I left the body length at 1,400 rather
  than re-run the harness for a wider margin.

## Noticed and left alone (out of scope)

- `tools/README.md`'s recent count entries (WO-6.8 → WO-4.6) say "the gap between sites and results
  stays at −16" while their own figures give 9 (e.g. 1413 sites, 1422 results). I wrote **−9** for
  this entry, the arithmetic, and did not touch theirs.
- `wo-sweep.mjs` § 24's `ANSWERS` list does not name `composeUrl`, `mailDoorOf`, `mailDoorName`
  or `ceilingFor` (WO-5.12's exports). Not this work order's, and the vacuity guard still holds on
  the seven it has.
- No `bcc` field — the ruling does not need one, and the Deliverable only says a *chosen* Bcc would
  be a new field.

## Draft CHANGELOG entry (for the teacher to accept, edit or drop)

> **The compose doors take a list.** Every way a draft leaves — the `mailto:`, Gmail, Outlook, the
> clipboard — now carries any number of addresses in To and in Cc, encoded one at a time and joined
> the way a mail client expects. Nothing changes on screen yet: the picker that chooses several
> people is WO-5.8, and it will put the primary alone in To and everyone else in **Cc** — never Bcc,
> because on a message about a child nobody should be told in secret, and a counselor copy is worth
> sending precisely so the guardian knows the counselor knows. The length warning already counts the
> addresses, because it measures the whole link.
