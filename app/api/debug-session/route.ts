import { NextRequest, NextResponse } from "next/server";
import serverClient from "@/lib/server/serverClient";
import { GET_CHAT_SESSION_NOTIFICATION_CONTEXT } from "@/qraphql/queries/queries";

/**
 * Diagnostic endpoint for the notification system.
 *
 * GET /api/debug-session?sessionId=42
 *   Returns the full session context the email helper would see.
 *
 * GET /api/debug-session?sessionId=42&reset=1
 *   No-op: with the in-memory dedupe map there is nothing to reset on the
 *   server side. The dedupe naturally re-arms after 60 minutes.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const sessionId = Number(url.searchParams.get("sessionId"));

  if (!Number.isInteger(sessionId) || sessionId <= 0) {
    return NextResponse.json({ error: "sessionId must be a positive integer" }, { status: 400 });
  }

  const { data, errors } = await serverClient.query({
    query: GET_CHAT_SESSION_NOTIFICATION_CONTEXT,
    variables: { id: sessionId },
  });

  const ctx = (data as any)?.chat_sessions;

  if (errors) {
    return NextResponse.json(
      { error: "GraphQL errors", errors, data },
      { status: 500 },
    );
  }

  if (!ctx) {
    return NextResponse.json(
      { error: "Session not found", sessionId },
      { status: 404 },
    );
  }

  const allMessages = (ctx.messages ?? [])
    .slice()
    .sort(
      (a: any, b: any) =>
        new Date(a.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  const lastMessage = allMessages[allMessages.length - 1];

  return NextResponse.json({
    sessionId,
    messageCount: ctx.messages?.length ?? 0,
    lastMessage: lastMessage ?? null,
    guest: ctx.guests,
    chatbot: ctx.chatbots,
    note:
      "Dedupe is now in-memory and re-arms after 60 minutes. There is no DB column to reset.",
  });
}