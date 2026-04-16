import { NextRequest, NextResponse } from "next/server";
import { sendEmailToMany } from "@/services/emailService";

/**
 * Test route — sends to both mithungrraj@gmail.com and chandrusaravan13@gmail.com
 * GET  /api/test-email
 */
export async function GET(req: NextRequest) {
  const recipients = [
    "mithungrraj@gmail.com",
    "chandrusaravanan13@gmail.com",
  ];

  const subject = "Test Email — Morchantra Email System ✅";
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:32px;background:#0a0a0a;color:#ffffff;border-radius:12px;">
      <h1 style="color:#ef4444;">Morchantra Email Working ✅</h1>
      <p style="color:#a1a1aa;">This is a test email sent via Google SMTP.</p>
      <p style="color:#a1a1aa;"><strong>From:</strong> \${process.env.GOOGLE_SMTP_USER || "Morchantra"}</p>
      <p style="color:#a1a1aa;"><strong>To:</strong> mithungrraj@gmail.com, chandrusaravanan13@gmail.com</p>
      <p style="color:#71717a;font-size:12px;margin-top:32px;">Morchantra — Empowering Digital Excellence</p>
    </div>
  `;

  const results = await sendEmailToMany(recipients, subject, html);

  const allSuccess = results.every(Boolean);
  const successCount = results.filter(Boolean).length;

  return NextResponse.json(
    {
      status: allSuccess ? "success" : "partial",
      message: `Sent ${successCount}/${recipients.length} emails`,
      recipients,
      results: recipients.map((email, i) => ({
        email,
        sent: results[i],
      })),
    },
    { status: allSuccess ? 200 : 207 }
  );
}

