import serverClient from '@/lib/server/serverClient';
import { GET_CHATBOTS_by_ID } from '@/qraphql/queries/queries';
import { InsertChatSession, InsertMessage, Insert_Guests } from '@/qraphql/mutations/mutations';
import { GetChatbotByIdResponse } from '@/types/types';
import { type NextRequest, NextResponse } from 'next/server';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { name, email, chatbot_id } = body;

  if (typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
  }
  if (typeof chatbot_id !== 'number' || !Number.isInteger(chatbot_id) || chatbot_id <= 0) {
    return NextResponse.json({ error: 'chatbot_id must be a positive integer' }, { status: 400 });
  }

  try {
    const { data: chatbotData } = await serverClient.query<GetChatbotByIdResponse>({
      query: GET_CHATBOTS_by_ID,
      variables: { id: String(chatbot_id) },
    });

    if (!chatbotData?.chatbots) {
      return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 });
    }

    const { data: guestResult } = await serverClient.mutate({
      mutation: Insert_Guests,
      variables: {
        created_at: new Date().toISOString(),
        email: email.trim(),
        name: name.trim(),
      },
    });

    const guestId: number = guestResult.insertGuests.id;

    const { data: sessionResult } = await serverClient.mutate({
      mutation: InsertChatSession,
      variables: {
        chatbot_id,
        guest_id: guestId,
        created_at: new Date().toISOString(),
      },
    });

    const chatSessionId: number = sessionResult.insertChat_sessions.id;

    await serverClient.mutate({
      mutation: InsertMessage,
      variables: {
        chat_session_id: chatSessionId,
        content: `Welcome ${name.trim()}!\nHow can I assist you today?`,
        created_at: new Date().toISOString(),
        sender: 'ai',
      },
    });

    return NextResponse.json({ chat_session_id: chatSessionId });
  } catch (error) {
    console.error('[/api/start-chat] error', error);
    return NextResponse.json(
      { error: 'Failed to start chat. Please try again.' },
      { status: 500 },
    );
  }
}
