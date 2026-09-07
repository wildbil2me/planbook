/*
  Google Drive sign-in — the token flow, and nothing else (WO-7.1).

  ── WHAT THIS IS ──

  One OAuth client, owned by us, verified by us. A teacher deploys nothing and configures nothing,
  which is the entire difference from the predecessor app: over there every teacher deployed their
  own Apps Script and so was their own unverified developer, and the "Google hasn't verified this
  app" warning could never be cleared for anybody. Here it gets cleared once, for everyone
  (WO-3.18, and WO-7.3 records the approval).

  Browser-only Google Identity Services token flow. No client secret, no backend, no redirect URI
  of ours, and NO REFRESH TOKEN — there is no such thing in this flow, which is why sync is a
  foreground act and why nothing in this app may be built on the assumption that it can happen
  while the teacher is not looking (docs/sync.md § Auth, and this work order's Traps line).

  ── WHAT THIS IS NOT ──

  It moves no data. Upload, download, `files.list`, `appProperties.docId` matching, the
  `rev`/`baseRev` comparison and the conflict copy are WO-7.2, and so is wiring the save
  indicator's `syncing` state. This file signs in, says so, and stops — which is why the panel copy
  in index.html says out loud that nothing is uploaded yet. A teacher who connects and expects to
  find her gradebook in Drive has been lied to by omission, and that is a worse defect than any
  bug in the handshake.

  This file imports src/live-region.js and nothing else. That is deliberate and it is the whole of
  "sign-out leaves the local document untouched": there is no path from here to src/store.js, so
  signing out cannot write, clear or reorder a single thing in IndexedDB. A later work order that
  needs the document should take the token from here rather than bring the store in.

  ── THE THREE DECISIONS THIS WORK ORDER HAD TO MAKE ──

  1. THE TOKEN LIVES IN MEMORY, AND ONLY IN MEMORY. `session` below is a module variable; a reload
     signs the teacher out. It is not student data and it is not a UI preference, so src/prefs.js's
     PREF_DEFAULTS would refuse it and should — but the reason not to persist it is stronger than
     "the door is shut". An access token is a bearer credential: anything holding it can read and
     write the files this app made in the teacher's Drive, with no password and no second factor.
     Written to localStorage it outlives the tab, survives a laptop handed to a substitute or a
     student, and sits in the one storage area this project has spent five work orders restricting
     to switch positions. What persisting it would buy is *nothing*: there is no refresh token, so
     the most it could preserve is the tail of one hour, and the thing that actually makes the next
     sign-in silent is the teacher's Google session — which is Google's cookie, not our storage.
     So: memory only, and a page reload is a sign-out. Argued rather than decided by omission,
     because "we never got round to persisting it" and "persisting it is wrong" read identically
     in a diff.

  2. THE CONTROL LIVES IN THE ABOUT MODAL, and the Backup & restore panel lost. Backup was the
     tempting answer — it is the app's other "what leaves this device" surface, and it has a
     section-label grammar ready to take one more row. It loses on the one sentence in docs/sync.md
     that a teacher must never have to unlearn: **sync is not a backup.** Drive holds one live copy
     that sync will happily overwrite with a newer one; the downloadable JSON is the safety net and
     stays mandatory whether or not sync is on. A "Connect Google Drive" button sitting under
     "Download a backup" teaches exactly the misconception that costs a term of grades — *I'm
     synced, so I'm backed up* — and a control's placement is a claim about what it does.
     About wins on the positive argument as well as that negative one: it already carries the
     sentence this control qualifies — "There is no account and no server: your data lives in this
     browser's own storage, and Google Drive sync is an opt-in extra you can ignore entirely" — and
     the modal's own comment about the two privacy links makes the case in general terms, that a
     footnote belongs beside the sentence it footnotes rather than in a settings screen this app
     does not have. The header was never a candidate: index.html measures its spare width at 390px
     under a coarse pointer at ~46px, and presentation mode spent it.

  3. THE FLAG IS THE ORIGIN. docs/sync.md says sync stays behind a flag until the client is
     verified, and WO-7.3's deliverable is "sync taken out from behind its flag" — so the flag had
     to be defined here, and it had to leave the sign-in reachable by the owner on the laptop today,
     because WO-3.18 cannot film a demo video of a control nobody can get to. `signInAvailable()`
     below answers with the page's own hostname, and three things fall out of that at once:
       · The owner reaches it. `tools/serve-https.mjs` serves `https://localhost:8443`, which is
         the client's ONLY authorized JavaScript origin (WO-3.10) — so the flag is open exactly
         where the handshake can succeed and shut everywhere it cannot.
       · The released app is untouched. On `planbook.hwgteach.com` this returns false, the section
         stays hidden, no Google script is ever fetched, and privacy.html's strongest sentence —
         "Planbook makes no network requests at all ... and no third-party code of any kind" —
         stays literally true for every teacher. A preference-shaped flag would have put a Google
         script one toggle away from all of them and made that sentence conditional. That is the
         argument that settled it.
       · The iPad shows the released app's About panel, which is correct: Google will not register
         a raw LAN address, so the handshake is drivable on the laptop only until a real origin is
         added to the client (WO-3.10 says so in as many words).
     WO-7.3 WIDENS THIS ONE FUNCTION, AND THAT IS ALL THAT IS LEFT OF THE PAIR. The two halves are
     this function and the OAuth client's authorized-origin list, and the console half is already
     paid: the client has carried `https://planbook.hwgteach.com` beside the loopback origin since
     2026-08-21 (confirmed 2026-08-24, recorded in WO-3.10's table). Do not book a console trip for
     it. The pairing rule still holds for any origin added later — widen one and not the other and
     you get a button that ends in Google's `origin_mismatch` — and today it is the code that is
     behind, which is the safe direction: nothing can reach a live handshake early. That is why
     `connect()` below refuses off-flag rather than trusting the section to stay hidden.

  ── THE ONE SCOPE, IN THE ONE PLACE ──

  SCOPE below is the only occurrence of the string in anything the browser loads, and
  tools/verify-shell.mjs asserts that by scanning every served file. That is not tidiness: the
  consent screen shows one line per scope string requested, so "exactly one scope" is guaranteed by
  there being exactly one string, requested from one call site. Never `spreadsheets` (it reads
  every spreadsheet the teacher owns), never a mail scope (outreach goes out through `mailto:`,
  which needs no permission at all), and not `openid`/`profile`/`email` for convenience — every
  extra string is another line on a screen a teacher reads and fears.
*/

