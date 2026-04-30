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
  function toast(message, type = "default") {
    const el = document.getElementById("toast");
    el.textContent = message;
    el.className = "toast show";
    if (type === "error") el.style.background = "var(--color-danger)";
    else if (type === "success") el.style.background = "var(--color-green)";
    else el.style.background = "var(--color-ink)";

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 3000);
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
        btn.textContent = "Copied!";
        btn.classList.add("copied");
        setTimeout(() => {
          btn.textContent = original;
          btn.classList.remove("copied");
        }, 2200);
      }
      return true;
    } catch {
      toast("Could not copy — please copy manually", "error");
      return false;
    }
  }

  /* ── Button loading state ── */
  /**
   * Put a button into a loading state (disables it, shows spinner).
   * @param {HTMLElement} btn
   */
  function btnLoading(btn) {
    const textEl = btn.querySelector(".btn__text");
    const spinnerEl = btn.querySelector(".btn__spinner");
    btn.disabled = true;
    if (textEl) textEl.style.opacity = "0.5";
    if (spinnerEl) spinnerEl.classList.remove("hidden");
  }

  /**
   * Reset a button from loading state.
   * @param {HTMLElement} btn
   */
  function btnReset(btn) {
    const textEl = btn.querySelector(".btn__text");
    const spinnerEl = btn.querySelector(".btn__spinner");
    btn.disabled = false;
    if (textEl) textEl.style.opacity = "";
    if (spinnerEl) spinnerEl.classList.add("hidden");
  }

  /* ── Formatting ── */
  /**
   * Format a timestamp into a human-friendly string.
   * @param {string|number} ts
   * @returns {string}
   */
  function formatTime(ts) {
    const d = new Date(ts);
    const now = new Date();
    const same = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    if (same) return `Today at ${time}`;
    return `${d.toLocaleDateString([], { month: "short", day: "numeric" })} at ${time}`;
  }

  /**
   * Safely escape HTML special characters.
   * @param {string} str
   * @returns {string}
   */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/\n/g, "<br>");
  }

  /* ── Nav tag ── */
  /**
   * Update the nav tag text.
   * @param {string} text
   */
  function setNavTag(text) {
    document.getElementById("nav-tag").textContent = text;
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
            <button class="msg-action-btn" data-action="share">Share</button>
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
      .map((m) => `[${formatTime(m.created_at)}]\n${m.text}`)
      .join("\n\n---\n\n");
    const header = `Room: ${roomName}\nExported: ${new Date().toLocaleString()}\n\n`;
    const blob = new Blob([header + lines], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "whispr-messages.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function wrapText(ctx, text, maxWidth) {
    const words = text.split(/\s+/);
    const lines = [];
    let line = "";

    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth) {
        line = candidate;
      } else {
        if (line) lines.push(line);
        if (ctx.measureText(word).width <= maxWidth) {
          line = word;
        } else {
          let partial = "";
          for (const char of word) {
            const next = partial + char;
            if (ctx.measureText(next).width <= maxWidth) {
              partial = next;
            } else {
              if (partial) lines.push(partial);
              partial = char;
            }
          }
          line = partial;
        }
      }
    }

    if (line) lines.push(line);
    return lines;
  }

  function downloadBlob(blob, filename) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function exportMessagesAsImage(roomName, messages, theme = "dark") {
    const width = 1200;
    const padding = 64;
    const cardRadius = 28;
    const cardPadding = 36;
    const gap = 26;
    const titleFont = '700 44px "DM Sans", system-ui, sans-serif';
    const bodyFont = '400 30px "DM Sans", system-ui, sans-serif';
    const metaFont = '400 22px "DM Sans", system-ui, sans-serif';

    const themes = {
      dark: {
        bg: "#0d1117",
        card: "#161b22",
        text: "#f8f8f2",
        secondary: "#8b949e",
        accent: "#58a6ff",
        border: "rgba(255,255,255,0.1)",
      },
      light: {
        bg: "#f8fafc",
        card: "#ffffff",
        text: "#0f172a",
        secondary: "#475569",
        accent: "#0f766e",
        border: "rgba(15,23,42,0.08)",
      },
    };

    const colors = themes[theme] || themes.dark;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const contentWidth = width - padding * 2;
    ctx.font = titleFont;
    const titleLines = wrapText(ctx, `Room: ${roomName}`, contentWidth);

    ctx.font = metaFont;
    const subtitleLines = wrapText(
      ctx,
      `Exported ${new Date().toLocaleString()}`,
      contentWidth,
    );

    const messageLayouts = messages.map((msg) => {
      ctx.font = bodyFont;
      const lines = wrapText(ctx, msg.text, contentWidth - cardPadding * 2);
      const lineHeight = 42;
      const textHeight = lines.length * lineHeight;
      const metaHeight = 28;
      const cardHeight = cardPadding * 2 + textHeight + 24 + metaHeight;
      return { msg, lines, cardHeight, textHeight, lineHeight };
    });

    let y = padding;
    y += titleLines.length * 52;
    y += 18;
    y += subtitleLines.length * 30;
    y += 40;

    for (const layout of messageLayouts) {
      y += layout.cardHeight + gap;
    }

    y += padding - gap;
    canvas.width = width;
    canvas.height = Math.max(y, 800);

    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = titleFont;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = colors.accent;
    let cursorY = padding;
    titleLines.forEach((line) => {
      ctx.fillText(line, padding, cursorY);
      cursorY += 52;
    });

    ctx.fillStyle = colors.secondary;
    subtitleLines.forEach((line) => {
      ctx.font = metaFont;
      ctx.fillText(line, padding, cursorY);
      cursorY += 30;
    });

    cursorY += 32;

    for (const layout of messageLayouts) {
      const cardTop = cursorY;
      const cardLeft = padding;
      const cardWidth = contentWidth;

      ctx.fillStyle = colors.card;
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cardLeft + cardRadius, cardTop);
      ctx.lineTo(cardLeft + cardWidth - cardRadius, cardTop);
      ctx.quadraticCurveTo(
        cardLeft + cardWidth,
        cardTop,
        cardLeft + cardWidth,
        cardTop + cardRadius,
      );
      ctx.lineTo(
        cardLeft + cardWidth,
        cardTop + layout.cardHeight - cardRadius,
      );
      ctx.quadraticCurveTo(
        cardLeft + cardWidth,
        cardTop + layout.cardHeight,
        cardLeft + cardWidth - cardRadius,
        cardTop + layout.cardHeight,
      );
      ctx.lineTo(cardLeft + cardRadius, cardTop + layout.cardHeight);
      ctx.quadraticCurveTo(
        cardLeft,
        cardTop + layout.cardHeight,
        cardLeft,
        cardTop + layout.cardHeight - cardRadius,
      );
      ctx.lineTo(cardLeft, cardTop + cardRadius);
      ctx.quadraticCurveTo(cardLeft, cardTop, cardLeft + cardRadius, cardTop);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      let textY = cardTop + cardPadding;
      ctx.font = bodyFont;
      ctx.fillStyle = colors.text;
      for (const line of layout.lines) {
        ctx.fillText(line, cardLeft + cardPadding, textY);
        textY += layout.lineHeight;
      }

      textY += 18;
      ctx.font = metaFont;
      ctx.fillStyle = colors.secondary;
      ctx.fillText(
        formatTime(layout.msg.created_at),
        cardLeft + cardPadding,
        textY,
      );

      cursorY += layout.cardHeight + gap;
    }

    return new Promise((resolve, reject) => {
      if (!canvas.toBlob) {
        try {
          const dataUrl = canvas.toDataURL("image/png");
          const a = document.createElement("a");
          a.href = dataUrl;
          a.download = `whispr-messages-${theme}.png`;
          a.click();
          resolve();
        } catch (error) {
          reject(error);
        }
        return;
      }

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Could not create image"));
          return;
        }
        downloadBlob(blob, `whispr-messages-${theme}.png`);
        resolve();
      }, "image/png");
    });
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
    exportMessagesAsImage,
  };
})();
