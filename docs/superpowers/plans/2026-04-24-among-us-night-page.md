# Among Us Night Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static, GitHub Pages-hosted "homebase" site for an Among Us friend-group game night, with splash gate, animated space background, predefined crew roster, RSVP via Discord webhook, and a past-nights gallery.

**Architecture:** Single-page vanilla HTML/CSS/JS. No build step locally. Howler.js vendored as the single dependency for audio. Data lives in JSON files in the repo. RSVPs POST to a Discord webhook whose URL is injected into `js/config.js` from a GitHub Actions secret at deploy time.

**Tech Stack:** HTML5, CSS3 (custom properties + keyframes), ES modules, Howler.js (vendored), GitHub Pages, GitHub Actions.

---

## Reference: Spec

The full design spec is at [docs/superpowers/specs/2026-04-24-among-us-night-page-design.md](../specs/2026-04-24-among-us-night-page-design.md). This plan implements that spec faithfully — when in doubt, the spec is authoritative.

## Local Development Loop

Throughout the plan, "verify in browser" means:

1. From the repo root, run: `python -m http.server 8000`
2. Open http://localhost:8000 in a browser
3. Reload after changes
4. `Ctrl+C` to stop the server when done

A local server is required (not `file://`) because the page uses `fetch()` to load JSON data files, which the browser blocks for `file://` origins.

## Sample Inputs (placeholders the user will replace later)

Use these values during development. They get swapped out in Task 20:

- **Discord webhook URL (test):** the implementer will set up a temporary test webhook in their own Discord server for development, or use the literal string `__WEBHOOK_URL__` and verify failure paths only.
- **Crew names:** Tim, Alex, Sam, Jordan
- **Discord server name:** "The Skeld Crew" (placeholder)
- **First event:** Friday a few days out, 8 PM, episode 7

---

## Task 1: Project initialization

**Files:**
- Create: `.gitignore`
- Create: `README.md`
- Create: directory structure (`css/`, `js/`, `vendor/`, `data/`, `assets/audio/`, `assets/crew/`, `assets/gallery/`, `.github/workflows/`)

- [ ] **Step 1: Initialize git repo**

```bash
git init
git branch -M main
```

- [ ] **Step 2: Create `.gitignore`**

```
.DS_Store
Thumbs.db
.superpowers/
.vscode/
*.log
```

- [ ] **Step 3: Create directory skeleton**

```bash
mkdir -p css js vendor data assets/audio assets/crew assets/gallery .github/workflows
```

- [ ] **Step 4: Create `README.md`** (placeholder; full content guide goes in Task 20)

```markdown
# Among Us Night Page

A static homebase site for our Among Us game nights.

See [`docs/superpowers/specs/2026-04-24-among-us-night-page-design.md`](docs/superpowers/specs/2026-04-24-among-us-night-page-design.md) for the design.

Update guide forthcoming.
```

- [ ] **Step 5: Initial commit**

```bash
git add .gitignore README.md docs/
git commit -m "chore: initialize project with design spec"
```

---

## Task 2: HTML shell and base theme CSS

**Files:**
- Create: `index.html`
- Create: `css/theme.css`
- Create: `vendor/howler.min.js`

- [ ] **Step 1: Vendor Howler.js**

Download Howler 2.2.4 from https://github.com/goldfire/howler.js/releases (or unpkg: https://unpkg.com/howler@2.2.4/dist/howler.min.js) and save the contents as `vendor/howler.min.js`.

If the engineer cannot fetch a URL, instruct them to copy the contents of unpkg into the file manually. The file is ~30 KB.

- [ ] **Step 2: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>Among Us Night</title>
  <link rel="stylesheet" href="css/theme.css" />
  <link rel="stylesheet" href="css/animations.css" />
  <link rel="stylesheet" href="css/splash.css" />
</head>
<body>
  <div id="bg-stars" aria-hidden="true">
    <div class="stars stars-near"></div>
    <div class="stars stars-mid"></div>
    <div class="stars stars-far"></div>
  </div>

  <div id="bg-asteroids" aria-hidden="true"></div>
  <div id="bg-crewmates" aria-hidden="true"></div>

  <main id="app" hidden>
    <section id="hero"></section>
    <section id="roster"></section>
    <div class="bottom-row">
      <section id="discord"></section>
      <section id="past-nights"></section>
    </div>
  </main>

  <button id="mute-toggle" type="button" aria-label="Toggle audio" hidden>🔊</button>

  <div id="splash" class="splash">
    <div class="splash-text">⬡ TAP TO BOARD ⬡</div>
  </div>

  <div id="flash-overlay" aria-hidden="true"></div>
  <div id="modal-root"></div>

  <script src="vendor/howler.min.js"></script>
  <script type="module" src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 3: Create `css/theme.css`**

```css
:root {
  --space-deep: #0a0e1a;
  --space-mid: #1a1f3a;
  --panel-border: #4a5588;
  --panel-bg: rgba(35, 40, 74, 0.4);
  --text: #cdd6f4;
  --text-dim: rgba(205, 214, 244, 0.6);
  --accent-red: #ff4747;
  --accent-blue: #5b8dff;
  --discord-blurple: #5865f2;
  --label-spacing: 3px;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  min-height: 100%;
  background: linear-gradient(180deg, var(--space-deep) 0%, var(--space-mid) 100%);
  color: var(--text);
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  overflow-x: hidden;
}

body {
  min-height: 100vh;
  position: relative;
}

#app {
  position: relative;
  z-index: 1;
  max-width: 880px;
  margin: 0 auto;
  padding: 32px 20px 80px;
}

#app[hidden] { display: none; }

.bottom-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 28px;
}

@media (max-width: 600px) {
  .bottom-row { grid-template-columns: 1fr; }
  #app { padding: 20px 12px 60px; }
}

.panel {
  border: 1px dashed var(--panel-border);
  border-radius: 10px;
  padding: 16px;
  background: var(--panel-bg);
}

.panel-label {
  font-size: 11px;
  letter-spacing: var(--label-spacing);
  color: var(--text-dim);
  text-transform: uppercase;
}

button.btn {
  font-family: inherit;
  border: 0;
  border-radius: 6px;
  padding: 10px 24px;
  font-weight: bold;
  letter-spacing: 1px;
  cursor: pointer;
  background: var(--accent-red);
  color: white;
  box-shadow: 0 0 16px rgba(255, 71, 71, 0.5);
}

button.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
}

button.btn-discord {
  background: var(--discord-blurple);
  box-shadow: 0 0 12px rgba(88, 101, 242, 0.4);
}

#mute-toggle {
  position: fixed;
  top: 14px;
  right: 14px;
  z-index: 50;
  background: rgba(0, 0, 0, 0.4);
  color: white;
  border: 1px solid var(--panel-border);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 18px;
  cursor: pointer;
}
```

- [ ] **Step 4: Create empty placeholder files** so links don't 404:

```bash
: > css/animations.css
: > css/splash.css
mkdir -p js
: > js/main.js
```

- [ ] **Step 5: Verify in browser**

