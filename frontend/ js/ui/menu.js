// =============================
// Menu Logic
// =============================

const menuBtn = document.getElementById("menuBtn");
const menuDropdown = document.getElementById("menuDropdown");
const logoutBtn = document.getElementById("logoutBtn");

if (menuBtn && menuDropdown) {

  menuBtn.addEventListener("click", () => {
      menuDropdown.classList.toggle("hidden");
        });

          document.addEventListener("click", (e) => {
              if (!menuBtn.contains(e.target)) {
                    menuDropdown.classList.add("hidden");
                        }
                          });
                          }

                          if (logoutBtn) {
                            logoutBtn.addEventListener("click", () => {
                                State.logout();
                                  });
                                  }
