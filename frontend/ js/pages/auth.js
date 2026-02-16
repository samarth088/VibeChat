// js/pages/auth.js
(function () {
  if (!window.App || !App.api || !App.state) {
    console.error("Core missing");
    return;
  }

  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = loginForm.querySelector('input[type="email"]').value;
      const password = loginForm.querySelector('input[type="password"]').value;

      try {
        const res = await App.api.login(email, password);
        if (res.user) App.state.setState({ currentUser: res.user });
        window.location.href = "chat.html";
      } catch (err) {
        alert(err.message || "Login failed");
      }
    });
  }

  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const inputs = signupForm.querySelectorAll("input");
      const name = inputs[0].value;
      const email = inputs[1].value;
      const password = inputs[2].value;

      try {
        const res = await App.api.signup(name, email, password);
        if (res.user) App.state.setState({ currentUser: res.user });
        window.location.href = "chat.html";
      } catch (err) {
        alert(err.message || "Signup failed");
      }
    });
  }
})();
