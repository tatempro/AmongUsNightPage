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
