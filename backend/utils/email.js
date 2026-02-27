const SibApiV3Sdk = require('sib-api-v3-sdk');

const defaultClient = SibApiV3Sdk.ApiClient.instance;
defaultClient.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const sendEmail = async (to, subject, html) => {
  try {
    await apiInstance.sendTransacEmail({
      sender: { email: 'a38ed6001@smtp-brevo.com', name: 'VibeChat' },
      to: [{ email: to }],
      subject,
      htmlContent: html
    });
    console.log("📧 Email sent via Brevo API");
  } catch (error) {
    console.error("❌ Brevo API Error:", error);
    throw new Error("Failed to send email");
  }
};

module.exports = { sendEmail };
