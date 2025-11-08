import Cookies from 'js-cookie';
import { AUTH_BASE_URL } from '../constants/baseUrls';
import type { SignInData, SignUpData } from '../types/authTypes';
import type { Account } from '../types/adminTypes';
import { getToken } from '../helpers/authUtils';
import { COOKIE_TOKEN_NAME } from '../constants/browserStorages';

export const signin = async (formData: SignInData) => {
    try {
        const response = await fetch(`${AUTH_BASE_URL}/authentications/signin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        if (!response.ok) {
            throw new Error('Signin failed!');
        }

        const data = await response.json();

        return data;
    } catch (error) {
        throw new Error(`Login failed: ${error}`);
    }
};

export const signup = async (formData: SignUpData) => {
    try {
        const response = await fetch(`${AUTH_BASE_URL}/authentications/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        if (!response.ok) {
            throw new Error('Signup failed!');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        throw new Error(`Signup failed: ${error}`);
    }
};

export const logout = (): void => {
    try {
        if (Cookies.get(COOKIE_TOKEN_NAME)) {
            Cookies.remove(COOKIE_TOKEN_NAME);
        }
    } catch (err) {
        console.error(`Logout failed: ${(err as Error).message || err}`);
    }
};

export const getAccounts = async (): Promise<Account[]> => {
    try {
        const response = await fetch(`${AUTH_BASE_URL}/authentications/accounts`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${getToken()}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch all accounts');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching all accounts:', error);
        return [];
    }
};

export const deleteAccount = async (accId: number): Promise<{ message: string }> => {
    try {
        const response = await fetch(`${AUTH_BASE_URL}/authentications/accounts/${accId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${getToken()}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to delete account');
        }

        return await response.json();
    } catch (error) {
        console.error('Error deleting account:', error);
        throw error;
    }
};
