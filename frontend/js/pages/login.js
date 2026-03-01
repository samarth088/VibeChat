// js/pages/login.js
document.addEventListener('DOMContentLoaded', function () {
  var form      = document.getElementById('loginForm');
  var errorBox  = document.getElementById('loginError');
  var submitBtn = form ? form.querySelector('button[type="submit"]') : null;

  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    errorBox.textContent = '';
    errorBox.classList.add('hidden');

    var formData   = new FormData(form);
    var identifier = (formData.get('identifier') || '').trim();
    var password   = formData.get('password') || '';

    if (!identifier || !password) { showError('Please fill in all fields.'); return; }
    if (password.length < 6) { showError('Password must be at least 6 characters.'); return; }

    setLoading(true);

    try {
      var response = await window.VibeAPI.login({ identifier, password });

      // Backend returns: { token, user: { id, uid, name, username, email, avatar } }
      var userData = response.user || {};

      // ✅ FIX: uid directly save — "vibe_a3f9k2" format
      var session = {
        userId:      userData.id       || '',
        uid:         userData.uid      || '',
        idFormatted: userData.uid      || '',
        name:        userData.name     || '',
        username:    userData.username || userData.email || identifier,
        email:       userData.email    || identifier,
        avatar:      userData.avatar   || '',
        token:       response.token    || '',
        profile:     response.profile  || {}
      };

      window.VibeState.saveSession(session);
      setTimeout(function () { window.location.assign('./app.html'); }, 50);

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
