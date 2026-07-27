import { gql } from '@apollo/client';

export const CREATE_CHATBOT= gql`
mutation CreateChatbot($clerk_user_id: String!, $name: String!,$created_at: DateTime!) { 
  insertChatbots(clerk_user_id: $clerk_user_id, name: $name, created_at: $created_at) {
    id
    name
    created_at
  }
}

  `;
export const REMOVE_CHARACTERISTIC= gql`
mutation RemoveCharacteristic($Id: Int!) {
     deleteChatbot_characteristics(id: $Id) {
id
}
}
`;
export const DELETE_CHATBOT= gql`
mutation DeleteChatbots($id: Int!) {
  deleteChatbots(id: $id) {
id
}
}`;
export const ADD_CHARACTERISTIC= gql`
mutation AddCharacteristic($chatbotId: Int!, $content: String!,$created_at: DateTime!) {
  insertChatbot_characteristics(chatbot_id: $chatbotId, content: $content, created_at: $created_at) {
   chatbot_id
    created_at
    content
  }
}`;

export const UPDATE_CHARACTERISTIC= gql`
mutation UpdateCharacteristic($id: Int!, $content: String!) {
  updateChatbot_characteristics(id: $id, content: $content) {
    id
    content
    created_at
  }
}
`;

export const UPDATE_CHATBOT= gql`
mutation UpdateChatbot($id: Int!, $name: String!) {
  updateChatbots(id: $id, name: $name) {
    id
    name
    created_at
  }
}`;

export const InsertMessage= gql`
mutation insertMessages($chat_session_id: Int!, $content: String!, $created_at: DateTime!, $sender
: String!) {
 insertMessages(chat_session_id: $chat_session_id,content: $content, created_at: $created_at, sender: $sender) {
    id
    content
    created_at
    sender
  }
}
`;

export const InsertChatSession= gql`
mutation insertChatSession($chatbot_id: Int!, $guest_id: Int!, $created_at: DateTime!) {
  insertChat_sessions( chatbot_id: $chatbot_id, guest_id: $guest_id,created_at: $created_at) {
id
}
}`
export const Insert_Guests=  gql`
mutation insertGuests($created_at: DateTime!, $email: String!, $name: String!) {
insertGuests(created_at: $created_at, email: $email, name: $name) {
id
}
}`

export const MARK_CHAT_SESSION_NOTIFIED = gql`
  mutation MarkChatSessionNotified(
    $id: Int!
    $chatbot_id: Int
    $created_at: DateTime
    $guest_id: Int
    $last_notified_at: DateTime!
  ) {
    updateChat_sessions(
      id: $id
      chatbot_id: $chatbot_id
      created_at: $created_at
      guest_id: $guest_id
      last_notified_at: $last_notified_at
    ) {
      id
      last_notified_at
    }
  }
`;