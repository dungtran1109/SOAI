import { useEffect, useRef, useCallback } from 'react';
import { getUserName, getToken } from '../../shared/helpers/authUtils';
import { getUsers } from '../api/authApi';
import { useDispatch } from 'react-redux';
import { pushMessage, setDoneResponse, setMessages, setWaitingResponse } from '../redux/chatSlices/chatSlice';
import { getChatIds, createChatSession, getChatHistories } from '../api/chatApi';
import { CHAT_ROLE, type SingleMgs, type WSMessage } from '../../shared/types/chatTypes';

// Reconnection configuration
const RECONNECT_BASE_DELAY = 1000; // 1 second
const RECONNECT_MAX_DELAY = 30000; // 30 seconds
const RECONNECT_MAX_ATTEMPTS = 10;
const MESSAGE_RETRY_DELAY = 500; // 500ms between retries
const MESSAGE_MAX_RETRIES = 5;

interface QueuedMessage {
    content: string;
    retries: number;
}

const useChatSocket = (endpointURL: string) => {
    const socketRef = useRef<WebSocket | null>(null);
    const connectingRef = useRef<boolean>(false);
    const reconnectAttemptRef = useRef<number>(0);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const messageQueueRef = useRef<QueuedMessage[]>([]);
    const userIdRef = useRef<number | null>(null);
    const chatIdRef = useRef<string | null>(null);
    const isMountedRef = useRef<boolean>(true);
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
            await createChatSession(userId);
            chat = await getChatIds(userId);
        }
        return chat?.data.conversations[0];
    };

    const getChatHistory = async (userId: number, chatId: string): Promise<SingleMgs[]> => {
        const response = await getChatHistories(userId, chatId);
        return response?.data.history || [];
    };

    // Process queued messages when connection is established
    const processMessageQueue = useCallback(() => {
        if (socketRef.current?.readyState !== WebSocket.OPEN) return;

        while (messageQueueRef.current.length > 0) {
            const queuedMsg = messageQueueRef.current[0];
            try {
                socketRef.current.send(
                    JSON.stringify({
                        type: 'user.input_text.commit',
                        data: queuedMsg.content,
                    }),
                );
                // Remove successfully sent message from queue
                messageQueueRef.current.shift();
                console.log('Sent queued message:', queuedMsg.content.substring(0, 50));
            } catch (err) {
                console.error('Failed to send queued message:', err);
                break;
            }
        }
    }, []);

    // Connect/reconnect to WebSocket
    const connectWebSocket = useCallback(async (isReconnect: boolean = false): Promise<void> => {
        if (connectingRef.current || !isMountedRef.current) return;
        connectingRef.current = true;

        try {
            // Get user and chat IDs (use cached values on reconnect)
            if (!isReconnect || !userIdRef.current) {
                userIdRef.current = await getUserId();
            }
            if (userIdRef.current === null || !isMountedRef.current) {
                connectingRef.current = false;
                return;
            }

            if (!isReconnect || !chatIdRef.current) {
                chatIdRef.current = await getChatId(userIdRef.current);
            }
            if (!isMountedRef.current) {
                connectingRef.current = false;
                return;
            }

            // Only fetch history on initial connection
            if (!isReconnect) {
                const chatHistories = await getChatHistory(userIdRef.current, chatIdRef.current);
                if (!isMountedRef.current) {
                    connectingRef.current = false;
                    return;
                }
                dispatch(setMessages(chatHistories));
            }

            const socket = new WebSocket(endpointURL);
            socketRef.current = socket;

            socket.onopen = (): void => {
                connectingRef.current = false;
                reconnectAttemptRef.current = 0; // Reset reconnect attempts on successful connection

                if (!isMountedRef.current) {
                    socket.close();
                    return;
                }

                console.log('WebSocket connected' + (isReconnect ? ' (reconnected)' : ''));

                socket.send(
                    JSON.stringify({
                        type: 'user.connect',
                        data: {
                            conversation_id: chatIdRef.current,
                            user_id: userIdRef.current,
                            token: getToken(),
                        },
                    }),
                );

                // Process any queued messages
                processMessageQueue();
            };

            socket.onmessage = (event): void => {
                if (!isMountedRef.current) return;
                const msg: WSMessage = JSON.parse(event.data);

                // Handle ping/pong for keep-alive
                if (msg.type === 'ping') {
                    socket.send(JSON.stringify({ type: 'pong' }));
                    return;
                }

                dispatch(pushMessage({ role: CHAT_ROLE.AI, content: msg.data }));
                dispatch(setDoneResponse());
            };

            socket.onerror = (err): void => {
                console.error('WS error', err);
                connectingRef.current = false;
            };

            socket.onclose = (event): void => {
                console.log('WS closed', event.code, event.reason);
                connectingRef.current = false;
                socketRef.current = null;

                // Attempt reconnection if component is still mounted
                if (isMountedRef.current && reconnectAttemptRef.current < RECONNECT_MAX_ATTEMPTS) {
                    const delay = Math.min(
                        RECONNECT_BASE_DELAY * Math.pow(2, reconnectAttemptRef.current),
                        RECONNECT_MAX_DELAY
                    );
                    reconnectAttemptRef.current++;
                    console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptRef.current}/${RECONNECT_MAX_ATTEMPTS})`);

                    reconnectTimeoutRef.current = setTimeout(() => {
                        connectWebSocket(true);
                    }, delay);
                } else if (reconnectAttemptRef.current >= RECONNECT_MAX_ATTEMPTS) {
                    console.error('Max reconnection attempts reached');
                }
            };
        } catch (err) {
            console.error('Error during WebSocket connection:', err);
            connectingRef.current = false;
        }
    }, [dispatch, endpointURL, processMessageQueue]);

    useEffect(() => {
        isMountedRef.current = true;
        connectWebSocket(false);

        return () => {
            isMountedRef.current = false;
            connectingRef.current = false;
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            socketRef.current?.close();
            socketRef.current = null;
            messageQueueRef.current = [];
        };
    }, [connectWebSocket]);

    const wsSendMsg = useCallback((content: string): void => {
        // Add message to UI immediately
        dispatch(pushMessage({ role: CHAT_ROLE.USER, content }));
        dispatch(setWaitingResponse());

        if (socketRef.current?.readyState === WebSocket.OPEN) {
            try {
                socketRef.current.send(
                    JSON.stringify({
                        type: 'user.input_text.commit',
                        data: content,
                    }),
                );
            } catch (err) {
                console.error('Failed to send message:', err);
                // Queue message for retry
                messageQueueRef.current.push({ content, retries: 0 });
            }
        } else {
            console.warn('WS not ready, queuing message for retry');
            messageQueueRef.current.push({ content, retries: 0 });

            // If not currently connecting, trigger a reconnection
            if (!connectingRef.current && isMountedRef.current) {
                connectWebSocket(true);
            }

            // Set up retry with timeout
            const retryInterval = setInterval(() => {
                if (!isMountedRef.current) {
                    clearInterval(retryInterval);
                    return;
                }

                const queuedMsg = messageQueueRef.current.find((m: QueuedMessage) => m.content === content);
                if (!queuedMsg) {
                    clearInterval(retryInterval);
                    return;
                }

                if (socketRef.current?.readyState === WebSocket.OPEN) {
                    try {
                        socketRef.current.send(
                            JSON.stringify({
                                type: 'user.input_text.commit',
                                data: content,
                            }),
                        );
                        // Remove from queue
                        messageQueueRef.current = messageQueueRef.current.filter((m: QueuedMessage) => m.content !== content);
                        console.log('Successfully sent queued message');
                        clearInterval(retryInterval);
                    } catch (err) {
                        queuedMsg.retries++;
                    }
                } else {
                    queuedMsg.retries++;
                }

                if (queuedMsg.retries >= MESSAGE_MAX_RETRIES) {
                    console.error('Max retries reached for message, removing from queue');
                    messageQueueRef.current = messageQueueRef.current.filter((m: QueuedMessage) => m.content !== content);
                    dispatch(setDoneResponse()); // Reset waiting state
                    clearInterval(retryInterval);
                }
            }, MESSAGE_RETRY_DELAY);
        }
    }, [dispatch, connectWebSocket]);

    return wsSendMsg;
};

export default useChatSocket;
