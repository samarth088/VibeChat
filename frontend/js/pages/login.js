// js/pages/login.js
// Login page logic — ES module (loaded with type="module" in index.html)
//
// FIXES:
//  1. saveSession was re-declared inside the try block — session never saved
//  2. window.location.assign ran before localStorage write completed
//  3. Removed duplicate STORAGE_KEY and formatId (use VibeState from state.js)
//  NOTE: login.js is type="module" but VibeState/VibeAPI are on window so still accessible

document.addEventListener('DOMContentLoaded', function () {
  var form      = document.getElementById('loginForm');
  var errorBox  = document.getElementById('loginError');
  var submitBtn = form ? form.querySelector('button[type="submit"]') : null;

  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    // Hide previous errors
    errorBox.textContent = '';
    errorBox.classList.add('hidden');

    var formData   = new FormData(form);
    var identifier = (formData.get('identifier') || '').trim();
    var password   = formData.get('password') || '';

    // Basic validation
    if (!identifier || !password) {
      showError('Please fill in all fields.');
      return;
    }
    if (!isValidPassword(password)) {
      showError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      // Use VibeAPI (from api.js loaded via <script> in index.html)
      // DEV_MODE => mock, production => real fetch
      var response = await window.VibeAPI.login({ identifier: identifier, password: password });

      // Build session object
      var session = {
        userId:      response.userId,
        idFormatted: response.idFormatted || window.VibeState.formatId(response.userId),
        username:    response.username || identifier,
        token:       response.token || '',
        profile:     response.profile || {}
      };

      // FIX: save session FIRST, then redirect
      // (old code re-declared saveSession inside try block so it was never called)
      window.VibeState.saveSession(session);

      // Small delay to ensure localStorage flush before navigation
      setTimeout(function () {
        window.location.assign('./app.html');
      }, 50);

    } catch (err) {
      setLoading(false);
      showError(err.message || 'Login failed. Please try again.');
    }
  });

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.classList.remove('hidden');
  }

  function setLoading(on) {
    if (!submitBtn) return;
    submitBtn.disabled    = on;
    submitBtn.textContent = on ? 'Signing in…' : 'Sign in';
  }
});
