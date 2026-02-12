// =============================
// Global App State
// =============================

const State = {

  currentUser: JSON.parse(localStorage.getItem("user")) || null,

    activeChatId: null,

      activeUserId: null,

        setUser(user) {
            this.currentUser = user;
                localStorage.setItem("user", JSON.stringify(user));
                  },

                    logout() {
                        localStorage.removeItem("user");
                            this.currentUser = null;
                                window.location.href = "index.html";
                                  }

                                  };
