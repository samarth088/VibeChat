const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.APP_PASSWORD
  }
});

const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"VibeChat" <${process.env.EMAIL}>`,
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
