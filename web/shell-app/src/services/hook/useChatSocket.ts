import { useEffect, useRef, useCallback, useState } from 'react';
import { getUserName, getToken } from '../../shared/helpers/authUtils';
import { getUsers } from '../api/authApi';
import { getChatIds, createChatSession, getChatHistories } from '../api/chatApi';
import { CHAT_ROLE, type SingleMgs } from '../../shared/types/chatTypes';

interface UseChatSocketResult {
  messages: SingleMgs[];
  status: 'Idle' | 'Waiting';
  send: (content: string) => void;
}

const RECONNECT_BASE_DELAY = 1000;
const RECONNECT_MAX_DELAY = 30000;
const RECONNECT_MAX_ATTEMPTS = 10;

const useChatSocket = (endpointURL: string): UseChatSocketResult => {
  const [messages, setMessages] = useState<SingleMgs[]>([]);
  const [status, setStatus] = useState<'Idle' | 'Waiting'>('Idle');

  const socketRef = useRef<WebSocket | null>(null);
  const connectingRef = useRef<boolean>(false);
  const reconnectAttemptRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userIdRef = useRef<number | null>(null);
  const chatIdRef = useRef<string | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const getUserId = async (): Promise<number | null> => {
    const userName = getUserName();
    if (!userName) {
      console.warn('[Chat] No username found, user may not be authenticated');
      return null;
    }
    const users = await getUsers(userName);
    const tmpUser = users.find((u: any) => u.userName === userName);
    return tmpUser?.userId || null;
  };

  const getChatId = async (userId: number): Promise<string> => {
    let chat = await getChatIds(userId);
    if (chat?.data?.conversations?.length === 0) {
      await createChatSession(userId);
      chat = await getChatIds(userId);
    }
    return chat?.data?.conversations?.[0];
  };

  const getChatHistory = async (userId: number, chatId: string): Promise<SingleMgs[]> => {
    const response = await getChatHistories(userId, chatId);
    return response?.data?.history || [];
  };

  const connectWebSocket = useCallback(
    async (isReconnect: boolean = false): Promise<void> => {
      if (connectingRef.current || !isMountedRef.current) return;
      connectingRef.current = true;

      try {
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

        if (!isReconnect) {
          const chatHistories = await getChatHistory(userIdRef.current, chatIdRef.current!);
          if (!isMountedRef.current) {
            connectingRef.current = false;
            return;
          }
          setMessages(chatHistories);
        }

        const socket = new WebSocket(endpointURL);
        socketRef.current = socket;

        socket.onopen = (): void => {
          connectingRef.current = false;
          reconnectAttemptRef.current = 0;
          if (!isMountedRef.current) {
            socket.close();
            return;
          }

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
        };

        socket.onmessage = (event): void => {
          if (!isMountedRef.current) return;
          const msg = JSON.parse(event.data);
          if (msg.type === 'ping') {
            socket.send(JSON.stringify({ type: 'pong' }));
            return;
          }
          setMessages((prev) => [...prev, { role: CHAT_ROLE.AI, content: msg.data }]);
          setStatus('Idle');
        };

        socket.onerror = (): void => {
          connectingRef.current = false;
        };

        socket.onclose = (): void => {
          connectingRef.current = false;
          socketRef.current = null;
          if (isMountedRef.current && reconnectAttemptRef.current < RECONNECT_MAX_ATTEMPTS) {
            const delay = Math.min(RECONNECT_BASE_DELAY * Math.pow(2, reconnectAttemptRef.current), RECONNECT_MAX_DELAY);
            reconnectAttemptRef.current++;
            reconnectTimeoutRef.current = setTimeout(() => {
              connectWebSocket(true);
            }, delay);
          }
        };
      } catch {
        connectingRef.current = false;
      }
    },
    [endpointURL],
  );

  useEffect(() => {
    isMountedRef.current = true;
    connectWebSocket(false);
    return () => {
      isMountedRef.current = false;
      connectingRef.current = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [connectWebSocket]);

  const send = useCallback((content: string) => {
    setMessages((prev) => [...prev, { role: CHAT_ROLE.USER, content }]);
    setStatus('Waiting');
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send(JSON.stringify({ type: 'user.input_text.commit', data: content }));
      } catch {
        // swallow
      }
    }
  }, []);

  return { messages, status, send };
};

export default useChatSocket;
