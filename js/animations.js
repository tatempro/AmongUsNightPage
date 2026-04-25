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
