const nodemailer = require("nodemailer");

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
 * Deliver via Resend HTTPS REST API (Port 443 - Never Blocked by Cloud Firewalls)
 */
async function sendViaResendHttp(apiKey, email, name, otp) {
  try {
    // Note: Resend test domain must be strictly 'onboarding@resend.dev'
    const fromAddress = process.env.EMAIL_FROM || "onboarding@resend.dev";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    console.log(`[Email Service] Sending Resend HTTP POST to https://api.resend.com/emails for ${email}...`);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        from: fromAddress,
        to: [email.toLowerCase().trim()],
        subject: `Your SportSync Verification Code: ${otp}`,
        html: getAppleEmailTemplate(name, otp),
      }),
    });

    clearTimeout(timeoutId);
    const data = await res.json();

    if (res.ok && data?.id) {
      console.log(`[Email Service] ✅ Real email sent via Resend HTTPS to ${email} (Id: ${data.id})`);
      return { success: true, delivered: true, id: data.id };
    } else {
      console.error("[Email Service] ⚠️ Resend API returned error:", data);
      const detail = data?.message || data?.error || JSON.stringify(data);
      return { success: false, delivered: false, error: `Resend API: ${detail}` };
    }
  } catch (err) {
    console.error("[Email Service] ⚠️ Resend HTTPS request failed:", err.message);
    return { success: false, delivered: false, error: `Resend Network Error: ${err.message}` };
  }
}

/**
 * Deliver via Nodemailer (Gmail / SMTP) with strict timeouts (max 6s)
 */
async function sendViaSmtpWithTimeout(email, name, otp) {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, "").trim() : "";

  if (!user || !pass) {
    return { success: false, delivered: false, error: "Missing EMAIL_USER or EMAIL_PASS" };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 465,
    secure: Number(process.env.SMTP_PORT) === 465 || !process.env.SMTP_PORT, // true for 465
    auth: { user, pass },
    connectionTimeout: 5000,
    greetingTimeout: 4000,
    socketTimeout: 5000,
  });

  const fromAddress = process.env.EMAIL_FROM || `"SportSync" <${user}>`;

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("SMTP connection timed out. Cloud host restricted outbound SMTP ports (587/465).")), 6000)
  );

  const sendPromise = transporter.sendMail({
    from: fromAddress,
    to: email,
    subject: `Your SportSync Verification Code: ${otp}`,
    text: `Hello ${name},\n\nYour SportSync verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nSportSync Team`,
    html: getAppleEmailTemplate(name, otp),
  });

  return await Promise.race([sendPromise, timeoutPromise])
    .then((info) => {
      console.log(`[Email Service] ✅ Real email sent via SMTP to ${email} (MessageId: ${info.messageId})`);
      return { success: true, delivered: true, messageId: info.messageId };
    })
    .catch((err) => {
      console.error(`[Email Service] ⚠️ SMTP failed for ${email}:`, err.message);
      return { success: false, delivered: false, error: err.message };
    });
}

/**
 * High-Performance Resilient Email Dispatcher
 * Priority:
 * 1. Resend HTTPS REST API (Port 443 — fast, reliable on Render)
 * 2. SMTP / Gmail (with 6s timeout guard)
 * Strict Production Enforcement: Never fake delivery or leak OTP in API response.
 */
async function sendOtpEmail(email, name, otp) {
  let lastError = "";

  // 1. Try Resend HTTPS API if key present
  if (process.env.RESEND_API_KEY) {
    console.log(`[Email Service] Attempting delivery via Resend HTTPS for ${email}...`);
    const resendResult = await sendViaResendHttp(process.env.RESEND_API_KEY, email, name, otp);
    if (resendResult.success) {
      return resendResult;
    }
    lastError = resendResult.error;
    console.warn(`[Email Service] Resend HTTPS delivery failed: ${lastError}`);
  } else {
    console.warn("[Email Service] ⚠️ RESEND_API_KEY is not configured in Render Environment Variables.");
  }

  // 2. Try SMTP if credentials present
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    console.log(`[Email Service] Attempting delivery via SMTP for ${email}...`);
    const smtpResult = await sendViaSmtpWithTimeout(email, name, otp);
    if (smtpResult.success) {
      return smtpResult;
    }
    lastError = lastError ? `${lastError}; SMTP: ${smtpResult.error}` : smtpResult.error;
    console.warn(`[Email Service] SMTP delivery failed: ${smtpResult.error}`);
  }

  // 3. Strict failure handling — No OTP leak to frontend
  const hasResend = !!process.env.RESEND_API_KEY;
  const hasSmtp = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);

  let failureMsg = "Email service not configured. Please set RESEND_API_KEY in Render Environment Variables.";
  if (hasResend) {
    failureMsg = `Resend delivery failed: ${lastError}. (Note: On Resend's free trial domain onboarding@resend.dev, you can only send to the email address registered on your Resend account).`;
  } else if (hasSmtp) {
    failureMsg = `SMTP delivery failed: ${lastError}.`;
  }

  console.error(`[Email Service] ❌ Final email delivery failure for ${email}: ${failureMsg}`);

  return {
    success: false,
    delivered: false,
    error: failureMsg,
  };
}

module.exports = {
  sendOtpEmail,
};
