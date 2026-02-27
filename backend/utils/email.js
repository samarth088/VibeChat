// utils/email.js
// Brevo (Sendinblue) v3 SDK - Safe initialization

const SibApiV3Sdk = require('sib-api-v3-sdk');

const sendEmail = async (to, subject, html) => {
  try {
    // ✅ Lazy init — env vars are definitely loaded at call time, not at module load
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    defaultClient.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    await apiInstance.sendTransacEmail({
      sender: { email: process.env.FROM_EMAIL, name: 'VibeChat' },
      to: [{ email: to }],
      subject,
      htmlContent: html
    });

    console.log("📧 Email sent via Brevo API to:", to);
  } catch (error) {
    console.error("❌ Brevo API Error:", error?.response?.body || error.message);
    throw new Error("Failed to send email");
  }
};

module.exports = { sendEmail };
