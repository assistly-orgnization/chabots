import serverClient from '@/lib/server/serverClient';
import { gql } from '@apollo/client';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Requested-With',
};

/**
 * Operation allowlist. Each entry declares the operation name, whether it
 * is a query or mutation, and whether it is callable without a Clerk session
 * (`public: true`). The browser can only invoke operations whose name appears
 * here; the body is forwarded verbatim to StepZen, which validates fields and
 * types via its own SDL.
 *
 * `public: true` is for operations invoked from the unauthenticated guest
 * embed (e.g. inside a cross-origin iframe). Admin operations must remain
 * authenticated — anyone who reaches the admin dashboard already has a
 * session, and a public admin query would expose every chatbot in the DB.
 *
 * If you add a new browser-facing operation, add it here first. Anything not
 * in this map is rejected.
 */
const ALLOWED_OPERATIONS: Record<
  string,
  { kind: 'query' | 'mutation'; public?: boolean }
> = {
  // queries
  getAllChatbots: { kind: 'query' },
  GETCHATBOTSBYID: { kind: 'query', public: true },
  ChatbotsListByClerkUserId: { kind: 'query' },
  getChatSessionsMessages: { kind: 'query' },
  GetMessagesByChatSessionId: { kind: 'query', public: true },
  GetInvitedAdmins: { kind: 'query' },
  GetInvitesForUser: { kind: 'query' },
  GetEmailPendingInvites: { kind: 'query' },
  // mutations
  CreateChatbot: { kind: 'mutation' },
  RemoveCharacteristic: { kind: 'mutation' },
  DeleteChatbots: { kind: 'mutation' },
  AddCharacteristic: { kind: 'mutation' },
  UpdateCharacteristic: { kind: 'mutation' },
  UpdateChatbot: { kind: 'mutation' },
  InviteAdmin: { kind: 'mutation' },
  RemoveAdmin: { kind: 'mutation' },
  BackfillInvitedUserId: { kind: 'mutation' },
};

function extractOperationName(body: string): { kind: 'query' | 'mutation'; name: string } | null {
  const trimmed = body.trim();
  const match = trimmed.match(/^(query|mutation)\s+([A-Za-z_][A-Za-z0-9_]*)/);
  if (!match) return null;
  return { kind: match[1] as 'query' | 'mutation', name: match[2] };
}

export async function POST(request: NextRequest) {
  const { query, variables } = await request.json();
  if (typeof query !== 'string') {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400, headers: corsHeaders },
    );
  }

  const parsed = extractOperationName(query);
  if (!parsed) {
    return NextResponse.json(
      { error: 'Operation must be a named query or mutation' },
      { status: 400, headers: corsHeaders },
    );
  }

  const allowed = ALLOWED_OPERATIONS[parsed.name];
  if (!allowed || allowed.kind !== parsed.kind) {
    return NextResponse.json(
      { error: `Operation "${parsed.name}" is not in the allowlist` },
      { status: 403, headers: corsHeaders },
    );
  }

  if (!allowed.public) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401, headers: corsHeaders },
      );
    }
  }

  try {
    const result = await serverClient.mutate({
      mutation: gql`${query}`,
      variables,
    });

    return NextResponse.json(
      { data: result.data, errors: result.errors ?? null },
      { headers: corsHeaders },
    );
  } catch (error) {
    console.error('[/api/graphql] error', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500, headers: corsHeaders });
  }
}