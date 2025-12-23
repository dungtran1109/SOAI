import Cookies from 'js-cookie';
import axiosClient from '../axios/axiosClient';
import { AUTH_API_BASE_URL } from '../../shared/constants/baseUrls';
import { COOKIE_TOKEN_NAME } from '../../shared/constants/browserStorages';
import type { Account, User } from '../../shared/types/adminTypes';
import type { SigninData, SignupData, SigninResponse } from '../../shared/types/authTypes';

/**
 * Login with User or Admin.
 * @param signinData - Authentication form data.
 * @returns Object of system response or throw an error.
 */
export const signin = async (signinData: SigninData): Promise<SigninResponse> => {
    try {
        return axiosClient.post('/signin', signinData, {
            baseURL: AUTH_API_BASE_URL,
        });
    } catch (error) {
        throw new Error(`Failed to login to system: ${error}`);
    }
};

/**
 * Register a new account.
 * @param registerData - Register form data.
 */
export const signup = async (registerData: SignupData): Promise<void> => {
    try {
        return axiosClient.post('/signup', registerData, {
            baseURL: AUTH_API_BASE_URL,
        });
    } catch (error) {
        throw new Error(`Failed to register a new account: ${error}`);
    }
};

/**
 * Logout current accout.
 */
export const logout = (): { ok: boolean; message: string } => {
    try {
        if (Cookies.get(COOKIE_TOKEN_NAME)) {
            Cookies.remove(COOKIE_TOKEN_NAME);
        }
        return { ok: true, message: 'Logout successfully.' };
    } catch (err) {
        console.error('[DEBUG logout]', err);
        return { ok: false, message: 'Logout unsuccessfully.' };
    }
};

/**
 * Get all accounts from system.
 * @returns Account list.
 */
export const getAccounts = async (): Promise<Account[]> => {
    try {
        return axiosClient.get('/accounts', {
            baseURL: AUTH_API_BASE_URL,
        });
    } catch (error) {
        console.error('[DEBUG getAccounts]:', error);
        return [];
    }
};

/**
 * Delete an account from system.
 * @param accountId - ID of account.
 * @returns Object includes a message after deleting an account.
 */
export const deleteAccount = async (accountId: number): Promise<{ message: string }> => {
    try {
        return axiosClient.delete(`/accounts/${accountId}`, {
            baseURL: AUTH_API_BASE_URL,
        });
    } catch (error) {
        console.error('[DEBUG deleteAccount]:', error);
        return { message: `${error}` };
    }
};

/**
 * Get information of users based on username.
 * @returns List of users.
 */
export const getUsers = async (userName: string): Promise<User[]> => {
    try {
        return axiosClient.get(`/users?userName=${userName}`, {
            baseURL: AUTH_API_BASE_URL,
        });
    } catch (error) {
        console.error('[DEBUG getUsers]:', error);
        return [];
    }
};
