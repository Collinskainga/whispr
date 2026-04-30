/**
 * ui.js — Reusable UI helper functions
 */

(function () {
  /* ── Toast ── */
  let toastTimer = null;

  /**
   * Show a toast notification.
   * @param {string} message
   * @param {'default'|'success'|'error'} [type='default']
   */
  function toast(message, type = 'default') {
    const el = document.getElementById('toast');
    el.textContent = message;
    el.className = 'toast show';
    if (type === 'error')   el.style.background = 'var(--color-danger)';
    else if (type === 'success') el.style.background = 'var(--color-green)';
    else el.style.background = 'var(--color-ink)';

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
  }

  /* ── Copy to clipboard ── */
  /**
   * Copy text and temporarily change a button's label.
   * @param {string} text
   * @param {HTMLElement} btn
   */
  async function copyText(text, btn) {
    try {
      await navigator.clipboard.writeText(text);
      if (btn) {
        const original = btn.textContent;
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = original;
          btn.classList.remove('copied');
        }, 2200);
      }
      return true;
    } catch {
      toast('Could not copy — please copy manually', 'error');
      return false;
    }
  }

  /* ── Button loading state ── */
  /**
   * Put a button into a loading state (disables it, shows spinner).
   * @param {HTMLElement} btn
   */
  function btnLoading(btn) {
    const textEl    = btn.querySelector('.btn__text');
    const spinnerEl = btn.querySelector('.btn__spinner');
    btn.disabled = true;
    if (textEl)    textEl.style.opacity = '0.5';
    if (spinnerEl) spinnerEl.classList.remove('hidden');
  }

  /**
   * Reset a button from loading state.
   * @param {HTMLElement} btn
   */
  function btnReset(btn) {
    const textEl    = btn.querySelector('.btn__text');
    const spinnerEl = btn.querySelector('.btn__spinner');
    btn.disabled = false;
    if (textEl)    textEl.style.opacity = '';
    if (spinnerEl) spinnerEl.classList.add('hidden');
  }

  /* ── Formatting ── */
  /**
   * Format a timestamp into a human-friendly string.
   * @param {string|number} ts
   * @returns {string}
   */
  function formatTime(ts) {
    const d    = new Date(ts);
    const now  = new Date();
    const same = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (same) return `Today at ${time}`;
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${time}`;
  }

  /**
   * Safely escape HTML special characters.
   * @param {string} str
   * @returns {string}
   */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;')
      .replace(/\n/g, '<br>');
  }

  /* ── Nav tag ── */
  /**
   * Update the nav tag text.
   * @param {string} text
   */
  function setNavTag(text) {
    document.getElementById('nav-tag').textContent = text;
  }

  /* ── Empty state HTML ── */
  /**
   * Render the empty inbox state.
   * @returns {string}
   */
  function emptyStateHTML() {
    return `
      <div class="empty-state">
        <div class="empty-state__icon">
          <svg viewBox="0 0 24 24">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <p>No messages yet.<br>Share your link and they'll appear here.</p>
      </div>`;
  }

  /**
   * Render a single message card HTML.
   * @param {object} msg  - message row from DB
   * @returns {string}
   */
  function msgCardHTML(msg) {
    return `
      <div class="msg-card" data-id="${msg.id}">
        <div class="msg-card__text">${escapeHtml(msg.text)}</div>
        <div class="msg-card__meta">
          <span class="msg-card__time">${formatTime(msg.created_at)}</span>
          <div class="msg-card__actions">
            <button class="msg-action-btn" data-action="share" data-text="${escapeHtml(msg.text)}">Share</button>
            <button class="msg-action-btn msg-action-btn--danger" data-action="delete" data-id="${msg.id}">Delete</button>
          </div>
        </div>
      </div>`;
  }

  /* ── Export ── */
  /**
   * Export messages to a plain-text file download.
   * @param {string} roomName
   * @param {object[]} messages
   */
  function exportMessages(roomName, messages) {
    const lines = messages
      .map(m => `[${formatTime(m.created_at)}]\n${m.text}`)
      .join('\n\n---\n\n');
    const header = `Room: ${roomName}\nExported: ${new Date().toLocaleString()}\n\n`;
    const blob   = new Blob([header + lines], { type: 'text/plain' });
    const a      = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = 'whispr-messages.txt';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  /* ── Expose ── */
  window.UI = {
    toast,
    copyText,
    btnLoading,
    btnReset,
    formatTime,
    escapeHtml,
    setNavTag,
    emptyStateHTML,
    msgCardHTML,
    exportMessages,
  };
})();
