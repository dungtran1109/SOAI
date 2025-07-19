import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie';

export function isAuthenticated() {
  const token = getToken();
  if (!token) return false;

  try {
    const decoded = jwtDecode(token);
    return decoded.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function getUserRole() {
  const token = getToken();
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    return decoded?.role || null;
  } catch {
    return null;
  }
}

export function getToken() {
  const cookie = Cookies.get('profile');
  if (!cookie) return null;

  try {
    const parsed = JSON.parse(cookie);
    return parsed?.token || null;
  } catch {
    return null;
  }
}
