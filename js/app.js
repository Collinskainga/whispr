/**
 * app.js — Entry point. Manages auth state & screen switching.
 */
(function () {
  function boot() {
    const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.__KOVA_CONFIG__ || {};

    if (!SUPABASE_URL || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
      document.body.innerHTML = `
        <div style="font-family:system-ui,sans-serif;max-width:520px;margin:80px auto;padding:2rem;text-align:center;color:#f0eeff;">
          <div style="width:56px;height:56px;background:#4f46e5;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:800;color:#fff;margin:0 auto 1.5rem;">K</div>
          <h2 style="margin-bottom:1rem;font-size:1.4rem;">Setup required</h2>
          <p style="color:#a8a4c0;line-height:1.8;">
            Open <code style="background:#1c1c24;padding:2px 6px;border-radius:4px;">js/config.js</code> and add your
            <strong style="color:#f0eeff;">Supabase URL</strong> and <strong style="color:#f0eeff;">anon key</strong>.<br><br>
            Then run <code style="background:#1c1c24;padding:2px 6px;border-radius:4px;">schema.sql</code> in the Supabase SQL Editor.<br><br>
            <a href="https://supabase.com" target="_blank" style="color:#6366f1;">Create a free Supabase project →</a>
          </p>
        </div>`;
      document.body.style.cssText = 'background:#0c0c0f;min-height:100vh;display:flex;align-items:center;justify-content:center;';
      return;
    }

    // Init modules
    Auth.init();

    // Listen for auth changes
    DB.onAuthChange(async (session) => {
      if (session?.user) {
        await showApp(session.user);
      } else {
        showAuth();
      }
    });
  }

  async function showApp(user) {
    // Fetch profile
    const { data: profile, error } = await DB.getProfile(user.id);
    if (error || !profile) {
      UI.toast('Could not load profile. Please try again.', 'error');
      await DB.signOut();
      return;
    }

    document.getElementById('screen-auth').classList.remove('active');
    document.getElementById('screen-app').classList.add('active');

    Chat.init(profile);
  }

  function showAuth() {
    document.getElementById('screen-app').classList.remove('active');
    document.getElementById('screen-auth').classList.add('active');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
