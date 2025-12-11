export interface Message {
    role: 'ASSISTANT' | 'USER';
    content: string;
}
