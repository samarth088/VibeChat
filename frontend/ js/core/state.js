// Global App State

export const State = {
  user: JSON.parse(localStorage.getItem("user")) || null,
  activeUser: null,
  activeChatId: null,
  messageMap: {},
};

// Save user to localStorage
export function setUser(user) {
  State.user = user;
  localStorage.setItem("user", JSON.stringify(user));
}

// Logout
export function logout() {
  localStorage.removeItem("user");
  window.location.href = "index.html";
}
