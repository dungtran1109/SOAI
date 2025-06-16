import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie';

export function isAuthenticated() {
    const cookie = Cookies.get('profile');
    if (!cookie) return false;

    try {
        const parsed = JSON.parse(decodeURIComponent(cookie))
        const token = parsed?.token;
        const decoded = jwtDecode(token);
        const isAuthenticated = decoded.exp * 1000 > Date.now()
        console.log("isAuthenticated: ", isAuthenticated);
        return isAuthenticated;
    } catch {
        return false;
    }
}