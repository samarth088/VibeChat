// ADDED
(function () {
  function qid(id) { return document.getElementById(id); }
  function applyDarkMode(enabled) {
    if (enabled) {
      document.documentElement.classList.add("dark-mode");
      localStorage.setItem("vibe_dark_mode", "1");
    } else {
      document.documentElement.classList.remove("dark-mode");
      localStorage.setItem("vibe_dark_mode", "0");
    }
  }

  function applySound(enabled) {
    localStorage.setItem("vibe_sound", enabled ? "1" : "0");
    // If you have a global Audio helper, you can toggle it here.
    window.VibeSoundEnabled = !!enabled;
  }

  document.addEventListener("DOMContentLoaded", function () {
    // Elements used in settings page (IDs are suggestions; keep them in HTML)
    var darkToggle = qid("darkModeToggle");
    var soundToggle = qid("soundToggle");
    var languageSelect = qid("languageSelect");
    var editProfileBtn = qid("editProfileBtn");

    // Load saved preferences
    var darkSaved = localStorage.getItem("vibe_dark_mode");
    var soundSaved = localStorage.getItem("vibe_sound");
    if (darkSaved === null) darkSaved = "0";
    if (soundSaved === null) soundSaved = "1";

    // Apply visual state
    applyDarkMode(darkSaved === "1");
    applySound(soundSaved === "1");

    if (darkToggle) {
      darkToggle.checked = (darkSaved === "1");
      darkToggle.addEventListener("change", function (e) {
        applyDarkMode(!!e.target.checked);
      });
    }

    if (soundToggle) {
      soundToggle.checked = (soundSaved === "1");
      soundToggle.addEventListener("change", function (e) {
        applySound(!!e.target.checked);
      });
    }

    if (languageSelect) {
      // Placeholder: persist language selection to localStorage
      var lang = localStorage.getItem("vibe_language") || "";
      if (lang) languageSelect.value = lang;
      languageSelect.addEventListener("change", function (e) {
        localStorage.setItem("vibe_language", e.target.value || "");
        // For now, just store — real i18n integration is outside this change
      });
    }

    if (editProfileBtn) {
      editProfileBtn.addEventListener("click", function () {
        // Navigate to profile page / open profile sheet
        if (window.location.pathname.endsWith("app.html")) {
          // If profile edit is an overlay, trigger it; else navigate
          var evt = new CustomEvent("openProfileEdit");
          document.dispatchEvent(evt);
        } else {
          window.location.href = "./app.html#profile";
        }
      });
    }
  });
})();
