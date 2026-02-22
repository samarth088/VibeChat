import { ENV } from "../../config/env.js";

const emailInput = document.getElementById("email");
const otpInput = document.getElementById("otp");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

const sendOtpBtn = document.getElementById("sendOtpBtn");
const verifyOtpBtn = document.getElementById("verifyOtpBtn");
const registerBtn = document.getElementById("registerBtn");

const otpSection = document.getElementById("otpSection");
const signupError = document.getElementById("signupError");

let otpVerified = false;

// ================= SEND OTP =================
sendOtpBtn.addEventListener("click", async () => {

  const email = emailInput.value.trim();
  if (!email) return alert("Enter email first");

  try {
    const res = await fetch(`${ENV.API_BASE}/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    if (data.error) return alert(data.error);

    alert("OTP sent to email");
    otpSection.classList.remove("hidden");

  } catch (err) {
    alert("Failed to send OTP");
  }

});

// ================= VERIFY OTP =================
verifyOtpBtn.addEventListener("click", async () => {

  const email = emailInput.value.trim();
  const otp = otpInput.value.trim();

  if (!otp) return alert("Enter OTP");

  try {
    const res = await fetch(`${ENV.API_BASE}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp })
    });

    const data = await res.json();
    if (data.error) return alert(data.error);

    alert("OTP Verified ✅");
    otpVerified = true;
    registerBtn.disabled = false;

  } catch (err) {
    alert("Verification failed");
  }

});

// ================= REGISTER =================
document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!otpVerified) {
    return alert("Verify OTP first");
  }

  const email = emailInput.value.trim();
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  try {
    const res = await fetch(`${ENV.API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, username, password })
    });

    const data = await res.json();

    if (data.error) {
      signupError.textContent = data.error;
      signupError.classList.remove("hidden");
      return;
    }

    alert("Account created successfully 🎉");
    window.location.href = "index.html";

  } catch (err) {
    alert("Registration failed");
  }
});