Run: `python -m http.server 8000`
Open: http://localhost:8000
Expected: dark space gradient background, no errors in console (some 404s OK for missing JSON; #app is hidden).

- [ ] **Step 6: Commit**

```bash
git add index.html css/ js/ vendor/
git commit -m "feat: html shell, base theme, vendored Howler"
```

---

## Task 3: Animated starfield (CSS only)

**Files:**
- Modify: `css/animations.css`

- [ ] **Step 1: Replace `css/animations.css`** with the starfield layers

```css
#bg-stars {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.stars {
  position: absolute;
  inset: -200px 0;
  background-repeat: repeat;
  background-size: 200px 200px;
}

.stars-far {
  background-image:
    radial-gradient(1px 1px at 20px 30px, rgba(255,255,255,0.6), transparent),
    radial-gradient(1px 1px at 130px 80px, rgba(255,255,255,0.4), transparent),
    radial-gradient(1px 1px at 80px 160px, rgba(255,255,255,0.5), transparent);
  animation: drift-stars 210s linear infinite;
  opacity: 0.6;
}

.stars-mid {
  background-image:
    radial-gradient(1.5px 1.5px at 60px 50px, rgba(255,255,255,0.8), transparent),
    radial-gradient(1.5px 1.5px at 170px 110px, rgba(180,200,255,0.7), transparent),
    radial-gradient(1.5px 1.5px at 30px 180px, rgba(255,255,255,0.7), transparent);
  animation: drift-stars 140s linear infinite;
  opacity: 0.8;
}

.stars-near {
  background-image:
    radial-gradient(2px 2px at 100px 40px, rgba(255,255,255,1), transparent),
    radial-gradient(2px 2px at 40px 120px, rgba(255,220,255,0.9), transparent),
    radial-gradient(2px 2px at 150px 170px, rgba(220,230,255,1), transparent);
  animation: drift-stars 90s linear infinite;
}

@keyframes drift-stars {
  from { transform: translateY(0); }
  to   { transform: translateY(-200px); }
}
```

- [ ] **Step 2: Verify in browser**

Reload http://localhost:8000.
Expected: three layers of stars drifting slowly upward at different speeds. No JS, no errors.

- [ ] **Step 3: Commit**

```bash
git add css/animations.css
git commit -m "feat: drifting multi-layer starfield"
```

---

## Task 4: Asteroid spawning

**Files:**
- Modify: `css/animations.css`
- Create: `js/animations.js`
- Modify: `js/main.js`

- [ ] **Step 1: Append asteroid styles to `css/animations.css`**

```css
#bg-asteroids,
#bg-crewmates {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.asteroid {
  position: absolute;
  width: 22px;
  height: 22px;
  background: radial-gradient(circle at 35% 35%, #6e6552, #2c2820 70%, #1a1612);
  border-radius: 50% 45% 55% 50%;
  box-shadow: inset -4px -4px 6px rgba(0,0,0,0.6);
  opacity: 0.85;
  animation: drift-asteroid linear forwards;
}

.asteroid.small { width: 12px; height: 12px; opacity: 0.6; }
.asteroid.large { width: 34px; height: 34px; }

@keyframes drift-asteroid {
  from { transform: translate3d(110vw, 0, 0) rotate(0deg); }
  to   { transform: translate3d(-20vw, 0, 0) rotate(360deg); }
}
```

- [ ] **Step 2: Create `js/animations.js`**

```javascript
const ASTEROID_INTERVAL_MIN = 8000;
const ASTEROID_INTERVAL_MAX = 15000;

function spawnAsteroid() {
  const container = document.getElementById('bg-asteroids');
  if (!container) return;
  const el = document.createElement('div');
  const size = pickWeighted(['small', '', 'large'], [0.4, 0.5, 0.1]);
  el.className = 'asteroid' + (size ? ' ' + size : '');
  el.style.top = Math.random() * 100 + 'vh';
  const duration = 18 + Math.random() * 14;
  el.style.animationDuration = duration + 's';
  el.addEventListener('animationend', () => el.remove(), { once: true });
  container.appendChild(el);
}

function pickWeighted(values, weights) {
  const r = Math.random();
  let cum = 0;
  for (let i = 0; i < values.length; i++) {
    cum += weights[i];
    if (r < cum) return values[i];
  }
  return values[values.length - 1];
}

function scheduleAsteroid() {
  const delay = ASTEROID_INTERVAL_MIN + Math.random() * (ASTEROID_INTERVAL_MAX - ASTEROID_INTERVAL_MIN);
  setTimeout(() => {
    spawnAsteroid();
    scheduleAsteroid();
  }, delay);
}

export function start() {
  scheduleAsteroid();
}
```

- [ ] **Step 3: Replace `js/main.js`** with a minimal boot that starts animations

```javascript
import * as animations from './animations.js';

document.addEventListener('DOMContentLoaded', () => {
  animations.start();
});
```

- [ ] **Step 4: Verify in browser**

Reload http://localhost:8000.
Expected: asteroids occasionally drift across the screen from right to left (first one within 15s). Stars still drifting underneath.

- [ ] **Step 5: Commit**

```bash
git add css/animations.css js/animations.js js/main.js
git commit -m "feat: drifting asteroids with random size/timing"
```

---

## Task 5: Wandering crewmate

**Files:**
- Modify: `css/animations.css`
- Modify: `js/animations.js`
- Create: `assets/crew/wanderer.svg`

- [ ] **Step 1: Create `assets/crew/wanderer.svg`** (CC0 / original — generic crewmate-shaped silhouette, not Innersloth artwork)

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 80" width="48" height="60">
  <ellipse cx="34" cy="74" rx="14" ry="3" fill="rgba(0,0,0,0.3)"/>
  <path d="M20 30 Q20 14 34 14 Q48 14 48 30 L48 60 Q48 66 44 66 L42 66 L42 72 L36 72 L36 66 L32 66 L32 72 L26 72 L26 66 L24 66 Q20 66 20 60 Z"
        fill="#3eff7a" stroke="#1f9b46" stroke-width="2"/>
  <path d="M14 38 Q10 38 10 44 L10 56 Q10 60 14 60 L20 60 L20 38 Z"
        fill="#3eff7a" stroke="#1f9b46" stroke-width="2"/>
  <path d="M26 22 Q26 18 32 18 L42 18 Q48 18 48 26 L48 32 Q48 34 46 34 L28 34 Q26 34 26 32 Z"
        fill="#a8d8ff" stroke="#3a6e9b" stroke-width="2"/>
</svg>
```

The body color is intentionally green here; we'll make it parameterizable later if needed. For v1 it's fine.

- [ ] **Step 2: Append crewmate styles to `css/animations.css`**

```css
.crewmate-walker {
  position: absolute;
  width: 48px;
  height: 60px;
  background: url('../assets/crew/wanderer.svg') no-repeat center / contain;
  animation: walk-across linear forwards;
}

.crewmate-walker.bob {
  animation: walk-across linear forwards, crewmate-bob 0.5s ease-in-out infinite;
}

@keyframes walk-across {
  from { transform: translate3d(110vw, 0, 0); }
  to   { transform: translate3d(-20vw, 0, 0); }
}

@keyframes crewmate-bob {
  0%, 100% { margin-top: 0; }
  50%      { margin-top: -4px; }
}
```

Note: combining two `transform`-based animations is tricky. Above we put the bob on `margin-top` instead of nesting. Keep it simple.

- [ ] **Step 3: Append crewmate spawning to `js/animations.js`**

```javascript
const CREWMATE_INTERVAL_MIN = 30000;
const CREWMATE_INTERVAL_MAX = 60000;

function spawnCrewmate() {
  const container = document.getElementById('bg-crewmates');
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'crewmate-walker bob';
  el.style.top = (20 + Math.random() * 60) + 'vh';
  const duration = 22 + Math.random() * 12;
  el.style.animationDuration = duration + 's, 0.5s';
  el.addEventListener('animationend', (e) => {
    if (e.animationName === 'walk-across') el.remove();
  });
  container.appendChild(el);
}

function scheduleCrewmate() {
  const delay = CREWMATE_INTERVAL_MIN + Math.random() * (CREWMATE_INTERVAL_MAX - CREWMATE_INTERVAL_MIN);
  setTimeout(() => {
    spawnCrewmate();
    scheduleCrewmate();
  }, delay);
}
```

- [ ] **Step 4: Update `start()` in `js/animations.js`** to also schedule crewmates

```javascript
export function start() {
  scheduleAsteroid();
  scheduleCrewmate();
  // For dev: spawn one immediately so it's visible without waiting 30s
  setTimeout(spawnCrewmate, 2000);
}
```

- [ ] **Step 5: Verify in browser**

Reload http://localhost:8000.
Expected: within ~2 seconds, a crewmate walks across the screen with a bobbing head. Asteroids and stars still drifting.

- [ ] **Step 6: Remove the dev spawn line** from `start()` (the immediate `setTimeout(spawnCrewmate, 2000)`) so crewmates only appear on the 30–60s schedule per the spec.

- [ ] **Step 7: Commit**

```bash
git add css/animations.css js/animations.js assets/crew/wanderer.svg
git commit -m "feat: wandering crewmate with bobbing walk"
```

---

## Task 6: Splash overlay

**Files:**
- Modify: `css/splash.css`
- Modify: `js/main.js`

- [ ] **Step 1: Replace `css/splash.css`**

```css
.splash {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 14, 26, 0.85);
  backdrop-filter: blur(2px);
  cursor: pointer;
  transition: opacity 600ms ease;
  user-select: none;
}

