// =============================
// API Layer
// =============================

const API = {

  async request(endpoint, method = "GET", data = null) {
      const options = {
            method,
                  headers: {
                          "Content-Type": "application/json",
                                  Authorization: State.currentUser?.token || ""
                                        }
                                            };

                                                if (data) {
                                                      options.body = JSON.stringify(data);
                                                          }

                                                              const res = await fetch(`${ENV.BASE_URL}${endpoint}`, options);

                                                                  if (!res.ok) {
                                                                        const error = await res.json();
                                                                              throw new Error(error.error || "Request failed");
                                                                                  }

                                                                                      return res.json();
                                                                                        },

                                                                                          login(username, password) {
                                                                                              return this.request("/auth/login", "POST", { username, password });
                                                                                                },

                                                                                                  register(username, password) {
                                                                                                      return this.request("/auth/register", "POST", { username, password });
                                                                                                        },

                                                                                                          getUsers() {
                                                                                                              return this.request("/users");
                                                                                                                },

                                                                                                                  getChats() {
                                                                                                                      return this.request("/chats");
                                                                                                                        }

                                                                                                                        };
