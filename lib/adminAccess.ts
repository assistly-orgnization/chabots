import serverClient from "@/lib/server/serverClient";
import { gql } from "@apollo/client";
import {
  GET_EMAIL_PENDING_INVITES,
  GET_INVITES_FOR_USER,
} from "@/qraphql/queries/queries";
import { findClerkUserIdByEmail } from "@/lib/clerkLookup";
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

const BACKFILL_INVITED_USER_ID = gql`
  mutation BackfillInvitedUserId(
    $id: Int!
    $owner_clerk_user_id: String
    $invited_clerk_user_id: String
    $invited_email: String
    $created_at: DateTime
  ) {
    updateAdmin_users(
      id: $id
      owner_clerk_user_id: $owner_clerk_user_id
      invited_clerk_user_id: $invited_clerk_user_id
      invited_email: $invited_email
      created_at: $created_at
    ) {
      id
      invited_clerk_user_id
    }
  }
`;

/**
 * Returns true if `userId` is allowed to view chat sessions for `chatbotId`.
 * Allowed when:
 *   - The user is the chatbot owner (chatbots.clerk_user_id === userId), OR
 *   - The user has been invited by that owner. Matched first by
 *     invited_clerk_user_id, then by invited_email (covers invites sent
 *     before the invitee signed up with Clerk).
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
  const { data } = await serverClient.query<{
    chatbotsListByClerkUserId: { id: number }[];
  }>({
    query: GET_OWNED_CHATBOT_IDS,
    variables: { clerk_user_id: userId },
  });
  return (data?.chatbotsListByClerkUserId ?? []).length > 0;
}

/**
 * Returns the owner of the chatbot, or null if the chatbot doesn't exist.
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
 * Returns every invite that points at `userId` as the invited Clerk user.
 */
export async function getInvitesForUser(userId: string): Promise<AdminUser[]> {
  const { data } = await serverClient.query<{
    admin_usersAccessByInvitedUser: AdminUser[];
  }>({
    query: GET_INVITES_FOR_USER,
    variables: { invited_clerk_user_id: userId },
  });
  return data?.admin_usersAccessByInvitedUser ?? [];
}

/**
 * Returns the set of owner_clerk_user_ids that have invited this user
 * (matched by Clerk user_id OR by email for pre-signup invites).
 */
export async function getOwnerIdsForUser(userId: string): Promise<Set<string>> {
  const ownerIds = new Set<string>();

  // 1) Direct matches — invites created with invited_clerk_user_id === userId.
  const direct = await getInvitesForUser(userId);
  for (const invite of direct) ownerIds.add(invite.owner_clerk_user_id);

  // 2) Email fallback — invites created before the user signed up. We look
  //    up the user's primary email via Clerk and then query admin_users for
  //    any invite whose invited_email matches.
  try {
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;
    if (email) {
      const lowerEmail = email.toLowerCase();
      const { data } = await serverClient.query<{
        admin_usersListByEmails: AdminUser[];
      }>({
        query: GET_EMAIL_PENDING_INVITES,
        variables: { emails: [lowerEmail] },
      });
      const emailInvites = data?.admin_usersListByEmails ?? [];
      for (const invite of emailInvites) {
        ownerIds.add(invite.owner_clerk_user_id);
      }

      // Back-fill pending invites (no invited_clerk_user_id set) so future
      // lookups skip the Clerk round-trip.
      const pending = emailInvites.filter((i) => !i.invited_clerk_user_id);
      await Promise.all(
        pending.map((i) =>
          serverClient
            .mutate({
              mutation: BACKFILL_INVITED_USER_ID,
              variables: {
                id: i.id,
                owner_clerk_user_id: i.owner_clerk_user_id,
                invited_clerk_user_id: userId,
                invited_email: i.invited_email,
                created_at: i.created_at,
              },
            })
            .catch((err) => {
              console.warn("[adminAccess] backfill failed", err);
            }),
        ),
      );
    }
  } catch (error) {
    console.warn("[adminAccess] email fallback failed", error);
  }

  return ownerIds;
}

/**
 * Resolve a Clerk email → user_id. Re-exported here for convenience.
 */
export { findClerkUserIdByEmail };