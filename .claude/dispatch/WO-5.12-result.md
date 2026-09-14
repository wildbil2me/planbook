# WO-5.12 — A webmail door that is not a `mailto:` · implementer result

**Implementer** Claude (Opus) · **Date** 2026-09-13 · **Tree** `C:\dev\planbook`, branch `main`, uncommitted
(nothing committed, nothing pushed, per the brief).

## Summary

Built as specified, documents first. Both tools green on the delivered tree, four mutations run and
each turned exactly the predicted checks red, `grep -rn MUTATION` clean. Five of eight Acceptance
lines closed by the build; the three 👤 lines are untouched and each says below what the owner
should do on which device.

- `node tools/verify-shell.mjs` — `1352 checks · 1352 passed · 0 failed · 0 skipped` ·
  `42,102 lines · 31.1 lines per check · 452s`. The summary printed, then the process hung at
  teardown (the shape TESTING.md § WO-5.7 / § WO-5.11 record); killed by PID after the summary was
  read. No `EXIT=` line was ever written for that reason — the figures above are from the log's own
  summary, read after it printed.
- `node tools/wo-sweep.mjs` — `42 checks · 39 passed · 0 failed · 3 to review` (the three reviews
  are the standing ones). Call-site count 1342, matching `tools/README.md:1213`.
- `node tools/wo-gate.mjs --audit` — PASS. `node tools/wo-gate.mjs WO-5.12` — gates clear.

## Files changed (all absolute)

- `C:\dev\planbook\privacy.html` — data-flow statement item 3 rewritten; the "record of the
  messages" bullet and the accommodations rule 3 moved to the present tense; the browser-preferences
  sentence names the mail door; *Last updated* → 13 September 2026.
- `C:\dev\planbook\docs\FERPA.md` — item 3 rewritten in the same words; its stale *"Not in the
  released app yet"* removed; the "record of the outreach" bullet and rule 3 under accommodations
  moved to the present tense; *Last updated* → 13 September 2026. Item 2's "not yet" stays in both.
- `C:\dev\planbook\src\prefs.js` — `mailDoor: 'default'` in `PREF_DEFAULTS`, with the comment saying
  why it is the device's fact and not the document's.
- `C:\dev\planbook\src\outreach.js` — `MAIL_DOORS`, `mailDoorOf()`, `mailDoorName()`,
  `composeUrl(draft, mail)`, `ceilingFor(mail)`, and the essay at them (LF ruling, null ceiling,
  the policy obligation). Header updated: three strings, not two.
- `C:\dev\planbook\src\outreach-view.js` — imports `getPref`/`setPref`; `outreachModel()` reads the
  door and builds `url` through `composeUrl()`, exposing `mail`, `doors`, `https`, `ceiling`;
  `paintOpen()` sets/strips `target`+`rel` with the `href`, and the length sentence knows the door;
  new `paintMailDoor()`; the blocked branch strips the pair; new `setOutreachMailDoor()`; the ready
  strip sentence, `aria-label` and post-handoff status name the door. Header: the "nothing is
  remembered" ruling gains its one exception, the anchor's reasons gain a fifth.
- `C:\dev\planbook\index.html` — the *Where does your mail live?* section label, three `.toggle-btn`
  chips (`data-outreach-mail`), `#outreachMailNote`; the `#outreachOpen` comment extended (WO-5.11
  reading kept, not deleted); the panel's closing hint mentions the webmail doors.
- `C:\dev\planbook\src\shell.js` — `[data-outreach-mail]` click route and its hook-table row; the
  `data-outreach-handoff` row notes the https shape.
- `C:\dev\planbook\src\shell.css` — `#outreachModal [data-outreach-mail]` at 44px in the coarse block.
- `C:\dev\planbook\sw.js` — `CACHE` `planbook-shell-v114` → `planbook-shell-v115`.
- `C:\dev\planbook\tools\verify\outreach.mjs` — nine new `check()` sites in four places; the cleanup
  takes the one contact off the log and its check gained two conjuncts; file header note. The
  WO-5.11 check is byte-identical (`git diff` touches none of its lines).
