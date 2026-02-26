import axiosClient from '../axios/axiosClient';
import { AUTH_API_BASE_URL } from '../../shared/constants/baseUrls';

export const getUsers = async (userName: string): Promise<any[]> => {
  try {
    return axiosClient.get(`/users?userName=${userName}`, { baseURL: AUTH_API_BASE_URL });
  } catch {
    return [];
  }
};

export const signin = async (signinData: { userName: string; password: string }): Promise<any> => {
  return axiosClient.post('/signin', signinData, { baseURL: AUTH_API_BASE_URL });
};

export const signup = async (signupData: { userName: string; password: string; email: string; role: string }): Promise<any> => {
  return axiosClient.post('/signup', signupData, { baseURL: AUTH_API_BASE_URL });
};
