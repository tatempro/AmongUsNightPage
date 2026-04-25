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
