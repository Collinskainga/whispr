/**
 * auth.js — Sign in / Sign up logic
 */
(function () {
  function init() {
    // Tab switching
    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`form-${tab.dataset.tab}`).classList.add('active');
        document.getElementById('auth-error').classList.add('hidden');
      });
    });

    // Sign in
    document.getElementById('btn-login').addEventListener('click', doLogin);
    document.getElementById('login-password').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
    document.getElementById('login-email').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

    // Sign up
    document.getElementById('btn-signup').addEventListener('click', doSignup);
    document.getElementById('signup-password').addEventListener('keydown', e => { if (e.key === 'Enter') doSignup(); });
  }

  function showError(msg) {
    const el = document.getElementById('auth-error');
    el.textContent = msg;
    el.classList.remove('hidden');
  }
  function hideError() {
    document.getElementById('auth-error').classList.add('hidden');
  }

  async function doLogin() {
    hideError();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    if (!email || !password) { showError('Please fill in all fields.'); return; }

    const btn = document.getElementById('btn-login');
    UI.btnLoading(btn);
    const { error } = await DB.signIn(email, password);
    UI.btnReset(btn);

    if (error) { showError(error.message); return; }
    // Auth state change handler in app.js takes over
  }

  async function doSignup() {
    hideError();
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;

    if (!name || !email || !password) { showError('Please fill in all fields.'); return; }
    if (password.length < 6) { showError('Password must be at least 6 characters.'); return; }

    const btn = document.getElementById('btn-signup');
    UI.btnLoading(btn);
    const { error } = await DB.signUp(email, password, name);
    UI.btnReset(btn);

    if (error) { showError(error.message); return; }
    UI.toast('Account created! Check your email to confirm, then sign in.');
    // Switch to login tab
    document.querySelector('[data-tab="login"]').click();
  }

  window.Auth = { init };
})();