import { announce } from './live-region.js';

/*
  The client from WO-3.10, which records it in plans/work-orders/phase-3-gradebook.md and explains
  at length why it belongs in a public file: for a browser client this is an identifier, not a
  credential. It ships in the served JavaScript of every app using Google Identity Services, so it
  is public the moment Planbook deploys. What protects it is the authorized JavaScript origin list
  in the Cloud console — which is why `signInAvailable()` below and that list are two halves of one
  fact. A client SECRET is a different thing, does not exist for this flow, and must never appear
  in this repository.
*/
const CLIENT_ID = '953887983230-ub72ee8rs6r6ejggn55l83pva3e8pedl.apps.googleusercontent.com';

/* The whole permission this app will ever ask for. See the header. */
const SCOPE = 'https://www.googleapis.com/auth/drive.file';

/* Google Identity Services, fetched on demand rather than from a <script> tag in index.html.
   Two reasons, and the second is the one that matters. A tag in the document would fetch this on
   every launch on every device — including the thousands of launches by teachers who will never
   turn sync on — which is a third-party request the privacy policy says this app does not make.
   And the app must work fully signed-out forever, which includes working with no network at all:
   sw.js precaches the shell, and a shell that cannot boot without a Google script is not a shell.
   It is deliberately NOT in sw.js's SHELL list — that list is same-origin by rule, and the fetch
   handler returns early for anything else. */
