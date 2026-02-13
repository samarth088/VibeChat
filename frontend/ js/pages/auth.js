import { ENV } from "../../config/env.js";

// DOM
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");

// ================= LOGIN =================
loginBtn.addEventListener("click", async () => {

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    alert("Enter username & password");
    return;
  }

  try {
    const res = await fetch(`${ENV.API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (data.error) {
      alert(data.error);
      return;
    }

    localStorage.setItem("user", JSON.stringify(data));
    window.location.href = "chat.html";

  } catch (err) {
    console.error(err);
    alert("Server error");
  }

});

// ================= SIGNUP =================
signupBtn.addEventListener("click", async () => {

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    alert("Enter username & password");
    return;
  }

  try {
    const res = await fetch(`${ENV.API_BASE}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (data.error) {
      alert(data.error);
      return;
    }

    alert("Account created. Login now.");

  } catch (err) {
    console.error(err);
    alert("Server error");
  }

});
