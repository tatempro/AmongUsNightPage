# Among Us Night Page

A static homebase site for our Among Us game nights. Hosted on GitHub Pages.

## What you can edit

All content lives in `data/*.json` files. Edit, push, and the page updates after the GitHub Action deploys (~30s).

### `data/event.json` — next event

```json
{
  "episode": 8,
  "title": "Among Us Night #08",
  "date": "2026-05-15",
  "time": "20:00",
  "timezone": "America/Chicago",
  "notes": "Optional flavor text shown under the date."
}
```

When you bump `episode`, RSVPs reset (the localStorage key changes), so everyone can RSVP again for the new event.

### `data/crew.json` — predefined roster

```json
[
  { "name": "Tim",  "color": "#ff4747" },
  { "name": "Alex", "color": "#5b8dff" }
]
```

Order in the file = order on the page.

### `data/gallery.json` — past nights

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
    "note": "Optional caption."
  }
]
```

Newest first. Drop photos in `assets/gallery/<date>/` and reference them by relative path.

### `data/discord.json` — Discord panel

```json
{
  "serverName": "The Skeld Crew",
  "inviteUrl": "https://discord.gg/your-invite"
}
```

## How RSVPs work

The I'M IN button POSTs a message to a Discord webhook. The webhook URL is set as a GitHub repository secret named `DISCORD_WEBHOOK_URL`; the deploy workflow injects it into `js/config.js` at build time.

To set up:

1. In Discord: Server Settings → Integrations → Webhooks → New Webhook → choose a channel → Copy Webhook URL.
2. In GitHub: repo → Settings → Secrets and variables → Actions → New repository secret → name `DISCORD_WEBHOOK_URL`, value = your webhook URL.
3. Push to `main`. The next deploy will use the secret.

If abuse occurs (someone scraped the webhook from the deployed JS): in Discord, delete the webhook and create a new one, then update the secret. The site's old webhook URL stops working immediately.

## Local development

```bash
python -m http.server 8000
# open http://localhost:8000
```

A real HTTP server is required (the page uses `fetch()` to load JSON; `file://` is blocked by browsers).

To test the RSVP flow locally, temporarily replace `'__WEBHOOK_URL__'` in `js/config.js` with a test webhook URL. Do NOT commit that change.

## File layout

See [the design spec](docs/superpowers/specs/2026-04-24-among-us-night-page-design.md) for full architecture.

## Audio assets

Drop CC0 / royalty-free audio in `assets/audio/`:

- `music.mp3` — looping ambient track (~1–2 min)
- `hover.mp3` — short blip
- `click.mp3` — confirmation blip
- `rsvp.mp3` — alert/alarm

Sources: [freesound.org](https://freesound.org), [pixabay.com/sound-effects](https://pixabay.com/sound-effects).

The page works without audio — Howler silently fails on missing files.
