// ADDED
(function () {
  function qid(id) { return document.getElementById(id); }
  function qs(sel) { return document.querySelector(sel); }

  async function loadProfile() {
    try {
      var sess = window.VibeState && window.VibeState.loadSession ? window.VibeState.loadSession() : null;
      if (!sess) return;

      var profile = await window.VibeAPI.getMyProfile(sess.token);
      if (!profile) return;

      // Fill UI fields (IDs used below should match HTML)
      var nameEl = qid("profileNameInput");
      var usernameEl = qid("profileUsernameInput");
      var bioEl = qid("profileBioInput");
      var avatarImg = qid("profileAvatarImg");
      var idText = qid("profileUid");

      if (nameEl) nameEl.value = profile.name || "";
      if (usernameEl) usernameEl.value = profile.username || "";
      if (bioEl) bioEl.value = profile.bio || "";
      if (avatarImg) {
        if (profile.avatar) {
          avatarImg.src = profile.avatar;
        } else {
          avatarImg.src = "/assets/images/default-avatar.png";
        }
      }
      if (idText) idText.textContent = profile.uid ? ("ID: " + profile.uid) : "";
    } catch (e) {
      console.error("Failed to load profile:", e);
    }
  }

  function readFileAsDataURL(file) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onload = function () { resolve(fr.result); };
      fr.onerror = function (err) { reject(err); };
      fr.readAsDataURL(file);
    });
  }

  async function saveProfile() {
    try {
      var sess = window.VibeState && window.VibeState.loadSession ? window.VibeState.loadSession() : null;
      if (!sess) return;

      var nameEl = qid("profileNameInput");
      var usernameEl = qid("profileUsernameInput");
      var bioEl = qid("profileBioInput");
      var avatarFileInput = qid("profileAvatarFile");
      var avatarImg = qid("profileAvatarImg");

      var data = {
        name: nameEl ? nameEl.value.trim() : undefined,
        username: usernameEl ? usernameEl.value.trim().toLowerCase() : undefined,
        bio: bioEl ? bioEl.value : undefined
      };

      // If new avatar file selected -> read as base64 and submit
      if (avatarFileInput && avatarFileInput.files && avatarFileInput.files[0]) {
        try {
          var dataUrl = await readFileAsDataURL(avatarFileInput.files[0]);
          data.avatar = dataUrl;
        } catch (err) {
          console.warn("Avatar read failed", err);
        }
      }

      var updated = await window.VibeAPI.updateProfile(data, sess.token);

      // Update session info stored locally if present
      if (window.VibeState && typeof window.VibeState.saveSession === "function") {
        var s = window.VibeState.loadSession() || {};
        s.username = updated.username || s.username;
        s.avatar = updated.avatar || s.avatar;
        window.VibeState.saveSession(s);
      }

      // Reflect updated avatar in UI
      if (avatarImg && updated.avatar) {
        avatarImg.src = updated.avatar;
      }

      // Optionally show a toast/notice (if overlays.js provides showToast)
      if (window.showToast) window.showToast("Profile updated");

      // refresh any global profile displays
      var evt = new CustomEvent("profileUpdated", { detail: updated });
      document.dispatchEvent(evt);

    } catch (err) {
      console.error("Profile save error:", err);
      var msg = err && err.message ? err.message : "Update failed";
      if (window.showToast) window.showToast(msg);
      else alert(msg);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    // Try to load profile when profile UI is present
    if (document.getElementById("profileNameInput")) {
      loadProfile();
    }

    var saveBtn = qid("profileSaveBtn");
    if (saveBtn) saveBtn.addEventListener("click", function (e) {
      e.preventDefault();
      saveProfile();
    });

    // Live avatar preview
    var avatarFileInput = qid("profileAvatarFile");
    var avatarImg = qid("profileAvatarImg");
    if (avatarFileInput && avatarImg) {
      avatarFileInput.addEventListener("change", function () {
        var f = avatarFileInput.files && avatarFileInput.files[0];
        if (!f) return;
        var reader = new FileReader();
        reader.onload = function () {
          avatarImg.src = reader.result;
        };
        reader.readAsDataURL(f);
      });
    }

    // Allow other parts of app to trigger profile reload
    document.addEventListener("openProfileEdit", function () {
      loadProfile();
      // show profile sheet if you have a sheet component
      var sheet = document.getElementById("profileSheet");
      if (sheet && typeof sheet.show === "function") sheet.show();
    });
  });

})();
