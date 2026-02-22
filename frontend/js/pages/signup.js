// js/pages/signup.js
// 2-step signup: Step 1 = details, Step 2 = OTP verify
// Regular script — NO type="module"

document.addEventListener('DOMContentLoaded', function () {

  var signupForm      = document.getElementById('signupForm');
  var otpPhase        = document.getElementById('otpPhase');
  var signupError     = document.getElementById('signupError');
  var otpError        = document.getElementById('otpError');
  var otpSuccess      = document.getElementById('otpSuccess');
  var verifyOtpBtn    = document.getElementById('verifyOtpBtn');
  var backBtn         = document.getElementById('backBtn');
  var resendBtn       = document.getElementById('resendBtn');
  var otpPhoneDisplay = document.getElementById('otpPhoneDisplay');
  var authSubtitle    = document.getElementById('authSubtitle');
  var timerCount      = document.getElementById('timerCount');
  var otpTimerEl      = document.getElementById('otpTimer');
  var submitBtn       = signupForm.querySelector('button[type="submit"]');
  var otpBoxes        = document.querySelectorAll('.otp-box');

  var pendingData   = {};
  var timerInterval = null;

  // ── STEP 1: Send OTP ────────────────────────────────────────
  signupForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    hide(signupError);

    var formData        = new FormData(signupForm);
    var fullname        = (formData.get('fullname')        || '').trim();
    var username        = (formData.get('username')        || '').trim();
    var phone           = (formData.get('phone')           || '').trim();
    var password        = (formData.get('password')        || '');
    var confirmPassword = (formData.get('confirmPassword') || '');

    // Clean phone — remove spaces, dashes, +91 prefix if typed
    phone = phone.replace(/\s|-/g, '').replace(/^\+91/, '').replace(/^0/, '');

    if (!fullname)
      return showErr(signupError, 'Please enter your full name.');
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username))
      return showErr(signupError, 'Username: 3-20 chars, letters/numbers/underscore only.');
    if (!/^[6-9]\d{9}$/.test(phone))
      return showErr(signupError, 'Enter a valid 10-digit Indian mobile number.');
    if (password.length < 6)
      return showErr(signupError, 'Password must be at least 6 characters.');
    if (password !== confirmPassword)
      return showErr(signupError, 'Passwords do not match.');

    pendingData = { fullname: fullname, username: username, phone: phone, password: password };

    setBtn(submitBtn, true, 'Sending OTP...');

    try {
      await window.VibeAPI.sendOTP('+91' + phone);

      // Switch to OTP phase
      signupForm.classList.add('hidden');
      otpPhase.classList.remove('hidden');
      authSubtitle.textContent = 'Verify your number';
      otpPhoneDisplay.textContent = '+91 ' + phone.slice(0, 5) + ' ' + phone.slice(5);
      otpBoxes[0].focus();
      startTimer(30);

    } catch (err) {
      setBtn(submitBtn, false, 'Send OTP');
      showErr(signupError, err.message || 'Could not send OTP. Try again.');
    }
  });

  // ── STEP 2: Verify OTP ──────────────────────────────────────
  verifyOtpBtn.addEventListener('click', async function () {
    hide(otpError); hide(otpSuccess);

    var otp = Array.from(otpBoxes).map(function (b) { return b.value; }).join('');
    if (otp.length < 6)
      return showErr(otpError, 'Please enter the complete 6-digit OTP.');

    setBtn(verifyOtpBtn, true, 'Verifying...');

    try {
      var response = await window.VibeAPI.verifyOTPAndSignup({
        otp:      otp,
        fullname: pendingData.fullname,
        username: pendingData.username,
        phone:    '+91' + pendingData.phone,
        password: pendingData.password
      });

      var session = {
        userId:      response.userId,
        idFormatted: response.idFormatted || window.VibeState.formatId(response.userId),
        username:    response.username || pendingData.username,
        token:       response.token || '',
        profile:     response.profile || {}
      };

      window.VibeState.saveSession(session);
      showOk(otpSuccess, '✅ Account created! ID: ' + session.idFormatted + ' — Redirecting...');

      setTimeout(function () {
        window.location.assign('./app.html');
      }, 1500);

    } catch (err) {
      setBtn(verifyOtpBtn, false, 'Verify & Create Account');
      showErr(otpError, err.message || 'Invalid OTP. Try again.');
      document.getElementById('otpBoxes').classList.add('shake');
      setTimeout(function () {
        document.getElementById('otpBoxes').classList.remove('shake');
      }, 500);
    }
  });

  // ── Back button ─────────────────────────────────────────────
  backBtn.addEventListener('click', function () {
    otpPhase.classList.add('hidden');
    signupForm.classList.remove('hidden');
    authSubtitle.textContent = 'Create your account. Start vibing.';
    setBtn(submitBtn, false, 'Send OTP');
    clearInterval(timerInterval);
    Array.from(otpBoxes).forEach(function (b) { b.value = ''; });
    hide(otpError); hide(otpSuccess);
  });

  // ── Resend OTP ───────────────────────────────────────────────
  resendBtn.addEventListener('click', async function () {
    resendBtn.classList.add('hidden');
    otpTimerEl.classList.remove('hidden');
    try {
      await window.VibeAPI.sendOTP('+91' + pendingData.phone);
      startTimer(30);
      showOk(otpSuccess, 'OTP resent!');
      setTimeout(function () { hide(otpSuccess); }, 2000);
    } catch (err) {
      showErr(otpError, 'Could not resend OTP.');
    }
  });

  // ── OTP box keyboard handling ────────────────────────────────
  otpBoxes.forEach(function (box, i) {
    box.addEventListener('input', function () {
      this.value = this.value.replace(/\D/g, '').slice(0, 1);
      if (this.value && i < otpBoxes.length - 1) otpBoxes[i + 1].focus();
      var full = Array.from(otpBoxes).map(function (b) { return b.value; }).join('');
      if (full.length === 6) verifyOtpBtn.click();
    });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'Backspace' && !this.value && i > 0) otpBoxes[i - 1].focus();
    });
    box.addEventListener('paste', function (e) {
      e.preventDefault();
      var pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
      pasted.split('').forEach(function (ch, idx) {
        if (otpBoxes[idx]) otpBoxes[idx].value = ch;
      });
      if (pasted.length === 6) setTimeout(function () { verifyOtpBtn.click(); }, 100);
    });
  });

  // ── Timer ────────────────────────────────────────────────────
  function startTimer(sec) {
    clearInterval(timerInterval);
    timerCount.textContent = sec;
    otpTimerEl.classList.remove('hidden');
    resendBtn.classList.add('hidden');
    timerInterval = setInterval(function () {
      sec--;
      timerCount.textContent = sec;
      if (sec <= 0) {
        clearInterval(timerInterval);
        otpTimerEl.classList.add('hidden');
        resendBtn.classList.remove('hidden');
      }
    }, 1000);
  }

  // ── Tiny helpers ─────────────────────────────────────────────
  function showErr(el, msg) { el.textContent = msg; el.classList.remove('hidden'); }
  function showOk(el, msg)  { el.textContent = msg; el.classList.remove('hidden'); }
  function hide(el)         { el.classList.add('hidden'); el.textContent = ''; }
  function setBtn(btn, on, label) { btn.disabled = on; btn.textContent = label; }

});
