const nodemailer = require("nodemailer");

/**
 * Configure Nodemailer Transporter
 * Supports:
 * 1. Resend API Key (smtp.resend.com)
 * 2. Gmail SMTP with App Password (EMAIL_USER + EMAIL_PASS)
 * 3. Custom SMTP (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
 */
function createTransporter() {
  // Option 1: Resend (100% Free - 3,000 emails/mo)
  if (process.env.RESEND_API_KEY) {
    return nodemailer.createTransport({
      host: "smtp.resend.com",
      port: 465,
      secure: true,
      auth: {
        user: "resend",
        pass: process.env.RESEND_API_KEY,
      },
    });
  }

  // Option 2: Custom SMTP Host
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER,
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
      },
    });
  }

  // Option 3: Gmail with App Password (100% Free)
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (user && pass) {
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "gmail",
      auth: { user, pass },
    });
  }

  return null;
}

/**
 * Generates an Apple-inspired HTML email template
 */
function getAppleEmailTemplate(name, otp) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SportSync Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background: rgba(22, 27, 34, 0.95); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 24px; padding: 36px 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.4);">
          <!-- Logo & Header -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; text-align: center; background: linear-gradient(135deg, #007aff, #5856d6); border-radius: 14px; font-size: 24px; color: #ffffff; margin-bottom: 12px; box-shadow: 0 8px 16px rgba(0, 122, 255, 0.3);">
                ⚡
              </div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; color: #ffffff;">SportSync</h1>
              <p style="margin: 4px 0 0; font-size: 13px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px;">Athlete Identity Verification</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding-bottom: 16px;">
              <p style="margin: 0; font-size: 16px; color: #e5e7eb; line-height: 1.5;">
                Hello <strong>${name}</strong>,
              </p>
              <p style="margin: 8px 0 0; font-size: 14px; color: #9ca3af; line-height: 1.6;">
                Welcome to SportSync! To verify your email and activate your athlete profile, please enter this 6-digit confirmation code:
              </p>
            </td>
          </tr>

          <!-- OTP Code Box -->
          <tr>
            <td align="center" style="padding: 24px 0;">
              <div style="display: inline-block; background: #000000; border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 16px; padding: 18px 36px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.6);">
                <span style="font-family: 'SF Mono', Monaco, Menlo, 'Courier New', monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #38bdf8;">
                  ${otp}
                </span>
              </div>
            </td>
          </tr>

          <!-- Security Notice -->
          <tr>
            <td style="padding-bottom: 24px; text-align: center;">
              <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.5;">
                ⏱️ This code will expire in <strong>10 minutes</strong>.<br>
                For your security, never share this code with anyone.
              </p>
            </td>
          </tr>

          <!-- Footer Divider -->
          <tr>
            <td style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 20px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #4b5563;">
                If you did not request this verification code, you can safely ignore this email.
              </p>
              <p style="margin: 8px 0 0; font-size: 11px; color: #374151;">
                © 2026 SportSync Platform. Match. Play. Elevate Your Game.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Send Real OTP to Athlete's Email
 */
async function sendOtpEmail(email, name, otp) {
  const transporter = createTransporter();

  if (!transporter) {
    console.error("[Email Service] ❌ No email delivery credentials found!");
    console.error("💡 Action Required: Set EMAIL_USER & EMAIL_PASS (Gmail App Password) or RESEND_API_KEY in Render Dashboard.");
    return {
      success: false,
      delivered: false,
      error: "EMAIL_NOT_CONFIGURED",
      msg: "Email service is not configured. Please set EMAIL_USER & EMAIL_PASS (or RESEND_API_KEY) in Render environment variables.",
    };
  }

  try {
    const fromAddress =
      process.env.EMAIL_FROM ||
      (process.env.RESEND_API_KEY
        ? `"SportSync" <onboarding@resend.dev>`
        : `"SportSync" <${process.env.EMAIL_USER}>`);

    const info = await transporter.sendMail({
      from: fromAddress,
      to: email,
      subject: `Your SportSync Verification Code: ${otp}`,
      text: `Hello ${name},\n\nYour SportSync verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nSportSync Team`,
      html: getAppleEmailTemplate(name, otp),
    });

    console.log(`[Email Service] ✅ Real email sent to ${email} (MessageId: ${info.messageId})`);
    return { success: true, delivered: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Email Service] ❌ Failed to deliver email to ${email}:`, err.message);
    return {
      success: false,
      delivered: false,
      error: err.message,
      msg: `Failed to deliver email: ${err.message}. Please check your Gmail App Password or SMTP settings.`,
    };
  }
}

module.exports = {
  sendOtpEmail,
};


