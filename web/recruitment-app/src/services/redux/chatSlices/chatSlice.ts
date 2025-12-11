import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Message } from '../../../shared/types/chatTypes';

const initialState: Message[] = [
    { role: 'AI', content: 'Good day 👋 How are you doing today?' },
    { role: 'USER', content: "I'm doing well. How about you?" },
    { role: 'AI', content: "I'm great, thank you! How can I help you?" },
    { role: 'USER', content: 'Are you AI assistant?' },
    { role: 'AI', content: 'Yes, I am an AI assistant.' },
];

export const aiChatSlices = createSlice({
    name: 'ai-chat',
    initialState,
    reducers: {
        pushMessage: (state, action: PayloadAction<Message>): Message[] => {
            return [...state, action.payload];
        },
    },
});

export const { pushMessage } = aiChatSlices.actions;

export default aiChatSlices.reducer;