- `C:\dev\planbook\tools\README.md` — count line 1333 → 1342 at line 1213; a WO-5.12 paragraph in
  the count history after WO-5.11's.
- `C:\dev\planbook\TESTING.md` — § WO-5.12 with the mutation table and the 👤 instructions.
- `C:\dev\planbook\plans\work-orders\phase-5-outreach.md` — Acceptance lines 1–5 ticked with
  evidence; status left at `🤖 CLAIMED` (`--tick` is the verdict path, not mine).

## Acceptance, line by line

1. **Gmail href + attributes; default mailto + neither; WO-5.11 check unchanged and green — ticked.**
   Harness, the Gmail chip tapped on the ready praise draft:
   `https://mail.google.com/mail/?view=cm&fs=1&to=wo53guardian1@… target = "_blank", rel = "noopener", pref = "gmail"`;
   the Default chip tapped: `mailto:… target = null, rel = null, pref = "default"`. The WO-5.11 check
   on the same run: `href present = true, target = null, rel = null`, PASS; `git diff
   tools/verify/outreach.mjs` removes only the cleanup check's lines. Mutations M1 and M2 prove
   each half non-vacuous.
2. **Blocked draft has no href under all three — ticked.** `gmail: href null, target null, rel null ·
   outlook: href null, target null, rel null · default: href null, target null, rel null`, each chip
   tapped in turn over the `{{supports.medical}}` draft.
3. **Webmail click appends exactly one contact — ticked.** Pressed under Gmail with
   `contact-log.mjs`'s capture-phase stop: `log 0 → 1, kind "contact"`, audience `guardian`, subject
   and body byte-equal to the boxes, status "Handed to Gmail and logged…", modal still open.
   `recordHandoff()` and the shell hook untouched; `verify/contact-log.mjs` untouched and green.
4. **`planbook_` key, nothing reaches the document — ticked.** `localStorage.getItem('planbook_mailDoor')
   === '"gmail"'` read off storage itself; sweep § 4 `10 declared, 8 used, all accounted for` and
   `prefs.js is the only door`; harness `document identical = true, rev 298 → 298` across the tap;
   M4 proves that conjunct bites.
5. **Both documents carry item 3 word for word; FERPA no longer says outreach is unreleased —
   ticked.** Mechanical compare after normalising `<code>`→backticks and whitespace: `identical:
   true`. `grep -n -i "released app"` over both files leaves item 2's and the sync section's only.
   `verify-deploy.mjs`'s three claims are sentences this pass did not touch; it is owed a run
   against the live origin after deploy, which no build can do.
