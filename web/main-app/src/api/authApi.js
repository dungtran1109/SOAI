import { API_BASE_URL } from "../constants/constants";
import Cookies from 'js-cookie';
import { handleResponse } from "./responseHandler";

export const signin = async(formData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/authentications/signin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error("Signin failed!");
        }

        const data = await response.json();
        
        return data;
    } catch (error) {
        throw new Error('Login failed:', error);
    }
}

export const signup = async(formData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/authentications/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error("Signup failed!");
        }

        const data = await response.json();
        return data;
    } catch (error) {
        throw new Error('Signup failed:', error);
    }
}

export const logout = () => {
    try {
        if (Cookies.get('profile')) {
            Cookies.remove('profile');
        }
    } catch (err) {
        console.error('Logout failed:', err.message || err);
    }
};

export const getToken = () => {
    try {
        const cookie = Cookies.get('profile');
        if (!cookie) return null;

        const parsed = JSON.parse(cookie);

        const isValid =
            parsed.token &&
            parsed.expiresAt &&
            new Date(parsed.expiresAt).getTime() > Date.now();

        return isValid ? parsed.token : null;
    } catch (err) {
        console.error('Failed to get token:', err.message || err);
        return null;
    }
};

export const getTokenPayload = () => {
    try {
        const token = getToken();
        if (!token) return null;

        const payload = token.split('.')[1];
        if (!payload) return null;
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
        const jsonPayload = atob(padded);
        console.log('Decoded JSON Payload:', jsonPayload);
        return JSON.parse(jsonPayload);
    } catch (err) {
        console.error('Failed to get token payload:', err.message || err);
        return null;
    }
}

// Example usage to get userName (sub):
export const getUserName = () => {
    const payload = getTokenPayload();
    return payload ? payload.sub : null;
}

export const getUserByUserId = async (userId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/authentications/users/${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (!response.ok) {
            throw new Error("Failed to fetch user data");
        }

        return await handleResponse(response);
    } catch (error) {
        console.error('Error fetching user data:', error);
        throw error;
    }
}

export const getUserByUserName = async (username) => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/api/v1/authentications/users/search?userName=${encodeURIComponent(username)}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                }
            }
        );

        if (!response.ok) {
            throw new Error("Failed to fetch user data by username");
        }

        return await handleResponse(response);
    } catch (error) {
        console.error('Error fetching user data by username:', error);
        throw error;
    }
}