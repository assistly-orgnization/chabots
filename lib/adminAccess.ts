import serverClient from "@/lib/server/serverClient";
import { gql } from "@apollo/client";
import sql from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import type { AdminUser } from "@/types/types";

const GET_CHATBOT_OWNER = gql`
  query GetChatbotOwner($id: Int!) {
    chatbots(id: $id) {
      id
      clerk_user_id
    }
  }
`;

const GET_OWNED_CHATBOT_IDS = gql`
  query OwnerHasAnyChatbot($clerk_user_id: String!) {
    chatbotsListByClerkUserId(clerk_user_id: $clerk_user_id) {
      id
    }
  }
`;

/**
 * Returns true if `userId` is allowed to view chat sessions for `chatbotId`.
 * Allowed when:
 *   - The user is the chatbot owner (chatbots.clerk_user_id === userId), OR
 *   - The user's email is in admin_users invited by that owner.
 */
export async function canReviewSessionsForChatbot(
  userId: string,
  chatbotId: number,
): Promise<boolean> {
  const owner = await getChatbotOwner(chatbotId);
  if (!owner) return false;
  if (owner === userId) return true;

  const ownerIds = await getOwnerIdsForUser(userId);
  return ownerIds.has(owner);
}

/**
 * Returns true if the user owns at least one chatbot — used to gate
 * the /admin-users settings page.
 */
export async function isOwnerOfAnyChatbot(userId: string): Promise<boolean> {
  // Preferred path: tenant-scoped server-side filter via StepZen.
  try {
    const { data, errors } = await serverClient.query<{
      chatbotsListByClerkUserId: { id: number }[];
    }>({
      query: GET_OWNED_CHATBOT_IDS,
      variables: { clerk_user_id: userId },
    });
    if (!errors && (data?.chatbotsListByClerkUserId ?? []).length > 0) {
      return true;
    }
  } catch (error) {
    console.warn("[adminAccess] tenant-scoped query failed, falling back", error);
  }

  // Fallback: enumerate all chatbots and filter client-side.
  try {
    const { data } = await serverClient.query<{
      chatbotsList: { id: number; clerk_user_id: string }[];
    }>({
      query: gql`
        query AllChatbotsForOwnershipCheck {
          chatbotsList {
            id
            clerk_user_id
          }
        }
      `,
    });
    return (data?.chatbotsList ?? []).some((c) => c?.clerk_user_id === userId);
  } catch (error) {
    console.error("[adminAccess] full-list fallback failed", error);
    return false;
  }
}

/**
 * Returns the owner clerk_user_id of the chatbot, or null if not found.
 */
export async function getChatbotOwner(
  chatbotId: number,
): Promise<string | null> {
  const { data } = await serverClient.query<{
    chatbots: { id: number; clerk_user_id: string } | null;
  }>({
    query: GET_CHATBOT_OWNER,
    variables: { id: chatbotId },
  });
  return data?.chatbots?.clerk_user_id ?? null;
}

/**
 * Returns the set of owner_clerk_user_ids that have invited this user.
 * Access is matched purely by email — no Clerk user_id required on the invite.
 */
export async function getOwnerIdsForUser(userId: string): Promise<Set<string>> {
  const ownerIds = new Set<string>();

  try {
    // Look up the signed-in user's primary email via Clerk.
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) return ownerIds;

    const lowerEmail = email.trim().toLowerCase();

    // Query admin_users by email directly from NeonDB.
    const rows = await sql`
      SELECT owner_clerk_user_id, role
      FROM admin_users
      WHERE LOWER(invited_email) = ${lowerEmail}
    ` as AdminUser[];

    for (const invite of rows) {
      ownerIds.add(invite.owner_clerk_user_id);
    }
  } catch (error) {
    console.warn("[adminAccess] getOwnerIdsForUser failed", error);
  }

  return ownerIds;
}

/**
 * Returns the role of the invited user for a given owner's chatbots.
 * Returns null if no invite exists.
 */
export async function getRoleForUser(
  userId: string,
  ownerClerkUserId: string,
): Promise<"editor" | "viewer" | null> {
  try {
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) return null;

    const lowerEmail = email.trim().toLowerCase();

    const rows = await sql`
      SELECT role FROM admin_users
      WHERE LOWER(invited_email) = ${lowerEmail}
        AND owner_clerk_user_id = ${ownerClerkUserId}
      LIMIT 1
    `;

    if (!rows || rows.length === 0) return null;
    return rows[0].role as "editor" | "viewer";
  } catch (error) {
    console.warn("[adminAccess] getRoleForUser failed", error);
    return null;
  }
}

/**
 * Returns the global role of the signed-in user:
 *   'owner'  — owns at least one chatbot (full access)
 *   'editor' — invited as editor but does not own any chatbot
 *   'viewer' — invited as viewer but does not own any chatbot
 *   null     — not invited anywhere, treat as fresh owner/no access
 */
export async function getMyGlobalRole(
  userId: string,
): Promise<"owner" | "editor" | "viewer" | null> {
  const isOwner = await isOwnerOfAnyChatbot(userId);
  if (isOwner) return "owner";

  try {
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) return null;

    const lowerEmail = email.trim().toLowerCase();

    const rows = await sql`
      SELECT role FROM admin_users
      WHERE LOWER(invited_email) = ${lowerEmail}
      ORDER BY created_at DESC
      LIMIT 1
    ` as { role: string }[];

    if (!rows || rows.length === 0) return null;
    const role = rows[0].role;
    if (role === "editor") return "editor";
    if (role === "viewer") return "viewer";
    return null;
  } catch (error) {
    console.warn("[adminAccess] getMyGlobalRole failed", error);
    return null;
  }
}