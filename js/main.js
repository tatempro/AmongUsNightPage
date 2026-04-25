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
