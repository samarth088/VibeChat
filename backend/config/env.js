// ================= ENV CONFIG =================
const dotenv = require("dotenv");

dotenv.config();

const requiredEnv = [
  "MONGO_URI",
  "JWT_SECRET"
];

// Check required env variables
requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Missing required env variable: ${key}`);
    process.exit(1);
  }
});

console.log("✅ Environment variables loaded");
