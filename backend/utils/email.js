const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, subject, html) => {
  const response = await resend.emails.send({
    from: "VibeChat <onboarding@resend.dev>",
    to,
    subject,
    html
  });

  return response;
};

module.exports = { sendEmail };
