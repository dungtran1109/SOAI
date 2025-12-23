import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { COOKIE_TOKEN_NAME } from '../constants/browserStorages';
import type { TokenDecoded, Role } from '../types/authTypes';

/**
 * Get stored authentication token.
 * @returns Authentication token.
 */
export const getToken = (): string => {
    const cookie = Cookies.get(COOKIE_TOKEN_NAME);
    if (!cookie) return '';
    try {
        const parsed = JSON.parse(cookie);
        return parsed?.token || '';
    } catch {
        return '';
    }
};

/**
 * Validate authentication.
 * @returns Status of authentication (True/False).
 */
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

/**
 * Get current account role from token.
 * @returns Current account role.
 */
export const getUserRole = (): Role => {
    try {
        const decoded: TokenDecoded = jwtDecode(getToken() || '');
        return decoded.role || 'USER';
    } catch {
        return 'USER';
    }
};

/**
 * Get username of account from token.
 * @returns Current username.
 */
export const getUserName = (): string => {
    try {
        const decoded: TokenDecoded = jwtDecode(getToken() || '');
        return decoded.sub;
    } catch {
        return '';
    }
};
