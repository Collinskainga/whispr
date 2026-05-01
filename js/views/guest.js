/**
 * views/guest.js — Anonymous message submission view.
 */

(function () {
  let currentRoomId = null;

  /* ── Init (run once on page load) ── */
  function init() {
    const textarea = document.getElementById('guest-msg-input');

    // Character counter
    textarea.addEventListener('input', () => {
      document.getElementById('char-count').textContent = textarea.value.length;
    });

    // Send button
    document.getElementById('btn-send-msg').addEventListener('click', sendMessage);

    // Allow Ctrl+Enter to send
    textarea.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') sendMessage();
    });

    // Send another
    document.getElementById('btn-send-another').addEventListener('click', resetForm);
  }

  /* ── Open the guest view for a room ── */
  async function open(id) {
    Router.showView('guest');
    UI.setNavTag('Send Message');

    // Show loading state
    document.getElementById('guest-host-name').textContent = '…';
    document.getElementById('guest-welcome-msg').textContent = '';

    const { data: room, error } = await DB.getRoom(id);

    if (error || !room) {
      Router.showView('404');
      return;
    }

    currentRoomId = id;

    // Populate header
    document.getElementById('guest-host-name').textContent = room.name;
    document.getElementById('guest-welcome-msg').textContent =
      room.welcome || 'Feel free to send anything — your identity is completely hidden.';

    // Reset form state
    resetForm();
  }

  /* ── Send message ── */
  async function sendMessage() {
    const textarea = document.getElementById('guest-msg-input');
    const btn      = document.getElementById('btn-send-msg');
    const text     = textarea.value.trim();

    if (!text) {
      UI.toast('Please write something first');
      textarea.focus();
      return;
    }

    if (text.length > 800) {
      UI.toast('Message is too long (max 800 characters)');
      return;
    }

    UI.btnLoading(btn);

    const { error } = await DB.sendMessage(currentRoomId, text);

    UI.btnReset(btn);

    if (error) {
      UI.toast('Could not send message — please try again', 'error');
      console.error(error);
      return;
    }

    // Show success state
    document.getElementById('guest-form').classList.add('hidden');
    document.getElementById('guest-success').classList.remove('hidden');
  }

  /* ── Reset form back to input state ── */
  function resetForm() {
    const textarea = document.getElementById('guest-msg-input');
    textarea.value = '';
    document.getElementById('char-count').textContent = '0';
    document.getElementById('guest-form').classList.remove('hidden');
    document.getElementById('guest-success').classList.add('hidden');
    textarea.focus();
  }

  window.GuestView = { init, open };
})();
