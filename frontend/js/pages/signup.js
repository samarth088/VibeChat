// js/pages/signup.js
// Signup page logic — ES module (type="module")

document.addEventListener('DOMContentLoaded', function () {
  const form         = document.getElementById('signupForm');
  const errorBox     = document.getElementById('signupError');
  const successBox   = document.getElementById('signupSuccess');
  const submitBtn    = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    hideMessages();

    const formData        = new FormData(form);
    const fullname        = (formData.get('fullname')        || '').trim();
    const username        = (formData.get('username')        || '').trim();
    const contact         = (formData.get('contact')         || '').trim();
    const password        = (formData.get('password')        || '');
    const confirmPassword = (formData.get('confirmPassword') || '');

    // ── Validation ──────────────────────────────────────────────
    if (!fullname) {
      return showError('Please enter your full name.');
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return showError('Username must be 3–20 chars: letters, numbers, underscore only.');
    }
    if (!contact) {
      return showError('Please enter your phone number or email.');
    }
    if (password.length < 6) {
      return showError('Password must be at least 6 characters.');
    }
    if (password !== confirmPassword) {
      return showError('Passwords do not match.');
    }

    setLoading(true);

    try {
      const response = await window.VibeAPI.signup({
        fullname,
        username,
        contact,
        password
      });

      const session = {
        userId:      response.userId,
        idFormatted: response.idFormatted || window.VibeState.formatId(response.userId),
        username:    response.username || username,
        token:       response.token || '',
        profile:     response.profile || {}
      };

      // Save session then go to app
      window.VibeState.saveSession(session);

      showSuccess('Account created! Your ID: ' + session.idFormatted + ' — Redirecting…');

      setTimeout(function () {
        window.location.assign('./app.html');
      }, 1500);

    } catch (err) {
      setLoading(false);
      showError(err.message || 'Signup failed. Please try again.');
    }
  });

  // ── Helpers ─────────────────────────────────────────────────
  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.classList.remove('hidden');
    successBox.classList.add('hidden');
  }

  function showSuccess(msg) {
    successBox.textContent = msg;
    successBox.classList.remove('hidden');
    errorBox.classList.add('hidden');
  }

  function hideMessages() {
    errorBox.classList.add('hidden');
    successBox.classList.add('hidden');
    errorBox.textContent = '';
    successBox.textContent = '';
  }

  function setLoading(on) {
    submitBtn.disabled    = on;
    submitBtn.textContent = on ? 'Creating account…' : 'Create Account';
  }
});
