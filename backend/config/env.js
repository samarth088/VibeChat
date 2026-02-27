// ================= ENV CONFIG =================
const dotenv = require("dotenv");
dotenv.config();

// All required env variables
const requiredEnv = [
  "MONGO_URI",
  "JWT_SECRET",
  "EMAIL",
  "APP_PASSWORD"
];

// Check required env variables
requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Missing required env variable: ${key}`);
    process.exit(1);
  }
});

console.log("✅ Environment variables loaded");


// ================= NODEMAILER CONFIG =================
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.APP_PASSWORD // Gmail App Password
  }
});

// Optional: verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email transporter error:", error);
  } else {
    console.log("✅ Email transporter ready");
  }
});


// ================= EXPORT =================
module.exports = transporter;
