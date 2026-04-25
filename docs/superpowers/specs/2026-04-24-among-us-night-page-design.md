# Among Us Night Page — Design Spec

**Date:** 2026-04-24
**Status:** Draft for implementation

## Overview

A static, GitHub Pages-hosted "homebase" site for a recurring Among Us friend-group game night. The v1 surface is the upcoming event (date/time/RSVP), the predefined crew roster, a Discord invite, and a simple gallery of past nights. Heavy Among Us flair: dark space background, drifting stars, asteroids, an occasional wandering crewmate, an "emergency meeting" red flash on RSVP, background music, and hover/click SFX gated behind a "TAP TO BOARD" splash.

Out of scope for v1: leaderboards, live attendee lists, admin dashboards, custom domain, multi-event scheduling, full i18n.

## Goals

- Serve as a single-page invitation + light hub for upcoming and past Among Us nights.
- Feel distinctly Among Us — visual, motion, and audio.
- Stay fully static (GitHub Pages, no runtime backend) with a simple "edit JSON, push to git" content workflow.
- Make RSVPs visible to the friend group via Discord, not on-page.

## Non-Goals

- Public attendee list, polls, or stats on the page itself.
- Real-time updates without a redeploy.
- Admin UI or authenticated flows.
- Pixel-accurate Among Us asset reproduction (assets are CC0 / original — Innersloth assets are not used).

## Architecture

Pure vanilla HTML / CSS / JS, no build step, no `package.json`, no `node_modules`. One dependency vendored as a file: Howler.js (~30 KB) for audio playback (pooling, fades, mute control).

Hosted on GitHub Pages, deployed via GitHub Actions to allow webhook-URL injection from a repository secret at deploy time.

### File Layout

```
AmongUsNightPage/
├── index.html              # Single-page entry (splash + main UI)
├── css/
│   ├── theme.css           # Colors, fonts, base layout
│   ├── animations.css      # Stars, asteroids, crewmate walk, RSVP flash
│   └── splash.css          # Splash overlay
├── js/
│   ├── main.js             # Boot, data loading, splash dismissal
│   ├── audio.js            # Howler setup, mute toggle, hover/click SFX
│   ├── rsvp.js             # Discord webhook POST + UI feedback
│   ├── gallery.js          # Past Nights lightbox
│   ├── animations.js       # Asteroid/crewmate spawning timers
│   └── config.js           # Holds webhook URL placeholder; injected at deploy
├── vendor/
│   └── howler.min.js       # Howler.js (vendored, no npm)
├── data/
│   ├── event.json
│   ├── crew.json
│   ├── gallery.json
│   └── discord.json
├── assets/
│   ├── audio/              # music.mp3, hover.mp3, click.mp3, rsvp.mp3
│   ├── crew/               # wandering-crewmate sprite frames
│   └── gallery/            # photos from past nights, organized by date
├── .github/
│   └── workflows/
│       └── deploy.yml      # Inject webhook secret + deploy to Pages
└── README.md               # Update guide
```

`js/config.js` is committed with a placeholder string (e.g. `"__WEBHOOK_URL__"`); the deploy workflow rewrites this from `secrets.DISCORD_WEBHOOK_URL` before publishing.

### Module Boundaries

Each JS file has one job and exposes a small surface to `main.js`:

- **`main.js`** — boots everything. Loads the four JSON files in parallel, dismisses the splash on first click, mounts the page sections, kicks off `audio`, `animations`, `rsvp`, and `gallery`.
- **`audio.js`** — initializes Howler with the music + SFX assets, exposes `playMusic()`, `playSfx(name)`, `setMuted(bool)`, `isMuted()`. Persists mute state to localStorage.
- **`rsvp.js`** — exposes `submitRsvp({ name, color, episode })`. Handles POST to webhook, success/failure UI, localStorage `rsvp_sent_<episode>` flag, the emergency-meeting flash effect.
- **`gallery.js`** — exposes `mount(galleryData)`. Renders the strip and owns the lightbox open/close behavior.
- **`animations.js`** — exposes `start()`. Spawns asteroids and the wandering crewmate on internal timers; static stars are pure CSS.
- **`config.js`** — exports `{ WEBHOOK_URL }`.

Boundaries should stay clean: `audio.js` should be replaceable without touching `rsvp.js`. `rsvp.js` calls `audio.playSfx('rsvp')` rather than reaching into Howler directly.

## UX Flow

### Splash (first visit)

- Page loads. Background: dark space gradient with drifting stars (CSS only, no audio).
- Full-screen overlay with center text: "⬡ TAP TO BOARD ⬡" (pulsing).
- Any click anywhere → overlay fades out (~600ms), Howler initializes, background music starts at low volume, hover/click SFX become active. localStorage flag `boarded=true` set.

