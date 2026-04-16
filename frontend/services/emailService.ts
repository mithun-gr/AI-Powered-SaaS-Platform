import nodemailer from "nodemailer";

// ── Morchantra Email Service — Google SMTP ───────────────────────────────────
// Uses NodeMailer with a Gmail account.
// Set GOOGLE_SMTP_USER and GOOGLE_SMTP_PASS in your .env.local file.

const SMTP_USER = process.env.GOOGLE_SMTP_USER;
const SMTP_PASS = process.env.GOOGLE_SMTP_PASS;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

const DEFAULT_SENDER = `Morchantra <${SMTP_USER || "mraj05688@gmail.com"}>`;

// ── Core sendEmail function ───────────────────────────────────────────────────

/**
 * Sends a transactional email via Google SMTP.
 * @param to       Recipient email address
 * @param subject  Email subject line
 * @param html     HTML body content
 * @returns        true on success, false on failure
 */
export async function sendEmail(
  to: string,
  subject: string = "Test Email",
  html: string = "<h1>Morchantra Email Working</h1>"
): Promise<boolean> {
  if (!SMTP_USER || !SMTP_PASS) {
    console.error("❌ GOOGLE_SMTP_USER or GOOGLE_SMTP_PASS is not set in .env.local");
    return false;
  }

  try {
    await transporter.sendMail({
      from: DEFAULT_SENDER,
      to,
      subject,
      html,
    });

    console.log(`✅ Email sent successfully to: ${to}`);
    return true;
  } catch (error: any) {
    console.error("❌ Google SMTP email sending failed:", error?.message || error);
    return false;
  }
}

/**
 * Sends the same email to multiple recipients in parallel.
 * @param recipients  Array of email addresses
 * @param subject     Email subject
 * @param html        HTML body
 * @returns           Array of booleans (true = sent, false = failed) per recipient
 */
export async function sendEmailToMany(
  recipients: string[],
  subject: string,
  html: string
): Promise<boolean[]> {
  return Promise.all(recipients.map((to) => sendEmail(to, subject, html)));
}

// ── Pre-built email templates for Morchantra ─────────────────────────────────

/**
 * Sends a branded welcome email to a newly registered user.
 */
export async function sendWelcomeEmail(
  toEmail: string,
  userName: string
): Promise<boolean> {
  return sendEmail(
    toEmail,
    "Welcome to Morchantra! 🎉",
    `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:32px;background:#0a0a0a;color:#ffffff;border-radius:12px;">
      <h1 style="color:#ef4444;">Welcome to Morchantra, ${userName}!</h1>
      <p style="color:#a1a1aa;">Your premium business services portal is ready to use.</p>
      <a href="https://morchantra.com/login"
         style="display:inline-block;padding:12px 24px;background:#ef4444;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">
        Go to Dashboard →
      </a>
      <p style="color:#71717a;font-size:12px;margin-top:32px;">Morchantra — Empowering Digital Excellence</p>
    </div>
    `
  );
}

/**
 * Forwards a client's contact message to the founder's inbox.
 */
export async function sendContactEmail(
  fromName: string,
  fromEmail: string,
  message: string
): Promise<boolean> {
  return sendEmail(
    SMTP_USER || "mraj05688@gmail.com",
    `📧 New Client Message from ${fromName}`,
    `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:32px;background:#0a0a0a;color:#ffffff;border-radius:12px;">
      <h2 style="color:#ef4444;">New Message via Morchantra Portal</h2>
      <p><strong>From:</strong> ${fromName}</p>
      <p><strong>Email:</strong> ${fromEmail}</p>
      <hr style="border-color:#27272a;margin:16px 0;" />
      <p style="color:#a1a1aa;line-height:1.6;">${message}</p>
      <p style="color:#71717a;font-size:12px;margin-top:32px;">Morchantra — Empowering Digital Excellence</p>
    </div>
    `
  );
}
