export const CHAT_ROLE = {
    USER: 'user',
    AI: 'assistant',
} as const;

type ChatRole = (typeof CHAT_ROLE)[keyof typeof CHAT_ROLE];

export interface SingleMgs {
    role: ChatRole;
    content: string;
}

export interface WSMessage {
    type: string;
    data: string;
}

interface ChatCommon {
    error: null;
    message: string;
    status: 'success' | 'fail';
}

export interface ChatID extends ChatCommon {
    data: { conversations: string[] };
}

export interface ChatHistory extends ChatCommon {
    data: { conversation_id: string; history: SingleMgs[] };
}
