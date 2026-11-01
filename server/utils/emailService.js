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
 * Deliver via Google SMTP (Gmail) with Nodemailer
 */
async function sendViaGoogleSmtp(email, name, otp) {
  const user = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : "";
  const pass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, "").trim() : "";

  if (!user || !pass) {
    return {
      success: false,
      delivered: false,
      error: "Google SMTP credentials missing: Please set EMAIL_USER and EMAIL_PASS in Render.",
    };
  }

  try {
    console.log(`[Google SMTP] Initializing Gmail transporter for ${user}...`);

    // Official Gmail service configuration in Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user,
        pass,
      },
      connectionTimeout: 10000, // 10s connection limit
      greetingTimeout: 8000,
      socketTimeout: 12000,
    });

    const fromAddress = process.env.EMAIL_FROM || `"SportSync" <${user}>`;

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              "Gmail SMTP timeout. Please ensure your 16-character Google App Password is correct."
            )
          ),
        12000
      )
    );

    const sendPromise = transporter.sendMail({
      from: fromAddress,
      to: email.toLowerCase().trim(),
      subject: `Your SportSync Verification Code: ${otp}`,
      text: `Hello ${name},\n\nYour SportSync verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nSportSync Team`,
      html: getAppleEmailTemplate(name, otp),
    });

    const info = await Promise.race([sendPromise, timeoutPromise]);
    console.log(`[Google SMTP] ✅ Real email delivered to ${email} (MessageId: ${info.messageId})`);
    return { success: true, delivered: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Google SMTP] ❌ Delivery failed to ${email}:`, err.message);
    let friendlyError = err.message;
    if (err.message.includes("Invalid login") || err.message.includes("535") || err.message.includes("Username and Password not accepted")) {
      friendlyError = "Google rejected login credentials. Please ensure 2-Step Verification is ON and you are using a 16-character App Password (not your normal Gmail password).";
    }
    return { success: false, delivered: false, error: friendlyError };
  }
}

/**
 * Deliver via Resend HTTPS REST API (Secondary / Fallback)
 */
async function sendViaResendHttp(apiKey, email, name, otp) {
  try {
    const fromAddress = process.env.EMAIL_FROM || "onboarding@resend.dev";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

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
      console.log(`[Resend HTTP] ✅ Real email sent to ${email} (Id: ${data.id})`);
      return { success: true, delivered: true, id: data.id };
    } else {
      const detail = data?.message || data?.error || JSON.stringify(data);
      return { success: false, delivered: false, error: `Resend API: ${detail}` };
    }
  } catch (err) {
    return { success: false, delivered: false, error: `Resend Network Error: ${err.message}` };
  }
}

/**
 * Deliver via Brevo (Sendinblue) HTTPS REST API (Port 443 - Can send to ANY recipient without domain lock)
 */
async function sendViaBrevoHttp(apiKey, email, name, otp) {
  try {
    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || "sportsync.verify@gmail.com";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    console.log(`[Brevo HTTP] Dispatching email to ${email} via Brevo HTTPS REST API...`);

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey.trim(),
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        sender: { name: "SportSync", email: fromEmail },
        to: [{ email: email.toLowerCase().trim(), name }],
        subject: `Your SportSync Verification Code: ${otp}`,
        htmlContent: getAppleEmailTemplate(name, otp),
      }),
    });

    clearTimeout(timeoutId);
    const data = await res.json();

    if (res.ok && (data.messageId || data.id)) {
      console.log(`[Brevo HTTP] ✅ Real email sent via Brevo to ${email} (Id: ${data.messageId || data.id})`);
      return { success: true, delivered: true, id: data.messageId || data.id };
    } else {
      const detail = data?.message || JSON.stringify(data);
      console.error("[Brevo HTTP] ⚠️ Brevo returned error:", detail);
      return { success: false, delivered: false, error: `Brevo API: ${detail}` };
    }
  } catch (err) {
    console.error("[Brevo HTTP] ⚠️ Request failed:", err.message);
    return { success: false, delivered: false, error: `Brevo Network Error: ${err.message}` };
  }
}

/**
 * High-Performance Email Dispatcher
 * Priority:
 * 1. Brevo HTTPS API (if BREVO_API_KEY set — can send to ANY email)
 * 2. Resend HTTPS API (if RESEND_API_KEY set — fast, sends to account email or verified domain)
 * 3. Google SMTP (if EMAIL_USER/EMAIL_PASS set — requires cloud host to permit outbound port 465/587)
 */
async function sendOtpEmail(email, name, otp) {
  let lastError = "";

  // 1. Try Brevo HTTPS REST API (Universal recipient delivery over Port 443)
  if (process.env.BREVO_API_KEY) {
    console.log(`[Email Service] Delivering via Brevo HTTPS for ${email}...`);
    const brevoResult = await sendViaBrevoHttp(process.env.BREVO_API_KEY, email, name, otp);
    if (brevoResult.success) {
      return brevoResult;
    }
    lastError = brevoResult.error;
    console.warn(`[Email Service] Brevo delivery failed: ${lastError}`);
  }

  // 2. Try Resend HTTPS REST API (Port 443)
  if (process.env.RESEND_API_KEY) {
    console.log(`[Email Service] Delivering via Resend HTTPS for ${email}...`);
    const resendResult = await sendViaResendHttp(process.env.RESEND_API_KEY, email, name, otp);
    if (resendResult.success) {
      return resendResult;
    }
    lastError = lastError ? `${lastError} | ${resendResult.error}` : resendResult.error;
    console.warn(`[Email Service] Resend HTTPS failed: ${resendResult.error}`);
  }

  // 3. Try Google SMTP (Gmail)
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    console.log(`[Email Service] Delivering via Google SMTP for ${email}...`);
    const smtpResult = await sendViaGoogleSmtp(email, name, otp);
    if (smtpResult.success) {
      return smtpResult;
    }
    lastError = lastError ? `${lastError} | ${smtpResult.error}` : smtpResult.error;
  }

  if (!lastError) {
    lastError = "Email service not configured. Please set RESEND_API_KEY (or BREVO_API_KEY / EMAIL_USER) in Render Environment Variables.";
  }

  console.error(`[Email Service] ❌ Failed to dispatch verification email to ${email}: ${lastError}`);

  return {
    success: false,
    delivered: false,
    error: lastError,
  };
}

module.exports = {
  sendOtpEmail,
};
