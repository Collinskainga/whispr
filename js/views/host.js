/**
 * views/host.js — Host dashboard: view/delete/share messages, real-time updates.
 */

(function () {
  let currentRoomId = null;
  let currentRoomName = null;
  let realtimeChannel = null;
  let allMessages = [];

  /* ── Init (run once on page load) ── */
  function init() {
    document
      .getElementById("copy-link-btn")
      .addEventListener("click", copyLink);
    document
      .getElementById("btn-share-native")
      .addEventListener("click", shareNative);
    document.getElementById("btn-export").addEventListener("click", exportAll);
    document
      .getElementById("btn-export-image-dark")
      .addEventListener("click", () => exportImage("dark"));
    document
      .getElementById("btn-export-image-light")
      .addEventListener("click", () => exportImage("light"));
    document
      .getElementById("btn-clear-all")
      .addEventListener("click", clearAll);
    document
      .getElementById("btn-refresh")
      .addEventListener("click", () => loadMessages(true));

    // Message-level actions via event delegation
    document.getElementById("host-messages").addEventListener("click", (e) => {
      const actionBtn = e.target.closest("[data-action]");
      if (!actionBtn) return;

      const action = actionBtn.dataset.action;
      const card = actionBtn.closest(".msg-card");
      const text = card?.querySelector(".msg-card__text")?.textContent || "";
      const createdAt = card?.dataset.createdAt || new Date().toISOString();

      if (action === "share") {
        openShareModal(text);
      }

      if (action === "copy") {
        UI.copyText(text, actionBtn);
      }

      if (action === "export-dark") {
        UI.exportMessagesAsImage(
          currentRoomName,
          [{ text, created_at: createdAt }],
          "dark",
        )
          .then(() => UI.toast("Image exported!"))
          .catch(() => UI.toast("Could not export image", "error"));
      }

      if (action === "export-light") {
        UI.exportMessagesAsImage(
          currentRoomName,
          [{ text, created_at: createdAt }],
          "light",
        )
          .then(() => UI.toast("Image exported!"))
          .catch(() => UI.toast("Could not export image", "error"));
      }

      if (action === "delete") deleteSingleMessage(actionBtn.dataset.id);
    });

    // Modal
    document
      .getElementById("btn-close-modal")
      .addEventListener("click", closeModal);
    document
      .getElementById("modal-copy-btn")
      .addEventListener("click", copyModalText);
    document.getElementById("share-modal").addEventListener("click", (e) => {
      if (e.target === document.getElementById("share-modal")) closeModal();
    });
  }

  /* ── Open dashboard for a given room ID ── */
  async function open(id) {
    // Unsubscribe from any previous room
    if (realtimeChannel) {
      realtimeChannel.unsubscribe();
      realtimeChannel = null;
    }

    currentRoomId = id;
    Router.showView("host");
    UI.setNavTag("Host Dashboard");

    // Fetch room details
    const { data: room, error } = await DB.getRoom(id);

    if (error || !room) {
      Router.showView("404");
      return;
    }

    currentRoomName = room.name;

    // Populate header
    const titleEl = document.getElementById("host-dash-title");
    titleEl.childNodes[0].textContent = room.name + " ";

    // Share link
    const link = getRoomLink(id);
    document.getElementById("host-share-link").textContent = link;

    // Room code stat
    document.getElementById("stat-code").textContent = id;

    // Load messages
    await loadMessages();

    // Real-time subscription — prepend new messages as they arrive
    realtimeChannel = DB.subscribeToMessages(id, (newMsg) => {
      allMessages.unshift(newMsg);
      renderMessages();
      updateStats();
    });
  }

  /* ── Fetch & render messages ── */
  async function loadMessages(showSpinner = false) {
    const container = document.getElementById("host-messages");
    if (showSpinner) {
      container.innerHTML =
        '<div class="loading-state"><div class="spinner"></div></div>';
      const btn = document.getElementById("btn-refresh");
      btn.classList.add("spinning");
      setTimeout(() => btn.classList.remove("spinning"), 800);
    }

    const { data, error } = await DB.getMessages(currentRoomId);

    if (error) {
      container.innerHTML =
        '<div class="empty-state"><p>Could not load messages. Try refreshing.</p></div>';
      return;
    }

    allMessages = data || [];
    renderMessages();
    updateStats();
  }

  function renderMessages() {
    const container = document.getElementById("host-messages");

    if (!allMessages.length) {
      container.innerHTML = UI.emptyStateHTML();
      return;
    }

    container.innerHTML = allMessages.map(UI.msgCardHTML).join("");
  }

  function updateStats() {
    const today = new Date().toDateString();
    const todayCount = allMessages.filter(
      (m) => new Date(m.created_at).toDateString() === today,
    ).length;

    document.getElementById("stat-total").textContent = allMessages.length;
    document.getElementById("stat-today").textContent = todayCount;
  }

  /* ── Actions ── */
  function getRoomLink(id) {
    return `${window.location.origin}${window.location.pathname}#room=${id}`;
  }

  function copyLink() {
    const btn = document.getElementById("copy-link-btn");
    UI.copyText(getRoomLink(currentRoomId), btn);
  }

  function shareNative() {
    const link = getRoomLink(currentRoomId);
    if (navigator.share) {
      navigator.share({
        title: `Send ${currentRoomName} an anonymous message`,
        url: link,
      });
    } else {
      const btn = document.getElementById("copy-link-btn");
      UI.copyText(link, btn);
      UI.toast("Link copied — paste it anywhere!");
    }
  }

  function exportAll() {
    if (!allMessages.length) {
      UI.toast("No messages to export");
      return;
    }
    UI.exportMessages(currentRoomName, allMessages);
  }

  function exportImage(theme) {
    if (!allMessages.length) {
      UI.toast("No messages to export");
      return;
    }
    UI.exportMessagesAsImage(currentRoomName, allMessages, theme)
      .then(() => UI.toast("Image exported!"))
      .catch(() => UI.toast("Could not export image", "error"));
  }

  async function clearAll() {
    if (!allMessages.length) {
      UI.toast("No messages to clear");
      return;
    }
    if (!confirm("Delete all messages? This cannot be undone.")) return;

    const { error } = await DB.clearMessages(currentRoomId);
    if (error) {
      UI.toast("Could not clear messages", "error");
      return;
    }

    allMessages = [];
    renderMessages();
    updateStats();
    UI.toast("All messages cleared");
  }

  async function deleteSingleMessage(msgId) {
    const { error } = await DB.deleteMessage(msgId);
    if (error) {
      UI.toast("Could not delete message", "error");
      return;
    }

    allMessages = allMessages.filter((m) => m.id !== msgId);
    renderMessages();
    updateStats();
    UI.toast("Message deleted");
  }

  /* ── Share modal ── */
  let modalText = "";

  function openShareModal(text) {
    modalText = text;
    const preview = text.length > 200 ? text.slice(0, 200) + "…" : text;
    const shareSnip = `"${text.slice(0, 100)}${text.length > 100 ? "…" : ""}"`;

    document.getElementById("modal-msg-text").textContent = preview;
    document.getElementById("modal-share-text").textContent = shareSnip;
    document.getElementById("share-modal").classList.add("open");
  }

  function closeModal() {
    document.getElementById("share-modal").classList.remove("open");
  }

  function copyModalText() {
    const btn = document.getElementById("modal-copy-btn");
    UI.copyText(`"${modalText}"`, btn);
  }

  window.HostView = { init, open };
})();
