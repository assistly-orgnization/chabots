export interface Message {
    id: number,
    chat_session_id: number,
    content: string,
    created_at: string,
    sender: "ai" | "user"
}

export interface Guest {
    id: number,
    name: string,
    email: string,
    created_at: string,
}

export interface ChatSession {
    id: number,
    chatbot_id: number,
    guest_id: number | null,
    created_at: string,
    guests: Guest,
    messages: Message[]
}

export interface MessagesbyChatSessionIdResponse {
    chat_sessions: ChatSession[]
}

export interface MessagesbyChatSessionIdResponseVariables {
    chat_session_id: number,
}
