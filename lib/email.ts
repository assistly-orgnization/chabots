const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY?.trim();
const SENDGRID_FROM_EMAIL = (
  process.env.SENDGRID_FROM_EMAIL ??
  process.env.ADMIN_NOTIFY_EMAIL ??
  "shaimaa.babeker95@gmail.com"
).trim();

const ADMIN_EMAIL = (process.env.ADMIN_NOTIFY_EMAIL ?? "shaimaaalmubarak00@gmail.com").trim();

if (!SENDGRID_API_KEY) {
  console.warn("[email] SENDGRID_API_KEY is not set — email notifications will be skipped.");
} else {
  console.log("[email] SendGrid client initialized (SENDGRID_API_KEY present)");
}

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

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Send email via SendGrid REST API v3 (Native fetch, zero dependencies)
 */
async function sendViaSendGrid(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!SENDGRID_API_KEY) {
    console.error("[email] SendGrid API key not configured.");
    return { ok: false, error: "SENDGRID_API_KEY not configured" };
  }

  try {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: options.to }] }],
        from: { email: SENDGRID_FROM_EMAIL, name: "Assistly" },
        subject: options.subject,
        content: [{ type: "text/html", value: options.html }],
      }),
    });

    if (res.ok || res.status === 202) {
      const messageId = res.headers.get("x-message-id") ?? "sg_ok";
      console.log(`[email] SendGrid delivered to ${options.to}`, { id: messageId });
      return { ok: true, id: messageId };
    }

    const errorData = await res.json().catch(() => ({}));
    console.error("[email] SendGrid API error:", res.status, errorData);
    return { ok: false, error: JSON.stringify(errorData) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "SendGrid error";
    console.error("[email] SendGrid exception:", msg);
    return { ok: false, error: msg };
  }
}

function buildDigestHtml(payload: AdminDigestPayload): string {
  const guestName = payload.guestName?.trim() || "A visitor";
  const guestEmail = payload.guestEmail?.trim();
  const sessionUrl = `${payload.appBaseUrl.replace(/\/$/, "")}/review-sessions/${payload.sessionId}`;
  const safeName = escapeHtml(guestName);
  const safeEmail = guestEmail ? escapeHtml(guestEmail) : "";

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1e1e1e; line-height: 1.5;">
      <h2 style="margin: 0 0 16px; font-size: 18px;">New chat session</h2>
      <p style="margin: 0 0 16px;">
        <strong>Name:</strong> ${safeName}
      </p>
      ${safeEmail ? `<p style="margin: 0 0 16px;"><strong>Email:</strong> ${safeEmail}</p>` : ""}
      <p style="margin: 0 0 24px;">
        <strong>Session ID:</strong> #${payload.sessionId}
      </p>
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
      <p style="margin: 0 0 24px; color: #4b4b4b; font-size: 14px;">
        ${roleDesc}
      </p>
      <p style="margin: 0 0 24px;">
        <a href="${signInUrl}" style="display: inline-block; background: #1e1e1e; color: #faf6ef; padding: 10px 18px; border-radius: 8px; text-decoration: none; font-weight: 500;">
          Sign in to Assistly
        </a>
      </p>
      <p style="margin: 0; font-size: 12px; color: #6b6b6b;">
        Sign in using this email address (${escapeHtml(payload.invitedEmail)}) to access the dashboard.
        If you don't have an account yet, create one with this email.
      </p>
    </div>
  `.trim();
}

export async function sendAdminNewMessageDigest(
  payload: AdminDigestPayload,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const subject = `New chat session from ${payload.guestName?.trim() || "a visitor"} on ${payload.chatbotName}`;
  const html = buildDigestHtml(payload);
  return sendViaSendGrid({ to: ADMIN_EMAIL, subject, html });
}

export async function sendInviteEmail(
  payload: InviteEmailPayload,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const subject = "You've been invited to Assistly";
  const html = buildInviteHtml(payload);
  return sendViaSendGrid({ to: payload.invitedEmail, subject, html });
}
