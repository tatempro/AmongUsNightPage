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
    src: ['assets/audio/music.ogg'],
    loop: true,
    volume: 0,
    html5: true,
    onloaderror: () => console.info('[audio] music asset missing — silent OK'),
  });

  state.sfx = {
    hover: new Howl({ src: ['assets/audio/hover.ogg'], volume: 0.3, onloaderror: noop }),
    click: new Howl({ src: ['assets/audio/click.ogg'], volume: 0.4, onloaderror: noop }),
    rsvp:  new Howl({ src: ['assets/audio/rsvp.ogg'],  volume: 0.5, onloaderror: noop }),
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
