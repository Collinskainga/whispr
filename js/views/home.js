/**
 * views/home.js — Home view interactions.
 */

(function () {
  function init() {
    // Create room button
    document.getElementById("btn-create-room").addEventListener("click", () => {
      Router.showView("setup");
      UI.setNavTag("Create Room");
    });

    // "I have a code" toggle
    document.getElementById("btn-have-code").addEventListener("click", () => {
      const panel = document.getElementById("enter-code-panel");
      panel.classList.remove("hidden");
      document.getElementById("guest-code-input").focus();
    });

    // Cancel code entry
    document.getElementById("btn-cancel-code").addEventListener("click", () => {
      document.getElementById("enter-code-panel").classList.add("hidden");
      document.getElementById("guest-code-input").value = "";
    });

    // Open room by code button
    document
      .getElementById("btn-open-code")
      .addEventListener("click", openByCode);

    // Owned room actions
    document
      .getElementById("owned-room-list")
      .addEventListener("click", handleOwnedRoomAction);

    // Allow pressing Enter in the code input
    document
      .getElementById("guest-code-input")
      .addEventListener("keydown", (e) => {
        if (e.key === "Enter") openByCode();
      });

    loadOwnedRooms();
  }

  function getOwnedRoomIds() {
    try {
      const owned = JSON.parse(localStorage.getItem("whispr_owned") || "[]");
      if (!Array.isArray(owned)) return [];
      return [
        ...new Set(owned.filter((id) => typeof id === "string" && id.trim())),
      ];
    } catch (_) {
      return [];
    }
  }

  function handleOwnedRoomAction(e) {
    const actionBtn = e.target.closest("[data-owned-action]");
    if (!actionBtn) return;

    const roomId = actionBtn.dataset.room;
    if (!roomId) return;

    if (actionBtn.dataset.ownedAction === "open") {
      Router.navigate("#host=" + roomId);
    }

    if (actionBtn.dataset.ownedAction === "copy") {
      UI.copyText(roomId, actionBtn);
    }
  }

  async function loadOwnedRooms() {
    const ownedIds = getOwnedRoomIds();
    const panel = document.getElementById("owned-rooms-panel");
    const list = document.getElementById("owned-room-list");

    if (!ownedIds.length) {
      panel.classList.add("hidden");
      list.innerHTML = "";
      return;
    }

    panel.classList.remove("hidden");
    list.innerHTML =
      '<div class="loading-state"><div class="spinner"></div></div>';

    const roomData = await Promise.all(
      ownedIds.map(async (id) => {
        const { data, error } = await DB.getRoom(id);
        return { id, room: data, error };
      }),
    );

    const validRooms = roomData.filter((item) => item.room && !item.error);
    const validIds = validRooms.map((item) => item.id);
    if (validIds.length !== ownedIds.length) {
      try {
        localStorage.setItem("whispr_owned", JSON.stringify(validIds));
      } catch (_) {}
    }

    if (!validRooms.length) {
      panel.classList.add("hidden");
      list.innerHTML = "";
      return;
    }

    list.innerHTML = validRooms
      .map((item) => {
        return `
          <div class="owned-room">
            <div class="owned-room__info">
              <strong>${UI.escapeHtml(item.room.name)}</strong>
              <div class="owned-room__code">${item.id}</div>
            </div>
            <div class="btn-row" style="gap:0.5rem; margin-top:0.75rem;">
              <button class="btn btn--primary btn--sm" type="button" data-owned-action="open" data-room="${item.id}">Open</button>
              <button class="btn btn--ghost btn--sm" type="button" data-owned-action="copy" data-room="${item.id}">Copy code</button>
            </div>
          </div>`;
      })
      .join("");
  }

  async function openByCode() {
    const code = document.getElementById("guest-code-input").value.trim();
    if (!code) {
      UI.toast("Please enter a room code");
      return;
    }

    const btn = document.getElementById("btn-open-code");
    UI.btnLoading(btn);

    const { data, error } = await DB.getRoom(code);

    UI.btnReset(btn);

    if (error || !data) {
      UI.toast("Room not found — check the code and try again", "error");
      return;
    }

    Router.navigate("#room=" + code);
  }

  window.HomeView = { init, onShow: loadOwnedRooms };
})();
