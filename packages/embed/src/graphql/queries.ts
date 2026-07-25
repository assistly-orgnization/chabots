import { gql } from "@apollo/client";

export const GET_MESSEGES_BY_CHAT_SESSION_ID = gql`
  query GetMessagesByChatSessionId($chat_session_id: Int!) {
    chat_sessions(id: $chat_session_id) {
      created_at
      id
      messages {
        id
        sender
        content
        created_at
      }
    }
  }
`;
