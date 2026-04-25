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
