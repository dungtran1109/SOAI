import { API_BASE_URL } from '../constants/baseUrl';
import { HTTP_ERROR_CODE } from '../constants/httpCode';
import type { CadidateCV } from '../interfaces/adminInterface';
import { getToken } from './authApi';

const authHeaders = (): HeadersInit => ({
    Authorization: `Bearer ${getToken()}`,
});

export const fetchCVsByPosition = async (position: string = ''): Promise<CadidateCV[]> => {
    const query = position ? `?position=${encodeURIComponent(position)}` : '';
    const url = `${API_BASE_URL}/recruitment/cvs/position${query}`;

    try {
        const response = await fetch(url, { headers: authHeaders() });
        if (!response.ok) {
            const message = HTTP_ERROR_CODE[response.status] || 'An unexpected error occurred.';
            throw new Error(message);
        }
        return await response.json();
    } catch (err) {
        console.log(`[DEBUG fetchCVsByPosition] Failed to parse JSON: ${err}`);
        return [];
    }
};
