const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASS
  }
});

const sendEmail = async (to, subject, html) => {
  await transporter.sendMail({
    from: `"VibeChat" <${process.env.SMTP_EMAIL}>`,
    to,
    subject,
    html
  });
};

module.exports = { sendEmail };
