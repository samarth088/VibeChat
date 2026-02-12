// =============================
// Settings Page Logic
// =============================

if (!State.currentUser) {
  window.location.href = "index.html";
  }

  const themeSelect = document.getElementById("themeSelect");
  const saveBtn = document.getElementById("saveSettings");

  if (themeSelect) {
    themeSelect.value = localStorage.getItem("theme") || "light";
    }

    if (saveBtn) {
      saveBtn.onclick = () => {
          const theme = themeSelect.value;
              document.body.className = theme;
                  localStorage.setItem("theme", theme);
                      alert("Theme updated");
                        };
                        }
