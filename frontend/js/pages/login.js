// js/pages/login.js
// FIX 1: All session fields properly save hote hain (name, uid, bio missing the pehle)
// FIX 2: identifier field correctly pass hota hai backend ko
// FIX 3: Session check — agar already logged in hai toh app.html pe redirect

document.addEventListener("DOMContentLoaded", function () {

  // ── Already logged in? Direct redirect ──────────────────────
  var existingSession = window.VibeState && window.VibeState.loadSession
    ? window.VibeState.loadSession() : null;
  if (existingSession && existingSession.token && existingSession.userId) {
    window.location.replace("./app.html");
    return;
  }

  var form      = document.getElementById("loginForm");
  var errorBox  = document.getElementById("loginError");
  var submitBtn = form ? form.querySelector('button[type="submit"]') : null;

  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (errorBox) {
      errorBox.textContent = "";
      errorBox.classList.add("hidden");
    }

    var formData   = new FormData(form);
    var identifier = String(formData.get("identifier") || "").trim();
    var password   = String(formData.get("password") || "");

    // Basic validation
    if (!identifier || !password) {
      showError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      showError("Password must be at least 6 characters.");
      return;
    }
    if (!window.VibeAPI || typeof window.VibeAPI.login !== "function") {
      showError("Login service not loaded. Please refresh.");
      return;
    }

    setLoading(true);

    try {
      var response = await window.VibeAPI.login({
        identifier: identifier,
        password:   password
      });

      var userData = response.user || {};

      // FIX: Sab fields save karo — name, uid, bio pehle missing the
      var session = {
        userId:      String(userData.id || response.userId || ""),
        uid:         String(userData.uid || ""),
        idFormatted: String(userData.uid || ""),
        name:        userData.name     || "",
        username:    userData.username || identifier,
        email:       userData.email    || "",
        avatar:      userData.avatar   || "",
        bio:         userData.bio      || "",
        token:       response.token    || ""
      };

      if (!session.userId || !session.token) {
        throw new Error("Invalid response from server. Try again.");
      }

      window.VibeState.saveSession(session);

      // Small delay to ensure localStorage write completes
      setTimeout(function () {
        window.location.assign("./app.html");
      }, 50);

    } catch (err) {
      setLoading(false);
      showError(err.message || "Login failed. Please try again.");
    }
  });

  function showError(msg) {
    if (errorBox) {
      errorBox.textContent = msg;
      errorBox.classList.remove("hidden");
    }
  }

  function setLoading(on) {
    if (!submitBtn) return;
    submitBtn.disabled    = on;
    submitBtn.textContent = on ? "Signing in..." : "Sign in";
  }
});
