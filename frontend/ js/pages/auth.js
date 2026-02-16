// js/pages/settings.js
(function () {
  if (!window.App || !App.api || !App.state) {
    console.error("Core missing");
    return;
  }

  const saveProfileBtn = document.getElementById("saveProfile");
  const saveLanguageBtn = document.getElementById("saveLanguage");
  const logoutBtn = document.getElementById("logout");

  saveProfileBtn?.addEventListener("click", async () => {
    const name = document.getElementById("name").value;
    try {
      await App.api.request("/user/profile", {
        method: "PUT",
        body: { name }
      });
      alert("Profile updated");
    } catch {
      alert("Profile update failed");
    }
  });

  saveLanguageBtn?.addEventListener("click", async () => {
    const lang = document.getElementById("language").value;
    try {
      await App.api.request("/user/settings", {
        method: "PUT",
        body: { language: lang }
      });
      alert("Language saved");
    } catch {
      alert("Failed to save language");
    }
  });

  logoutBtn?.addEventListener("click", async () => {
    await App.api.logout();
    App.state.replaceState({
      currentUser: null,
      chats: {},
      messages: {},
      ui: {}
    });
    window.location.href = "index.html";
  });
})();
