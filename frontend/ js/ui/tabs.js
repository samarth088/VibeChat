// =============================
// Tab Switching Logic
// =============================

const tabButtons = document.querySelectorAll("[data-tab]");
const tabContents = document.querySelectorAll("[data-content]");

tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {

      const target = btn.dataset.tab;

          tabButtons.forEach(b => b.classList.remove("active"));
              tabContents.forEach(c => c.classList.add("hidden"));

                  btn.classList.add("active");

                      document.querySelector(`[data-content="${target}"]`)
                            .classList.remove("hidden");
                              });
                              });
