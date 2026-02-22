// js/pages/signup.js
// Signup logic — regular script (NO type="module")

document.addEventListener('DOMContentLoaded', function () {
  var form       = document.getElementById('signupForm');
  var errorBox   = document.getElementById('signupError');
  var successBox = document.getElementById('signupSuccess');
  var submitBtn  = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    hideMessages();

    var formData        = new FormData(form);
    var fullname        = (formData.get('fullname')        || '').trim();
    var username        = (formData.get('username')        || '').trim();
    var contact         = (formData.get('contact')         || '').trim();
    var password        = (formData.get('password')        || '');
    var confirmPassword = (formData.get('confirmPassword') || '');

    // Validations
    if (!fullname) return showError('Please enter your full name.');
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return showError('Username: 3-20 chars, letters/numbers/underscore only.');
    if (!contact) return showError('Please enter phone or email.');
    if (password.length < 6) return showError('Password must be at least 6 characters.');
    if (password !== confirmPassword) return showError('Passwords do not match.');

    setLoading(true);

    try {
      var response = await window.VibeAPI.signup({
        fullname: fullname,
        username: username,
        contact:  contact,
        password: password
      });

      var session = {
        userId:      response.userId,
        idFormatted: response.idFormatted || window.VibeState.formatId(response.userId),
        username:    response.username || username,
        token:       response.token || '',
        profile:     response.profile || {}
      };

      window.VibeState.saveSession(session);
      showSuccess('Account created! Your ID: ' + session.idFormatted + ' — Redirecting...');

      setTimeout(function () {
        window.location.assign('./app.html');
      }, 1500);

    } catch (err) {
      setLoading(false);
      showError(err.message || 'Signup failed. Please try again.');
    }
  });

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
  }
  function setLoading(on) {
    submitBtn.disabled    = on;
    submitBtn.textContent = on ? 'Creating account...' : 'Create Account';
  }
});