const GIS_SRC = 'https://accounts.google.com/gsi/client';

/*
  A token within a minute of lapsing is treated as already lapsed. A request that starts with five
  seconds left arrives expired, and the failure lands on whatever WO-7.2 was in the middle of
  rather than here where it can be re-asked cheaply.
*/
const FRESH_MARGIN_MS = 60 * 1000;

/*
  What to assume when Google answers without an `expires_in`. It always sends one (3599), so this
  is the shape of the guess rather than a number anybody will see — and it guesses SHORT on
  purpose: a credential of unknown lifetime that we treat as fresh for an hour is a silent failure
  waiting for the fifty-ninth minute, where one we treat as nearly-lapsed costs a silent re-auth.
*/
const ASSUMED_LIFETIME_MS = 5 * 60 * 1000;

/* How long to wait for Google before giving up and saying so. Two numbers because they are two
   different waits: the silent attempt either works or fails almost immediately, while the visible
   one includes a teacher reading an unverified-app screen, choosing between two accounts, and
   possibly finding her phone for a second factor. A single number would either abandon a real
   sign-in or leave the button dead for three minutes after a popup the teacher closed. */
const SILENT_TIMEOUT_MS = 25 * 1000;
const VISIBLE_TIMEOUT_MS = 180 * 1000;

/* ────────────────────────────── state ────────────────────────────── */

/*
  The whole of it, and all three of these die with the page.

  `session` is null or exactly three fields — see acceptTokenResponse(), which is where the
  three-field rule is the enforcement of "no refresh token is stored" rather than a formatting
  choice.
*/
let session = null;
/* A sentence for the teacher, or ''. Never a raw Google error string on its own: `popup_closed`
   is not something to put in a panel. */
let lastError = '';
/* True while a request is out. Guards a second popup, and greys the button. */
let busy = false;

/* The GIS loader and the token client are each created once and reused. `pending` is the resolve
   of the request in flight — GIS answers through callbacks it was handed at init time, so the
   promise-shaped wrapper has to park its resolver somewhere. */
let gisLoading = null;
let tokenClient = null;
let pending = null;
let pendingTimer = null;

const PANEL_ID = 'drivePanel';
const STATUS_ID = 'driveStatus';
const CONNECT_ID = 'driveConnectBtn';
const DISCONNECT_ID = 'driveDisconnectBtn';

/* ────────────────────────────── the flag ────────────────────────────── */

/*
  Is the sign-in reachable on this origin at all — decision 3 in the header.

  Loopback and nothing else — and IT IS THIS LIST THAT IS NARROW, NOT THE CLIENT'S. The client has
  authorized `https://planbook.hwgteach.com` beside `https://localhost:8443` since 2026-08-21, so
  the deployed origin would handshake today if this function let it; WO-7.3 is that one edit, and
  what it costs is privacy.html's "no third-party code of any kind" on the deployed origin.
  (WO-3.10, and `tools/make-cert.mjs` writes both loopback names into the certificate so that
  server answers this laptop's own browser); `127.0.0.1` is additionally what
  tools/verify-shell.mjs serves the app from, so the harness can drive every state below. A real
  handshake attempted from the harness's origin would come back `origin_mismatch`, which is
  correct and is not what the harness measures — it measures the state machine, which is the half
  no browser without a Google account can be made to reach.

  Loopback is a secure context by definition, which is GIS's own requirement, so a true answer
  here never means a script that will refuse to run.
*/
export function signInAvailable() {
  return hostAllowsSignIn(location.hostname);
}

