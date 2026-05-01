/**
 * app.js — Application entry point.
 * Initialises all view modules and kicks off routing.
 */

(function () {
  function boot() {
    // Safety check — make sure Supabase and config loaded correctly
    const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.__WHISPR_CONFIG__ || {};

    if (
      !SUPABASE_URL ||
      SUPABASE_URL === 'YOUR_SUPABASE_URL' ||
      !SUPABASE_ANON_KEY ||
      SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY'
    ) {
      document.body.innerHTML = `
        <div style="
          font-family: system-ui, sans-serif;
          max-width: 560px;
          margin: 80px auto;
          padding: 2rem;
          text-align: center;
          color: #333;
        ">
          <h2 style="margin-bottom:1rem;">⚙️ Setup required</h2>
          <p style="line-height:1.7;color:#666;">
            Open <code>js/config.js</code> and paste your
            <strong>Supabase URL</strong> and <strong>anon key</strong>.<br><br>
            Don't have a Supabase project yet?
            <a href="https://supabase.com" target="_blank" rel="noopener" style="color:#c9622f;">
              Create one free at supabase.com
            </a> — it only takes 2 minutes.<br><br>
            Then run the SQL in <code>schema.sql</code> to create the tables.
          </p>
        </div>`;
      return;
    }

    // Initialise view modules (attach event listeners)
    HomeView.init();
    SetupView.init();
    HostView.init();
    GuestView.init();

    // Handle 404 home button
    document.getElementById('btn-404-home').addEventListener('click', () => {
      Router.navigate('');
    });

    // Kick off routing from the current URL hash
    Router.dispatch();
  }

  // Run after DOM is fully parsed
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
