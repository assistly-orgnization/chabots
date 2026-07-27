import serverClient from "@/lib/server/serverClient";
import { gql } from "@apollo/client";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const GET_OWNED_CHATBOT_IDS = gql`
  query DebugOwnerCheck($clerk_user_id: String!) {
    chatbotsListByClerkUserId(clerk_user_id: $clerk_user_id) {
      id
      clerk_user_id
    }
  }
`;

const GET_ALL_CHATBOTS = gql`
  query DebugAllChatbots {
    chatbotsList {
      id
      name
      clerk_user_id
    }
  }
`;

/**
 * Diagnostic endpoint. Reports:
 *   - The signed-in Clerk userId
 *   - Result of `chatbotsListByClerkUserId(userId)`
 *   - Result of `chatbotsList` (every chatbot in the DB)
 *
 * Hit:
 *   /api/debug-owner            → formatted summary
 *   /api/debug-owner?raw=1      → raw GraphQL payloads
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw = url.searchParams.get("raw") === "1";

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const ownedResult = await serverClient.query<{
    chatbotsListByClerkUserId: { id: number; clerk_user_id: string }[];
  }>({
    query: GET_OWNED_CHATBOT_IDS,
    variables: { clerk_user_id: userId },
  });

  const allResult = await serverClient.query<{
    chatbotsList: { id: number; name: string; clerk_user_id: string }[];
  }>({
    query: GET_ALL_CHATBOTS,
  });

  if (raw) {
    return NextResponse.json({
      signedInAs: userId,
      owned: ownedResult,
      all: allResult,
    });
  }

  const owned = ownedResult.data?.chatbotsListByClerkUserId ?? [];
  const allChatbots = allResult.data?.chatbotsList ?? [];
  const ownedIds = owned.map((b) => b.id);

  // Did we find any chatbots whose owner matches the signed-in user,
  // even via the full list?
  const matchedViaFullList = allChatbots.filter(
    (c) => c.clerk_user_id === userId,
  );

  return NextResponse.json({
    signedInAs: userId,
    ownedViaScopedQuery: ownedIds.length,
    ownedIds,
    matchedViaFullList: matchedViaFullList.length,
    matchedIds: matchedViaFullList.map((c) => c.id),
    totalChatbots: allChatbots.length,
    errors: {
      owned: ownedResult.errors ?? null,
      all: allResult.errors ?? null,
    },
    note:
      matchedViaFullList.length > 0 && ownedIds.length === 0
        ? "Found your chatbots via the full list, but the tenant-scoped query returned zero. StepZen hasn't picked up the updated SDL — re-deploy StepZen."
        : matchedViaFullList.length === 0
          ? "No chatbot in the DB has clerk_user_id === userId. The chatbots you see in /view-chatbots were created from a different Clerk account or environment."
          : "Owner check should pass — if /admin-users still says you don't own any, share this response.",
  });
}