import { AUTH_BASE_URL } from '../constants/baseUrl';
import type { SignInData, SignUpData } from '../interfaces/authInterface';
import Cookies from 'js-cookie';

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
        if (Cookies.get('profile')) {
            Cookies.remove('profile');
        }
    } catch (err) {
        console.error(`Logout failed: ${(err as Error).message || err}`);
    }
};

export const getToken = () => {
    try {
        const cookie = Cookies.get('profile');
        if (!cookie) return null;

        const parsed = JSON.parse(cookie);

        const isValid = parsed.token && parsed.expiresAt && new Date(parsed.expiresAt).getTime() > Date.now();

        return isValid ? parsed.token : null;
    } catch (err) {
        console.error(`Failed to get token: ${(err as Error).message || err}`);
        return null;
    }
};
