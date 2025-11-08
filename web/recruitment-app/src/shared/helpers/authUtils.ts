import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import type { TokenDecoded, Role } from '../types/authTypes';
import { COOKIE_TOKEN_NAME } from '../constants/browserStorages';

export const getToken = (): string | null => {
    const cookie = Cookies.get(COOKIE_TOKEN_NAME);
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
        const decoded: TokenDecoded = jwtDecode(token);
        return decoded.exp * 1000 > Date.now();
    } catch {
        return false;
    }
};

export const getUserRole = (): Role => {
    const token = getToken();
    if (!token) return 'USER';

    try {
        const decoded: TokenDecoded = jwtDecode(token);
        return decoded.role || 'USER';
    } catch {
        return 'USER';
    }
};