/*
  The flag as a pure function of a hostname, split out for one reason: A PAGE CANNOT CHANGE ITS OWN
  HOSTNAME, so the arm that matters most — the SHUT one, which is the arm every teacher on the
  released app meets — is unreachable from a harness that can only ever measure the origin it was
  served from. Written this way, the whole truth table is drivable: tools/verify-shell.mjs asks it
  about `planbook.hwgteach.com` and about the LAN address the iPad uses, and gets false for both.

  WO-7.3's "sync taken out from behind its flag" is an edit to this list and to the OAuth client's
  authorized origins in the Cloud console. Neither half works alone — and the console half is done,
  as of 2026-08-21: both origins are registered. So what WO-7.3 has left here is this list.
*/
export function hostAllowsSignIn(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

/* ────────────────────────────── reading the state ────────────────────────────── */

function fresh() {
  return !!session && session.expiresAt - Date.now() > FRESH_MARGIN_MS;
}

/*
  Everything a screen needs, and NOT THE TOKEN. That is the point of the shape: a state object
  handed to a renderer, a log line or a future debug dump cannot leak a credential it never
  carried. accessToken() below is the one door to the string, and it has exactly one intended
  caller — the code WO-7.2 writes.

  `signedIn` is COMPUTED from the clock every time it is read, never stored as a flag. A lapsed
  token therefore reads as signed out everywhere at once, which is this work order's answer to
  "token expiry is handled without a silent failure": there is no state in this module that can go
  on claiming a connection after the token behind it has lapsed.
*/
export function authState() {
  return {
    available: signInAvailable(),
    signedIn: fresh(),
    /* Null rather than 0 when there is no session: "no token" and "a token with no time left" are
       different facts and a panel says different things about them. */
    expiresAt: session ? session.expiresAt : null,
    busy: busy,
    lastError: lastError,
    scope: SCOPE,
    /* THE FIELD NAMES OF WHAT IS HELD, AND NEVER THE VALUES. This is how "no refresh token is
       requested or stored" is checkable from outside the module without a second copy of the
       session living in the harness: the answer is `['token','expiresAt','granted']` or it is a
       defect. It is here rather than in an export of its own because this is already the one
       function that describes the state, and the edit it exists to catch — acceptTokenResponse()
       spreading the whole Google response instead of copying three fields — moves nothing else
       anywhere and passes every grep. */
    fields: session ? Object.keys(session) : [],
  };
}

/*
  The token, for the one caller that will need it. Null when there is none or when what there is
  has less than FRESH_MARGIN_MS left — a stale token is never handed out, because the caller cannot
  tell the difference and the request would fail somewhere less able to explain itself.
*/
export function accessToken() {
  return fresh() ? session.token : null;
}

/* ────────────────────────────── taking a token ────────────────────────────── */

/*
  THE SEAM, and the reason it is exported.

  A page cannot be handed a real Google token by a script — no headless browser has an account, a
  consent screen or a Google session — so the success path of this whole feature is unreachable
  from any harness. Everything after the token arrives is the same code either way, and this
  function is where it arrives: the GIS callback in requestToken() below is its only caller in the
  app, and tools/verify-shell.mjs calls it with a synthetic response to drive the states no click
  can reach. That is exactly the argument src/backup.js's restoreFromText() is exported on, in
  src/shell.js's seam comment — a page cannot be handed a real file either, and the read is the
  only part that differs.

  It is not a back door in any useful sense: it mints nothing. What it accepts is a token string,
  and a string that Google did not issue buys its caller precisely nothing from Google. Anything
  able to call it could equally have called GIS itself.

  THE THREE-FIELD COPY IS THE "NO REFRESH TOKEN" RULE, WRITTEN AS CODE. It reads `access_token`,
  `expires_in` and `scope` off the response and constructs its own object; it never keeps the
  response. So there is no field a refresh token could be sitting in, whatever Google sends and
  whatever a later edit to the request adds — the acceptance line becomes a property of the shape
  rather than a promise to check for. Refusing a `refresh_token` key would have been the other way
  to write this, and it is weaker: it only refuses the name it was told about.

  IT REFUSES A GRANT THAT IS NOT THE ONE WE ASKED FOR. `resp.scope` is what Google says it
  granted; if it is present and does not contain ours, this returns false and stores nothing. An
  absent `scope` is accepted, because the consent screen can only ever grant what was requested and
  exactly one string was requested — but it is recorded as unreported rather than assumed to be
  ours, so a state dump cannot claim a grant Google never described.
*/
export function acceptTokenResponse(resp) {
  if (!resp || typeof resp.access_token !== 'string' || !resp.access_token) {
    session = null;
    lastError = 'Google did not send an access token back, so Planbook is not connected. '
      + 'Try connecting again.';
    return false;
  }

  const granted = typeof resp.scope === 'string' ? resp.scope : '';
  if (granted && granted.split(/\s+/).indexOf(SCOPE) === -1) {
    session = null;
    lastError = 'Google granted a different permission than the one Planbook asked for, so nothing '
      + 'was connected. Planbook asks for one permission and works with no other.';
    return false;
  }

  const seconds = Number(resp.expires_in);
  const lifetime = Number.isFinite(seconds) && seconds > 0
    ? seconds * 1000
    : ASSUMED_LIFETIME_MS;

  session = {
    token: resp.access_token,
    expiresAt: Date.now() + lifetime,
    granted: granted || '(Google did not say)',
  };
  lastError = '';
  return true;
}

/* ────────────────────────────── talking to Google ────────────────────────────── */

/*
  Fetch the GIS library, once. Resolves when `google.accounts.oauth2` is there to be called and
  rejects with a sentence rather than a stack: the likeliest cause by far is no network, and the
  second likeliest is a school network that blocks accounts.google.com — which is a real
  configuration and not a bug, and the app has to keep working under it.
*/
function loadGis() {
  const ready = () => !!(window.google && window.google.accounts && window.google.accounts.oauth2);
  if (ready()) return Promise.resolve();
  if (gisLoading) return gisLoading;

  gisLoading = new Promise((resolve, reject) => {
    const el = document.createElement('script');
    el.src = GIS_SRC;
    el.async = true;
    el.defer = true;
    el.onload = () => {
      if (ready()) resolve();
      else reject(new Error('loaded but empty'));
    };
    el.onerror = () => reject(new Error('did not load'));
    document.head.appendChild(el);
  }).catch((e) => {
    /* Cleared so a later tap tries again — a teacher who connects to the wi-fi and taps twice
       should not be held to the first answer. */
    gisLoading = null;
    throw e;
  });
  return gisLoading;
}

/* Settle the request in flight, whichever of the three ways it ended. Idempotent: GIS can call
   both the callback and the error callback in some flows, and a second settle must be a no-op
   rather than a second resolve that unblocks a request nobody made. */
function settle(outcome) {
  clearTimeout(pendingTimer);
  pendingTimer = null;
  const done = pending;
  pending = null;
  busy = false;
  if (done) done(outcome);
}

/*
  One request to GIS, wrapped in a promise.

  `silent` is the whole of the difference the work order asks for: `prompt: ''` requests a token
  without showing anything, which succeeds when the teacher has already granted this scope and
  still has a Google session, and fails immediately when she has not. The visible attempt passes NO
  prompt at all rather than `prompt: 'consent'` — the library's default shows the account chooser
  and the consent screen where one is needed, while forcing `consent` would re-ask a teacher who
  granted it this morning for no reason.

  The timeout is not belt-and-braces. GIS answers through callbacks on a popup it owns; a popup
  that is closed by the operating system, or a device that sleeps mid-flow, can leave neither
  callback fired — and without this the button stays greyed for the rest of the session with no
  explanation, which is the silent failure this work order's fifth acceptance line is about.
*/
function requestToken(silent) {
  if (pending) {
    return Promise.resolve({
      ok: false,
      why: 'Planbook is already waiting for Google. Finish or close that window first.',
    });
  }

  return loadGis().then(() => {
    if (!tokenClient) {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        /* THE ONE PLACE THE SCOPE IS REQUESTED. One string, one call site — see the header. */
        scope: SCOPE,
        callback: (resp) => {
          if (resp && resp.access_token) {
            settle({ ok: acceptTokenResponse(resp), why: lastError });
            return;
          }
          /* GIS reports some refusals through the success callback with an `error` field. */
          settle({ ok: false, why: describe(resp && resp.error) });
        },
        error_callback: (err) => settle({ ok: false, why: describe(err && err.type) }),
      });
    }

    return new Promise((resolve) => {
      pending = resolve;
      busy = true;
      pendingTimer = setTimeout(
        () => settle({ ok: false, why: 'Google did not answer. Nothing was connected — try again.' }),
        silent ? SILENT_TIMEOUT_MS : VISIBLE_TIMEOUT_MS
      );
      try {
        tokenClient.requestAccessToken(silent ? { prompt: '' } : {});
      } catch (e) {
        settle({ ok: false, why: 'Planbook could not open the Google sign-in window.' });
      }
    });
  }, () => ({
    ok: false,
    why: 'Planbook could not reach Google to sign in. Check the network — and note that some '
      + 'school networks block it. Everything else in Planbook works either way.',
  }));
}