.splash.fading {
  opacity: 0;
  pointer-events: none;
}

.splash-text {
  font-size: 28px;
  font-weight: bold;
  letter-spacing: 6px;
  color: var(--text);
  text-shadow: 0 0 20px rgba(91, 141, 255, 0.6);
  animation: splash-pulse 1.6s ease-in-out infinite;
}

@keyframes splash-pulse {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50%      { opacity: 1;   transform: scale(1.04); }
}
```

- [ ] **Step 2: Modify `js/main.js`** to handle splash dismissal and show the app

```javascript
import * as animations from './animations.js';

const STORAGE_BOARDED = 'boarded';

function dismissSplash() {
  const splash = document.getElementById('splash');
  if (!splash || splash.classList.contains('fading')) return;
  splash.classList.add('fading');
  try { localStorage.setItem(STORAGE_BOARDED, 'true'); } catch {}
  setTimeout(() => splash.remove(), 700);
  document.getElementById('app').hidden = false;
  document.getElementById('mute-toggle').hidden = false;
}

function setupSplash() {
  const splash = document.getElementById('splash');
  if (!splash) return;
  let boarded = false;
  try { boarded = localStorage.getItem(STORAGE_BOARDED) === 'true'; } catch {}
  const text = splash.querySelector('.splash-text');
  if (boarded && text) text.textContent = '⬡ TAP TO RE-BOARD ⬡';
  splash.addEventListener('click', dismissSplash, { once: true });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') dismissSplash();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  animations.start();
  setupSplash();
});
```

- [ ] **Step 3: Verify in browser**

Reload http://localhost:8000.
Expected: splash overlay with pulsing "⬡ TAP TO BOARD ⬡". Click anywhere → fades out (~600ms), `#app` becomes visible (empty for now), mute toggle appears top-right. Reload → text now says "⬡ TAP TO RE-BOARD ⬡".

- [ ] **Step 4: Verify localStorage cleared correctly**

In DevTools console: `localStorage.removeItem('boarded')` then reload — expect "TAP TO BOARD" again.

- [ ] **Step 5: Commit**

```bash
git add css/splash.css js/main.js
git commit -m "feat: splash overlay with first-gesture dismissal"
```

---

## Task 7: Data files and parallel fetch loader

**Files:**
- Create: `data/event.json`
- Create: `data/crew.json`
- Create: `data/gallery.json`
- Create: `data/discord.json`
- Modify: `js/main.js`

- [ ] **Step 1: Create `data/event.json`** with sample data

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

- [ ] **Step 2: Create `data/crew.json`**

```json
[
  { "name": "Tim",    "color": "#ff4747" },
  { "name": "Alex",   "color": "#5b8dff" },
  { "name": "Sam",    "color": "#3eff7a" },
  { "name": "Jordan", "color": "#ffe94c" }
]
```

- [ ] **Step 3: Create `data/gallery.json`** (empty array is valid)

```json
[]
```

- [ ] **Step 4: Create `data/discord.json`**

```json
{
  "serverName": "The Skeld Crew",
  "inviteUrl": "https://discord.gg/replace-me"
}
```

- [ ] **Step 5: Modify `js/main.js`** to load all four files in parallel and store on a global app state

```javascript
import * as animations from './animations.js';

const STORAGE_BOARDED = 'boarded';

const state = {
  event: null,
  crew: null,
  gallery: null,
  discord: null,
  errors: []
};

async function loadJson(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`${path} → ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[data]', err.message);
    state.errors.push(path);
    return null;
  }
}

async function loadAll() {
  const [event, crew, gallery, discord] = await Promise.all([
    loadJson('data/event.json'),
    loadJson('data/crew.json'),
    loadJson('data/gallery.json'),
    loadJson('data/discord.json')
  ]);
  state.event = event;
  state.crew = crew;
  state.gallery = gallery;
  state.discord = discord;
}

function dismissSplash() {
  const splash = document.getElementById('splash');
  if (!splash || splash.classList.contains('fading')) return;
  splash.classList.add('fading');
  try { localStorage.setItem(STORAGE_BOARDED, 'true'); } catch {}
  setTimeout(() => splash.remove(), 700);
  document.getElementById('app').hidden = false;
  document.getElementById('mute-toggle').hidden = false;
}

function setupSplash() {
  const splash = document.getElementById('splash');
  if (!splash) return;
  let boarded = false;
  try { boarded = localStorage.getItem(STORAGE_BOARDED) === 'true'; } catch {}
  const text = splash.querySelector('.splash-text');
  if (boarded && text) text.textContent = '⬡ TAP TO RE-BOARD ⬡';
  splash.addEventListener('click', dismissSplash, { once: true });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') dismissSplash();
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  animations.start();
  setupSplash();
  await loadAll();
  console.log('[state]', state);
});

export { state };
```

- [ ] **Step 6: Verify in browser**

Reload. Open DevTools console.
Expected: `[state]` log shows all four objects populated with sample data, no warnings.

Then in console: `fetch('data/nope.json').catch(()=>{})` — verify the page still works.

- [ ] **Step 7: Commit**

```bash
git add data/ js/main.js
git commit -m "feat: data files and parallel fetch loader"
```

---

## Task 8: Hero "Incoming Transmission" panel

**Files:**
- Modify: `css/theme.css`
- Modify: `js/main.js`

- [ ] **Step 1: Append hero styles to `css/theme.css`**

```css
#hero .panel-hero {
  text-align: center;
  padding: 32px 20px;
  border: 2px solid var(--accent-red);
  border-radius: 14px;
  background: rgba(255, 71, 71, 0.08);
  position: relative;
  max-width: 720px;
  margin: 0 auto;
}

#hero .corner-dots {
  position: absolute;
  top: 10px;
  right: 14px;
  opacity: 0.5;
  letter-spacing: 4px;
}

#hero .transmission-label {
  font-size: 13px;
  opacity: 0.75;
  letter-spacing: var(--label-spacing);
}

#hero .when {
  font-size: clamp(28px, 5vw, 42px);
  margin-top: 10px;
  color: white;
  font-weight: bold;
  letter-spacing: 2px;
}

#hero .episode-title {
  margin-top: 6px;
  opacity: 0.85;
  font-size: 14px;
}

#hero .notes {
  margin-top: 8px;
  font-size: 13px;
  font-style: italic;
  color: var(--text-dim);
}

#hero .actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}
```

- [ ] **Step 2: Add a `formatEventWhen` helper and a `renderHero` function to `js/main.js`** — insert before `document.addEventListener('DOMContentLoaded', ...)`

```javascript
function formatEventWhen(event) {
  if (!event || !event.date) return { when: '—', title: '—', notes: '' };
  const [y, m, d] = event.date.split('-').map(Number);
  const [hh, mm] = (event.time || '00:00').split(':').map(Number);
  const eventDate = new Date(Date.UTC(y, m - 1, d, hh, mm));

  const tz = event.timezone || undefined;
  const dayFmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'long' });
  const shortDayFmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' });
  const monthDayFmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, month: 'short', day: 'numeric' });
  const timeFmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' });

  const dayLong = dayFmt.format(eventDate).toUpperCase();
  const time = timeFmt.format(eventDate).replace(':00', '').toUpperCase();
  const sixDaysMs = 6 * 24 * 60 * 60 * 1000;
  const within6Days = (eventDate.getTime() - Date.now()) <= sixDaysMs && (eventDate.getTime() - Date.now()) >= -sixDaysMs;

  let when;
  if (within6Days) {
    when = `${dayLong} · ${time}`;
  } else {
    when = `${shortDayFmt.format(eventDate).toUpperCase()} · ${monthDayFmt.format(eventDate).toUpperCase()} · ${time}`;
  }

  return { when, title: event.title || '', notes: event.notes || '' };
}

