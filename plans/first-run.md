# First run: a landing page, then two ways in

**Design notes — 2026-10-12. Status: proposed, unbuilt, not yet drawn.**

The owner looked at the deployed app as a stranger and found it **wordy and uninviting**. This file
holds the direction the conversation reached so it survives until there is a sitting to draw it. It
is not a work order and books nothing: the next step is a mockup under `design/mockups/` (per
`PROTOCOL.md`), the owner's ruling on it, and then M/S work orders — probably folded into or cut
ahead of [WO-8.6](work-orders/phase-8-packaging.md#wo-86--onboarding).

## What a stranger meets today

1. **The front door** (WO-8.16) — the about.html lede, then a device-picked panel whose main content
   is install instructions, and a *Use it in this browser* button.
2. **The home screen** — the amber install banner (a long iPad-Safari warning, shown even on a
   laptop, immediately after the visitor chose the browser), then *No classes yet*, *Add your first
   class*, and under a hairline the WO-7.9 doors: *Open from Google Drive* and *Restore a backup
   file*.

Three screens' worth of warnings and doubts, and one line about what the app does.

## The direction

**An empty device asks one question, not three.** A returning teacher on a device that has their
year never sees any of this — the app opens straight onto their classes. So anyone who reaches setup
is on an empty device, and the only question is whether they are starting fresh or bringing a year
that lives somewhere else. "Returning user" and "returning user, new device" were the same path.

```
Landing page          the pitch and one button — no install steps
   │
   ▼  (iPad only) install first — see "The Safari trap"
   │
Nothing is stored in this browser yet.
Planbook keeps everything on the device you use it on.
   ├─ A  I'm new to Planbook        → the new-user experience (WO-8.6's first-run flow)
   └─ B  I already use Planbook     → the import walkthrough
```

- **Landing page.** The lede, three or four lines of what it does, the privacy promise in a
  sentence, **Get started**. Install instructions are what make the current door read like a manual.
- **The headline is neutral on purpose.** *"Your data has not been loaded in this browser"* was
  considered and set aside: it assumes the reader has data, and most readers here do not — to a
  stranger it reads as an error. The second line carries the one idea the install and backup
  warnings later spend paragraphs on, at the moment it explains the screen.
- **A — new.** Name the year, add the first class, paste the roster, mark attendance.
- **B — the import walkthrough**, three short steps:
  1. *Where is your year?* On another device that syncs to Drive, or in a backup file.
  2. *Get it.* Sign in and pick it, or choose the file.
  3. *Confirm what is in it* — classes, student count, last changed — *Open it here?* — then the home
     screen with their own classes.

## Things that are already true and constrain it

- **The Drive door does not work for strangers yet.** While the OAuth client is in Testing only
  listed test users can sign in. Until Google verifies the app, B leads with the backup file.
- **The Safari trap.** On an iPad, Safari and the home-screen app keep separate storage, so a teacher
  who tried Planbook in Safari and then installed it opens the icon to an empty app with their year
  stranded in Safari. Installing *before* setup on iPad avoids creating the stranded year; B also
  carries a line for the teacher who already has one: open it in Safari, download a backup, restore
  it here. *(Believed not to happen on laptop Chrome/Edge, where tab and installed window share
  storage — verify before relying on it.)*
- **Nothing can be fetched from Drive at launch without a tap** (WO-7.10: Google has no silent
  sign-in in a browser). So "up-to-date data loads automatically" is not buildable. What is: on an
  opted-in device whose copy is stale, a launch prompt — *Last synced 3 days ago on this iPad.
  [Sync now]* — one tap, inside the gesture Safari needs. The header's sync button already reads
  freshness (WO-7.5). **Open question: what counts as stale.** Too eager and it shows every launch
  and gets dismissed by reflex.

## What it would undo

- **WO-8.16's ruling that the door's words are lifted from `about.html`**, never retyped. A shorter
  pitch means `about.html` gets shorter too, or the door gets its own words — which that ruling
  forbids. Decide which before drawing.
- **The WO-7.9 doors under the home screen's empty state** move into B, leaving the empty state
  with *Add your first class* alone.

## Fix regardless

The **install banner** should not fire on the first launch after the visitor chose the browser at
the door, and should not use iPad wording on a laptop. Small, separable, and worth booking on its
own whatever is decided above.
