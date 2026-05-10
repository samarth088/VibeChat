// js/pages/settings.js
// Settings page — Change Password handler

document.addEventListener("DOMContentLoaded", function () {

  // ■■ Change Password Form ■■
  var cpForm = document.getElementById("changePasswordForm");
  if (cpForm) {
    cpForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      var currentPass = document.getElementById("currentPassword").value.trim();
      var newPass     = document.getElementById("newPassword").value.trim();
      var confirmPass = document.getElementById("confirmPassword").value.trim();
      var msgEl       = document.getElementById("passwordMsg");

      // Reset message
      msgEl.textContent = "";
      msgEl.style.color = "";

      // Frontend validation
      if (!currentPass || !newPass || !confirmPass) {
        msgEl.textContent = "Saare fields fill karo";
        msgEl.style.color = "var(--err, #ff5060)";
        return;
      }
      if (newPass !== confirmPass) {
        msgEl.textContent = "Naya password aur confirm password match nahi kar rahe";
        msgEl.style.color = "var(--err, #ff5060)";
        return;
      }
      if (newPass.length < 6) {
        msgEl.textContent = "Password kam se kam 6 characters ka hona chahiye";
        msgEl.style.color = "var(--err, #ff5060)";
        return;
      }
      if (currentPass === newPass) {
        msgEl.textContent = "Naya password purane se alag hona chahiye";
        msgEl.style.color = "var(--err, #ff5060)";
        return;
      }

      var btn = cpForm.querySelector("button[type=submit]");
      if (btn) { btn.disabled = true; btn.textContent = "Saving..."; }

      try {
        var sess = window.VibeState && window.VibeState.loadSession
          ? window.VibeState.loadSession()
          : null;
        if (!sess || !sess.token) {
          msgEl.textContent = "Session expire ho gayi, dobara login karo";
          msgEl.style.color = "var(--err, #ff5060)";
          return;
        }

        await window.VibeAPI.changePassword(currentPass, newPass, sess.token);

        msgEl.textContent = "✓ Password change ho gaya!";
        msgEl.style.color = "#22c55e";
        cpForm.reset();

      } catch (err) {
        msgEl.textContent = err.message || "Kuch error aaya, dobara try karo";
        msgEl.style.color = "var(--err, #ff5060)";
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = "Change Password"; }
      }
    });
  }

});
