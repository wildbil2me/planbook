# `tools/` — scripts, run by hand

| Script | What it does |
|---|---|
| `verify-shell.mjs` | Drives the real app in headless Edge/Chrome and **measures** what a stylesheet review can only assert. `node tools/verify-shell.mjs` |
| `make-icons.mjs` | Draws the home-screen icons and writes them as PNGs into `icons/`, using `node:zlib` and nothing else. `node tools/make-icons.mjs` |
| `make-cert.mjs` | Mints a local CA and a server certificate into `certs/`, so the LAN address is a secure context. `node tools/make-cert.mjs` |
| `serve-https.mjs` | Serves the repo over HTTPS for a device sitting, plus a plain-HTTP page that hands the iPad the CA. `node tools/serve-https.mjs` |

The demo build lands in Phase 8 (WO-8.2), modelled on Roll Call!'s `tools/build-demo.mjs`.

## The rule

**Anything scripted is a `.mjs` file here, run under bare Node, with zero dependencies.**

```
node tools/build-demo.mjs
```

That is the whole invocation. There is no `npm run`, because there is no `package.json` — and
there is not going to be one, not even "just for scripts." A `package.json` is how a bundler
arrives six weeks later; it has been proposed and rejected before (see `CLAUDE.md`, and
`plans/b-hygiene.md` in Roll Call!).

- **`.mjs`, not `.js`.** Without a `package.json` declaring `"type": "module"`, Node reads `.js`
  as CommonJS. The extension is what makes `import` work here — it isn't a style preference.
- **Node's standard library only.** `node:fs`, `node:path`, `node:url`. If a script needs a
  dependency, the script is doing too much.
- **No script may be required to run the app.** Everything in `tools/` builds something
  optional — a demo, a report, a fixture. `index.html` and `src/` are served as they sit on
  disk, and a teacher's laptop never runs Node. `make-icons.mjs` is the shape to copy if a
  future asset needs generating: its **output is committed**, it is run by hand when the
  drawing changes, and no deploy, server, or page load ever invokes it. A script whose output
  has to be regenerated to serve the app is a build step by another name.
- **Exit non-zero on failure and say what failed.** These get run once every few months by
  someone who has forgotten how they work.

## Testing on the iPad — `make-cert.mjs` and `serve-https.mjs`

```
node tools/make-cert.mjs      # once per machine, and again if the LAN address changes
node tools/serve-https.mjs    # every sitting
```

Then open **`http://<address>:8080/`** on the iPad — the setup page — and work down it. The app
itself is on **8443, over HTTPS**.

**Why not the static server `TESTING.md` used for WO-1.2.** A service worker requires a secure
context. `localhost` is specially exempted from that rule; a LAN address is not. So
`http://192.168.50.142:8000` cannot register `sw.js` at all — and the failure does not look like
one, because **Safari's own HTTP cache will re-serve the pages after the Wi-Fi goes off**. The
offline walk passes, the tick goes in, and what was actually proven is that Safari has a cache.
This is the WO-1.2 safe-area miss in a new place: a check that reports green while measuring
nothing. `serve-https.mjs` sends `no-store` on everything for exactly that reason, leaving only
the service worker able to answer. (`no-store` does not affect the precache — Cache Storage is
explicit and ignores `Cache-Control`.)

These do not break the no-script-required rule above. A teacher's tablet loads the deployed site
over ordinary HTTPS; this is scaffolding for testing that on hardware before there is a deploy.

**`certs/` is gitignored, and is the one thing `tools/` writes that is not committed.** It holds
two private keys, one of them a CA root that a machine has been told to trust. Regenerating costs
one command.

### Four things that fail closed and say nothing useful

1. **Installing the root is not trusting it.** iOS puts a newly installed root in a disabled
   state. Settings → General → About → **Certificate Trust Settings**, switch it on. Until that
   toggle is flipped nothing changes, and the symptom is a generic certificate warning that
   looks like the certificate is wrong rather than untrusted.
2. **There is no click-through for a service worker.** Safari will let you past the interstitial
   to *read* a page over an untrusted certificate, and still silently refuse to register a
   worker behind it. The app looks broken, or worse, looks fine until the network goes off.
3. **iOS ignores Common Name entirely**, and needs `IP:` in `subjectAltName` for an
   address-based URL, plus ≤398 days, `serverAuth`, and EC P-256 / RSA-2048 upward.
   `make-cert.mjs` sets all of it; the list is in its header because a hand-rolled replacement
   will get one of them wrong.
4. **A DHCP lease that moved leaves a valid certificate for the wrong host.** Signed, unexpired,
   and refused — reported identically to every other certificate problem. `serve-https.mjs`
   compares the certificate's addresses against the machine's on startup and says so.

