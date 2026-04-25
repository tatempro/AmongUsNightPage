import * as animations from './animations.js';
import * as gallery from './gallery.js';
import * as audio from './audio.js';
import * as rsvp from './rsvp.js';

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
  const discordBtn = document.getElementById('discord-button');
  if (discordBtn) {
    discordBtn.addEventListener('click', () => {
      const url = state.discord && state.discord.inviteUrl;
      if (url) window.open(url, '_blank', 'noopener');
    });
  }
  const rsvpBtn = document.getElementById('rsvp-button');
  if (rsvpBtn) {
    rsvpBtn.addEventListener('click', () => {
      rsvp.openChooser(state.crew || []);
    });
  }
  if (state.event && rsvp.isAlreadySent(state.event.episode)) {
    const b = document.getElementById('rsvp-button');
    if (b) { b.disabled = true; b.textContent = 'TRANSMISSION SENT ✓'; }
  }
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}

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

document.addEventListener('DOMContentLoaded', async () => {
  animations.start();
  setupSplash();
  wireSfx();
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
  await loadAll();
  renderHero();
  renderRoster();
  wireRosterClicks();
  renderDiscord();
  renderPastNights();
  gallery.mount(state.gallery);
});

export { state };
