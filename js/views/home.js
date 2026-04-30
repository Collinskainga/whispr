/**
 * views/home.js — Home view interactions.
 */

(function () {
  function init() {
    // Create room button
    document.getElementById('btn-create-room').addEventListener('click', () => {
      Router.showView('setup');
      UI.setNavTag('Create Room');
    });

    // "I have a code" toggle
    document.getElementById('btn-have-code').addEventListener('click', () => {
      const panel = document.getElementById('enter-code-panel');
      panel.classList.remove('hidden');
      document.getElementById('guest-code-input').focus();
    });

    // Cancel code entry
    document.getElementById('btn-cancel-code').addEventListener('click', () => {
      document.getElementById('enter-code-panel').classList.add('hidden');
      document.getElementById('guest-code-input').value = '';
    });

    // Open room by code button
    document.getElementById('btn-open-code').addEventListener('click', openByCode);

    // Allow pressing Enter in the code input
    document.getElementById('guest-code-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') openByCode();
    });
  }

  async function openByCode() {
    const code = document.getElementById('guest-code-input').value.trim();
    if (!code) {
      UI.toast('Please enter a room code');
      return;
    }

    const btn = document.getElementById('btn-open-code');
    UI.btnLoading(btn);

    const { data, error } = await DB.getRoom(code);

    UI.btnReset(btn);

    if (error || !data) {
      UI.toast('Room not found — check the code and try again', 'error');
      return;
    }

    Router.navigate('#room=' + code);
  }

  window.HomeView = { init };
})();
