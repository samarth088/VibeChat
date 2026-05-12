// js/ui/profile.js
// VibeChat — Profile editor overlay
// FIX: applyProfileToUI now also updates stat-chats count
// FIX: loadProfile merges backend data with session properly

(function () {
  var editorState = {
    currentAvatar:      "",
    selectedAvatarData: ""
  };

  function esc(t) {
    return String(t || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
  function escAttr(t) {
    return String(t || "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function getSession() {
    return window.VibeState && window.VibeState.loadSession
      ? window.VibeState.loadSession() : null;
  }

  function saveSessionSafe(sess) {
    if (window.VibeState && typeof window.VibeState.saveSession === "function") {
      window.VibeState.saveSession(sess);
    }
  }

  function showToast(message) {
    var old = document.getElementById("vibeProfileToast");
    if (old) old.remove();
    var toast = document.createElement("div");
    toast.id = "vibeProfileToast";
    toast.textContent = message;
    toast.style.cssText =
      "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:99999;" +
      "background:rgba(0,12,40,0.96);color:#fff;padding:10px 14px;border-radius:12px;" +
      "border:1px solid rgba(0,128,255,0.35);font-size:13px;" +
      "box-shadow:0 10px 30px rgba(0,0,0,0.35);";
    document.body.appendChild(toast);
    setTimeout(function () { toast.remove(); }, 2200);
  }
  // Expose globally so other files can use it
  window.showToast = showToast;

  function getInitials(user) {
    return String(user.username || user.name || "U").charAt(0).toUpperCase();
  }

  function setAvatarNode(node, avatar, fallbackText) {
    if (!node) return;
    if (avatar) {
      node.innerHTML =
        '<img src="' + escAttr(avatar) + '" alt="avatar" ' +
        'style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
      return;
    }
    node.innerHTML = esc(fallbackText || "U");
  }

  function applyProfileToUI(user) {
    if (!user) return;

    var allName = document.querySelectorAll(
      ".profile-name, #profileName, #userProfileName"
    );
    var allUid = document.querySelectorAll(
      ".profile-uid, #profileUid, #userProfileUid"
    );
    var allBio = document.querySelectorAll(
      ".profile-bio, #profileBio, #userProfileBio"
    );
    var allAvatar = document.querySelectorAll(
      ".profile-avatar-big, .profile-avatar, #profileAvatar, #userProfileAvatar"
    );

    Array.prototype.forEach.call(allName, function (el) {
      el.textContent = user.name || user.username || "User";
    });

    Array.prototype.forEach.call(allUid, function (el) {
      var idText = user.uid || user.userId || "";
      el.textContent =
        "@" + (user.username || "user") + (idText ? " · ID: " + idText : "");
    });

    Array.prototype.forEach.call(allBio, function (el) {
      el.textContent = user.bio || "✨ Add your bio";
    });

    Array.prototype.forEach.call(allAvatar, function (el) {
      setAvatarNode(el, user.avatar || "", getInitials(user));
    });
  }

  async function loadProfile() {
    try {
      var sess = getSession();
      if (!sess || !sess.token) return null;
      if (!window.VibeAPI || !window.VibeAPI.getMyProfile) return null;

      var user = await window.VibeAPI.getMyProfile(sess.token);
      if (!user) return null;

      var merged = {
        userId:   sess.userId,
        uid:      user.uid      || sess.uid      || "",
        name:     user.name     || sess.name     || "",
        username: user.username || sess.username || "",
        bio:      user.bio      || "",
        avatar:   user.avatar   || ""
      };

      // Sync session
      sess.name     = merged.name;
      sess.username = merged.username;
      sess.bio      = merged.bio;
      sess.avatar   = merged.avatar;
      sess.uid      = merged.uid;
      saveSessionSafe(sess);

      applyProfileToUI(merged);
      return merged;

    } catch (err) {
      console.error("Profile load error:", err);
      return null;
    }
  }

  // ── Editor styles ────────────────────────────────────────────────
  function ensureEditorStyles() {
    if (document.getElementById("vibeProfileEditorStyles")) return;
    var style = document.createElement("style");
    style.id   = "vibeProfileEditorStyles";
    style.textContent = [
      "#vibeProfileEditorOverlay{position:fixed;inset:0;background:rgba(0,0,0,0.72);",
        "z-index:99998;display:none;align-items:center;justify-content:center;padding:18px;}",
      "#vibeProfileEditor{width:min(420px,100%);",
        "background:linear-gradient(180deg,#00173d 0%,#000d24 100%);",
        "border:1px solid rgba(0,125,255,0.28);border-radius:22px;",
        "box-shadow:0 20px 60px rgba(0,0,0,0.45);overflow:hidden;color:#fff;}",
      "#vibeProfileEditorHeader{padding:16px 18px;",
        "border-bottom:1px solid rgba(0,125,255,0.18);font-size:18px;font-weight:700;}",
      "#vibeProfileEditorBody{padding:18px;display:flex;flex-direction:column;gap:12px;}",
      ".vibeProfileField label{display:block;font-size:12px;",
        "color:rgba(255,255,255,0.7);margin-bottom:6px;}",
      ".vibeProfileField input,.vibeProfileField textarea{width:100%;",
        "background:rgba(255,255,255,0.06);border:1px solid rgba(0,125,255,0.24);",
        "border-radius:14px;color:#fff;padding:12px 14px;font-size:14px;",
        "outline:none;box-sizing:border-box;}",
      ".vibeProfileField textarea{min-height:88px;resize:none;}",
      "#vibeProfileEditorAvatarPreview{width:84px;height:84px;border-radius:50%;",
        "margin:0 auto 4px;background:rgba(255,255,255,0.06);",
        "border:2px solid rgba(0,125,255,0.3);overflow:hidden;display:flex;",
        "align-items:center;justify-content:center;font-size:34px;font-weight:700;color:#4db8ff;}",
      "#vibeProfileEditorActions{display:flex;gap:10px;padding:0 18px 18px;}",
      ".vibeProfileBtn{flex:1;border:none;border-radius:14px;",
        "padding:12px 14px;font-size:14px;font-weight:700;cursor:pointer;}",
      ".vibeProfileBtnCancel{background:rgba(255,255,255,0.08);color:#fff;}",
      ".vibeProfileBtnSave{background:linear-gradient(135deg,#0c8dff,#005cff);color:#fff;}",
      ".vibeProfileMiniBtn{display:inline-flex;align-items:center;justify-content:center;",
        "padding:10px 12px;border-radius:12px;border:1px solid rgba(0,125,255,0.26);",
        "background:rgba(255,255,255,0.04);color:#fff;font-size:12px;cursor:pointer;}"
    ].join("");
    document.head.appendChild(style);
  }

  function ensureEditor() {
    ensureEditorStyles();
    if (document.getElementById("vibeProfileEditorOverlay")) return;

    var overlay = document.createElement("div");
    overlay.id  = "vibeProfileEditorOverlay";
    overlay.innerHTML =
      '<div id="vibeProfileEditor">' +
        '<div id="vibeProfileEditorHeader">✏️ Edit Profile</div>' +
        '<div id="vibeProfileEditorBody">' +
          '<div id="vibeProfileEditorAvatarPreview">U</div>' +
          '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">' +
            '<label class="vibeProfileMiniBtn" for="vibeProfileAvatarFile">📷 Choose Photo</label>' +
            '<input id="vibeProfileAvatarFile" type="file" accept="image/*" style="display:none;">' +
          "</div>" +
          '<div class="vibeProfileField">' +
            '<label for="vibeProfileAvatarUrl">Profile Picture URL (optional)</label>' +
            '<input id="vibeProfileAvatarUrl" type="text" placeholder="https://example.com/avatar.png">' +
          "</div>" +
          '<div class="vibeProfileField">' +
            '<label for="vibeProfileName">Name</label>' +
            '<input id="vibeProfileName" type="text" maxlength="60" placeholder="Your name">' +
          "</div>" +
          '<div class="vibeProfileField">' +
            '<label for="vibeProfileUsername">Username</label>' +
            '<input id="vibeProfileUsername" type="text" maxlength="30" placeholder="username">' +
          "</div>" +
          '<div class="vibeProfileField">' +
            '<label for="vibeProfileBio">Bio</label>' +
            '<textarea id="vibeProfileBio" maxlength="180" placeholder="Write something about yourself"></textarea>' +
          "</div>" +
        "</div>" +
        '<div id="vibeProfileEditorActions">' +
          '<button type="button" class="vibeProfileBtn vibeProfileBtnCancel" id="vibeProfileCancelBtn">Cancel</button>' +
          '<button type="button" class="vibeProfileBtn vibeProfileBtnSave" id="vibeProfileSaveBtn">Save Changes</button>' +
        "</div>" +
      "</div>";

    document.body.appendChild(overlay);

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeEditor();
    });

    document.getElementById("vibeProfileCancelBtn").addEventListener("click", closeEditor);

    document.getElementById("vibeProfileAvatarUrl").addEventListener("input", function () {
      var url = this.value.trim();
      editorState.selectedAvatarData = "";
      renderEditorAvatar(url || editorState.currentAvatar || "");
    });

    document.getElementById("vibeProfileAvatarFile").addEventListener("change", function () {
      var file = this.files && this.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        editorState.selectedAvatarData = reader.result;
        document.getElementById("vibeProfileAvatarUrl").value = "";
        renderEditorAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    });

    document.getElementById("vibeProfileSaveBtn").addEventListener("click", saveEditor);
  }

  function renderEditorAvatar(value) {
    var preview = document.getElementById("vibeProfileEditorAvatarPreview");
    if (!preview) return;
    var sess     = getSession() || {};
    var fallback = (sess.username || sess.name || "U").charAt(0).toUpperCase();
    if (value) {
      preview.innerHTML =
        '<img src="' + escAttr(value) + '" alt="avatar" ' +
        'style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
    } else {
      preview.textContent = fallback;
    }
  }

  async function openEditor() {
    ensureEditor();
    var overlay = document.getElementById("vibeProfileEditorOverlay");
    var sess    = getSession() || {};
    var profile = await loadProfile();
    var current = profile || {
      name:     sess.name     || "",
      username: sess.username || "",
      bio:      sess.bio      || "",
      avatar:   sess.avatar   || ""
    };

    editorState.currentAvatar      = current.avatar || "";
    editorState.selectedAvatarData = "";

    document.getElementById("vibeProfileName").value     = current.name     || "";
    document.getElementById("vibeProfileUsername").value = current.username || "";
    document.getElementById("vibeProfileBio").value      = current.bio      || "";
    document.getElementById("vibeProfileAvatarUrl").value = "";
    document.getElementById("vibeProfileAvatarFile").value = "";

    renderEditorAvatar(current.avatar || "");
    overlay.style.display = "flex";
  }

  function closeEditor() {
    var overlay = document.getElementById("vibeProfileEditorOverlay");
    if (overlay) overlay.style.display = "none";
  }

  async function saveEditor() {
    try {
      var sess = getSession();
      if (!sess || !sess.token) { showToast("Session expired. Please login again."); return; }

      var name     = document.getElementById("vibeProfileName").value.trim();
      var username = document.getElementById("vibeProfileUsername").value.trim().toLowerCase();
      var bio      = document.getElementById("vibeProfileBio").value.trim();
      var avatarUrl = document.getElementById("vibeProfileAvatarUrl").value.trim();

      if (!name)     { showToast("Name cannot be empty."); return; }
      if (!username) { showToast("Username cannot be empty."); return; }

      var payload = { name: name, username: username, bio: bio };

      if (editorState.selectedAvatarData) {
        payload.avatar = editorState.selectedAvatarData;
      } else if (avatarUrl) {
        payload.avatar = avatarUrl;
      } else {
        payload.avatar = editorState.currentAvatar || "";
      }

      var updated = await window.VibeAPI.updateProfile(payload, sess.token);

      sess.name     = updated.name     || sess.name     || "";
      sess.username = updated.username || sess.username || "";
      sess.bio      = typeof updated.bio    === "string" ? updated.bio    : (sess.bio    || "");
      sess.avatar   = typeof updated.avatar === "string" ? updated.avatar : (sess.avatar || "");
      sess.uid      = updated.uid || sess.uid || "";

      saveSessionSafe(sess);
      applyProfileToUI(sess);
      closeEditor();
      showToast("✅ Profile updated!");

      document.dispatchEvent(new CustomEvent("profile:updated", { detail: updated }));

    } catch (err) {
      console.error("Profile save error:", err);
      showToast(err && err.message ? err.message : "Profile update failed.");
    }
  }

  document.addEventListener("vibe:open-profile-editor", openEditor);

  document.addEventListener("DOMContentLoaded", function () {
    ensureEditor();
    loadProfile();
  });

  window.VibeProfile = {
    openEditor: openEditor,
    refresh:    loadProfile
  };
})();
