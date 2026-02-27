const Brevo = require('@getbrevo/brevo');

const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

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
