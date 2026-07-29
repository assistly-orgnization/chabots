import nodemailer from "nodemailer";

// ---------------------------------------------------------------------------
// Config — Gmail SMTP with App Password
// No domain verification needed. Sends through Google's servers → inbox, not spam.
// ---------------------------------------------------------------------------
const GMAIL_USER  = process.env.GMAIL_USER?.trim();       // e.g. supportoptika@gmail.com
const GMAIL_PASS  = process.env.GMAIL_APP_PASSWORD?.trim(); // 16-char App Password from Google
const ADMIN_EMAIL = (process.env.ADMIN_NOTIFY_EMAIL ?? GMAIL_USER ?? "").trim();

if (!GMAIL_USER || !GMAIL_PASS) {
  console.warn("[email] GMAIL_USER or GMAIL_APP_PASSWORD not set — emails will be skipped.");
} else {
  console.log(`[email] Gmail SMTP ready (${GMAIL_USER})`);
}

function createTransport() {
  if (!GMAIL_USER || !GMAIL_PASS) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_PASS,
    },
  });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type AdminDigestPayload = {
  chatbotName: string;
  guestName: string | null;
  guestEmail: string | null;
  sessionId: number;
  sessionCreatedAt: string;
  appBaseUrl: string;
};

export type InviteEmailPayload = {
  invitedEmail: string;
  role: "editor" | "viewer";
  appBaseUrl: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function sendMail(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const transport = createTransport();
  if (!transport) {
    return { ok: false, error: "Gmail credentials not configured" };
  }

  try {
    const info = await transport.sendMail({
      from: `"Assistly" <${GMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    console.log(`[email] Sent to ${options.to}`, { id: info.messageId });
    return { ok: true, id: info.messageId };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gmail SMTP error";
    console.error("[email] Gmail SMTP error:", msg);
    return { ok: false, error: msg };
  }
}

// ---------------------------------------------------------------------------
// HTML builders
// ---------------------------------------------------------------------------
function buildDigestHtml(payload: AdminDigestPayload): string {
  const guestName = payload.guestName?.trim() || "A visitor";
  const guestEmail = payload.guestEmail?.trim();
  const sessionUrl = `${payload.appBaseUrl.replace(/\/$/, "")}/review-sessions/${payload.sessionId}`;
  const safeName = escapeHtml(guestName);
  const safeEmail = guestEmail ? escapeHtml(guestEmail) : "";

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1e1e1e; line-height: 1.5;">
      <h2 style="margin: 0 0 16px; font-size: 18px;">New chat session</h2>
      <p style="margin: 0 0 16px;"><strong>Name:</strong> ${safeName}</p>
      ${safeEmail ? `<p style="margin: 0 0 16px;"><strong>Email:</strong> ${safeEmail}</p>` : ""}
      <p style="margin: 0 0 24px;"><strong>Session ID:</strong> #${payload.sessionId}</p>
      <p style="margin: 0 0 24px;">
        <a href="${sessionUrl}" style="display: inline-block; background: #1e1e1e; color: #faf6ef; padding: 10px 18px; border-radius: 8px; text-decoration: none; font-weight: 500;">
          Open conversation
        </a>
      </p>
      <p style="margin: 0; font-size: 12px; color: #6b6b6b;">
        Sent by Assistly · ${escapeHtml(payload.chatbotName)} · ${escapeHtml(payload.sessionCreatedAt)}
      </p>
    </div>
  `.trim();
}

function buildInviteHtml(payload: InviteEmailPayload): string {
  const signInUrl = `${payload.appBaseUrl.replace(/\/$/, "")}/login?invited=1`;
  const roleLabel = payload.role === "editor" ? "Editor" : "Viewer";
  const roleDesc =
    payload.role === "editor"
      ? "You can review chat sessions and manage chatbot settings."
      : "You can view and download chat session data (read-only).";

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1e1e1e; line-height: 1.5;">
      <h2 style="margin: 0 0 16px; font-size: 18px;">You've been invited to Assistly</h2>
      <p style="margin: 0 0 16px;">
        You have been added as a team member with the <strong>${roleLabel}</strong> role.
      </p>
      <p style="margin: 0 0 24px; color: #4b4b4b; font-size: 14px;">${roleDesc}</p>
      <p style="margin: 0 0 24px;">
        <a href="${signInUrl}" style="display: inline-block; background: #1e1e1e; color: #faf6ef; padding: 10px 18px; border-radius: 8px; text-decoration: none; font-weight: 500;">
          Sign in to Assistly
        </a>
      </p>
      <p style="margin: 0; font-size: 12px; color: #6b6b6b;">
        Sign in using this email address (${escapeHtml(payload.invitedEmail)}) to access the dashboard.
        If you don&apos;t have an account yet, create one with this email.
      </p>
    </div>
  `.trim();
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
export async function sendAdminNewMessageDigest(
  payload: AdminDigestPayload,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const subject = `New chat session from ${payload.guestName?.trim() || "a visitor"} on ${payload.chatbotName}`;
  return sendMail({ to: ADMIN_EMAIL, subject, html: buildDigestHtml(payload) });
}

export async function sendInviteEmail(
  payload: InviteEmailPayload,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  return sendMail({
    to: payload.invitedEmail,
    subject: "You've been invited to Assistly",
    html: buildInviteHtml(payload),
  });
}
