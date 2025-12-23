import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { SingleMgs } from '../../../shared/types/chatTypes';

interface Message {
    status: 'Waiting' | 'Done';
    msg: SingleMgs[];
}

const initialState: Message = {
    status: 'Done',
    msg: [],
};

export const aiChatSlices = createSlice({
    name: 'ai-chat',
    initialState,
    reducers: {
        setMessages: (state, action: PayloadAction<SingleMgs[]>): Message => {
            const histories = action.payload;
            if (histories.length == 0) {
                return initialState;
            }
            return {
                ...state,
                msg: action.payload,
            };
        },
        pushMessage: (state, action: PayloadAction<SingleMgs>): Message => {
            return {
                ...state,
                msg: [...state.msg, action.payload],
            };
        },
        setWaitingResponse: (state): Message => {
            return {
                ...state,
                status: 'Waiting',
            };
        },
        setDoneResponse: (state): Message => {
            return {
                ...state,
                status: 'Done',
            };
        },
    },
});

export const { setMessages, pushMessage, setWaitingResponse, setDoneResponse } = aiChatSlices.actions;

export default aiChatSlices.reducer;
