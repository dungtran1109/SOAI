import { useEffect, useRef } from 'react';
import { getUserName } from '../../shared/helpers/authUtils';
import { getUsers } from '../api/authApi';
import { useDispatch } from 'react-redux';
import { pushMessage, setDoneResponse, setMessages, setWaitingResponse } from '../redux/chatSlices/chatSlice';
import { getChatIds, createChatSession, getChatHistories } from '../api/chatApi';
import { CHAT_ROLE, type SingleMgs, type WSMessage } from '../../shared/types/chatTypes';

const useChatSocket = (endpointURL: string) => {
    const socketRef = useRef<WebSocket | null>(null);
    const dispatch = useDispatch();

    const getUserId = async (): Promise<number | null> => {
        const userName = getUserName();
        const users = await getUsers(userName);
        const tmpUser = users.find((u) => u.userName === userName);
        return tmpUser?.userId || null;
    };

    const getChatId = async (userId: number): Promise<string> => {
        let chat = await getChatIds(userId);
        if (chat?.data.conversations.length == 0) {
            // TODO: Check the status if creation is succeed or not.
            await createChatSession(userId);
            chat = await getChatIds(userId);
        }
        return chat?.data.conversations[0];
    };

    const getChatHistory = async (userId: number, chatId: string): Promise<SingleMgs[]> => {
        const response = await getChatHistories(userId, chatId);
        console.log(response);
        return response?.data.history || [];
    };

    useEffect(() => {
        const initChatSocket = async (): Promise<void> => {
            const userId = await getUserId();
            if (userId === null) return;
            const chatId = await getChatId(userId);
            const chatHistories = await getChatHistory(userId, chatId);
            dispatch(setMessages(chatHistories));

            const socket = new WebSocket(endpointURL);
            socketRef.current = socket;

            socket.onopen = (): void => {
                socket.send(
                    JSON.stringify({
                        type: 'user.connect',
                        data: {
                            conversation_id: chatId,
                            user_id: userId,
                        },
                    }),
                );
            };

            socket.onmessage = (event): void => {
                const msg: WSMessage = JSON.parse(event.data);
                dispatch(pushMessage({ role: CHAT_ROLE.AI, content: msg.data }));
                dispatch(setDoneResponse());
            };

            socket.onerror = (err): void => {
                console.error('WS error', err);
            };

            socket.onclose = (): void => {
                console.log('WS closed');
                // TODO: Handling reconnection
            };
        };

        initChatSocket();

        return () => socketRef.current?.close();
    }, [dispatch, endpointURL]);

    const wsSendMsg = (content: string): void => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(
                JSON.stringify({
                    type: 'user.input_text.commit',
                    data: content,
                }),
            );
            dispatch(pushMessage({ role: CHAT_ROLE.USER, content }));
            dispatch(setWaitingResponse());
        } else {
            console.warn('WS not ready, message dropped');
        }
    };

    return wsSendMsg;
};

export default useChatSocket;
