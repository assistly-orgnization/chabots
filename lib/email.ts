import { Resend } from "resend";

function readResendKey(): string | undefined {
  // Accept any casing of the env var. Vercel preserves case but some import
  // pipelines lowercase names.
  const candidates = [
    process.env.RESEND_API_KEY,
    process.env.RESEND_API_KEY,
    process.env.resend_API_KEY,
  ];
  for (const value of candidates) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}

const RESEND_API_KEY = readResendKey();

if (!RESEND_API_KEY) {
  console.warn(
    "[email] RESEND_API_KEY is not set — admin notifications will be skipped.",
  );
} else {
  console.log(
    "[email] resend client initialised (key present, prefix: " +
      RESEND_API_KEY.slice(0, 6) +
      "…)",
  );
}

const rawFrom = (process.env.ADMIN_NOTIFY_FROM ?? "Assistly <onboarding@resend.dev>").trim();
// Only accept `Name <addr@verified-domain>` form. If a bare email is supplied,
// or the domain is one we know isn't verified (gmail/yahoo/outlook/hotmail),
// fall back to Resend's built-in test sender so the API call doesn't fail
// with "domain not verified".
const UNVERIFIED_DOMAINS = /(@gmail\.|@yahoo\.|@outlook\.|@hotmail\.|@icloud\.)/i;
const looksLikeResendTest = /onboarding@resend\.dev/i.test(rawFrom);
const formattedFrom = /<.+@.+>/.test(rawFrom) ? rawFrom : `Assistly <${rawFrom}>`;
const FROM_ADDRESS =
  !looksLikeResendTest && UNVERIFIED_DOMAINS.test(formattedFrom)
    ? "Assistly <onboarding@resend.dev>"
    : formattedFrom;

if (!looksLikeResendTest) {
  console.log(
    "[email] Using Resend test sender (onboarding@resend.dev) because the configured FROM address is on an unverified domain.",
  );
}

const ADMIN_EMAIL = (process.env.ADMIN_NOTIFY_EMAIL ?? "shaimaaalmubarak00@gmail.com").trim();

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export type AdminDigestPayload = {
  chatbotName: string;
  guestName: string | null;
  guestEmail: string | null;
  sessionId: number;
  sessionCreatedAt: string;
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

export async function sendAdminNewMessageDigest(
  payload: AdminDigestPayload,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!resend) {
    console.error(
      "[email] Resend client not initialised — RESEND_API_KEY missing at module load.",
    );
    return { ok: false, error: "Resend API key not configured" };
  }

  const subject = `New chat session from ${payload.guestName?.trim() || "a visitor"} on ${payload.chatbotName}`;

  console.log("[email] sending digest via Resend", {
    from: FROM_ADDRESS,
    to: ADMIN_EMAIL,
    subject,
    sessionId: payload.sessionId,
  });

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: ADMIN_EMAIL,
      subject,
      html: buildDigestHtml(payload),
    });

    if (error) {
      console.error("[email] Resend returned an error:", error);
      return { ok: false, error: error.message ?? "Resend error" };
    }

    console.log("[email] Resend accepted the message", { id: data?.id });
    return { ok: true, id: data?.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Resend error";
    console.error("[email] Failed to send admin digest:", message);
    return { ok: false, error: message };
  }
}
