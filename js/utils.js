/* ══════════════════════════════════════════════
   SYNTAX SYNDICATE — UTILITIES
   Toasts · Modals · Validation · Helpers
   ══════════════════════════════════════════════ */

const SS = window.SS || {};

/* ── TOAST SYSTEM ── */
(function () {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    
    const style = document.createElement('style');
    style.innerHTML = `
      .toast-container { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; gap: 12px; z-index: 9999; }
      .toast { background: #ffffff; color: #0a0e1a; padding: 14px 24px; border-radius: 12px; box-shadow: 0 12px 40px rgba(10,14,26,0.12); display: flex; align-items: center; gap: 12px; font-family: 'DM Sans', sans-serif; font-size: 0.95rem; font-weight: 500; border-left: 4px solid #4169e1; animation: slideInBottom 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      .toast-success { border-left-color: #28c840; }
      .toast-error { border-left-color: #ff5f57; }
      .toast-info { border-left-color: #4169e1; }
      .toast-icon { font-weight: 700; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; }
      .toast-success .toast-icon { color: #28c840; }
      .toast-error .toast-icon { color: #ff5f57; }
      .toast-info .toast-icon { color: #4169e1; }
      .toast.hiding { animation: fadeOutBottom 0.3s forwards; }
      @keyframes slideInBottom { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      @keyframes fadeOutBottom { from { transform: translateY(0); opacity: 1; } to { transform: translateY(10px); opacity: 0; } }
    `;
    document.head.appendChild(style);
  }

  SS.showToast = function (message, type = 'info', duration = 3500) {
    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ'}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('hiding');
      toast.addEventListener('animationend', () => toast.remove());
    }, duration);
  };
})();

/* ── MODAL SYSTEM ── */
(function () {
  let overlay = null;

  function ensureOverlay() {
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML = '<div class="modal-content"></div>';
      document.body.appendChild(overlay);
      overlay.addEventListener('click', (e) => { if (e.target === overlay) SS.closeModal(); });
    }
    return overlay;
  }

  SS.showModal = function (html, opts = {}) {
    const ov = ensureOverlay();
    const content = ov.querySelector('.modal-content');
    const title = opts.title || '';
    const closeable = opts.closeable !== false;
    let header = '';
    if (title || closeable) {
      header = `<div class="modal-header"><div class="modal-title">${title}</div>${closeable ? '<button class="modal-close" onclick="SS.closeModal()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' : ''}</div>`;
    }
    content.innerHTML = header + '<div class="modal-body">' + html + '</div>';
    requestAnimationFrame(() => ov.classList.add('active'));
    document.body.style.overflow = 'hidden';
  };

  SS.closeModal = function () {
    if (overlay) { overlay.classList.remove('active'); document.body.style.overflow = ''; }
  };

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') SS.closeModal(); });
})();

/* ── FORM VALIDATION ── */
SS.validateForm = function (form, rules) {
  const errors = {};
  const data = new FormData(form);
  for (const [field, rule] of Object.entries(rules)) {
    const value = (data.get(field) || '').trim();
    if (rule.required && !value) { errors[field] = rule.message || `${field} is required`; continue; }
    if (rule.minLength && value.length < rule.minLength) { errors[field] = `Minimum ${rule.minLength} characters`; continue; }
    if (rule.pattern && !rule.pattern.test(value)) { errors[field] = rule.message || `Invalid ${field}`; continue; }
    if (rule.match) { const mv = (data.get(rule.match) || '').trim(); if (value !== mv) errors[field] = rule.message || 'Does not match'; }
  }
  for (const [field] of Object.entries(rules)) {
    const input = form.querySelector(`[name="${field}"]`);
    if (!input) continue;
    const ex = input.parentElement.querySelector('.form-error');
    if (ex) ex.remove();
    if (errors[field]) {
      input.style.borderColor = '#d32f2f';
      const e = document.createElement('div'); e.className = 'form-error'; e.textContent = errors[field];
      input.parentElement.appendChild(e);
    } else { input.style.borderColor = ''; }
  }
  return { valid: Object.keys(errors).length === 0, errors };
};

/* ── HELPERS ── */
SS.formatDate = function (ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};
SS.formatDateRelative = function (ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now'; if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60); if (h < 24) return h + 'h ago';
  const days = Math.floor(h / 24); if (days < 7) return days + 'd ago';
  return SS.formatDate(ts);
};
SS.truncateText = (s, max = 120) => (!s || s.length <= max) ? (s || '') : s.substring(0, max).trim() + '…';
SS.getInitials = (name) => name ? name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2) : '?';
SS.getRoleBadge = function(role) {
  if (!role) return '';
  let label = '', cssClass = '';
  if (role === 'superadmin') { label = 'Admin'; cssClass = 'badge-super'; }
  else if (role === 'institute_admin') { label = 'Partner'; cssClass = 'badge-partner'; }
  else if (role === 'team') { label = 'Team'; cssClass = 'badge-team'; }
  else return '';
  return `<span class="premium-badge ${cssClass}">${label}</span>`;
};

SS.sanitizeHTML = function(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

SS.copyToClipboard = function(text) {
  navigator.clipboard.writeText(text).then(() => {
    SS.showToast('Copied to clipboard!', 'success');
  }).catch(() => {
    SS.showToast('Failed to copy', 'error');
  });
};

SS.renderAvatar = (p, sizeClass = '') => {
  if (!p) return `<div class="avatar-fallback ${sizeClass}">?</div>`;
  const name = p.name || 'User';
  const url = p.avatar_url || p.author_avatar_url || '';
  const badge = SS.getRoleBadge(p.role);
  let avatarHtml = '';
  if (url && typeof url === 'string' && url.trim()) {
    const sanitizedUrl = SS.sanitizeHTML(url.trim());
    avatarHtml = `<img src="${sanitizedUrl}" alt="${SS.sanitizeHTML(name)}" class="avatar-img ${sizeClass}" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\\'avatar-fallback ${sizeClass}\\\'>${SS.getInitials(name)}</div>';">`;
  } else {
    avatarHtml = `<div class="avatar-fallback ${sizeClass}">${SS.getInitials(name)}</div>`;
  }
  return `<div class="avatar-wrapper ${sizeClass}">${avatarHtml}</div>`;
};

SS.scrollTo = (sel) => { const el = document.querySelector(sel); if (el) el.scrollIntoView({ behavior: 'smooth' }); };

window.SS = SS;
