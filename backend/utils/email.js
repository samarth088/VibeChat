// utils/email.js
const SibApiV3Sdk = require('sib-api-v3-sdk');

const sendOtpEmail = async (to, otp) => {
  try {
    // ✅ Lazy init — inside function so env vars are loaded before this runs
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    defaultClient.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    const subject = `${otp} is your VibeChat verification code`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px;">
          <div style="max-width:480px;margin:auto;background:white;border-radius:12px;padding:32px;">
            <h2 style="color:#7c3aed;margin:0 0 8px;">VibeChat</h2>
            <p style="color:#555;margin:0 0 24px;">Your email verification code:</p>
            <div style="background:#f3f0ff;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px;">
              <h1 style="margin:0;color:#7c3aed;font-size:40px;letter-spacing:8px;">${otp}</h1>
            </div>
            <p style="color:#888;font-size:13px;margin:0;">
              Expires in <strong>10 minutes</strong>.<br/>
              If you didn't request this, ignore this email.
            </p>
          </div>
        </body>
      </html>
    `;

    await apiInstance.sendTransacEmail({
      sender: { email: process.env.FROM_EMAIL, name: 'VibeChat' },
      to: [{ email: to }],
      subject,
      htmlContent
    });

    console.log("📧 OTP email sent to:", to);
  } catch (error) {
    console.error("❌ Brevo API Error:", error?.response?.body || error.message);
    throw new Error("Failed to send OTP email");
  }
};

module.exports = { sendOtpEmail };