And one that is not a certificate problem at all: **Windows Defender prompts on first bind**, and
a dismissed prompt — or a network typed Public — leaves the port open here and invisible from the
tablet. Symptom is "Safari cannot open the page", same as a wrong address. Load the HTTPS URL in
this laptop's browser first; if it works here and not there, it is the firewall.

## `verify-shell.mjs` — and why it is not a test framework

It is one `.mjs` under `tools/`, zero dependencies, run by hand. `CLAUDE.md` and Roll Call!'s
`plans/b-hygiene.md` rule out linters and test frameworks; Roll Call!'s
`design/execution-guide.md` §7 already says to verify by driving the built demo in headless
Edge over CDP. This is that, written down. **`TESTING.md` is still the gate** — nothing here
closes a 👤 item, because no emulator has a thumb or a safe-area inset.

It exists because WO-1.2 shipped `.search-box { min-height: 44px }` around a **19px input**.
The wrapper measured 44px, the input did not, and tapping above the text did nothing. A
stylesheet review calls that line compliant. Measuring it does not.

**It went green at WO-1.3**, 28 of 28. The one check that used to fail by design — the
`viewport-fit=cover` precondition, without which iOS resolves every `env(safe-area-inset-*)` to
`0` and the padding is inert — passes now that WO-1.3 set the meta value. That the run is green
still closes no 👤 item: it drives a page, not an installed app, and it has never seen a service
worker.

### Driving a browser over CDP — four traps, all of which first look like app defects

Every one of these was hit and diagnosed twice, by two different agents, before it was written
down here. That is the entire reason this section exists.

1. **A modern `CSSStyleRule` has its own empty-but-truthy `.cssRules`** (CSS nesting). So the
   obvious rule walk — `if (r.cssRules) { walk(r.cssRules); continue; }` — treats every
   ordinary style rule as a container, recurses into nothing, and skips it. A 123-rule
   stylesheet reports 3, every selector search returns empty, and **nothing throws**. It reads
   as a clean pass. Process the rule, *then* recurse into children. `window.__eachRule` in
   `verify-shell.mjs` is the fixed version; use it rather than writing a second walker.
2. **Headless Chromium with no visible frame never advances a transition or a keyframe.**
   `getComputedStyle` and `getBoundingClientRect` return start-of-animation values, so
   `.modal-close` measures 42.24px — which is 44 × 0.96, the `srIn` keyframe's opening scale —
   and reads exactly like a failed touch target. Inject
   `*,*::before,*::after{transition:none!important;animation:none!important}` before measuring,
   and again after every reload.
3. **`Emulation.setEmulatedMedia`'s `features` list does not reach `pointer`.** It needs
   `setTouchEmulationEnabled` plus `mobile: true` device metrics. Get it wrong and you measure
   the desktop pass and report green — so **assert `matchMedia('(pointer: coarse)').matches`
   before trusting any measurement below it**.
4. **A fixed `--remote-debugging-port` collides** with a previous run that did not shut down
   cleanly, and the failure reads as "the app broke." Pass `--remote-debugging-port=0` and read
   the chosen port from `<user-data-dir>/DevToolsActivePort` (line 1 is the port, line 2 is the
   websocket path).
5. **A fixed sleep before a measurement is a race, and it hides defects rather than only causing
   flakes.** Wait on the condition — poll for the state you expect, with a timeout — and where the
   state can be transient, require it to *hold* for a beat. A single sample cannot tell a finished
   operation from the gap between two attempts.

   The forced-save-failure check slept `setTimeout(150)` and then read the chip. It failed
   intermittently on a green build, was investigated once, and was written off as "a flaky check,
   not a store defect." That was half right. Replacing the sleep with a poll made it fail
   *consistently*, which is how the actual behavior surfaced: a stale max-wait timer restarts a
   permanently-failed write about five seconds later, and `MAX_WAIT_MS` is 5000, so the first
   poll deadline landed exactly on it. The 150 ms sleep had been sampling before the defect
   became visible.

   This is the same shape as the four traps above — a check that reports green while measuring
   nothing — except that here the check was *believed* to be the broken part, which bought the
   underlying behavior another round of not being looked at.

### Two rules that follow from those

- **Guard every sweep against a vacuous pass.** Assert the walker saw a plausible number of
  rules, that the measurement found a plausible number of controls, that the emulated pointer
  really is coarse. An empty result set and a clean result set are the same value, and three of
  the four traps above produce an empty one silently.
- **A skip is announced, never silent.** When a fixture is missing — the WO-1.2 component shelf
  goes away at WO-1.10, and `window.planbook` with it — the check prints `SKIP` with a reason
  and is counted separately. A suite of 28 checks that quietly becomes a suite of 4 still
  prints green.