/* Google's own words are identifiers, not sentences. The ones a teacher can act on get a sentence;
   everything else gets an honest shrug with the identifier appended so a bug report carries it. */
function describe(type) {
  if (type === 'popup_failed_to_open') {
    return 'The browser blocked the Google sign-in window. Allow pop-ups for Planbook and try again.';
  }
  if (type === 'popup_closed') return 'The Google sign-in window closed before it finished.';
  if (type === 'access_denied') return 'Google did not grant access, so nothing was connected.';
  return 'The sign-in did not finish, so nothing was connected'
    + (type ? ' (Google said: ' + String(type) + ')' : '') + '.';
}

/* ────────────────────────────── what the two controls do ────────────────────────────── */

/*
  Connect — silent first, visible when that fails, exactly as the deliverable says.

  The visible attempt is fired from the failure of the silent one and therefore may land outside
  the browser's window of trust for the tap that started it. That is why `popup_failed_to_open`
  gets a sentence of its own above: the state it leaves is "tap Connect again", the second tap is
  its own gesture, and the panel says so rather than looking broken.
*/
export async function connect() {
  if (!signInAvailable()) {
    /* Refused here and not only hidden in the markup. The section is hidden off-flag, but a hidden
       control is a cosmetic flag and this one has to be real — see decision 3. */
    lastError = 'Google Drive sync is not switched on in this build of Planbook.';
    refreshAuthChrome();
    return false;
  }
  if (busy) return false;

  lastError = '';
  busy = true;
  refreshAuthChrome();

  let out = await requestToken(true);
  if (!out.ok) out = await requestToken(false);

  busy = false;
  lastError = out.ok ? '' : (out.why || describe(null));
  refreshAuthChrome();
  announce(out.ok
    ? 'Connected to Google Drive.'
    : 'Planbook is not connected to Google Drive. ' + lastError);
  return out.ok;
}

