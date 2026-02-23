const nodemailer = require("nodemailer");

if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASS) {
  console.error("❌ SMTP credentials missing in environment variables");
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASS
  }
});

const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"VibeChat" <${process.env.SMTP_EMAIL}>`,
      to,
      subject,
      html
    });

    console.log("📧 Email sent:", info.messageId);
    return info;

  } catch (error) {
    console.error("❌ Gmail SMTP Error:", error);
    throw new Error("Failed to send email");
  }
};

module.exports = { sendEmail };