### Splash (revisit, `boarded=true`)

- Same overlay still appears for ~400ms with text "⬡ TAP TO RE-BOARD ⬡". Required so Howler still has its first user gesture (browser autoplay rule). Single click dismisses.

### Main page

- **Hero "INCOMING TRANSMISSION" panel** — date/time/episode title, two buttons: **★ I'M IN ★** and **DISCORD →**. Red border with subtle glow.
- **Crew Roster strip** — predefined crewmates as colored squares with names below. Each crewmate tile is itself clickable as an RSVP shortcut (click a tile → confirm modal "RSVP as Tim?" → submit). Trailing dashed "+ you" tile opens an inline mini-form (name input + color picker) → submitting RSVPs as a guest.
- **Two-column row** — Discord panel (server name + "→ join the channel"); Past Nights panel (4 thumbnail strip; click any → lightbox modal showing that night's full gallery).
- **Animated background layers** behind everything: starfield (slow drift, multiple z-depths), asteroids (slower, occasional spawn), wandering crewmate (every 30–60s, walks across screen at varying y-offsets).
- **Mute toggle** in top-right corner — small speaker icon, persists choice to localStorage.

### RSVP entry points

There are three ways to start an RSVP, all of which converge on the same submission step:

1. **Hero I'M IN button** → opens a small "WHO ARE YOU?" chooser overlay listing the predefined crew + a "Guest" option. Picking a crew member submits as them; picking Guest opens the +you guest form.
2. **Click a crew roster tile** → confirm modal "RSVP as Tim?" with a single Confirm button → submits.
3. **Click the +you tile** → guest form (name + color picker) → Submit.

Once submitted, all three paths run the same RSVP flow below.

### RSVP click flow

1. Button → "TRANSMITTING…" state, disabled.
2. POST to webhook with payload (see Data Flow below).
3. On success: red "EMERGENCY MEETING" flash overlay pulses ~800ms, alert SFX plays, button settles into "TRANSMISSION SENT ✓" disabled state. localStorage `rsvp_sent_<episode>=true` set.
4. On failure (network/webhook gone): button → "TRANSMISSION FAILED — open Discord", Discord button gets a glow highlight.

If `rsvp_sent_<episode>=true` is already in localStorage on page load, the I'M IN button starts in the disabled "TRANSMISSION SENT ✓" state.

## Data Files

All four files are loaded in parallel via `fetch()` on boot. If any individual file fails, the corresponding section shows a small "—" placeholder and the rest of the page still renders.

### `data/event.json`

```json
{
  "episode": 7,
  "title": "Among Us Night #07",
  "date": "2026-05-01",
  "time": "20:00",
  "timezone": "America/Chicago",
  "notes": "Bringing back the airship. Sussy."
}
```

Date/time are formatted client-side into the hero display. Format rule: if the event is within the next 6 days from page-load `Date.now()`, show day-of-week only ("FRIDAY · 8 PM"); otherwise show short month + day ("FRI · MAY 1 · 8 PM"). `timezone` is an IANA zone string; the formatter converts to that zone for display. `episode` is used as the localStorage key suffix for the RSVP flag and in the Discord webhook payload.

### `data/crew.json`

```json
[
  { "name": "Tim",    "color": "#ff4747" },
  { "name": "Alex",   "color": "#5b8dff" },
  { "name": "Sam",    "color": "#3eff7a" },
  { "name": "Jordan", "color": "#ffe94c" }
]
```

Order in the file = order on the page. `color` is any valid CSS color string.

### `data/gallery.json`

```json
[
  {
    "date": "2026-04-15",
    "title": "Night #06 — Polus chaos",
    "cover": "assets/gallery/2026-04-15/cover.jpg",
    "photos": [
      "assets/gallery/2026-04-15/01.jpg",
      "assets/gallery/2026-04-15/02.jpg"
    ],
    "note": "Riley got ejected three times in a row."
  }
]
```

Newest first. The strip displays the last 4 covers; clicking any opens that night's full gallery (cover + photos) in a lightbox.

### `data/discord.json`

```json
{
  "serverName": "The Skeld Crew",
  "inviteUrl": "https://discord.gg/abcd1234"
}
```

## Data Flow — RSVP

1. User clicks I'M IN (predefined crew member identified via the roster click that opened the panel) **or** submits the +you guest form.
2. `rsvp.js` builds payload:
   ```json
   { "content": "🚀 Tim is in for Night #07" }
   ```
   `content` is composed from the chosen name + episode title.
3. `fetch(config.WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })`.
4. On 2xx response: success path (flash, SFX, disable, localStorage flag).
5. On non-2xx or network error: failure path.

Client-side throttle is purely UX, not abuse prevention — there is no backend to enforce it.

## Animation Layers

All animations are CSS-driven; `animations.js` only owns timing for spawning asteroids and the wandering crewmate.

- **Stars** — three layers of `<div>` elements with `background-image: radial-gradient` star sprites, each layer with a different `transform: translateY` keyframe duration (e.g. 90s / 140s / 210s). Pure CSS, no JS.
- **Asteroids** — `animations.js` injects an asteroid `<div>` every 8–15s at a random y, removes it after its CSS keyframe completes (transform from `translateX(110vw)` to `translateX(-20vw)`).
- **Wandering crewmate** — same pattern, every 30–60s, but with a small bobbing animation overlaid via a nested element. CC0/original sprite at `assets/crew/wanderer.png`.
- **Emergency Meeting flash** — a fixed-position full-viewport div with `background: rgba(255,71,71,0.4)` and a single keyframe pulse, added on RSVP success and removed after the keyframe finishes.

## Audio

Howler.js handles all sound playback. All audio is gated behind the splash dismissal so first-user-gesture autoplay rules are satisfied.

- **Background music** — looping, low volume (~0.3), faded in over 1s after splash.
- **Hover SFX** — short blip, played on `mouseenter` of buttons and crew roster tiles.
- **Click SFX** — confirmation blip, played on any button click.
- **RSVP SFX** — alert/alarm sound, played on RSVP success.

`audio.js` exposes `setMuted(bool)`. Mute state persists in localStorage (`muted=true|false`). Mute toggle UI is a small speaker icon top-right.

Audio assets are CC0 / royalty-free (e.g. freesound.org, OpenGameArt) — not original Among Us audio.

## Webhook Security & Deployment

The Discord webhook URL is sensitive: a public URL allows anyone with it to post to the channel. Strategy:

- `js/config.js` is committed with the literal placeholder string `__WEBHOOK_URL__`.
- `.github/workflows/deploy.yml` runs on push to `main`:
  1. Checkout repo
  2. `sed -i "s|__WEBHOOK_URL__|${DISCORD_WEBHOOK_URL}|" js/config.js` (with the secret bound from `secrets.DISCORD_WEBHOOK_URL`)
  3. Upload as GitHub Pages artifact
  4. Deploy via `actions/deploy-pages@v4`
- GitHub Pages source: **GitHub Actions** (not "deploy from branch") so the workflow can publish.
- Visitors still receive the webhook URL in their browser (it's bundled into the deployed `config.js`); the protection is only against the URL leaking via the **repo**, not against client-side inspection. If abuse occurs, rotate the webhook in Discord and update the secret.

## Error Handling

- **JSON file fetch failure** — log to console, render section with "—" placeholder, continue.
- **Webhook POST failure** — UI feedback per RSVP click flow; user is directed to Discord directly.
- **Audio asset load failure** — Howler emits a load error; `audio.js` swallows it silently and `playSfx`/`playMusic` become no-ops. Page remains fully usable.
- **Image load failure (gallery)** — broken-image fallback via `onerror` handler; lightbox still opens for the night.
- **localStorage unavailable** (e.g. private browsing) — all reads default to `false`/unset; mute and RSVP sent flags simply won't persist across sessions. No errors thrown.

## Testing

Manual testing only — automated tests are overkill for v1.

Smoke checks before each deploy:

- Splash dismisses on first click; music begins; SFX fires on hover.
- I'M IN posts to a **test** Discord channel before pointing at the real one.
- Gallery lightbox opens, navigates, closes (Esc + click outside).
- Mute toggle works and persists across reload.
- Layout doesn't break at 375px width (iPhone SE).
- Lighthouse pass: no severe a11y / perf regressions.

Browsers: latest Chrome, Firefox, Safari, Edge (desktop), iOS Safari, Android Chrome.

## Open Questions for Implementation

- Exact crew names + colors (currently placeholders — user supplies).
- Discord server name + invite URL (user supplies).
- First event details for `event.json`.
- Audio asset selection — implementer sources CC0 candidates and presents for approval before wiring.
- Wandering crewmate sprite — implementer provides a CC0/original silhouette; user can swap later.

## Deferred to Future Releases

- Leaderboards / stats
- Live RSVP attendee list visible on page
- Admin dashboard for non-git updates
- Custom domain
- Multi-event support (more than one upcoming event)
- Full timezone-picker UX in the visitor's local zone