/*
  Disconnect.

  THE LOCAL STATE GOES FIRST AND THE REVOKE SECOND, which is the order that makes the acceptance
  line true whatever Google does: the teacher is signed out of this app the instant she taps, and a
  revoke that throws, hangs or is blocked by the network cannot leave a session behind. The revoke
  is still worth making — dropping our only reference to a token leaves it valid at Google for the
  rest of its hour, and "signed out" ought to mean Google agrees. The price is that the next
  connect shows the consent screen again, which for an opt-in feature is the right price.

  It touches no year document, and it cannot: this file imports src/live-region.js and nothing
  else. That is the whole implementation of "sign-out leaves the local document untouched".
*/
export function disconnect() {
  const token = session && session.token;
  session = null;
  lastError = '';
  busy = false;

  if (token && window.google && window.google.accounts && window.google.accounts.oauth2
      && typeof window.google.accounts.oauth2.revoke === 'function') {
    try {
      window.google.accounts.oauth2.revoke(token, () => {});
    } catch (e) {
      /* Swallowed on purpose. The local sign-out above already happened, and a failed revoke is
         one token expiring on its own within the hour rather than something to tell a teacher
         about mid-class. */
    }
  }

  refreshAuthChrome();
  announce('Signed out of Google Drive. Nothing on this device changed.');
  return true;
}