6. **👤 Laptop, installed PWA, Gmail — untouched.** Owner: force-quit the installed app, confirm
   `v115` on the build line, open a draft from a signal card, tap *Gmail in the browser*, tap *Open
   in my mail app*. Read: a new tab on mail.google.com with a compose open; To, Subject, body
   filled; paragraph breaks intact and not doubled (the LF ruling's reading); the PWA window still
   on the draft with "Handed to Gmail and logged". Then once more from a plain Chrome tab, as
   WO-5.11 did.
7. **👤 iPad, preference untouched — untouched.** Owner: force-quit from the app switcher, `v115`;
   the chips should show *Default mail app* pressed without being touched; tap *Open in my mail
   app* — Mail opens filled, no tab and no window left behind, Safari and installed alike.
8. **👤 Outlook on the web — untouched, and not readable this sitting.** The Outlook URL is asserted
   in shape only (`outlook.office.com/mail/deeplink/compose` with `to`, `subject`, `body`, LF round
   trip, the attribute pair). The option ships behind Gmail's reading as the line itself allows.

## Mutation round

Run in four scratch copies of the tree in parallel (exact-string replacement that fails unless the
target occurs exactly once), never in the working tree — so nothing was reverted with `git
checkout` against unstaged work, and the delivered files never carried a mutation.

| # | Mutation | Predicted red | Result |
|---|---|---|---|
| M1 | `paintOpen()`: `rel` dropped on the https href | Gmail check, Outlook check | `1352 · 1350 passed · 2 failed` — the two |
| M2 | `paintOpen()`: `target`/`rel` on every ready href (mailto included) | WO-5.11 check, *Default mail app* check, chips-at-390 check | `1352 · 1349 passed · 3 failed` — the three |
| M3 | `encodeComposeField()`: CRLF instead of LF | Gmail round-trip check, Outlook check | `1352 · 1350 passed · 2 failed` — the two |
| M4 | `setOutreachMailDoor()`: `getDoc().mailDoor = door` | "choosing a door wrote NOTHING" | `1352 · 1351 passed · 1 failed` — the one |

`grep -rn MUTATION` over every touched file and over `src/`: every hit is pre-existing prose
(`src/shell.js:874`, `tools/README.md`, the WO-5.3 note in `outreach.mjs`, the WO-5.7 record in the
phase file). None is mine. Scratch copies deleted.

## Decisions the work order did not settle

- **Scope of the "not in the released app" fix.** The Deliverable names item 3; Acceptance line 5
  says *FERPA no longer says outreach is not in the released app*. FERPA said it in three places
  (item 3, the "record of the outreach" bullet, rule 3 under accommodations) and `privacy.html` in
  the same three. I rewrote all six to the present tense — the resolver and the contact log both
  exist — because a verifier grepping the file would otherwise find the acceptance line false. The
  sync "not yet" lines were left alone.
- **The item-3 sentence is person-neutral** ("the mail account that was going to send it anyway",
  imperative "choose one") so that it can be the same words in a "you" document and a "the
  teacher" document. The bold lead differs (*you drafted* / *the teacher drafted*), as the existing
  items' leads already do.
- **Both documents' "Last updated" dates moved** to 13 September 2026 — the policy says of itself
  that the date changes with the page. Nothing asserts the date.
- **The visible label stays *Open in my mail app*** under every door; the chips above it, the
  strip's ready sentence, the `aria-label`, the note and the status line name Gmail / Outlook.
  Keeping the label static keeps the panel's copy in `index.html`, which is that panel's rule.
- **Line breaks in a compose URL are LF**, argued at `composeUrl()`; the laptop 👤 line is the
  reading that checks it. **The webmail ceiling is `null`** and the warning says it cannot know,
  still triggered at 2,000 as a conservative floor; argued at `ceilingFor()`.
- **The pref control lives inside `#outreachForm`**, so it goes down with the form in presentation
  mode. It names nobody, but a control drawn under a refusal that empties everything else would
  read as an oversight.
- **The WO-5.11 check's own comment** says it is "the ONLY check in the run that reads `target` or
  `rel`". That sentence is now history; the brief said byte-identical, so the correction is a note
  directly after the check rather than an edit inside it. TESTING.md § WO-5.11's same sentence is a
  dated record and was left as written.

## Not done, and why

- Nothing left undone inside the work order. The three 👤 lines need hardware. `verify-deploy.mjs`
  needs a deploy. `CHANGELOG.md` is the teacher's; a draft entry is below.
- Out-of-scope temptations declined: a per-door label on the anchor; a `cc` field for Outlook was
  kept but Outlook's `bcc` was not added; nothing detects a handler; no `window.open()`.
- The teardown hang is now four of four runs in this sitting; still not this work order's to fix.

## Draft CHANGELOG entry (for the teacher to accept, edit, or discard)

> **Where does your mail live?** The draft-an-email panel now asks once, per device, whether your
> mail is a mail app, Gmail in the browser, or Outlook on the web — and *Open in my mail app* opens
> the right one: a Gmail or Outlook compose in a new browser tab with everything filled in, and the
> app stays where it was. The iPad's Mail door is unchanged. The privacy policy and the FERPA guide
> say what the webmail door does with a draft, in the same words.
