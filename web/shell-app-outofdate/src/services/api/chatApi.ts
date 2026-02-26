import axiosClient from '../axios/axiosClient';
import { CHAT_API_BASE_URL } from '../../shared/constants/baseUrls';

export const getChatIds = async (userId: number): Promise<any> => {
  try {
    return axiosClient.get(`/conversations/${userId}`, { baseURL: CHAT_API_BASE_URL });
  } catch {
    return {};
  }
};

export const getChatHistories = async (userId: number, chatId: string): Promise<any> => {
  try {
    return axiosClient.get(`/conversations/${userId}/${chatId}`, { baseURL: CHAT_API_BASE_URL });
  } catch {
    return {};
  }
};

export const createChatSession = async (userId: number) => {
  try {
    return axiosClient.post(`/conversations/${userId}/create`, {}, { baseURL: CHAT_API_BASE_URL });
  } catch {
    return [];
  }
};
