/**
 * views/setup.js — Room creation view.
 */

(function () {
  function init() {
    document.getElementById('btn-setup-back').addEventListener('click', () => {
      Router.navigate('');
    });

    document.getElementById('btn-do-create').addEventListener('click', createRoom);

    // Allow Enter in the name field to submit
    document.getElementById('host-name-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') createRoom();
    });
  }

  async function createRoom() {
    const nameEl    = document.getElementById('host-name-input');
    const welcomeEl = document.getElementById('host-welcome-input');
    const btn       = document.getElementById('btn-do-create');

    const name    = nameEl.value.trim();
    const welcome = welcomeEl.value.trim();

    if (!name) {
      UI.toast('Please enter a name for your room');
      nameEl.focus();
      return;
    }

    UI.btnLoading(btn);

    const { data, error } = await DB.createRoom({ name, welcome });

    UI.btnReset(btn);

    if (error || !data) {
      UI.toast('Could not create room — please try again', 'error');
      console.error(error);
      return;
    }

    // Store host ownership in localStorage so they can return to their dashboard
    try {
      const owned = JSON.parse(localStorage.getItem('whispr_owned') || '[]');
      if (!owned.includes(data.id)) owned.push(data.id);
      localStorage.setItem('whispr_owned', JSON.stringify(owned));
    } catch (_) { /* private/incognito may block localStorage */ }

    // Clear form fields for next use
    nameEl.value    = '';
    welcomeEl.value = '';

    Router.navigate('#host=' + data.id);
  }

  window.SetupView = { init };
})();