/*
  A fresh token for a caller that needs one now — WO-7.2's door, and IT HAS ONE AS OF 2026-09-07.
  This comment read "it has no caller in this build" until that day, and named the save indicator's
  `syncing` state as the same shape: a thing built for the next work order and unreachable until it
  arrived. Both were true for WO-7.1 and both stopped being true in the same landing.
  src/drive-sync.js calls this once per tap of Sync, before it reads or writes anything, so a
  sign-in that lapsed is found at the top of the flow rather than in the middle of a transfer — and
  it is still the only caller. The half of Phase 7 that owns the token is this file; the half that
  spends it is that one, and the dependency points from there to here and never back.

  SILENT ONLY, AND NEVER A POPUP. A visible Google window with no tap behind it is blocked by every
  browser worth supporting, and one that got through mid-lesson would be worse than the failure it
  was avoiding. So this renews quietly or it fails — and when it fails it fails LOUDLY IN THE
  MODEL: null back, `lastError` set to a sentence, and the panel repainted. Whatever calls this
  has to show that sentence; a caller that swallows the null is the silent failure the fifth
  acceptance line forbids, and it will be reviewable as such because the reason is sitting in
  authState() waiting to be read.
*/
export async function ensureFreshToken() {
  if (fresh()) return session.token;
  if (!signInAvailable()) return null;

  const out = await requestToken(true);
  lastError = out.ok ? '' : (out.why || describe(null));
  refreshAuthChrome();
  return out.ok ? session.token : null;
}

/* ────────────────────────────── the panel ────────────────────────────── */

/*
  Paint the About modal's Drive section from the state above.

  Called when the About modal opens, and after every flip — not at boot, because everything it
  writes lives inside a modal nobody has opened yet and a fact about an access token goes stale
  faster than any other line in this app. src/shell.js does the calling, on the same path that
  writes the build line, for the same reason: a panel that opens and then fills in is a panel that
  flickers.

  The whole section is hidden when the flag is shut, and that is the flag a teacher meets. Nothing
  in the About prose contradicts it — that modal already says Drive sync "comes after" the screens
  this build has.

  THE EXPIRY IS A CLOCK TIME AND NOT A COUNTDOWN. "Expires at 2:47" stays true while the panel sits
  open; "expires in 58 minutes" is wrong a minute later, and a stale number in the one place that
  reports on a credential is exactly the shape of failure this work order is trying to avoid.
*/
export function refreshAuthChrome() {
  const panel = document.getElementById(PANEL_ID);
  if (!panel) return;

  const available = signInAvailable();
  panel.classList.toggle('hidden', !available);
  if (!available) return;

  const state = authState();
  const status = document.getElementById(STATUS_ID);
  const connectBtn = document.getElementById(CONNECT_ID);
  const disconnectBtn = document.getElementById(DISCONNECT_ID);

  if (status) {
    /* `.class-error` is the panel grammar's red box and `.class-hint` its quiet note — the same
       pair every other dialog in this app uses, swapped rather than layered so the line is only
       ever one of the two. */
    status.className = state.lastError ? 'class-error' : 'class-hint';
    if (state.lastError) {
      status.textContent = state.lastError;
    } else if (state.busy) {
      status.textContent = 'Waiting for Google…';
    } else if (state.signedIn) {
      const at = new Date(state.expiresAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      status.textContent = 'Connected to Google Drive. This access ends at ' + at
        + ', and closing Planbook ends it sooner — Planbook keeps no sign-in on this device.';
    } else {
      status.textContent = 'Not connected. Planbook works exactly the same either way.';
    }
  }

  if (connectBtn) {
    connectBtn.classList.toggle('hidden', state.signedIn);
    connectBtn.disabled = state.busy;
  }
  if (disconnectBtn) disconnectBtn.classList.toggle('hidden', !state.signedIn);
}
