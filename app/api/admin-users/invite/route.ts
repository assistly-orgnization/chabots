import serverClient from "@/lib/server/serverClient";
import { INVITE_ADMIN } from "@/qraphql/mutations/mutations";
import { isOwnerOfAnyChatbot } from "@/lib/adminAccess";
import { findClerkUserIdByEmail } from "@/lib/clerkLookup";
import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";

/**
 * POST /api/admin-users/invite
 * Body: { email: string }
 *
 * Owner-only. Adds a row to admin_users granting the address read-only access
 * to /review-sessions. Clerk user_id is left null until the invited user signs
 * up; the access helper matches by invited_email fallback at query time, but
 * currently matches by invited_clerk_user_id only — owners should pass the
 * Clerk user_id of the invitee when known.
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isOwnerOfAnyChatbot(userId))) {
    return NextResponse.json(
      { error: "Only chatbot owners can invite admins" },
      { status: 403 },
    );
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { email, invited_clerk_user_id } = body as {
    email?: unknown;
    invited_clerk_user_id?: unknown;
  };

  const trimmedEmail =
    typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!trimmedEmail) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  // Resolve email → Clerk user_id. If the invitee hasn't signed up yet, we
  // store the email and back-fill the user_id once they exist (the access
  // helper also resolves email at check time).
  let invitedUserId =
    typeof invited_clerk_user_id === "string" && invited_clerk_user_id.length > 0
      ? invited_clerk_user_id
      : null;
  if (!invitedUserId) {
    try {
      invitedUserId = await findClerkUserIdByEmail(trimmedEmail);
    } catch (error) {
      // Clerk lookup failure shouldn't block the invite — we still have the
      // email address and can back-fill later.
      console.warn("[/api/admin-users/invite] clerk lookup failed", error);
    }
  }

  try {
    const result = await serverClient.mutate({
      mutation: INVITE_ADMIN,
      variables: {
        owner_clerk_user_id: userId,
        invited_clerk_user_id: invitedUserId,
        invited_email: trimmedEmail,
        created_at: new Date().toISOString(),
      },
    });

    if (result.errors) {
      const message = result.errors[0]?.message ?? "GraphQL error";
      // Unique constraint violation → friendly message.
      if (/unique|duplicate/i.test(message)) {
        return NextResponse.json(
          { error: "This person is already invited" },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, admin: result.data?.insertAdmin_users });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[/api/admin-users/invite] error", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}