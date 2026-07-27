import serverClient from "@/lib/server/serverClient";
import { REMOVE_ADMIN } from "@/qraphql/mutations/mutations";
import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { gql } from "@apollo/client";

const GET_OWNER_OF_INVITE = gql`
  query GetOwnerOfInvite($id: Int!) {
    admin_users(id: $id) {
      id
      owner_clerk_user_id
    }
  }
`;

/**
 * POST /api/admin-users/remove
 * Body: { id: number }
 *
 * Owner-only. Verifies the caller owns the invite's owner_clerk_user_id, then
 * deletes the row.
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const id = (body as { id?: unknown } | null)?.id;
  if (typeof id !== "number" || !Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "id must be a positive integer" }, { status: 400 });
  }

  // Fetch the invite to check ownership before deleting.
  const { data, errors } = await serverClient.query<{
    admin_users: { id: number; owner_clerk_user_id: string } | null;
  }>({
    query: GET_OWNER_OF_INVITE,
    variables: { id },
  });

  if (errors || !data?.admin_users) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }
  if (data.admin_users.owner_clerk_user_id !== userId) {
    return NextResponse.json(
      { error: "You can only remove admins you invited" },
      { status: 403 },
    );
  }

  try {
    const result = await serverClient.mutate({
      mutation: REMOVE_ADMIN,
      variables: { id },
    });
    if (result.errors) {
      return NextResponse.json(
        { error: result.errors[0]?.message ?? "GraphQL error" },
        { status: 400 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[/api/admin-users/remove] error", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}