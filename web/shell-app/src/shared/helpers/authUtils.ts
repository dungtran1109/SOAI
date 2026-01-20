import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

const COOKIE_TOKEN_NAME = 'profile';

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

export const getUserName = (): string => {
  try {
    const decoded: any = jwtDecode(getToken() || '');
    return decoded.sub;
  } catch {
    return '';
  }
};

export const isAuthenticated = (): boolean => {
  const token = getToken();
  if (!token) return false;
  try {
    const decoded: any = jwtDecode(token);
    return decoded.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

export const getUserRole = (): string | null => {
  try {
    const decoded: any = jwtDecode(getToken() || '');
    return decoded.role || null;
  } catch {
    return null;
  }
};

export const logout = (): void => {
  if (Cookies.get(COOKIE_TOKEN_NAME)) {
    Cookies.remove(COOKIE_TOKEN_NAME);
  }
};

export const setAuthToken = (response: any, rememberMe: boolean = false): void => {
  Cookies.set(COOKIE_TOKEN_NAME, JSON.stringify(response), {
    expires: rememberMe ? 7 : 1,
    secure: true,
    sameSite: 'Strict',
  });
};
