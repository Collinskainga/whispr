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
      <div class="msg-card" data-id="${msg.id}" data-created-at="${msg.created_at}">
        <div class="msg-card__text">${escapeHtml(msg.text)}</div>
        <div class="msg-card__meta">
          <span class="msg-card__time">${formatTime(msg.created_at)}</span>
          <div class="msg-card__actions">
            <button class="msg-action-btn" data-action="share">Share</button>
            <button class="msg-action-btn" data-action="copy">Copy</button>
            <button class="msg-action-btn" data-action="export-dark">Image dark</button>
            <button class="msg-action-btn" data-action="export-light">Image light</button>
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
    // ── Canvas dimensions (9:16 story format) ──────────────────
    const W = 1080;
    const H = 1920;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    // ── Theme palettes ──────────────────────────────────────────
    const themes = {
      dark: {
        // Deep midnight with aurora glow
        bgStops: [
          { pos: 0, color: "#0a0a1a" },
          { pos: 0.4, color: "#0d1526" },
          { pos: 1, color: "#0a0a18" },
        ],
        orb1: { x: 0.75, y: 0.18, r: 0.38, color: "rgba(139,92,246,0.28)" },
        orb2: { x: 0.2, y: 0.65, r: 0.32, color: "rgba(201,98,47,0.22)" },
        orb3: { x: 0.6, y: 0.82, r: 0.25, color: "rgba(56,189,248,0.18)" },
        cardBg: "rgba(255,255,255,0.07)",
        cardBorder: "rgba(255,255,255,0.14)",
        cardShadow: "rgba(0,0,0,0.55)",
        quoteColor: "rgba(255,255,255,0.22)",
        msgColor: "#f0ece6",
        labelColor: "rgba(240,236,230,0.5)",
        brandColor: "rgba(240,236,230,0.35)",
        accentLine: "rgba(201,98,47,0.85)",
        dotColor: "#c9622f",
      },
      light: {
        // Warm cream with sunrise tones
        bgStops: [
          { pos: 0, color: "#fdf6ec" },
          { pos: 0.5, color: "#faf0e6" },
          { pos: 1, color: "#f5e8d8" },
        ],
        orb1: { x: 0.8, y: 0.15, r: 0.4, color: "rgba(201,98,47,0.12)" },
        orb2: { x: 0.15, y: 0.7, r: 0.3, color: "rgba(234,179,8,0.10)" },
        orb3: { x: 0.55, y: 0.88, r: 0.28, color: "rgba(201,98,47,0.08)" },
        cardBg: "rgba(255,255,255,0.72)",
        cardBorder: "rgba(201,98,47,0.15)",
        cardShadow: "rgba(100,60,20,0.12)",
        quoteColor: "rgba(201,98,47,0.18)",
        msgColor: "#1a1612",
        labelColor: "rgba(26,22,18,0.45)",
        brandColor: "rgba(26,22,18,0.28)",
        accentLine: "#c9622f",
        dotColor: "#c9622f",
      },
    };

    const t = themes[theme] || themes.dark;

    // ── 1. Background gradient ──────────────────────────────────
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    t.bgStops.forEach((s) => bgGrad.addColorStop(s.pos, s.color));
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // ── 2. Soft ambient orbs ────────────────────────────────────
    [t.orb1, t.orb2, t.orb3].forEach((orb) => {
      const ox = orb.x * W,
        oy = orb.y * H,
        or = orb.r * W;
      const radial = ctx.createRadialGradient(ox, oy, 0, ox, oy, or);
      radial.addColorStop(0, orb.color);
      radial.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, W, H);
    });

    // ── 3. Subtle dot-grid noise texture ───────────────────────
    ctx.save();
    ctx.globalAlpha = theme === "dark" ? 0.025 : 0.04;
    for (let gx = 0; gx < W; gx += 28) {
      for (let gy = 0; gy < H; gy += 28) {
        ctx.beginPath();
        ctx.arc(gx, gy, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = theme === "dark" ? "#fff" : "#7a4820";
        ctx.fill();
      }
    }
    ctx.restore();

    // ── Layout constants ────────────────────────────────────────
    const MARGIN = 72;
    const CARD_W = W - MARGIN * 2;
    const CARD_RADIUS = 32;
    const CARD_PAD_X = 52;
    const CARD_PAD_TOP = 56;
    const CARD_PAD_BOT = 52;
    const LINE_H = 52;
    const BODY_FONT_SIZE = 38;

    // Pre-measure message text
    ctx.font = `400 ${BODY_FONT_SIZE}px Georgia, "Playfair Display", serif`;
    const textLayouts = messages.map((msg) => {
      const lines = wrapText(ctx, msg.text, CARD_W - CARD_PAD_X * 2);
      const textH = lines.length * LINE_H;
      const cardH = CARD_PAD_TOP + textH + CARD_PAD_BOT;
      return { msg, lines, textH, cardH };
    });

    // Total content height: label + cards + footer
    const LABEL_H = 80;
    const GAP = 28;
    const FOOTER_H = 100;
    const totalCards = textLayouts.reduce((s, l) => s + l.cardH + GAP, -GAP);
    const totalContent = LABEL_H + 32 + totalCards + 60 + FOOTER_H;
    let cursorY = Math.round((H - totalContent) / 2);

    // ── 4. "you received an anonymous message" label ────────────
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `500 22px "DM Sans", system-ui, sans-serif`;
    ctx.letterSpacing = "0.14em";
    ctx.fillStyle = t.labelColor;
    // uppercase trick via manual conversion
    ctx.fillText("YOU RECEIVED AN ANONYMOUS MESSAGE", W / 2, cursorY + 22);
    ctx.restore();

    cursorY += LABEL_H;

    // ── 5. Cards ────────────────────────────────────────────────
    for (const layout of textLayouts) {
      const cardX = MARGIN;
      const cardY = cursorY;
      const cardH = layout.cardH;

      // Drop shadow
      ctx.save();
      ctx.shadowColor = t.cardShadow;
      ctx.shadowBlur = 48;
      ctx.shadowOffsetY = 16;

      // Card background (glass)
      ctx.beginPath();
      roundRect(ctx, cardX, cardY, CARD_W, cardH, CARD_RADIUS);
      ctx.fillStyle = t.cardBg;
      ctx.fill();
      ctx.restore();

      // Card border
      ctx.beginPath();
      roundRect(ctx, cardX, cardY, CARD_W, cardH, CARD_RADIUS);
      ctx.strokeStyle = t.cardBorder;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Left accent bar
      ctx.beginPath();
      ctx.moveTo(cardX + CARD_RADIUS, cardY + 20);
      ctx.lineTo(cardX + CARD_RADIUS, cardY + cardH - 20);
      ctx.strokeStyle = t.accentLine;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.stroke();

      // Giant decorative quote mark
      ctx.save();
      ctx.font = `bold 220px Georgia, serif`;
      ctx.fillStyle = t.quoteColor;
      ctx.textBaseline = "top";
      ctx.textAlign = "right";
      ctx.fillText("\u201C", cardX + CARD_W - 18, cardY - 36);
      ctx.restore();

      // Message text
      ctx.save();
      ctx.font = `400 ${BODY_FONT_SIZE}px Georgia, "Times New Roman", serif`;
      ctx.fillStyle = t.msgColor;
      ctx.textBaseline = "top";
      ctx.textAlign = "left";
      let textY = cardY + CARD_PAD_TOP;
      for (const line of layout.lines) {
        ctx.fillText(line, cardX + CARD_PAD_X + 12, textY);
        textY += LINE_H;
      }
      ctx.restore();

      cursorY += cardH + GAP;
    }

    cursorY += 32;

    // ── 6. Footer branding ──────────────────────────────────────
    // Dot + wordmark
    const dotR = 7;
    const dotX = W / 2 - 54;
    const dotY = cursorY + FOOTER_H / 2;

    ctx.beginPath();
    ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
    ctx.fillStyle = t.dotColor;
    ctx.fill();

    ctx.save();
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = `600 34px Georgia, "Playfair Display", serif`;
    ctx.fillStyle = t.brandColor;
    ctx.fillText("Whispr", dotX + dotR + 12, dotY);
    ctx.restore();

    // Tagline below
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.font = `400 18px "DM Sans", system-ui, sans-serif`;
    ctx.fillStyle = t.brandColor;
    ctx.fillText("anonymous messaging · whispr", W / 2, dotY + 22);
    ctx.restore();

    // ── Helper: rounded rect path ───────────────────────────────
    function roundRect(c, x, y, w, h, r) {
      c.moveTo(x + r, y);
      c.lineTo(x + w - r, y);
      c.quadraticCurveTo(x + w, y, x + w, y + r);
      c.lineTo(x + w, y + h - r);
      c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      c.lineTo(x + r, y + h);
      c.quadraticCurveTo(x, y + h, x, y + h - r);
      c.lineTo(x, y + r);
      c.quadraticCurveTo(x, y, x + r, y);
      c.closePath();
    }

    // ── Download ────────────────────────────────────────────────
    return new Promise((resolve, reject) => {
      if (!canvas.toBlob) {
        try {
          const dataUrl = canvas.toDataURL("image/png");
          const a = document.createElement("a");
          a.href = dataUrl;
          a.download = `whispr-${theme}.png`;
          a.click();
          resolve();
        } catch (err) {
          reject(err);
        }
        return;
      }
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Could not create image"));
          return;
        }
        downloadBlob(blob, `whispr-${theme}.png`);
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
