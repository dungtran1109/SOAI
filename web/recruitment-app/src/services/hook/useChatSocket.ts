import { useEffect, useRef } from 'react';
import { getUserName } from '../../shared/helpers/authUtils';
import { getUsers } from '../api/authApi';
import { useDispatch } from 'react-redux';
import { pushMessage, setDoneResponse, setMessages, setWaitingResponse } from '../redux/chatSlices/chatSlice';
import { getChatIds, createChatSession, getChatHistories } from '../api/chatApi';
import { CHAT_ROLE, type SingleMgs, type WSMessage } from '../../shared/types/chatTypes';

const useChatSocket = (endpointURL: string) => {
    const socketRef = useRef<WebSocket | null>(null);
    const connectingRef = useRef<boolean>(false);
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
        return response?.data.history || [];
    };

    useEffect(() => {
        // Prevent multiple concurrent connection attempts
        if (connectingRef.current) return;
        connectingRef.current = true;

        let socket: WebSocket | null = null;
        let isMounted = true;

        const initChatSocket = async (): Promise<void> => {
            const userId = await getUserId();
            if (userId === null || !isMounted) {
                connectingRef.current = false;
                return;
            }
            const chatId = await getChatId(userId);
            if (!isMounted) {
                connectingRef.current = false;
                return;
            }
            const chatHistories = await getChatHistory(userId, chatId);
            if (!isMounted) {
                connectingRef.current = false;
                return;
            }
            dispatch(setMessages(chatHistories));

            socket = new WebSocket(endpointURL);
            socketRef.current = socket;

            socket.onopen = (): void => {
                connectingRef.current = false;
                if (!isMounted) {
                    socket?.close();
                    return;
                }
                socket?.send(
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
                if (!isMounted) return;
                const msg: WSMessage = JSON.parse(event.data);
                dispatch(pushMessage({ role: CHAT_ROLE.AI, content: msg.data }));
                dispatch(setDoneResponse());
            };

            socket.onerror = (err): void => {
                console.error('WS error', err);
                connectingRef.current = false;
            };

            socket.onclose = (): void => {
                console.log('WS closed');
                connectingRef.current = false;
                // TODO: Handling reconnection
            };
        };

        initChatSocket();

        return () => {
            isMounted = false;
            connectingRef.current = false;
            socket?.close();
            socketRef.current = null;
        };
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
