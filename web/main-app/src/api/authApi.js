import { API_BASE_URL } from "../constants/constants";
import Cookies from 'js-cookie';

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