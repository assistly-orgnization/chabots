import { NextRequest, NextResponse } from "next/server";
import { sendAdminNewMessageDigest } from "@/lib/email";

/**
 * Diagnostic endpoint. Hits Resend directly with a fake payload, no chat
 * session, no StepZen, no DB. If this works, the email library is fine and
 * the bug is upstream in maybeNotifyAdmin / the chat flow.
 *
 * Hit it from a browser or curl:
 *   http://localhost:3000/api/test-notify
 *   https://your-app.vercel.app/api/test-notify
 */
export async function GET(_req: NextRequest) {
  const result = await sendAdminNewMessageDigest({
    chatbotName: "Test Chatbot",
    guestName: "Shaimaa (test)",
    guestEmail: "shaimaaalmubarak00@gmail.com",
    latestUserMessage: "Hello from the test endpoint — if you see this, the email path is wired up correctly.",
    transcript: "Guest: Hello from the test endpoint — if you see this, the email path is wired up correctly.\n\nAssistant: This is a test reply.",
    sessionId: 0,
    sessionCreatedAt: new Date().toISOString(),
    appBaseUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
