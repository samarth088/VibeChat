// config/env.js
const dotenv = require("dotenv");
dotenv.config();

const requiredEnv = [
  "MONGO_URI",
  "JWT_SECRET",
  "BREVO_API_KEY",
  "FROM_EMAIL",     // ✅ Added — Brevo verified sender email
];

requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Missing required env variable: ${key}`);
    process.exit(1);
  }
});

console.log("✅ Environment variables loaded");