function renderHero() {
  const root = document.getElementById('hero');
  if (!root) return;
  const event = state.event;
  if (!event) {
    root.innerHTML = '<div class="panel-hero"><div class="when">—</div></div>';
    return;
  }
  const { when, title, notes } = formatEventWhen(event);
  root.innerHTML = `
    <div class="panel-hero">
      <div class="corner-dots">○ ○ ○</div>
      <div class="transmission-label">⬡ INCOMING TRANSMISSION ⬡</div>
      <div class="when">${when}</div>
      <div class="episode-title">${escapeHtml(title)}</div>
      ${notes ? `<div class="notes">${escapeHtml(notes)}</div>` : ''}
      <div class="actions">
        <button id="rsvp-button" class="btn" type="button">★ I'M IN ★</button>
        <button id="discord-button" class="btn btn-discord" type="button">DISCORD →</button>
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}
```

- [ ] **Step 3: Call `renderHero()` after `loadAll()`** in the DOMContentLoaded handler

```javascript
document.addEventListener('DOMContentLoaded', async () => {
  animations.start();
  setupSplash();
  await loadAll();
  renderHero();
});
```

- [ ] **Step 4: Verify in browser**

Reload, dismiss splash.
Expected: red-bordered hero panel showing the event date in either "FRIDAY · 8 PM" or "FRI · MAY 1 · 8 PM" format depending on whether the date in `event.json` is within 6 days. Title and notes show below. Two buttons.

To test the >6 days branch: temporarily edit `event.json` `date` to a date a month away, reload, confirm format switches. Then put it back.

- [ ] **Step 5: Wire the Discord button** so it opens the invite URL — append inside `renderHero()` after setting innerHTML, *before* the closing brace of the function

```javascript
  const discordBtn = document.getElementById('discord-button');
  if (discordBtn) {
    discordBtn.addEventListener('click', () => {
      const url = state.discord && state.discord.inviteUrl;
      if (url) window.open(url, '_blank', 'noopener');
    });
  }
```

- [ ] **Step 6: Commit**

```bash
git add css/theme.css js/main.js
git commit -m "feat: hero transmission panel with date format and discord link"
```

---

## Task 9: Crew Roster strip (predefined tiles)

**Files:**
- Modify: `css/theme.css`
- Modify: `js/main.js`

- [ ] **Step 1: Append roster styles to `css/theme.css`**

```css
#roster {
  margin-top: 32px;
  max-width: 820px;
  margin-left: auto;
  margin-right: auto;
}

#roster .roster-grid {
  border: 1px dashed var(--panel-border);
  border-radius: 10px;
  padding: 18px;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
}

.crew-tile {
  text-align: center;
  width: 64px;
  cursor: pointer;
  background: none;
  border: 0;
  padding: 0;
  font-family: inherit;
  color: inherit;
}

.crew-tile .swatch {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  margin: 0 auto;
  transition: transform 0.15s ease;
}

.crew-tile:hover .swatch {
  transform: scale(1.08);
}

.crew-tile .name {
  font-size: 11px;
  margin-top: 6px;
}

.crew-tile.you .swatch {
  background: #888;
  border: 2px dashed #aaa;
}

.crew-tile.you .name {
  opacity: 0.6;
}
```

- [ ] **Step 2: Add `renderRoster()` function in `js/main.js`** — insert near `renderHero`

```javascript
function renderRoster() {
  const root = document.getElementById('roster');
  if (!root) return;
  const crew = Array.isArray(state.crew) ? state.crew : [];

  root.innerHTML = `
    <div class="panel-label">CREW ROSTER</div>
    <div class="roster-grid">
      ${crew.map((c, i) => `
        <button class="crew-tile" data-crew-index="${i}" type="button">
          <div class="swatch" style="background:${escapeHtml(c.color)}"></div>
          <div class="name">${escapeHtml(c.name)}</div>
        </button>
      `).join('')}
      <button class="crew-tile you" id="crew-you" type="button">
        <div class="swatch"></div>
        <div class="name">+ you</div>
      </button>
    </div>
  `;
}
```

- [ ] **Step 3: Call `renderRoster()`** in DOMContentLoaded handler after `renderHero()`

```javascript
  await loadAll();
  renderHero();
  renderRoster();
```

- [ ] **Step 4: Verify in browser**

Reload, dismiss splash.
Expected: crew roster with 4 colored tiles (Tim/Alex/Sam/Jordan) and a dashed "+ you" tile at the end. Hover scales the swatch slightly.

- [ ] **Step 5: Commit**

```bash
git add css/theme.css js/main.js
git commit -m "feat: crew roster strip"
```

---

## Task 10: Discord and Past Nights bottom panels

**Files:**
- Modify: `css/theme.css`
- Modify: `js/main.js`

- [ ] **Step 1: Append bottom-panel styles to `css/theme.css`**

```css
#discord, #past-nights {
  border: 1px dashed var(--panel-border);
  border-radius: 10px;
  padding: 16px;
  min-height: 110px;
  background: var(--panel-bg);
}

#discord .server-name {
  margin-top: 12px;
  color: white;
  font-size: 16px;
  font-weight: bold;
}

#discord .join-link {
  display: inline-block;
  margin-top: 8px;
  color: var(--discord-blurple);
  font-size: 13px;
  text-decoration: none;
  cursor: pointer;
}

#past-nights .thumbs {
  display: flex;
  gap: 6px;
  margin-top: 12px;
  flex-wrap: wrap;
}

#past-nights .thumb {
  width: 60px;
  height: 42px;
  border-radius: 4px;
  border: 1px solid #353a5a;
  background-color: #23284a;
  background-size: cover;
  background-position: center;
  cursor: pointer;
  transition: transform 0.15s ease;
}

#past-nights .thumb:hover {
  transform: scale(1.05);
}

#past-nights .empty {
  margin-top: 12px;
  font-size: 12px;
  color: var(--text-dim);
  font-style: italic;
}
```

- [ ] **Step 2: Add `renderDiscord()` and `renderPastNights()` to `js/main.js`** — insert near other render functions

```javascript
function renderDiscord() {
  const root = document.getElementById('discord');
  if (!root) return;
  const d = state.discord;
  if (!d) {
    root.innerHTML = '<div class="panel-label">DISCORD</div><div>—</div>';
    return;
  }
  root.innerHTML = `
    <div class="panel-label">DISCORD</div>
    <div class="server-name">${escapeHtml(d.serverName || '')}</div>
    <a class="join-link" href="${escapeHtml(d.inviteUrl || '#')}" target="_blank" rel="noopener">→ join the channel</a>
  `;
}

function renderPastNights() {
  const root = document.getElementById('past-nights');
  if (!root) return;
  const nights = Array.isArray(state.gallery) ? state.gallery : [];
  if (nights.length === 0) {
    root.innerHTML = `
      <div class="panel-label">PAST NIGHTS</div>
      <div class="empty">No past nights yet — first one's coming up.</div>
    `;
    return;
  }
  const recent = nights.slice(0, 4);
  root.innerHTML = `
    <div class="panel-label">PAST NIGHTS</div>
    <div class="thumbs">
      ${recent.map((n, i) => `
        <div class="thumb" data-night-index="${i}"
             style="${n.cover ? `background-image:url('${escapeHtml(n.cover)}')` : ''}"
             title="${escapeHtml(n.title || n.date || '')}"></div>
      `).join('')}
    </div>
  `;
}
```

- [ ] **Step 3: Call both render functions** in DOMContentLoaded handler

```javascript
  renderHero();
  renderRoster();
  renderDiscord();
  renderPastNights();
```

- [ ] **Step 4: Verify in browser**

Reload. Expected: Discord panel shows "The Skeld Crew" + join link; Past Nights panel shows the empty-state message. Layout is two columns on desktop, stacks on mobile (test by resizing window below 600px).

- [ ] **Step 5: Add a sample past night** to `data/gallery.json` to verify thumbnails render

```json
[
  {
    "date": "2026-04-15",
    "title": "Night #06 — Polus chaos",
    "cover": "",
    "photos": [],
    "note": "Riley got ejected three times in a row."
  }
]
```

(Empty `cover` is fine — thumbnail shows the dark blue placeholder color.)

Reload and verify a single thumbnail appears. Then revert `gallery.json` back to `[]` for now (Task 11 reintroduces sample data).

- [ ] **Step 6: Commit**

```bash
git add css/theme.css js/main.js data/gallery.json
git commit -m "feat: discord panel and past-nights thumbnail strip"
```

---

## Task 11: Past Nights lightbox

**Files:**
- Create: `js/gallery.js`
- Modify: `css/theme.css`
- Modify: `js/main.js`
- Modify: `data/gallery.json`

- [ ] **Step 1: Append lightbox styles to `css/theme.css`**

```css
.lightbox {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.lightbox-close {
  position: absolute;
  top: 16px;
  right: 20px;
  background: none;
  border: 0;
  color: white;
  font-size: 28px;
  cursor: pointer;
}

.lightbox-title {
  color: white;
  font-size: 18px;
  margin-bottom: 16px;
  text-align: center;
}

.lightbox-img {
  max-width: 90vw;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 8px;
}

.lightbox-controls {
  margin-top: 16px;
  display: flex;
  gap: 24px;
  align-items: center;
  color: white;
}

.lightbox-controls button {
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.3);
  color: white;
  font-size: 18px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  cursor: pointer;
}

.lightbox-controls button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.lightbox-note {
  color: var(--text-dim);
  font-size: 13px;
  font-style: italic;
  margin-top: 12px;
  max-width: 600px;
  text-align: center;
}
```

- [ ] **Step 2: Create `js/gallery.js`**

```javascript
let nights = [];
let activeNightIndex = -1;
let activePhotoIndex = 0;

export function mount(galleryData) {
  nights = Array.isArray(galleryData) ? galleryData : [];
  const container = document.getElementById('past-nights');
  if (!container) return;
  container.addEventListener('click', (e) => {
    const thumb = e.target.closest('[data-night-index]');
    if (!thumb) return;
    const i = parseInt(thumb.getAttribute('data-night-index'), 10);
    if (!Number.isNaN(i)) openNight(i);
  });
  document.addEventListener('keydown', handleKey);
}

function openNight(index) {
  const night = nights[index];
  if (!night) return;
  activeNightIndex = index;
  activePhotoIndex = 0;
  renderLightbox();
}

function close() {
  activeNightIndex = -1;
  const lb = document.getElementById('lightbox');
  if (lb) lb.remove();
}

function handleKey(e) {
  if (activeNightIndex < 0) return;
  if (e.key === 'Escape') close();
  else if (e.key === 'ArrowLeft') step(-1);
  else if (e.key === 'ArrowRight') step(1);
}

function step(dir) {
  const night = nights[activeNightIndex];
  if (!night) return;
  const total = (night.photos || []).length + (night.cover ? 1 : 0);
  if (total === 0) return;
  activePhotoIndex = (activePhotoIndex + dir + total) % total;
  renderLightbox();
}

function currentImage(night) {
  const photos = night.cover ? [night.cover, ...(night.photos || [])] : (night.photos || []);
  return photos[activePhotoIndex] || '';
}

function renderLightbox() {
  let lb = document.getElementById('lightbox');
  if (!lb) {
    lb = document.createElement('div');
    lb.id = 'lightbox';
    lb.className = 'lightbox';
    lb.addEventListener('click', (e) => {
      if (e.target === lb) close();
    });
    document.getElementById('modal-root').appendChild(lb);
  }
  const night = nights[activeNightIndex];
  if (!night) return;
  const photos = night.cover ? [night.cover, ...(night.photos || [])] : (night.photos || []);
  const total = photos.length;
  const img = currentImage(night);
  lb.innerHTML = `
    <button class="lightbox-close" type="button" aria-label="Close">×</button>
    <div class="lightbox-title">${escapeHtml(night.title || night.date || '')}</div>
    ${img ? `<img class="lightbox-img" src="${escapeHtml(img)}" alt="" onerror="this.style.opacity='0.3'" />` : '<div class="lightbox-note">No photos yet.</div>'}
    ${total > 1 ? `
      <div class="lightbox-controls">
        <button data-step="-1" aria-label="Previous">‹</button>
        <span>${activePhotoIndex + 1} / ${total}</span>
        <button data-step="1" aria-label="Next">›</button>
      </div>
    ` : ''}
    ${night.note ? `<div class="lightbox-note">${escapeHtml(night.note)}</div>` : ''}
  `;
  lb.querySelector('.lightbox-close').addEventListener('click', close);
  lb.querySelectorAll('[data-step]').forEach((b) => {
    b.addEventListener('click', () => step(parseInt(b.getAttribute('data-step'), 10)));
  });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}
```

- [ ] **Step 3: Wire `gallery.mount(state.gallery)` into `js/main.js`**

At top of file, add:
```javascript
import * as gallery from './gallery.js';
```

After `renderPastNights();` in DOMContentLoaded handler, add:
```javascript
  gallery.mount(state.gallery);
```

- [ ] **Step 4: Add a sample night to `data/gallery.json`** (with a real publicly-available test image to verify rendering — replace with real photos later)

```json
[
  {
    "date": "2026-04-15",
    "title": "Night #06 — Polus chaos",
    "cover": "https://picsum.photos/seed/aun06/800/600",
    "photos": [
      "https://picsum.photos/seed/aun06b/800/600",
      "https://picsum.photos/seed/aun06c/800/600"
    ],
    "note": "Riley got ejected three times in a row."
  }
]
```

(Picsum returns deterministic placeholder images for the seed. The user replaces these with real local photos in `assets/gallery/<date>/...` later. The CSS `onerror` handler covers missing images.)

- [ ] **Step 5: Verify in browser**

Reload. Click the past-nights thumbnail.
Expected: lightbox opens with the cover image, title, and 1/3 indicator. Arrow keys step through. Esc closes. Click outside the image closes.

- [ ] **Step 6: Commit**

```bash
git add css/theme.css js/gallery.js js/main.js data/gallery.json
git commit -m "feat: past-nights lightbox with keyboard navigation"
```

---

## Task 12: Audio module (music + mute toggle)

**Files:**
- Create: `js/audio.js`
- Modify: `js/main.js`

- [ ] **Step 1: Create `js/audio.js`**

```javascript
const STORAGE_MUTED = 'muted';

const state = {
  initialized: false,
  music: null,
  sfx: {},
  muted: false
};

export function isMuted() {
  return state.muted;
}

export function setMuted(value) {
  state.muted = !!value;
  try { localStorage.setItem(STORAGE_MUTED, state.muted ? 'true' : 'false'); } catch {}
  applyMute();
  updateToggleIcon();
}

function applyMute() {
  if (!state.initialized || typeof Howler === 'undefined') return;
  Howler.mute(state.muted);
}

export function init() {
  if (state.initialized) return;
  state.initialized = true;

  try { state.muted = localStorage.getItem(STORAGE_MUTED) === 'true'; } catch {}

  if (typeof Howl === 'undefined') {
    console.warn('[audio] Howler not loaded, audio disabled');
    return;
  }

  state.music = new Howl({
    src: ['assets/audio/music.mp3'],
    loop: true,
    volume: 0,
    html5: true,
    onloaderror: () => console.info('[audio] music asset missing — silent OK'),
  });

  state.sfx = {
    hover: new Howl({ src: ['assets/audio/hover.mp3'], volume: 0.3, onloaderror: noop }),
    click: new Howl({ src: ['assets/audio/click.mp3'], volume: 0.4, onloaderror: noop }),
    rsvp:  new Howl({ src: ['assets/audio/rsvp.mp3'],  volume: 0.5, onloaderror: noop }),
  };

  applyMute();
}

function noop() {}

export function playMusic() {
  if (!state.music) return;
  try {
    state.music.play();
    state.music.fade(0, 0.3, 1000);
  } catch (e) { /* ignore */ }
}

export function playSfx(name) {
  const s = state.sfx[name];
  if (s) { try { s.play(); } catch { /* ignore */ } }
}

function updateToggleIcon() {
  const btn = document.getElementById('mute-toggle');
  if (btn) btn.textContent = state.muted ? '🔇' : '🔊';
}

export function attachToggleButton() {
  const btn = document.getElementById('mute-toggle');
  if (!btn) return;
  updateToggleIcon();
  btn.addEventListener('click', () => setMuted(!state.muted));
}
```

- [ ] **Step 2: Wire audio init into splash dismissal in `js/main.js`**

At top of file:
```javascript
import * as audio from './audio.js';
```

Modify `dismissSplash()` to init + start music:
```javascript
function dismissSplash() {
  const splash = document.getElementById('splash');
  if (!splash || splash.classList.contains('fading')) return;
  splash.classList.add('fading');
  try { localStorage.setItem(STORAGE_BOARDED, 'true'); } catch {}
  setTimeout(() => splash.remove(), 700);
  document.getElementById('app').hidden = false;
  document.getElementById('mute-toggle').hidden = false;
  audio.init();
  audio.attachToggleButton();
  audio.playMusic();
}
```

- [ ] **Step 3: Source CC0 audio assets** (4 short clips)

The engineer should source four CC0 / royalty-free clips from freesound.org (search: "ui beep", "ui click", "alarm short", "ambient space loop") or pixabay.com. Save to:

- `assets/audio/music.mp3` — looping ambient ~1–2 minute clip
- `assets/audio/hover.mp3` — short blip ~100ms
- `assets/audio/click.mp3` — confirmation blip ~150ms
- `assets/audio/rsvp.mp3` — alarm/alert ~500ms

If assets cannot be sourced in this task, leave the folder empty — Howler emits load errors but the page still works (per spec).

- [ ] **Step 4: Verify in browser**

Reload, dismiss splash.
Expected: if audio files are present, music starts at low volume after splash dismiss; mute toggle icon flips between 🔊 / 🔇 on click; reload preserves the mute state. If audio files are absent, console shows "music asset missing — silent OK" but page works.

- [ ] **Step 5: Commit**

```bash
git add js/audio.js js/main.js assets/audio/
git commit -m "feat: audio module with Howler music + mute toggle"
```

---

## Task 13: Hover and click SFX wiring

**Files:**
- Modify: `js/main.js`

- [ ] **Step 1: Add a global SFX wiring helper in `js/main.js`** — insert as a top-level function

```javascript
function wireSfx() {
  document.addEventListener('mouseover', (e) => {
    const target = e.target.closest('button, .crew-tile, .thumb, a');
    if (!target) return;
    if (target.dataset.sfxHover === 'wired') return;
    target.dataset.sfxHover = 'wired';
    target.addEventListener('mouseenter', () => audio.playSfx('hover'));
  });
  document.addEventListener('click', (e) => {
    const target = e.target.closest('button, .crew-tile, .thumb');
    if (!target) return;
    audio.playSfx('click');
  });
}
```

The `mouseover` delegation lazily attaches `mouseenter` listeners as the user encounters elements, so newly-rendered tiles work too.

- [ ] **Step 2: Call `wireSfx()` once during DOMContentLoaded** (after `setupSplash()`)

```javascript
  animations.start();
  setupSplash();
  wireSfx();
  await loadAll();
```

- [ ] **Step 3: Verify in browser**

Dismiss splash. Hover and click buttons / crew tiles / thumbnails.
Expected: hover SFX fires on first mouseenter; click SFX fires on click. (No SFX if asset files are missing — that's expected.)

- [ ] **Step 4: Commit**

```bash
git add js/main.js
git commit -m "feat: hover and click SFX wiring via event delegation"
```

---

## Task 14: RSVP entry points (chooser overlay, confirm modal, guest form)

**Files:**
- Create: `js/rsvp.js` (skeleton; submission happens in Task 15)
- Modify: `css/theme.css`
- Modify: `js/main.js`

- [ ] **Step 1: Append modal styles to `css/theme.css`**

```css
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 150;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-card {
  background: linear-gradient(180deg, #1a1f3a, #0a0e1a);
  border: 2px solid var(--accent-red);
  border-radius: 12px;
  padding: 24px;
  max-width: 420px;
  width: 100%;
  box-shadow: 0 0 30px rgba(255, 71, 71, 0.3);
}

.modal-title {
  font-size: 18px;
  font-weight: bold;
  letter-spacing: 2px;
  text-align: center;
  margin-bottom: 16px;
  color: white;
}

.modal-chooser {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}

.modal-actions {
  margin-top: 18px;
  display: flex;
  gap: 10px;
  justify-content: center;
}

.modal-actions .btn-secondary {
  background: transparent;
  color: var(--text);
  border: 1px solid var(--panel-border);
  box-shadow: none;
}

.guest-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.guest-form label {
  font-size: 12px;
  color: var(--text-dim);
  letter-spacing: 1px;
}

.guest-form input[type="text"] {
  width: 100%;
  padding: 10px;
  background: rgba(0,0,0,0.3);
  border: 1px solid var(--panel-border);
  border-radius: 6px;
  color: var(--text);
  font-family: inherit;
  font-size: 14px;
}

.color-picker {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.color-picker .swatch-pick {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  border: 2px solid transparent;
}

.color-picker .swatch-pick.selected {
  border-color: white;
  box-shadow: 0 0 8px white;
}
```

- [ ] **Step 2: Create `js/rsvp.js`** with stubs for now

```javascript
import * as audio from './audio.js';

const GUEST_COLORS = [
  '#ff4747', '#5b8dff', '#3eff7a', '#ffe94c',
  '#c46bff', '#ff8c2b', '#ffffff', '#222222'
];

let onSubmit = null;

export function init({ onSubmit: handler }) {
  onSubmit = handler;
}

export function openChooser(crew) {
  const modal = createModal(`
    <div class="modal-title">WHO ARE YOU?</div>
    <div class="modal-chooser">
      ${crew.map((c, i) => `
        <button class="crew-tile" data-pick-index="${i}" type="button">
          <div class="swatch" style="background:${escapeHtml(c.color)}"></div>
          <div class="name">${escapeHtml(c.name)}</div>
        </button>
      `).join('')}
      <button class="crew-tile you" data-pick-guest type="button">
        <div class="swatch"></div>
        <div class="name">+ guest</div>
      </button>
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" data-cancel type="button">CANCEL</button>
    </div>
  `);
  modal.querySelectorAll('[data-pick-index]').forEach((b) => {
    b.addEventListener('click', () => {
      const i = parseInt(b.getAttribute('data-pick-index'), 10);
      const c = crew[i];
      closeModal(modal);
      if (c) confirmRsvp(c);
    });
  });
  modal.querySelector('[data-pick-guest]')?.addEventListener('click', () => {
    closeModal(modal);
    openGuestForm();
  });
  modal.querySelector('[data-cancel]')?.addEventListener('click', () => closeModal(modal));
}

export function confirmRsvp(crewMember) {
  const modal = createModal(`
    <div class="modal-title">RSVP AS ${escapeHtml(crewMember.name).toUpperCase()}?</div>
    <div style="text-align:center;">
      <div class="swatch" style="background:${escapeHtml(crewMember.color)}; width:60px; height:60px; margin:0 auto 12px; border-radius:8px;"></div>
    </div>
    <div class="modal-actions">
      <button class="btn" data-confirm type="button">CONFIRM</button>
      <button class="btn btn-secondary" data-cancel type="button">CANCEL</button>
    </div>
  `);
  modal.querySelector('[data-confirm]')?.addEventListener('click', () => {
    closeModal(modal);
    onSubmit && onSubmit({ name: crewMember.name, color: crewMember.color });
  });
  modal.querySelector('[data-cancel]')?.addEventListener('click', () => closeModal(modal));
}

export function openGuestForm() {
  let selectedColor = GUEST_COLORS[0];
  const modal = createModal(`
    <div class="modal-title">JOIN AS GUEST</div>
    <div class="guest-form">
      <label>NAME
        <input type="text" maxlength="32" required data-name placeholder="Your name" />
      </label>
      <label>COLOR
        <div class="color-picker">
          ${GUEST_COLORS.map((c, i) => `
            <button type="button" class="swatch-pick${i === 0 ? ' selected' : ''}" data-color="${c}" style="background:${c}" aria-label="${c}"></button>
          `).join('')}
        </div>
      </label>
    </div>
    <div class="modal-actions">
      <button class="btn" data-confirm type="button">SUBMIT</button>
      <button class="btn btn-secondary" data-cancel type="button">CANCEL</button>
    </div>
  `);
  modal.querySelectorAll('[data-color]').forEach((b) => {
    b.addEventListener('click', () => {
      selectedColor = b.getAttribute('data-color');
      modal.querySelectorAll('[data-color]').forEach((x) => x.classList.remove('selected'));
      b.classList.add('selected');
    });
  });
  modal.querySelector('[data-confirm]')?.addEventListener('click', () => {
    const input = modal.querySelector('[data-name]');
    const name = (input.value || '').trim();
    if (!name) { input.focus(); return; }
    closeModal(modal);
    onSubmit && onSubmit({ name, color: selectedColor });
  });
  modal.querySelector('[data-cancel]')?.addEventListener('click', () => closeModal(modal));
  setTimeout(() => modal.querySelector('[data-name]')?.focus(), 50);
}

function createModal(innerHtml) {
  const root = document.getElementById('modal-root');
  const wrap = document.createElement('div');
  wrap.className = 'modal-backdrop';
  wrap.innerHTML = `<div class="modal-card">${innerHtml}</div>`;
  wrap.addEventListener('click', (e) => { if (e.target === wrap) closeModal(wrap); });
  root.appendChild(wrap);
  return wrap;
}

function closeModal(el) {
  if (el && el.parentNode) el.parentNode.removeChild(el);
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}
```

- [ ] **Step 3: Wire RSVP entry points in `js/main.js`**

At top of file:
```javascript
import * as rsvp from './rsvp.js';
```

After `wireSfx();` in DOMContentLoaded, add (use a temporary stub onSubmit; Task 15 replaces it):
```javascript
  rsvp.init({
    onSubmit: ({ name, color }) => {
      console.log('[rsvp] submit', { name, color });
    }
  });
```

After `renderRoster()` (and after each render that creates roster tiles), wire the click handlers. Add this helper near `renderRoster`:

```javascript
function wireRosterClicks() {
  const root = document.getElementById('roster');
  if (!root) return;
  root.addEventListener('click', (e) => {
    const tile = e.target.closest('[data-crew-index]');
    if (tile) {
      const i = parseInt(tile.getAttribute('data-crew-index'), 10);
      const c = state.crew && state.crew[i];
      if (c) rsvp.confirmRsvp(c);
      return;
    }
    if (e.target.closest('#crew-you')) {
      rsvp.openGuestForm();
    }
  });
}
```

And call `wireRosterClicks()` after `renderRoster();` in DOMContentLoaded.

- [ ] **Step 4: Wire the hero I'M IN button** to open the chooser. Inside `renderHero()`, append (after the discord button wiring):

```javascript
  const rsvpBtn = document.getElementById('rsvp-button');
  if (rsvpBtn) {
    rsvpBtn.addEventListener('click', () => {
      rsvp.openChooser(state.crew || []);
    });
  }
```

- [ ] **Step 5: Verify in browser**

Reload, dismiss splash.
Expected:
- Click hero I'M IN → "WHO ARE YOU?" overlay with 4 crew tiles + a guest tile + Cancel. Clicking a crew tile → "RSVP AS TIM?" confirm modal → Confirm logs the submission to console. Clicking guest tile → guest form with name + color picker → Submit logs.
- Click a crew tile in the roster directly → confirm modal opens for that crewmate.
- Click "+ you" in the roster → guest form opens.
- Esc and click-outside should close modals (click-outside works; Esc handling is added in Task 15 via the same gallery handler pattern, or skip for v1 since spec doesn't require Esc on modals).

- [ ] **Step 6: Commit**

```bash
git add css/theme.css js/rsvp.js js/main.js
git commit -m "feat: RSVP entry points (chooser, confirm modal, guest form)"
```

---

## Task 15: RSVP submission (Discord webhook + emergency meeting flash)

**Files:**
- Create: `js/config.js`
- Modify: `js/rsvp.js`
- Modify: `css/animations.css`
- Modify: `js/main.js`

- [ ] **Step 1: Create `js/config.js`** with the deploy-injected placeholder

```javascript
export const WEBHOOK_URL = '__WEBHOOK_URL__';
```

- [ ] **Step 2: Append flash overlay style to `css/animations.css`**

```css
#flash-overlay {
  position: fixed;
  inset: 0;
  z-index: 90;
  pointer-events: none;
  background: transparent;
}

#flash-overlay.firing {
  animation: emergency-flash 800ms ease-out forwards;
}

@keyframes emergency-flash {
  0%   { background: rgba(255, 71, 71, 0); }
  20%  { background: rgba(255, 71, 71, 0.55); }
  60%  { background: rgba(255, 71, 71, 0.25); }
  100% { background: rgba(255, 71, 71, 0); }
}
```

- [ ] **Step 3: Add submission logic to `js/rsvp.js`**

First, add the new `import` at the **top** of the file (alongside the existing `import * as audio from './audio.js';` line):

```javascript
import { WEBHOOK_URL } from './config.js';
```

Then **append the rest of the code below at the end of the file** (after `openGuestForm` and before `createModal`/`closeModal`/`escapeHtml` is fine — order within a module doesn't matter for hoisted functions, but keeping helpers at the bottom reads cleaner):

```javascript
export async function submitRsvp({ name, color, episode, eventTitle }) {
  const button = document.getElementById('rsvp-button');
  setButtonState(button, 'transmitting');
  const content = `🚀 ${name} is in for ${eventTitle || 'Among Us Night'}`;
  try {
    if (!WEBHOOK_URL || WEBHOOK_URL === '__WEBHOOK_URL__') {
      throw new Error('webhook URL not configured');
    }
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    onSubmitSuccess(button, episode);
  } catch (err) {
    console.warn('[rsvp]', err.message);
    onSubmitFailure(button);
  }
}

function setButtonState(button, state) {
  if (!button) return;
  if (state === 'transmitting') {
    button.disabled = true;
    button.textContent = 'TRANSMITTING…';
  } else if (state === 'sent') {
    button.disabled = true;
    button.textContent = 'TRANSMISSION SENT ✓';
  } else if (state === 'failed') {
    button.disabled = false;
    button.textContent = 'TRANSMISSION FAILED — open Discord';
  }
}

function onSubmitSuccess(button, episode) {
  setButtonState(button, 'sent');
  fireEmergencyFlash();
  audio.playSfx('rsvp');
  if (episode != null) {
    try { localStorage.setItem(`rsvp_sent_${episode}`, 'true'); } catch {}
  }
}

function onSubmitFailure(button) {
  setButtonState(button, 'failed');
  const discordBtn = document.getElementById('discord-button');
  if (discordBtn) {
    discordBtn.style.boxShadow = '0 0 24px rgba(88, 101, 242, 0.9)';
  }
}

function fireEmergencyFlash() {
  const overlay = document.getElementById('flash-overlay');
  if (!overlay) return;
  overlay.classList.remove('firing');
  // Reflow so animation restarts when class re-added
  void overlay.offsetWidth;
  overlay.classList.add('firing');
  overlay.addEventListener('animationend', () => overlay.classList.remove('firing'), { once: true });
}

export function isAlreadySent(episode) {
  if (episode == null) return false;
  try { return localStorage.getItem(`rsvp_sent_${episode}`) === 'true'; } catch { return false; }
}
```

- [ ] **Step 4: Replace the stub `onSubmit` handler in `js/main.js`**

Find the `rsvp.init({...})` call and replace with:

```javascript
  rsvp.init({
    onSubmit: ({ name, color }) => {
      const ev = state.event || {};
      rsvp.submitRsvp({
        name,
        color,
        episode: ev.episode,
        eventTitle: ev.title
      });
    }
  });
```

- [ ] **Step 5: Hide the I'M IN button if already sent.** In `renderHero()`, after wiring the button, add:

```javascript
  if (state.event && rsvp.isAlreadySent(state.event.episode)) {
    const b = document.getElementById('rsvp-button');
    if (b) { b.disabled = true; b.textContent = 'TRANSMISSION SENT ✓'; }
  }
```

- [ ] **Step 6: Verify in browser**

Reload, dismiss splash, click I'M IN → pick a crew member → Confirm.

Expected (without webhook configured): button shows "TRANSMITTING…", then "TRANSMISSION FAILED — open Discord". Discord button glows. Console shows "[rsvp] webhook URL not configured".

To verify the success path:
1. Create a temporary Discord webhook in your own test server (Server Settings → Integrations → Webhooks → New Webhook → Copy URL).
2. Edit `js/config.js` and replace `'__WEBHOOK_URL__'` with the real URL (locally only — do NOT commit).
3. Reload, RSVP again.
4. Expected: red emergency flash pulses, RSVP SFX plays (if asset present), button settles into "TRANSMISSION SENT ✓", message appears in your Discord channel.
5. Reload — button starts in "TRANSMISSION SENT ✓" state due to localStorage flag.
6. To reset: `localStorage.removeItem('rsvp_sent_7')` (or whatever the episode #).
7. **Revert `js/config.js`** back to `'__WEBHOOK_URL__'` before committing.

- [ ] **Step 7: Commit**

```bash
git add js/config.js js/rsvp.js css/animations.css js/main.js
git commit -m "feat: RSVP submission with webhook POST and emergency flash"
```

---

## Task 16: GitHub Actions deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Inject webhook URL
        env:
          WEBHOOK_URL: ${{ secrets.DISCORD_WEBHOOK_URL }}
        run: |
          if [ -z "$WEBHOOK_URL" ]; then
            echo "::warning::DISCORD_WEBHOOK_URL secret not set; deploying without it (RSVPs will fail)."
            exit 0
          fi
          # Use a delimiter that won't appear in a Discord webhook URL
          sed -i "s|__WEBHOOK_URL__|$WEBHOOK_URL|" js/config.js
          echo "Webhook URL injected."

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: .

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Commit the workflow**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Pages deploy workflow with webhook secret injection"
```

- [ ] **Step 3: Verify workflow config locally** by skim — confirm:
- Step `Inject webhook URL` runs `sed -i "s|__WEBHOOK_URL__|$WEBHOOK_URL|" js/config.js`
- The `path: .` upload includes the whole repo (the JSON files, JS, CSS, assets are all needed)
- `permissions: pages: write, id-token: write` is set

(Actual workflow execution happens after Task 17 when the user pushes to GitHub.)

---

## Task 17: README content guide and final smoke testing

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace `README.md`** with the full content guide

```markdown
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
```

- [ ] **Step 2: Run final smoke checklist** locally

With a fresh browser (or `localStorage.clear()`):

- [ ] First load: splash says "TAP TO BOARD"; click dismisses it; main UI fades in.
- [ ] Reload: splash now says "TAP TO RE-BOARD"; same dismissal.
- [ ] Stars drift, asteroids occasionally cross, crewmate walks every 30–60s.
- [ ] Hero shows formatted date; if event date is within 6 days, day-of-week-only format; otherwise short month + day.
- [ ] Clicking I'M IN opens chooser → picking a crew member opens confirm modal → Confirm runs the RSVP flow.
- [ ] Clicking a crew tile directly opens confirm modal.
- [ ] Clicking "+ you" opens guest form with required name + color picker.
- [ ] RSVP success (with valid webhook): emergency flash pulses, button settles to "TRANSMISSION SENT ✓", message appears in test Discord channel, localStorage flag set.
- [ ] RSVP failure (no webhook): button shows "TRANSMISSION FAILED", Discord button glows.
- [ ] Discord button opens the invite URL in a new tab.
- [ ] Past Nights thumbnail click opens lightbox; arrow keys step photos; Esc closes; click-outside closes.
- [ ] Mute toggle works; reload preserves mute state.
- [ ] Hover/click SFX fire on buttons, tiles, thumbnails.
- [ ] Resize window to <600px width — bottom panels stack, hero font size shrinks via `clamp()`, no horizontal scroll.

- [ ] **Step 3: Run Lighthouse** in DevTools → Lighthouse → Performance + Accessibility on desktop. Note any severe regressions; fix any obvious accessibility issues (missing alt text, low contrast). Best-practices fixes that don't block: ignore for v1.

- [ ] **Step 4: Verify `js/config.js` is still the placeholder** before committing

```bash
grep "__WEBHOOK_URL__" js/config.js
# expected: export const WEBHOOK_URL = '__WEBHOOK_URL__';
```

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: README content guide and update instructions"
```

---

## Task 18: Push to GitHub and configure Pages

**Files:** none in repo.

This task is performed by the user since it requires GitHub account access.

- [ ] **Step 1: Create the GitHub repo**

On GitHub, create a new repository named `AmongUsNightPage` (public, since GitHub Pages free tier requires public OR a paid plan). Do not initialize with a README.

- [ ] **Step 2: Push**

```bash
git remote add origin https://github.com/<your-username>/AmongUsNightPage.git
git push -u origin main
```

- [ ] **Step 3: Add the webhook secret**

In the GitHub repo: Settings → Secrets and variables → Actions → New repository secret.
- Name: `DISCORD_WEBHOOK_URL`
- Value: the webhook URL from Discord (Server Settings → Integrations → Webhooks)

- [ ] **Step 4: Enable Pages with Actions source**

In the GitHub repo: Settings → Pages → Build and deployment → Source: **GitHub Actions**.

- [ ] **Step 5: Trigger a deploy**

Either push another commit (e.g., `git commit --allow-empty -m "ci: trigger deploy"; git push`) or run the workflow manually: Actions tab → "Deploy to GitHub Pages" → Run workflow.

- [ ] **Step 6: Verify deploy**

Wait for the workflow to finish (~1 minute). Visit `https://<your-username>.github.io/AmongUsNightPage/`.

Expected: site loads, splash dismissable, all sections render, RSVP successfully posts to your Discord channel.

If RSVP fails on the deployed site:
- Check the Actions logs for "DISCORD_WEBHOOK_URL secret not set" warning — secret name must match exactly
- View page source in the browser → search for `WEBHOOK_URL` in the deployed `js/config.js` to confirm injection worked

---

## Task 19: User content customization

**Files:**
- Modify: `data/event.json`, `data/crew.json`, `data/discord.json`

This task is performed by the user.

- [ ] **Step 1: Set the real first event** in `data/event.json` — episode #, title, date, time, timezone, notes.

- [ ] **Step 2: Set the real crew** in `data/crew.json` — friends' names and chosen Among Us colors.

- [ ] **Step 3: Set the real Discord info** in `data/discord.json` — server name and a long-lived invite link.

- [ ] **Step 4: Clear the placeholder gallery entry** in `data/gallery.json` (or leave it as `[]` if there are no past nights yet).

- [ ] **Step 5: Commit and push**

```bash
git add data/
git commit -m "content: real event details and crew roster"
git push
```

GitHub Actions auto-deploys. Verify the live site.

---

## Self-review checklist for the implementer

Before declaring the project done, run through:

- [ ] No `__WEBHOOK_URL__` placeholder visible to users (i.e., the deploy workflow must have run successfully, or RSVPs will fail with "webhook URL not configured")
- [ ] No copyrighted Innersloth audio or sprite assets
- [ ] All four `data/*.json` files contain real values, not the dev placeholders
- [ ] At least one CC0 audio file present (or all four; or none — page works either way)
- [ ] README's local-dev and webhook-setup instructions actually work
- [ ] Visited site on a phone in actual mobile browser, not just resized desktop
