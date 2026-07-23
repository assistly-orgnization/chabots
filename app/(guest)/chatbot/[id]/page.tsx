import serverClient from "@/lib/server/serverClient";
import { GET_CHATBOTS_by_ID } from "@/qraphql/queries/queries";
import { GetChatbotByIdResponse } from "@/types/types";
import ChatbotClient from "./ChatbotClient";

export const dynamic = 'force-dynamic';

export default async function ChatbotPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;

  // We fetch the data on the server, avoiding any initial client-side network delay 
  // for the welcome message rendering.
  const { data } = await serverClient.query<GetChatbotByIdResponse>({
    query: GET_CHATBOTS_by_ID,
    variables: { id: parseInt(id) }
  });

  const chatbotName = data?.chatbots?.name || 'Assistant';

  return <ChatbotClient id={id} chatbotName={chatbotName} />;
}
