import axiosClient from '../axios/axiosClient';
import { CHAT_API_URL_PREFIX } from '../../shared/constants/baseUrls';
import type { ChatHistory, ChatID } from '../../shared/types/chatTypes';

/**
 * Get all chat ID of a user ID
 * @param userId - User ID.
 * @returns Object includes a list of conversations.
 */
export const getChatIds = async (userId: number): Promise<ChatID> => {
    try {
        return axiosClient.get(`/conversations/${userId}`, {
            baseURL: CHAT_API_URL_PREFIX,
        });
    } catch (error) {
        console.error('[DEBUG getChatIds]', error);
        return {} as ChatID;
    }
};

/**
 * Get chat histories of a user based on user ID and chat ID.
 * @param userId - User ID.
 * @param chatId - Chat ID.
 * @returns Object includes chat ID and histories.
 */
export const getChatHistories = async (userId: number, chatId: string): Promise<ChatHistory> => {
    try {
        return axiosClient.get(`/conversations/${userId}/${chatId}`, {
            baseURL: CHAT_API_URL_PREFIX,
        });
    } catch (error) {
        console.error('[DEBUG getChatHistories]', error);
        return {} as ChatHistory;
    }
};

/**
 * Create a chat session based on user ID.
 * @param userId - User ID.
 * @returns List of chat conversions.
 */
export const createChatSession = async (userId: number) => {
    try {
        return axiosClient.post(
            `/conversations/${userId}/create`,
            {},
            {
                baseURL: CHAT_API_URL_PREFIX,
            },
        );
    } catch (error) {
        console.error('[DEBUG createChatSession]', error);
        return [];
    }
};
