import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import type { DecodedToken, Role } from '../interfaces/authInterface';

export const getToken = (): string | null => {
    const cookie = Cookies.get('profile');
    if (!cookie) return null;

    try {
        const parsed = JSON.parse(cookie);
        return parsed?.token || null;
    } catch {
        return null;
    }
};

export const isAuthenticated = (): boolean => {
    const token = getToken();
    if (!token) return false;

    try {
        const decoded: DecodedToken = jwtDecode(token);
        return decoded.exp * 1000 > Date.now();
    } catch {
        return false;
    }
};

export const getUserRole = (): Role | null => {
    const token = getToken();
    if (!token) return null;

    try {
        const decoded: DecodedToken = jwtDecode(token);
        return decoded.role || null;
    } catch {
        return null;
    }
};
