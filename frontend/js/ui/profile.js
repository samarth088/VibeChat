// js/pages/profile.js
// VibeChat Profile — view + edit
// FIX: Removed bindEditTriggers() auto-scan — it caused profile editor to
//      auto-open whenever any "Edit Profile" text appeared (e.g. after tab switch).
//      Now openEditor() is exposed on window.VibeProfile and called explicitly.

(function () {
  var editorState = {
    currentAvatar: "",
    selectedAvatarData: ""
  };

  /* ── helpers ── */
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
      ? window.VibeState.loadSession()
      : null;
  }
  function saveSessionSafe(sess) {
    if (window.VibeState && typeof window.VibeState.saveSession === "function") {
      window.VibeState.saveSession(sess);
    }
  }

  /* ── toast ── */
  function showToast(message) {
    if (window.showToast) { window.showToast(message); return; }
    var old = document.getElementById("vibeProfileToast");
    if (old) old.remove();
    var toast = document.createElement("div");
    toast.id = "vibeProfileToast";
    toast.textContent = message;
    toast.style.cssText =
      "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:99999;" +
      "background:rgba(0,12,40,0.96);color:#fff;padding:10px 14px;border-radius:12px;" +
      "border:1px solid rgba(0,128,255,0.35);font-size:13px;" +
      "box-shadow:0 10px 30px rgba(0,0,0,0.35);pointer-events:none;";
    document.body.appendChild(toast);
    setTimeout(function () { toast.remove(); }, 2200);
  }

  /* ── avatar helpers ── */
  function getInitials(user) {
    return String(user.username || user.name || "U").charAt(0).toUpperCase();
  }
  function setAvatarNode(node, avatar, fallbackText) {
    if (!node) return;
    if (avatar) {
      if (node.tagName === "IMG") {
        node.src = avatar;
      } else {
        node.innerHTML =
          '<img src="' + escAttr(avatar) +
          '" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
      }
      return;
    }
    if (node.tagName === "IMG") { node.removeAttribute("src"); }
    else { node.innerHTML = esc(fallbackText || "U"); }
  }

  /* ── apply profile to ALL UI placeholders ── */
  function applyProfileToUI(user) {
    if (!user) return;

    var allName   = document.querySelectorAll(".profile-name,[data-profile-name],#profileName,#userProfileName");
    var allUid    = document.querySelectorAll(".profile-uid,[data-profile-uid],#profileUid,#userProfileUid");
    var allBio    = document.querySelectorAll(".profile-bio,[data-profile-bio],#profileBio,#userProfileBio");
    var allAvatar = document.querySelectorAll(".profile-avatar-big,.profile-avatar,[data-profile-avatar],#profileAvatar,#userProfileAvatar");

    Array.prototype.forEach.call(allName, function (el) {
      el.textContent = user.name || user.username || "User";
    });
    Array.prototype.forEach.call(allUid, function (el) {
      var idText = user.uid || user.userId || "";
      el.textContent = "@" + (user.username || "user") + (idText ? " · ID: " + idText : "");
    });
    Array.prototype.forEach.call(allBio, function (el) {
      el.textContent = user.bio || "🚀 Add your bio";
    });
    Array.prototype.forEach.call(allAvatar, function (el) {
      setAvatarNode(el, user.avatar || "", getInitials(user));
    });
  }

  /* ── load profile from backend ── */
  async function loadProfile() {
    try {
      var sess = getSession();
      if (!sess || !sess.token || !window.VibeAPI || !window.VibeAPI.getMyProfile) return null;

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

  /* ── editor styles (injected once) ── */
  function ensureEditorStyles() {
    if (document.getElementById("vibeProfileEditorStyles")) return;
    var style = document.createElement("style");
    style.id = "vibeProfileEditorStyles";
    style.textContent =
      "#vibeProfileEditorOverlay{" +
        "position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:99998;" +
        "display:none;align-items:center;justify-content:center;padding:18px;}" +
      "#vibeProfileEditor{" +
        "width:min(420px,100%);background:linear-gradient(180deg,#00173d 0%,#000d24 100%);" +
        "border:1px solid rgba(0,125,255,0.28);border-radius:22px;" +
        "box-shadow:0 20px 60px rgba(0,0,0,0.5);overflow:hidden;color:#fff;}" +
      "#vibeProfileEditorHeader{" +
        "padding:16px 18px;border-bottom:1px solid rgba(0,125,255,0.18);" +
        "font-size:18px;font-weight:700;display:flex;align-items:center;justify-content:space-between;}" +
      "#vibeProfileEditorBody{padding:18px;display:flex;flex-direction:column;gap:14px;}" +
      ".vibeProfileField label{display:block;font-size:12px;color:rgba(255,255,255,0.6);margin-bottom:6px;font-weight:600;letter-spacing:0.3px;}" +
      ".vibeProfileField input,.vibeProfileField textarea{" +
        "width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(0,125,255,0.24);" +
        "border-radius:14px;color:#fff;padding:12px 14px;font-size:14px;outline:none;box-sizing:border-box;" +
        "transition:border-color 0.2s;}" +
      ".vibeProfileField input:focus,.vibeProfileField textarea:focus{border-color:rgba(0,125,255,0.6);}" +
      ".vibeProfileField textarea{min-height:88px;resize:none;}" +
      "#vibeProfileEditorAvatarWrap{display:flex;flex-direction:column;align-items:center;gap:10px;}" +
      "#vibeProfileEditorAvatarPreview{" +
        "width:88px;height:88px;border-radius:50%;background:rgba(255,255,255,0.08);" +
        "border:2px solid rgba(0,125,255,0.35);overflow:hidden;" +
        "display:flex;align-items:center;justify-content:center;" +
        "font-size:36px;font-weight:700;color:#4db8ff;cursor:pointer;position:relative;}" +
      "#vibeProfileEditorAvatarPreview:hover::after{" +
        "content:'📷';position:absolute;inset:0;background:rgba(0,0,0,0.5);" +
        "display:flex;align-items:center;justify-content:center;border-radius:50%;font-size:24px;}" +
      "#vibeProfileEditorActions{display:flex;gap:10px;padding:0 18px 18px;}" +
      ".vibeProfileBtn{flex:1;border:none;border-radius:14px;padding:13px 14px;font-size:14px;font-weight:700;cursor:pointer;transition:opacity 0.2s;}" +
      ".vibeProfileBtn:active{opacity:0.8;}" +
      ".vibeProfileBtnCancel{background:rgba(255,255,255,0.08);color:#fff;}" +
      ".vibeProfileBtnSave{background:linear-gradient(135deg,#0c8dff,#005cff);color:#fff;}" +
      ".vibeProfileMiniBtn{" +
        "display:inline-flex;align-items:center;gap:6px;padding:8px 14px;" +
        "border-radius:12px;border:1px solid rgba(0,125,255,0.3);" +
        "background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.85);" +
        "font-size:12px;font-weight:600;cursor:pointer;}" +
      ".vibeProfileAvatarHint{font-size:11px;color:rgba(255,255,255,0.45);text-align:center;}";
    document.head.appendChild(style);
  }

  /* ── build editor DOM (once) ── */
  function ensureEditor() {
    ensureEditorStyles();
    if (document.getElementById("vibeProfileEditorOverlay")) return;

    var overlay = document.createElement("div");
    overlay.id = "vibeProfileEditorOverlay";
    overlay.innerHTML =
      '<div id="vibeProfileEditor">' +
        '<div id="vibeProfileEditorHeader">' +
          '<span>✏️ Edit Profile</span>' +
          '<button id="vibeProfileCloseBtn" style="background:none;border:none;color:rgba(255,255,255,0.5);font-size:22px;cursor:pointer;line-height:1;padding:0;">×</button>' +
        "</div>" +
        '<div id="vibeProfileEditorBody">' +

          /* avatar */
          '<div id="vibeProfileEditorAvatarWrap">' +
            '<div id="vibeProfileEditorAvatarPreview">U</div>' +
            '<div style="display:flex;gap:8px;">' +
              '<label class="vibeProfileMiniBtn" for="vibeProfileAvatarFile">📷 Choose Photo</label>' +
              '<input id="vibeProfileAvatarFile" type="file" accept="image/*" style="display:none;">' +
            "</div>" +
            '<p class="vibeProfileAvatarHint">Or paste a URL below</p>' +
          "</div>" +

          /* avatar url */
          '<div class="vibeProfileField">' +
            '<label for="vibeProfileAvatarUrl">Profile Picture URL (optional)</label>' +
            '<input id="vibeProfileAvatarUrl" type="url" placeholder="https://example.com/avatar.png">' +
          "</div>" +

          /* name */
          '<div class="vibeProfileField">' +
            '<label for="vibeProfileName">Display Name</label>' +
            '<input id="vibeProfileName" type="text" maxlength="60" placeholder="Your name">' +
          "</div>" +

          /* username */
          '<div class="vibeProfileField">' +
            '<label for="vibeProfileUsername">Username</label>' +
            '<input id="vibeProfileUsername" type="text" maxlength="30" placeholder="username (no spaces)">' +
          "</div>" +

          /* bio */
          '<div class="vibeProfileField">' +
            '<label for="vibeProfileBio">Bio</label>' +
            '<textarea id="vibeProfileBio" maxlength="180" placeholder="Write something about yourself…"></textarea>' +
          "</div>" +

        "</div>" +
        '<div id="vibeProfileEditorActions">' +
          '<button type="button" class="vibeProfileBtn vibeProfileBtnCancel" id="vibeProfileCancelBtn">Cancel</button>' +
          '<button type="button" class="vibeProfileBtn vibeProfileBtnSave"   id="vibeProfileSaveBtn">Save Changes</button>' +
        "</div>" +
      "</div>";

    document.body.appendChild(overlay);

    /* close on backdrop click */
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeEditor();
    });

    /* close buttons */
    document.getElementById("vibeProfileCloseBtn").addEventListener("click", closeEditor);
    document.getElementById("vibeProfileCancelBtn").addEventListener("click", closeEditor);

    /* avatar preview click → file picker */
    document.getElementById("vibeProfileEditorAvatarPreview").addEventListener("click", function () {
      document.getElementById("vibeProfileAvatarFile").click();
    });

    /* file upload */
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

    /* avatar URL input */
    document.getElementById("vibeProfileAvatarUrl").addEventListener("input", function () {
      var url = this.value.trim();
      editorState.selectedAvatarData = "";
      renderEditorAvatar(url || editorState.currentAvatar || "");
    });

    /* save */
    document.getElementById("vibeProfileSaveBtn").addEventListener("click", saveEditor);
  }

  /* ── render avatar preview in editor ── */
  function renderEditorAvatar(value) {
    var preview = document.getElementById("vibeProfileEditorAvatarPreview");
    if (!preview) return;
    var sess = getSession() || {};
    var fallback = (sess.username || sess.name || "U").charAt(0).toUpperCase();
    if (value) {
      preview.innerHTML =
        '<img src="' + escAttr(value) +
        '" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
    } else {
      preview.textContent = fallback;
    }
  }

  /* ── OPEN editor ── */
  async function openEditor() {
    ensureEditor();

    var overlay = document.getElementById("vibeProfileEditorOverlay");
    var sess    = getSession() || {};

    /* load fresh from server, fallback to session */
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

  /* ── CLOSE editor ── */
  function closeEditor() {
    var overlay = document.getElementById("vibeProfileEditorOverlay");
    if (overlay) overlay.style.display = "none";
  }

  /* ── SAVE editor ── */
  async function saveEditor() {
    var saveBtn = document.getElementById("vibeProfileSaveBtn");
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = "Saving…"; }

    try {
      var sess = getSession();
      if (!sess || !sess.token) { showToast("Session expired — please log in again"); return; }

      var name     = document.getElementById("vibeProfileName").value.trim();
      var username = document.getElementById("vibeProfileUsername").value.trim().toLowerCase().replace(/\s+/g, "");
      var bio      = document.getElementById("vibeProfileBio").value.trim();
      var avatarUrl = document.getElementById("vibeProfileAvatarUrl").value.trim();

      if (!name) { showToast("Name cannot be empty"); return; }
      if (username && !/^[a-z0-9_]{3,30}$/.test(username)) {
        showToast("Username: 3-30 chars, letters/numbers/underscore only");
        return;
      }

      var payload = { name: name, username: username, bio: bio };

      if (editorState.selectedAvatarData) {
        payload.avatar = editorState.selectedAvatarData;
      } else if (avatarUrl) {
        payload.avatar = avatarUrl;
      } else {
        payload.avatar = editorState.currentAvatar || "";
      }

      var updated = await window.VibeAPI.updateProfile(payload, sess.token);

      /* merge back to session */
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
      console.error("Profile update error:", err);
      showToast(err && err.message ? err.message : "Profile update failed");
    } finally {
      if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = "Save Changes"; }
    }
  }

  /* ── Init on DOM ready ── */
  document.addEventListener("DOMContentLoaded", function () {
    ensureEditor();   // build DOM early
    loadProfile();    // populate from server
  });

  /* ── Custom event support (optional) ── */
  document.addEventListener("vibe:open-profile-editor", function () {
    openEditor();
  });

  /* ── Public API ── */
  window.VibeProfile = {
    openEditor:  openEditor,
    closeEditor: closeEditor,
    refresh:     loadProfile,
    applyToUI:   applyProfileToUI
  };

})();
