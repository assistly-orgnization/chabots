import { NextRequest, NextResponse } from "next/server";
import serverClient from "@/lib/server/serverClient";
import { GET_CHAT_SESSION_NOTIFICATION_CONTEXT } from "@/qraphql/queries/queries";
import { MARK_CHAT_SESSION_NOTIFIED } from "@/qraphql/mutations/mutations";

/**
 * Diagnostic endpoint for the notification system.
 *
 * GET /api/debug-session?sessionId=42
 *   Returns the full session context the email helper would see.
 *
 * GET /api/debug-session?sessionId=42&reset=1
 *   Clears last_notified_at so the next message in this session re-triggers
 *   the notification.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const sessionId = Number(url.searchParams.get("sessionId"));
  const reset = url.searchParams.get("reset") === "1";

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

  if (!reset) {
    return NextResponse.json({
      sessionId,
      last_notified_at: ctx.last_notified_at,
      messageCount: ctx.messages?.length ?? 0,
      lastMessage: (ctx.messages ?? [])
        .slice()
        .sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )[0],
      guest: ctx.guests,
      chatbot: ctx.chatbots,
    });
  }

  // reset=1: clear last_notified_at so a fresh notification can fire.
  await serverClient.mutate({
    mutation: MARK_CHAT_SESSION_NOTIFIED,
    variables: {
      id: sessionId,
      chatbot_id: null,
      created_at: null,
      guest_id: null,
      last_notified_at: new Date(0).toISOString(),
    },
  });

  return NextResponse.json({
    ok: true,
    message: "Reset last_notified_at to epoch. Next message in this session will re-trigger the email.",
    sessionId,
  });
}
