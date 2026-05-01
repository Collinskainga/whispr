/**
 * ui.js — Shared UI helpers
 */
(function () {
  // ── Toast ──────────────────────────────────────────────────
  let toastTimer = null;
  function toast(msg, type = 'default') {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = 'toast show';
    if (type === 'error') el.style.borderColor = 'rgba(239,68,68,0.4)';
    else el.style.borderColor = 'var(--border-light)';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
  }

  // ── Button states ──────────────────────────────────────────
  function btnLoading(btn) {
    const t = btn.querySelector('.btn__text');
    const s = btn.querySelector('.btn__spinner');
    btn.disabled = true;
    if (t) t.style.opacity = '0.4';
    if (s) s.classList.remove('hidden');
  }
  function btnReset(btn) {
    const t = btn.querySelector('.btn__text');
    const s = btn.querySelector('.btn__spinner');
    btn.disabled = false;
    if (t) t.style.opacity = '';
    if (s) s.classList.add('hidden');
  }

  // ── Avatar ─────────────────────────────────────────────────
  const AVATAR_COLORS = [
    '#6366f1','#8b5cf6','#ec4899','#f59e0b',
    '#10b981','#3b82f6','#ef4444','#14b8a6',
  ];
  function getAvatarColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  }
  function avatarInitials(name) {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }
  function setAvatar(el, name) {
    const color = getAvatarColor(name);
    el.style.background = color;
    el.textContent = avatarInitials(name);
  }

  // ── Time formatting ─────────────────────────────────────────
  function formatTime(ts) {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  function formatDate(ts) {
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return 'Today';
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  function formatConvTime(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString())
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
  }

  window.UI = { toast, btnLoading, btnReset, getAvatarColor, avatarInitials, setAvatar, formatTime, formatDate, formatConvTime, escapeHtml };
})();
