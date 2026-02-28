const axios = require("axios");

const sendEmail = async (to, subject, html) => {
  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "VibeChat",
          email: "vibechat.testing@gmail.com", // yaha verified email hona chahiye
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Email sent:", response.data);
    return response.data;

  } catch (error) {
    console.error("❌ Brevo API Error:", error.response?.data || error);
    throw new Error("Failed to send email");
  }
};

module.exports = { sendEmail };
