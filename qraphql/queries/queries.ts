import { gql } from "@apollo/client";

export const GET_USER_CHATBOTS = gql`
 query getAllChatbots {
  chatbotsList {
    id
    name
    created_at
    clerk_user_id
    chat_sessions {
      id
      created_at
      guests {
        name
        id
        email
      }
    }
  }

}
`


export const GET_CHATBOTS_BY_CLERK_USER_ID = gql`
  query ChatbotsListByClerkUserId($clerk_user_id: String!) {
    chatbotsListByClerkUserId(clerk_user_id: $clerk_user_id) {
      id
      name
      created_at
      clerk_user_id
      chatbot_characteristics {
        id
        content
        created_at
      }
      chat_sessions {
        id
        created_at
        guests {
          id
          name
          email
        }
      }
    }
  }
`



export const GET_CHATBOTS_by_ID = gql`
  query GETCHATBOTSBYID($id: Int!) 
  {
  chatbots(id: $id) {
    id
    name
    created_at
    chatbot_characteristics {
      created_at
      content
      id
      chatbots {
        chat_sessions {
          guest_id
          created_at
          id
          messages {
            id
            content
            created_at
          }
        }
      }
    }
  }
}   
`
export const GET_CHATBOTS_by_USER = gql`
query getAllChatbots {
  chatbotsList {
    id
    name
    created_at
    chatbot_characteristics {
      created_at
      content
      id
      chatbots {
        chat_sessions {
          guest_id
          created_at
          id
          messages {
            id
            content
            created_at
          }
        }
      }
    }
    clerk_user_id
    chat_sessions {
     chatbot_id
      created_at
      guests {
        email
        name
        id
      }
     
    }
  }
}
 ` 
 export const GET_CHAT_SESSIONS_MESSAGES = gql`
   query getChatSessionsMessages($id:Int!){
   chat_sessions(id: $id) {
    created_at
    id
    guests {
      email
      name
    }
    chatbots {
      name
      clerk_user_id
    }
    messages {
      id
      sender
      content
      created_at
    }
  }
  
   }
 `
export  const GET_MESSEGES_BY_CHAT_SESSION_ID= gql`
 query GetMessagesByChatSessionId($chat_session_id:Int!) {
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
 `

export const GET_CHAT_SESSION_NOTIFICATION_CONTEXT = gql`
  query GetChatSessionNotificationContext($id: Int!) {
    chat_sessions(id: $id) {
      id
      created_at
      last_notified_at
      guest_id
      chatbot_id
      guests {
        id
        name
        email
      }
      chatbots {
        id
        name
      }
      messages {
        id
        sender
        content
        created_at
      }
    }
  }
`