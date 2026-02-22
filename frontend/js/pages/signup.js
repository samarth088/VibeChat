// js/pages/signup.js
// 2-step signup: Step 1 = details, Step 2 = Email OTP verify

document.addEventListener('DOMContentLoaded', function () {

  var signupForm       = document.getElementById('signupForm');
  var otpPhase         = document.getElementById('otpPhase');
  var signupError      = document.getElementById('signupError');
  var otpError         = document.getElementById('otpError');
  var otpSuccess       = document.getElementById('otpSuccess');
  var verifyOtpBtn     = document.getElementById('verifyOtpBtn');
  var backBtn          = document.getElementById('backBtn');
  var resendBtn        = document.getElementById('resendBtn');
  var otpEmailDisplay  = document.getElementById('otpEmailDisplay');
  var authSubtitle     = document.getElementById('authSubtitle');
  var timerCount       = document.getElementById('timerCount');
  var otpTimerEl       = document.getElementById('otpTimer');
  var submitBtn        = signupForm.querySelector('button[type="submit"]');
  var otpBoxes         = document.querySelectorAll('.otp-box');

  var pendingData   = {};
  var timerInterval = null;

  // ================= STEP 1 =================
  signupForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    hide(signupError);

    var formData        = new FormData(signupForm);
    var fullname        = (formData.get('fullname')        || '').trim();
    var username        = (formData.get('username')        || '').trim();
    var email           = (formData.get('email')           || '').trim().toLowerCase();
    var password        = (formData.get('password')        || '');
    var confirmPassword = (formData.get('confirmPassword') || '');

    if (!fullname)
      return showErr(signupError, 'Please enter your full name.');
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username))
      return showErr(signupError, 'Username: 3-20 chars, letters/numbers/underscore only.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return showErr(signupError, 'Please enter a valid email address.');
    if (password.length < 6)
      return showErr(signupError, 'Password must be at least 6 characters.');
    if (password !== confirmPassword)
      return showErr(signupError, 'Passwords do not match.');

    pendingData = { fullname, username, email, password };

    setBtn(submitBtn, true, 'Sending OTP...');

    try {

      await window.VibeAPI.sendOTP(email);

      signupForm.classList.add('hidden');
      otpPhase.classList.remove('hidden');
      authSubtitle.textContent = 'Verify your email';

      var parts = email.split('@');
      var masked = parts[0].slice(0, 3) + '***@' + parts[1];
      otpEmailDisplay.textContent = masked;

      otpBoxes[0].focus();
      startTimer(30);

    } catch (err) {
      setBtn(submitBtn, false, 'Send OTP');
      showErr(signupError, err.message || 'Could not send OTP.');
    }
  });

  // ================= STEP 2 =================
  verifyOtpBtn.addEventListener('click', async function () {

    hide(otpError);
    hide(otpSuccess);

    var otp = Array.from(otpBoxes).map(function (b) { return b.value; }).join('');

    if (otp.length !== 6)
      return showErr(otpError, 'Please enter the complete 6-digit OTP.');

    setBtn(verifyOtpBtn, true, 'Verifying...');

    try {

      var response = await window.VibeAPI.verifyOTPAndSignup({
        otp: otp,
        username: pendingData.username,
        email: pendingData.email,
        password: pendingData.password
      });

      // ✅ FIXED SESSION BLOCK
      var session = {
        userId:      response.userId,
        idFormatted: window.VibeState.formatId(response.userId),
        username:    response.username,
        token:       response.token,
        profile:     response.profile || {}
      };

      window.VibeState.saveSession(session);

      showOk(otpSuccess, '✅ Account created! Redirecting...');

      setTimeout(function () {
        window.location.assign('./app.html');
      }, 1200);

    } catch (err) {
      setBtn(verifyOtpBtn, false, 'Verify & Create Account');
      showErr(otpError, err.message || 'Invalid OTP.');
    }
  });

  // ================= BACK =================
  backBtn.addEventListener('click', function () {
    otpPhase.classList.add('hidden');
    signupForm.classList.remove('hidden');
    authSubtitle.textContent = 'Create your account. Start vibing.';
    setBtn(submitBtn, false, 'Send OTP');
    clearInterval(timerInterval);
    otpBoxes.forEach(function (b) { b.value = ''; });
    hide(otpError);
    hide(otpSuccess);
  });

  // ================= RESEND =================
  resendBtn.addEventListener('click', async function () {

    resendBtn.classList.add('hidden');
    otpTimerEl.classList.remove('hidden');

    try {
      await window.VibeAPI.sendOTP(pendingData.email);
      startTimer(30);
      showOk(otpSuccess, 'OTP resent successfully.');
    } catch (err) {
      showErr(otpError, 'Could not resend OTP.');
    }
  });

  // ================= OTP INPUT HANDLING =================
  otpBoxes.forEach(function (box, i) {

    box.addEventListener('input', function () {
      this.value = this.value.replace(/\D/g, '').slice(0, 1);
      if (this.value && i < otpBoxes.length - 1)
        otpBoxes[i + 1].focus();
    });

    box.addEventListener('keydown', function (e) {
      if (e.key === 'Backspace' && !this.value && i > 0)
        otpBoxes[i - 1].focus();
    });
  });

  // ================= TIMER =================
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

  // ================= HELPERS =================
  function showErr(el, msg) {
    el.textContent = msg;
    el.classList.remove('hidden');
  }

  function showOk(el, msg) {
    el.textContent = msg;
    el.classList.remove('hidden');
  }

  function hide(el) {
    el.classList.add('hidden');
    el.textContent = '';
  }

  function setBtn(btn, state, label) {
    btn.disabled = state;
    btn.textContent = label;
  }

});
