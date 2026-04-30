/**
 * router.js — Simple hash-based client router.
 *
 * Routes:
 *   #            → home view
 *   #room=<id>   → guest (send message) view
 *   #host=<id>   → host dashboard view
 */

(function () {
  const VIEWS = ['home', 'setup', 'host', 'guest', '404'];

  /**
   * Switch the visible view.
   * @param {string} name  One of VIEWS.
   */
  function showView(name) {
    VIEWS.forEach(v => {
      const el = document.getElementById(`view-${v}`);
      if (el) el.classList.toggle('active', v === name);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Navigate to a hash route and optionally push to history.
   * @param {string} hash      e.g. '#room=abc', '' for home
   * @param {boolean} [push]   Whether to push (true) or replace (false) state
   */
  function navigate(hash, push = true) {
    if (push) {
      history.pushState(null, '', hash || window.location.pathname);
    } else {
      history.replaceState(null, '', hash || window.location.pathname);
    }
    dispatch();
  }

  /**
   * Parse the current hash and trigger the appropriate view handler.
   */
  async function dispatch() {
    const hash = window.location.hash;

    if (hash.startsWith('#room=')) {
      const id = hash.slice(6).trim();
      if (id) {
        await window.GuestView.open(id);
      } else {
        showView('home');
      }
      return;
    }

    if (hash.startsWith('#host=')) {
      const id = hash.slice(6).trim();
      if (id) {
        await window.HostView.open(id);
      } else {
        showView('home');
      }
      return;
    }

    // Default: home
    showView('home');
    UI.setNavTag('Anonymous Messaging');
  }

  // Listen for back/forward navigation
  window.addEventListener('popstate', dispatch);

  // Expose for use by view modules
  window.Router = { showView, navigate, dispatch };
})();
